import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, CheckCircle2, Mic, MicOff,
  Sparkles, BookOpenCheck, Volume2, PhoneOff, Camera,
  MessageSquareText, Monitor,
} from 'lucide-react';
import {
  LiveKitRoom, RoomAudioRenderer, useDataChannel, useTracks, VideoTrack,
  useVoiceAssistant, useChat, useMultibandTrackVolume,
} from '@livekit/components-react';
import { Track, createLocalVideoTrack } from 'livekit-client';
import * as faceapi from 'face-api.js';
import { apiFetch } from '@/lib/api';
import { COMMUNICATION_CATEGORIES } from '@/src/constants';

const STORAGE_KEY = 'lk-interview';

const EMOTION_EMOJIS = {
  happy: '😊', sad: '😢', angry: '😠', fearful: '😨',
  surprised: '😮', disgusted: '🤢', neutral: '😐',
};

function SetupScreen({ onStart }) {
  const [category, setCategory] = useState(COMMUNICATION_CATEGORIES[0]);
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    setStarting(true);
    await onStart(category);
    setStarting(false);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <svg
        width="64" height="64" viewBox="0 0 64 64" fill="none"
        className="mb-6 size-16 text-emerald-500"
      >
        <path
          d="M15 24V40C15 40.7957 14.6839 41.5587 14.1213 42.1213C13.5587 42.6839 12.7956 43 12 43C11.2044 43 10.4413 42.6839 9.87868 42.1213C9.31607 41.5587 9 40.7957 9 40V24C9 23.2044 9.31607 22.4413 9.87868 21.8787C10.4413 21.3161 11.2044 21 12 21C12.7956 21 13.5587 21.3161 14.1213 21.8787C14.6839 22.4413 15 23.2044 15 24ZM22 5C21.2044 5 20.4413 5.31607 19.8787 5.87868C19.3161 6.44129 19 7.20435 19 8V56C19 56.7957 19.3161 57.5587 19.8787 58.1213C20.4413 58.6839 21.2044 59 22 59C22.7956 59 23.5587 58.6839 24.1213 58.1213C24.6839 57.5587 25 56.7957 25 56V8C25 7.20435 24.6839 6.44129 24.1213 5.87868C23.5587 5.31607 22.7956 5 22 5ZM32 13C31.2044 13 30.4413 13.3161 29.8787 13.8787C29.3161 14.4413 29 15.2044 29 16V48C29 48.7957 29.3161 49.5587 29.8787 50.1213C30.4413 50.6839 31.2044 51 32 51C32.7956 51 33.5587 50.6839 34.1213 50.1213C34.6839 49.5587 35 48.7957 35 48V16C35 15.2044 34.6839 14.4413 34.1213 13.8787C33.5587 13.3161 32.7956 13 32 13ZM42 21C41.2043 21 40.4413 21.3161 39.8787 21.8787C39.3161 22.4413 39 23.2044 39 24V40C39 40.7957 39.3161 41.5587 39.8787 42.1213C40.4413 42.6839 41.2043 43 42 43C42.7957 43 43.5587 42.6839 44.1213 42.1213C44.6839 41.5587 45 40.7957 45 40V24C45 23.2044 44.6839 22.4413 44.1213 21.8787C43.5587 21.3161 42.7957 21 42 21ZM52 17C51.2043 17 50.4413 17.3161 49.8787 17.8787C49.3161 18.4413 49 19.2044 49 20V44C49 44.7957 49.3161 45.5587 49.8787 46.1213C50.4413 46.6839 51.2043 47 52 47C52.7957 47 53.5587 46.6839 54.1213 46.1213C54.6839 45.5587 55 44.7957 55 44V20C55 19.2044 54.6839 18.4413 54.1213 17.8787C53.5587 17.3161 52.7957 17 52 17Z"
          fill="currentColor"
        />
      </svg>

      <h1 className="text-center text-2xl font-bold text-slate-800">
        Live Interview Practice
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm leading-5 text-slate-500">
        AI-powered interview coach that listens, evaluates, and gives real-time feedback
        on your communication skills.
      </p>

      <div className="mt-8 w-full max-w-sm space-y-2">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
          Choose topic
        </p>
        {COMMUNICATION_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`w-full rounded-full px-5 py-2.5 text-center text-sm font-semibold transition ${
              category === cat
                ? 'bg-emerald-500/20 text-emerald-600 ring-1 ring-emerald-500/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <button
        onClick={handleStart}
        disabled={starting}
        className="mt-8 flex w-64 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {starting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {starting ? 'Connecting...' : 'Start Interview'}
      </button>

      <div className="fixed bottom-5 left-0 flex w-full items-center justify-center">
        <p className="max-w-prose text-xs font-normal text-slate-400">
          Camera and microphone will be used for video analysis
        </p>
      </div>
    </div>
  );
}

function EmotionOverlay({ expressions }) {
  if (!expressions) return null;
  const entries = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
  const top = entries[0];

  return (
    <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-black/60 p-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">{EMOTION_EMOJIS[top[0]] || '😐'}</span>
        <span className="text-sm font-semibold capitalize text-white">{top[0]}</span>
        <span className="ml-auto text-xs text-white/70">{Math.round(top[1] * 100)}%</span>
      </div>
      <div className="mt-1.5 flex gap-1">
        {entries.slice(0, 4).map(([emotion, value]) => (
          <div key={emotion} className="flex flex-1 flex-col items-center gap-0.5">
            <div className="h-6 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${value * 100}%` }}
              />
            </div>
            <span className="text-[10px] capitalize text-white/60">{emotion.slice(0, 4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserVideoTile({ onEmotion }) {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const allCameraTracks = useTracks([Track.Source.Camera]);
  const track = allCameraTracks.find((t) => t.participant.isLocal);
  const hasVideo = !!track?.publication?.track;

  useEffect(() => {
    faceapi.nets.tinyFaceDetector.loadFromUri('/weights')
      .then(() => faceapi.nets.faceExpressionNet.loadFromUri('/weights'))
      .then(() => setModelsLoaded(true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!modelsLoaded || !videoRef.current) return;
    let running = true;

    async function detect() {
      while (running) {
        const el = videoRef.current;
        if (el && el.videoWidth) {
          try {
            const detections = await faceapi
              .detectAllFaces(el, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }))
              .withFaceExpressions();
            if (detections.length > 0) {
              onEmotion?.(detections[0].expressions);
            }
          } catch {}
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    detect();
    return () => { running = false; };
  }, [modelsLoaded, onEmotion]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
      {hasVideo ? (
        <VideoTrack
          ref={videoRef}
          trackRef={track}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="text-center text-white/50">
          <Camera className="mx-auto mb-2 h-10 w-10" />
          <p className="text-sm">Camera off</p>
        </div>
      )}
    </div>
  );
}

function AudioBars({ state, barCount = 7, className = '' }) {
  const [active, setActive] = useState(-1);
  const isSpeaking = state === 'speaking';

  useEffect(() => {
    if (!isSpeaking) { setActive(-1); return; }
    const id = setInterval(() => setActive(Math.floor(Math.random() * barCount)), 180);
    return () => clearInterval(id);
  }, [isSpeaking, barCount]);

  return (
    <div className={`flex h-full w-full items-end gap-[3px] ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all duration-200"
          style={{
            height: isSpeaking
              ? `${18 + Math.abs(i - active) * 9}%`
              : '14%',
            backgroundColor: !isSpeaking
              ? 'rgba(255,255,255,0.12)'
              : i === active
                ? '#34d399'
                : 'rgba(52,211,153,0.35)',
          }}
        />
      ))}
    </div>
  );
}

function RadialAura({ state, audioTrack, barCount = 24 }) {
  const bands = useMultibandTrackVolume(audioTrack, { bands: barCount, loPass: 100, hiPass: 200 });
  const volumes = audioTrack ? bands : new Array(barCount).fill(0);
  const center = barCount / 2;
  const radius = 64;
  const dotSize = 4;

  const [seqIdx, setSeqIdx] = useState(0);
  const seqRef = useRef(0);

  useEffect(() => {
    if (state === 'connecting' || state === 'thinking' || state === 'listening') {
      const id = setInterval(() => {
        seqRef.current += 1;
        setSeqIdx(seqRef.current);
      }, state === 'thinking' ? 100 : state === 'connecting' ? 400 : 300);
      return () => { clearInterval(id); seqRef.current = 0; setSeqIdx(0); };
    }
    seqRef.current = 0;
    setSeqIdx(0);
  }, [state]);

  function isActive(idx) {
    if (state === 'speaking') return true;
    if (state === 'connecting') {
      const pair = seqIdx % Math.ceil(barCount / 2);
      return idx === pair || idx === (pair + center) % barCount;
    }
    if (state === 'listening') {
      const group = Math.floor(barCount / 4);
      const offset = seqIdx % group;
      return idx % group === offset;
    }
    if (state === 'thinking') {
      const ringSize = Math.floor(barCount / 4);
      const offset = seqIdx % ringSize;
      return idx % ringSize === offset || (idx + ringSize) % barCount === (offset + ringSize) % barCount;
    }
    return false;
  }

  return (
    <div
      className="relative flex items-center justify-center"
      data-lk-state={state}
      data-state={state}
      style={state === 'thinking' ? { animation: 'spin 5s linear infinite' } : undefined}
    >
      {volumes.map((band, idx) => {
        const angle = (idx / barCount) * Math.PI * 2;
        const barHeight = state === 'speaking' ? Math.max(4, band * 40) : 4;
        return (
          <div
            key={idx}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `rotate(${angle}rad) translateY(-${radius}px)`,
              transformOrigin: 'center',
            }}
          >
            <div
              className="w-1 rounded-full transition-all duration-200"
              style={{
                height: `${barHeight}px`,
                backgroundColor: isActive(idx) ? '#34d399' : 'rgba(255,255,255,0.08)',
                boxShadow: isActive(idx) && state === 'speaking' ? '0 0 6px #34d399' : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ChatInput({ onSend }) {
  const [text, setText] = useState('');
  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none placeholder:text-white/30 focus:border-emerald-500/50"
      />
      <button
        type="submit"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 transition hover:bg-emerald-500/30"
      >
        <MessageSquareText className="h-4 w-4" />
      </button>
    </form>
  );
}

function RoomUI({ category, onComplete }) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [agentStatus, setAgentStatus] = useState('connecting');
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [expressions, setExpressions] = useState(null);
  const [dominantEmotion, setDominantEmotion] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [pipView, setPipView] = useState('user');
  const scrollRef = useRef(null);
  const { state, audioTrack } = useVoiceAssistant();
  const { send: sendDc } = useDataChannel((msg) => {
    try {
      const data = JSON.parse(msg.payload);
      switch (data.type) {
        case 'status':
          setAgentStatus(data.status);
          break;
        case 'transcript':
          setTranscript(data.text);
          break;
        case 'evaluation':
          setEvaluation(data.evaluation);
          setFeedback(data.feedback);
          setExchangeCount(data.exchange_number || 0);
          break;
        case 'complete':
          setIsComplete(true);
          break;
      }
    } catch {}
  });
  const { chatMessages, send: sendChat } = useChat();

  function handleEmotion(expr) {
    setExpressions(expr);
    const top = Object.entries(expr).sort((a, b) => b[1] - a[1])[0];
    if (top) setDominantEmotion(top[0]);
    sendDc(
      new TextEncoder().encode(JSON.stringify({ type: 'emotion', expressions: expr })),
      { reliable: true },
    );
  }

  // scroll transcript when new data arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, feedback]);

  return (
    <div className="relative flex h-full w-full flex-col bg-neutral-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {category}
          </span>
          {exchangeCount > 0 && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/60">
              {exchangeCount}/6
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dominantEmotion && (
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
              {EMOTION_EMOJIS[dominantEmotion]} {dominantEmotion}
            </span>
          )}
          {agentStatus === 'speaking' && (
            <span className="flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
              <Volume2 className="h-3 w-3 animate-pulse" />
              Speaking
            </span>
          )}
          {agentStatus === 'listening' && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Listening
            </span>
          )}
          {agentStatus === 'thinking' && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Evaluating
            </span>
          )}
        </div>
      </div>

      {/* Main video area */}
      <div className="relative flex flex-1 overflow-hidden px-5 pb-4">
        {/* Large tile */}
        <div
          className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-950 cursor-pointer"
          onClick={() => setPipView(pipView === 'user' ? 'ai' : 'user')}
        >
          {pipView === 'user' ? (
            /* AI interviewer full-size */
            <div className="flex flex-col items-center gap-3">
              <p className="text-base font-semibold text-white/60">AI Interviewer</p>
              <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
                <RadialAura state={state} audioTrack={audioTrack} barCount={32} />
                <div className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/20">
                  <Volume2 className="h-7 w-7 text-emerald-400" />
                </div>
              </div>
            </div>
          ) : (
            /* User camera full-size */
            <div className="relative h-full w-full">
              <UserVideoTile onEmotion={handleEmotion} />
              <EmotionOverlay expressions={expressions} />
            </div>
          )}
        </div>

        {/* PiP tile (bottom-right) */}
        <div
          className="absolute bottom-4 right-4 overflow-hidden rounded-xl shadow-2xl shadow-black/60 cursor-pointer transition hover:ring-2 hover:ring-emerald-500/50"
          style={{ width: pipView === 'user' ? '15rem' : '10rem', height: pipView === 'user' ? '11rem' : '7.5rem' }}
          onClick={() => setPipView(pipView === 'user' ? 'ai' : 'user')}
        >
          {pipView === 'user' ? (
            /* User camera PiP */
            <>
              <UserVideoTile onEmotion={handleEmotion} />
              <EmotionOverlay expressions={expressions} />
              <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/70 backdrop-blur-sm">
                You
              </div>
            </>
          ) : (
            /* AI Interviewer PiP */
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-neutral-900">
              <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
                <RadialAura state={state} audioTrack={audioTrack} barCount={16} />
                <div className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/20">
                  <Volume2 className="h-3 w-3 text-emerald-400" />
                </div>
              </div>
              <p className="text-[10px] font-semibold text-white/50">AI Interviewer</p>
            </div>
          )}
        </div>

        {/* Chat slide-in panel */}
        {chatOpen && (
          <div className="absolute bottom-0 right-5 top-0 z-30 flex w-80 flex-col rounded-2xl bg-neutral-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">Chat</p>
              <button onClick={() => setChatOpen(false)} className="text-xs text-white/40 hover:text-white/70">Close</button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {chatMessages.map((m) => (
                <div key={m.timestamp} className={`flex ${m.from?.identity ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.from?.identity ? 'bg-white/10 text-white/80' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    <p className="text-[10px] font-semibold text-white/40">{m.from?.identity || 'You'}</p>
                    <p className="mt-0.5">{m.message}</p>
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <p className="py-12 text-center text-sm text-white/30">No messages yet</p>
              )}
            </div>
            <div className="border-t border-white/10 p-3">
              <ChatInput onSend={(text) => sendChat(text)} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-4 pb-5">
        <button
          onClick={() => setMicEnabled((v) => !v)}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            micEnabled
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          }`}
        >
          {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          onClick={() => setChatOpen((v) => !v)}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            chatOpen
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <MessageSquareText className="h-5 w-5" />
        </button>

        <button
          onClick={onComplete}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 transition hover:bg-red-500/30"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>

      {/* Complete overlay */}
      {isComplete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 rounded-2xl border border-white/10 bg-neutral-900 p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Interview Complete</h3>
            <p className="mt-2 text-sm text-white/60">
              Great job! Your responses have been recorded for review.
            </p>
            <button
              onClick={onComplete}
              className="mt-6 w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-700"
            >
              View Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewRoom({ room, token, category, onComplete }) {
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';
  const [ended, setEnded] = useState(false);

  function handleEnd() {
    setEnded(true);
    onComplete();
  }

  if (ended) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950">
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        video={true}
        audio={true}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <RoomAudioRenderer />
        <RoomUI category={category} onComplete={handleEnd} />
      </LiveKitRoom>
    </div>
  );
}

export default function CommunicationPage() {
  const navigate = useNavigate();
  const [roomInfo, setRoomInfo] = useState(null);
  const [rejoining, setRejoining] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setRejoining(false);
      return;
    }
    let parsed;
    try { parsed = JSON.parse(saved); } catch { localStorage.removeItem(STORAGE_KEY); setRejoining(false); return; }

    apiFetch('/api/livekit/rejoin-room', {
      method: 'POST',
      body: JSON.stringify({ room: parsed.room }),
    }).then((data) => {
      setRoomInfo({ ...parsed, token: data.token });
      setRejoining(false);
    }).catch(() => {
      localStorage.removeItem(STORAGE_KEY);
      setRejoining(false);
    });
  }, []);

  async function handleStart(category) {
    const data = await apiFetch('/api/livekit/create-room', {
      method: 'POST',
      body: JSON.stringify({ category }),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ room: data.room, category: data.category }));
    setRoomInfo(data);
  }

  function handleComplete() {
    localStorage.removeItem(STORAGE_KEY);
    if (roomInfo?.room) {
      apiFetch('/api/livekit/end-room', {
        method: 'POST',
        body: JSON.stringify({ room: roomInfo.room }),
      }).catch(() => {});
    }
    setRoomInfo(null);
  }

  if (rejoining) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (roomInfo) {
    return (
      <InterviewRoom
        room={roomInfo.room}
        token={roomInfo.token}
        category={roomInfo.category}
        onComplete={handleComplete}
      />
    );
  }

  return <SetupScreen onStart={handleStart} />;
}
