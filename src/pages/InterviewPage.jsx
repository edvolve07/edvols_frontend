import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Mic,
  Mic2,
  RotateCcw,
  Send,
  Square,
  Upload,
  Video,
  VideoOff,
} from "lucide-react";
import clsx from "clsx";
import { DOMAIN_ROLES, INTERVIEW_DOMAINS, INTERVIEW_ROLES, METRIC_LABELS } from "@/src/constants";
import { useNavigate } from "@/src/navigation";
import { endInterview, getSessionState, startInterview, submitAnswer as submitInterviewAnswer } from "@/lib/api";
import { useRecorder } from "@/components/VoiceRecorder";

function MetricBar({ label, value }) {
  const percentage = Math.min(100, Math.max(0, value * 10));
  const color = value >= 7 ? "bg-emerald-500" : value >= 5 ? "bg-amber-500" : "bg-red-500";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-800">{value}/10</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function SetupForm({ onStart }) {
  const [domain, setDomain] = useState(INTERVIEW_DOMAINS[0]);
  const [role, setRole] = useState(DOMAIN_ROLES[INTERVIEW_DOMAINS[0]][0]);
  const [customRole, setCustomRole] = useState("");
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const domainRoles = DOMAIN_ROLES[domain] ?? [];

  function handleDomainClick(item) {
    setDomain(item);
    setRole(DOMAIN_ROLES[item][0]);
    setIsCustomRole(false);
    setCustomRole("");
  }

  function handleRoleClick(item) {
    setRole(item);
    setIsCustomRole(false);
    setCustomRole("");
  }

  function handleCustomRoleChange(value) {
    setCustomRole(value);
    setIsCustomRole(true);
    if (value.trim()) {
      setRole(value.trim());
    }
  }

  async function submit() {
    if (!file || loading) return;
    setLoading(true);
    setError("");
    try {
      await onStart(domain, role, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start interview.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-600">Mock interview</p>
        <h1 className="font-display text-3xl font-semibold text-slate-950">Start a live interview</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Select your domain and target role, then upload a PDF resume so the questions can match your background.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Domain</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {INTERVIEW_DOMAINS.map((item) => (
                <button
                  key={item}
                  onClick={() => handleDomainClick(item)}
                  className={clsx(
                    "rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                    domain === item
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Target role</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {domainRoles.map((item) => (
                <button
                  key={item}
                  onClick={() => handleRoleClick(item)}
                  className={clsx(
                    "rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                    role === item && !isCustomRole
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">or add a custom role</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <input
                type="text"
                value={customRole}
                onChange={(event) => handleCustomRoleChange(event.target.value)}
                placeholder="Type your own role..."
                className={clsx(
                  "mt-3 w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition",
                  isCustomRole
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600"
                )}
              />
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Resume PDF</h2>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const droppedFile = event.dataTransfer.files[0];
              if (droppedFile?.type === "application/pdf") setFile(droppedFile);
            }}
            className={clsx(
              "flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-5 text-center transition",
              dragging ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50"
            )}
          >
            {file ? (
              <>
                <FileText size={28} className="text-emerald-500" />
                <p className="max-w-full truncate text-sm font-medium text-slate-800">{file.name}</p>
                <button onClick={() => setFile(null)} className="text-xs font-semibold text-emerald-600">
                  Replace file
                </button>
              </>
            ) : (
              <>
                <Upload size={28} className="text-slate-400" />
                <p className="text-sm text-slate-500">Drop your PDF here</p>
                <label className="cursor-pointer text-sm font-semibold text-emerald-600">
                  Browse files
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={!file || loading}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Mic2 size={18} />}
            {loading ? "Analyzing resume" : "Start interview"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function LiveInterview({
  session,
  question,
  questionNumber,
  loading,
  error,
  transcript,
  feedback,
  metrics,
  onAnswer,
  onEnd,
}) {
  const videoRef = useRef(null);
  const waveRef = useRef(null);
  const [seconds, setSeconds] = useState(0);
  const [tabWarnings, setTabWarnings] = useState(0);
  const tabWarnRef = useRef(false);
  const recorder = useRecorder(videoRef, waveRef, onAnswer, loading);

  useEffect(() => {
    recorder.startCamera();
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);

    const handleVisibility = () => {
      if (document.hidden) {
        tabWarnRef.current = true;
        setTimeout(() => {
          if (document.hidden) {
            setTabWarnings((c) => {
              const next = c + 1;
              if (next >= 3) onEnd();
              return next;
            });
          }
        }, 2000);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(timer);
      recorder.stopAll();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const isRecording = recorder.micState === "recording";
  const isReviewing = recorder.micState === "review";
  const sessionTime = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {session.role} / {session.domain}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-slate-950">
                Question {questionNumber}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {tabWarnings > 0 && (
                <span className="rounded-xl bg-amber-100 px-3 py-2 font-mono text-xs font-semibold text-amber-700">
                  {tabWarnings}/3 tab switches
                </span>
              )}
              <span className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm font-semibold text-slate-700">
                {sessionTime}
              </span>
              <button
                onClick={onEnd}
                className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                End
              </button>
            </div>
          </div>

          <div className="grid gap-px bg-slate-100 lg:grid-cols-2">
            <div className="relative min-h-[340px] bg-slate-950">
              <video
                ref={videoRef}
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {!recorder.hasCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <VideoOff size={42} />
                  <p className="text-sm">Camera not available</p>
                </div>
              )}
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-xl bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                {recorder.hasCamera ? <Video size={14} /> : <VideoOff size={14} />}
                {isRecording ? "Recording" : "Live"}
              </div>
              <div className="absolute bottom-4 left-4 rounded-xl bg-black/55 px-3 py-2 text-xs font-semibold text-emerald-200 backdrop-blur">
                ATS {session.ats_score}
              </div>
            </div>

            <div className="flex min-h-[340px] flex-col bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current question</p>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-base font-medium leading-7 text-slate-800">{question}</p>
              </div>
              {session.skills_found.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-slate-100 p-5">
                  {session.skills_found.map((skill) => (
                    <span key={skill} className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-px bg-slate-100 lg:grid-cols-2">
            <div className="bg-slate-950 p-5">
              <div className="relative mb-5 h-36 overflow-hidden rounded-2xl bg-slate-900">
                <canvas
                  ref={waveRef}
                  width={700}
                  height={200}
                  className={clsx("absolute inset-0 h-full w-full", isRecording ? "opacity-100" : "opacity-0")}
                />
                {!isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center gap-1">
                    {Array.from({ length: 36 }).map((_, index) => (
                      <span
                        key={index}
                        className="w-1 rounded-full bg-slate-700"
                        style={{ height: `${12 + Math.abs(Math.sin(index * 0.6)) * 34}px` }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {loading ? (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 size={16} className="animate-spin text-emerald-400" /> Evaluating answer
                  </span>
                ) : isReviewing ? (
                  <>
                    <button
                      onClick={recorder.reRecord}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                    >
                      <RotateCcw size={16} /> Re-record
                    </button>
                    <button
                      onClick={recorder.submitAnswer}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600"
                    >
                      <Send size={16} /> Submit answer
                    </button>
                  </>
                ) : isRecording ? (
                  <>
                    <span className="font-mono text-lg font-semibold text-red-300">{recorder.fmt(recorder.recSecs)}</span>
                    <button
                      onClick={recorder.stopMic}
                      className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
                    >
                      <Square size={18} fill="currentColor" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={recorder.startMic}
                    className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-card transition hover:bg-emerald-600"
                  >
                    <Mic size={22} />
                  </button>
                )}
              </div>
              {recorder.errMsg && (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-200">
                  {recorder.errMsg}
                </p>
              )}
            </div>

            <div className="bg-white p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Feedback</p>
              {error && (
                <div className="mb-4 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
                </div>
              )}
              {!loading && !transcript && !feedback && (
                <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl bg-slate-50 text-center text-sm text-slate-400">
                  <Mic2 size={26} className="mb-2" />
                  Submit an answer to see transcript, feedback, and metrics.
                </div>
              )}
              {transcript && (
                <div className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-500">Transcript</p>
                  {transcript}
                </div>
              )}
              {feedback && (
                <div className="mb-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">AI feedback</p>
                  {feedback}
                </div>
              )}
              {metrics && (
                <div className="space-y-3">
                  {Object.entries(metrics).map(([key, value]) => (
                    <MetricBar key={key} label={METRIC_LABELS[key] ?? key} value={value} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-slate-900">Question progress</p>
            <div className="mt-4 grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }).map((_, index) => (
                <span
                  key={index}
                  className={clsx("h-2 rounded-full", index < questionNumber ? "bg-emerald-500" : "bg-slate-200")}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Question {questionNumber} of 10</p>
          </div>

          {session.improvements.length > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-900">Resume suggestions</p>
              <ul className="mt-3 space-y-2">
                {session.improvements.map((item) => (
                  <li key={item} className="text-sm leading-6 text-amber-800">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

const STORAGE_KEY = "activeInterviewSession";

export default function InterviewPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("setup");
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [metrics, setMetrics] = useState(null);
  const resumeAttempted = useRef(false);

  useEffect(() => {
    if (resumeAttempted.current) return;
    resumeAttempted.current = true;
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;
    setLoading(true);
    getSessionState(savedId)
      .then((data) => {
        if (data.status !== "active") {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        const resumeSession = { ...data, session_id: data.session_id };
        setSession(resumeSession);
        setQuestion(data.question);
        setQuestionNumber(data.question_number);
        setPhase("live");
      })
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function handleStart(domain, role, file) {
    const data = await startInterview(domain, role, file);
    const interviewSession = { ...data, domain, role };
    setSession(interviewSession);
    setQuestion(interviewSession.question);
    setQuestionNumber(interviewSession.question_number);
    setTranscript("");
    setFeedback("");
    setMetrics(null);
    setPhase("live");
    localStorage.setItem(STORAGE_KEY, interviewSession.session_id);
  }

  const handleAnswer = useCallback(
    async (media) => {
      if (!session) return;
      setLoading(true);
      setError("");
      setTranscript("");
      setFeedback("");
      setMetrics(null);
      try {
        const data = await submitInterviewAnswer(
          session.session_id,
          media.audioBlob,
          media.videoBlob
        );
        setTranscript(data.transcript ?? "");
        setFeedback(data.feedback ?? "");
        setMetrics(data.metrics ?? null);
        if (data.completed) {
          localStorage.removeItem(STORAGE_KEY);
          setPhase("complete");
        } else {
          setQuestion(data.next_question ?? "");
          setQuestionNumber(data.question_number ?? questionNumber + 1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to process answer.");
      } finally {
        setLoading(false);
      }
    },
    [questionNumber, session]
  );

  async function openReport() {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      await endInterview(session.session_id);
      navigate(`/reports?session=${session.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate report.");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "setup") {
    return <SetupForm onStart={handleStart} />;
  }

  if (phase === "complete" && session) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
          <CheckCircle2 size={42} />
        </div>
        <h1 className="font-display text-3xl font-semibold text-slate-950">Interview complete</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your answers have been recorded. Generate the final report to review scores and improvement areas.
        </p>
        {error && (
          <div className="mt-5 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}
        <button
          onClick={openReport}
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          {loading ? "Generating report" : "View report"}
        </button>
      </div>
    );
  }

  if (phase === "live" && session) {
    return (
      <LiveInterview
        session={session}
        question={question}
        questionNumber={questionNumber}
        loading={loading}
        error={error}
        transcript={transcript}
        feedback={feedback}
        metrics={metrics}
        onAnswer={handleAnswer}
        onEnd={() => { localStorage.removeItem(STORAGE_KEY); setPhase("complete"); }}
      />
    );
  }

  return null;
}
