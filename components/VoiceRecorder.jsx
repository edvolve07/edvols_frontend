import { useState, useRef, useEffect, useCallback } from "react";

function bestAudioMime() {
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"])
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  return "";
}

function bestVideoMime() {
  for (const t of ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"])
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  return "";
}

export function useRecorder(videoRef, waveCanvasRef, onSubmit, disabled, maxDuration = 90) {
  const [micState, setMicState] = useState("idle");
  const [recSecs, setRecSecs] = useState(0);
  const [hasCamera, setHasCamera] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const pendingAudio = useRef(null);
  const pendingVideo = useRef(null);
  const audioMrRef = useRef(null);
  const videoMrRef = useRef(null);
  const audioChunks = useRef([]);
  const videoChunks = useRef([]);
  const recTimerRef = useRef();
  const analyserRef = useRef(null);
  const rafRef = useRef();
  const audioStreamRef = useRef(null);
  const videoStreamRef = useRef(null);
  const acRef = useRef(null);
  const timeLimitRef = useRef(false);

  /* ── Waveform ── */
  const drawWave = useCallback(() => {
    const canvas   = waveCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const W = canvas.width, H = canvas.height;
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      ctx.clearRect(0, 0, W, H);
      // centre line
      ctx.strokeStyle = "rgba(148,163,184,0.25)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      // waveform
      ctx.strokeStyle = "#818cf8"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
      ctx.beginPath();
      const sw = W / buf.length; let x = 0;
      for (let i = 0; i < buf.length; i++) {
        const y = (buf[i] / 128) * (H / 2);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sw;
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [waveCanvasRef]);

  useEffect(() => {
    if (micState === "recording") {
      const t = setTimeout(drawWave, 40);
      return () => clearTimeout(t);
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [micState, drawWave]);

  /* ── Cleanup on unmount (audio stream only — camera stays alive) ── */
 useEffect(() => () => {
    clearInterval(recTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (acRef.current && acRef.current.state !== "closed") {
      acRef.current.close();
    }
    audioStreamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  /* ── Start camera (call on interview mount) ── */
  const startCamera = useCallback(async () => {
    try {
      const vs = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      videoStreamRef.current = vs;
      setHasCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = vs;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setHasCamera(false);
    }
  }, [videoRef]);

  /* ── Stop all streams (call on interview unmount) ── */
  const stopAll = useCallback(() => {
    clearInterval(recTimerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    acRef.current?.close();
    audioStreamRef.current?.getTracks().forEach(t => t.stop());
    videoStreamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [videoRef]);

  /* ── Start mic recording ── */
  const startMic = async () => {
    if (disabled || micState !== "idle") return;
    setErrMsg("");
    audioChunks.current = []; videoChunks.current = [];
    pendingAudio.current = null; pendingVideo.current = null;

    // 1. Audio stream
    let audioStream;
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      setErrMsg("Microphone access denied. Please allow microphone."); setMicState("error"); return;
    }
    audioStreamRef.current = audioStream;

    // 2. Web Audio analyser for waveform
    const ac = new AudioContext();
    acRef.current = ac;
    const src = ac.createMediaStreamSource(audioStream);
    const analyser = ac.createAnalyser();
    analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.8;
    src.connect(analyser); analyserRef.current = analyser;

    // 3. Audio MediaRecorder
    const audioMime = bestAudioMime();
    const aMR = new MediaRecorder(audioStream, audioMime ? { mimeType: audioMime } : {});
    aMR.ondataavailable = e => { if (e.data?.size > 0) audioChunks.current.push(e.data); };
    audioMrRef.current = aMR;

    // 4. Video clip recorder (piggybacking on the live camera stream)
    let vMR = null;
    if (videoStreamRef.current && videoStreamRef.current.active) {
      try {
        const videoMime = bestVideoMime();
        vMR = new MediaRecorder(videoStreamRef.current, videoMime ? { mimeType: videoMime } : {});
        vMR.ondataavailable = e => { if (e.data?.size > 0) videoChunks.current.push(e.data); };
        videoMrRef.current = vMR;
      } catch { vMR = null; }
    }

    // 5. Both-stop handler → go to REVIEW (never auto-submit)
    let audioReady = false, videoReady = !vMR;
    const tryFinish = () => {
      if (!audioReady || !videoReady) return;
      const aBlob = new Blob(audioChunks.current, { type: aMR.mimeType || audioMime || "audio/webm" });
      if (aBlob.size < 100) {
        setErrMsg("Recording too short — please speak for at least 1 second.");
        setMicState("error"); return;
      }
      pendingAudio.current = aBlob;
      pendingVideo.current = (vMR && videoChunks.current.length > 0)
        ? new Blob(videoChunks.current, { type: vMR.mimeType || "video/webm" }) : null;
      if (timeLimitRef.current) {
        submitAnswer();
        return;
      }
      setMicState("review");
    };

   aMR.onstop = () => {
      audioStream.getTracks().forEach(t => t.stop());
      if (acRef.current && acRef.current.state !== "closed") {
        acRef.current.close();
      }
      acRef.current = null;
      analyserRef.current = null;
      audioReady = true; tryFinish();
    };
    if (vMR) { vMR.onstop = () => { videoReady = true; tryFinish(); }; }

    aMR.start(500); vMR?.start(500);
    setMicState("recording");
    setRecSecs(0);
    timeLimitRef.current = false;
    recTimerRef.current = setInterval(() => {
      setRecSecs((s) => {
        const next = s + 1;
        if (next >= maxDuration && !timeLimitRef.current) {
          timeLimitRef.current = true;
        }
        return next;
      });
    }, 1000);
  };

  /* ── Stop mic — goes to review, NOT submit ── */
  const stopMic = () => {
    clearInterval(recTimerRef.current);
    if (audioMrRef.current?.state !== "inactive") audioMrRef.current?.stop();
    if (videoMrRef.current?.state !== "inactive") videoMrRef.current?.stop();
    // micState transitions to "review" via tryFinish inside onstop
  };

  /* ── Submit (only when user clicks the button) ── */
  const submitAnswer = () => {
    if (!pendingAudio.current) return;
    setMicState("submitting");
    onSubmit({ audioBlob: pendingAudio.current, videoBlob: pendingVideo.current });
    pendingAudio.current = null; pendingVideo.current = null;
    setTimeout(() => setMicState("done"), 300);
    setTimeout(() => setMicState("idle"), 2500);
  };

  /* ── Re-record — discard blobs, go back to idle ── */
  const reRecord = () => {
    pendingAudio.current = null; pendingVideo.current = null;
    setMicState("idle");
  };

  /* ── Auto-stop when time limit reached ── */
  useEffect(() => {
    if (micState === "recording" && recSecs >= maxDuration && timeLimitRef.current) {
      stopMic();
    }
  }, [recSecs, micState, maxDuration]);

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return {
    micState, recSecs, hasCamera, errMsg,
    fmt, startCamera, stopAll,
    startMic, stopMic, submitAnswer, reRecord,
  };
}
