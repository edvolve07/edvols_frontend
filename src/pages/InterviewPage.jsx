import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  ListChecks,
  Loader2,
  Mic,
  Mic2,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Upload,
  Video,
  VideoOff,
} from "lucide-react";
import clsx from "clsx";
import { DOMAIN_ROLES, INTERVIEW_DOMAINS, INTERVIEW_ROLES, METRIC_COLORS, METRIC_LABELS } from "@/src/constants";
import { useNavigate } from "@/src/navigation";
import { useAuth } from "@/src/portal/context/AuthContext";
import { apiFetch, endInterview, getNextInterview, getSessionState, startInterview, submitAnswer as submitInterviewAnswer, getSavedResume } from "@/lib/api";
import { useRecorder } from "@/components/VoiceRecorder";

function MetricBar({ label, value, color }) {
  const percentage = Math.min(100, Math.max(0, value * 10));
  const barColor = color ?? (value >= 7 ? "#10b981" : value >= 5 ? "#f59e0b" : "#ef4444");

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{value}/10</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: barColor }} />
      </div>
    </div>
  );
}

function mapStreamToDomain(stream) {
  if (!stream) return INTERVIEW_DOMAINS[0];
  if (INTERVIEW_DOMAINS.includes(stream)) return stream;
  return "Other";
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
  const [savedResume, setSavedResume] = useState(null);
  const [useSaved, setUseSaved] = useState(false);
  const [nextInterview, setNextInterview] = useState(null);

  useEffect(() => {
    getSavedResume().then((res) => {
      if (res?.hasSaved) setSavedResume(res);
    }).catch(() => {});

    getNextInterview().then(setNextInterview).catch(() => {});

    apiFetch("/api/auth/me")
      .then((res) => {
        const user = res?.user || res;
        const savedStream = user?.stream;
        const savedRole = user?.interested_role;
        if (!savedStream && !savedRole) return;
        const initialDomain = mapStreamToDomain(savedStream);
        const roles = DOMAIN_ROLES[initialDomain] ?? [];
        if (roles.includes(savedRole)) {
          setDomain(initialDomain);
          setRole(savedRole);
        } else if (savedRole) {
          setDomain(initialDomain);
          setCustomRole(savedRole);
          setRole(savedRole);
          setIsCustomRole(true);
        }
      })
      .catch(() => {});
  }, []);

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
    if (loading) return;
    if (!useSaved && !file) return;
    setLoading(true);
    setError("");
    try {
      await onStart(domain, role, useSaved ? null : file, useSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start interview.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {nextInterview && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-[0_0_0_1px_rgba(5,150,105,0.25),0_0_28px_rgba(5,150,105,0.15)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-5 py-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <Mic2 size={15} />
              </span>
              {nextInterview.all_completed ? "All interviews completed" : `Interview ${nextInterview.interview_number} — ${nextInterview.title}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Level {nextInterview.level} · {nextInterview.difficulty}
              </span>
              {!nextInterview.all_completed && (
                <span className="rounded-lg border border-slate-100 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  {nextInterview.completed_interviews} of {nextInterview.total_interviews} completed
                </span>
              )}
            </div>
          </div>
          {!nextInterview.all_completed && (
            <div className="px-5 py-3.5">
              <p className="text-sm leading-6 text-emerald-900/80">{nextInterview.objective}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(nextInterview.focus_areas || []).map((area) => (
                  <span key={area} className="rounded-lg border border-slate-100 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

          {savedResume?.hasSaved && (
            <div className="mb-4">
              <button
                onClick={() => { setUseSaved(true); setFile(null); setError(""); }}
                className={clsx(
                  "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition",
                  useSaved
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className={useSaved ? "text-emerald-500" : "text-slate-400"} />
                  Use saved resume
                </span>
                <span className="mt-1 block text-xs text-slate-500 truncate">{savedResume.name}</span>
              </button>
            </div>
          )}

          {(!useSaved || !savedResume?.hasSaved) && (
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
                if (droppedFile?.type === "application/pdf") { setFile(droppedFile); setUseSaved(false); }
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
                      onChange={(event) => { setFile(event.target.files?.[0] ?? null); setUseSaved(false); }}
                    />
                  </label>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={(!useSaved && !file) || loading}
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

const INTERVIEW_TOTAL_SECONDS = 40 * 60;

const FEEDBACK_TABS = [
  { id: "transcript", label: "Transcript", icon: FileText },
  { id: "feedback", label: "Feedback", icon: Sparkles },
  { id: "evaluation", label: "Detailed Evaluation", icon: BarChart3 },
];

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(Math.floor(safe % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function scoreBarClass(score) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function InterviewHeader({ session, questionNumber, answered, timeLeft, tabWarnings, onEnd, totalQuestions = 10 }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const completed = Math.max(0, questionNumber - 1);
  const remaining = totalQuestions - questionNumber + 1;

  return (
    <header className="rounded-3xl border border-slate-100 bg-white px-5 py-3 shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-xl font-semibold text-slate-950">
            Question {questionNumber}<span className="ml-1 text-sm font-medium text-slate-400">of {totalQuestions}</span>
          </h1>
          {session.blueprint_title && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Mic2 size={12} /> Interview {session.interview_number} — {session.blueprint_title}
            </span>
          )}
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {session.role} / {session.domain}
          </p>
          <p className="text-xs text-slate-500">
            {answered
              ? "Answer submitted — review your feedback."
              : `${completed} completed · ${remaining} remaining`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            aria-label="Profile"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </button>
          {tabWarnings > 0 && (
            <span className="shrink-0 rounded-lg bg-amber-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-amber-700">
              {tabWarnings}/3 tab switches
            </span>
          )}
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-sm font-semibold text-slate-700">
            <Clock size={13} className="text-slate-400" /> {formatTime(timeLeft)}
          </span>
          <button
            onClick={onEnd}
            className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white shadow-card transition hover:bg-red-600"
          >
            End Interview
          </button>
        </div>
      </div>
    </header>
  );
}

function QuestionCard({ question, questionNumber, skills }) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current question</p>
        <span className="text-xs font-semibold text-slate-400">Q{questionNumber}</span>
      </div>
      <p className="mt-2 text-base font-medium leading-7 text-slate-900">{question}</p>
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {skills.map((skill) => (
            <span key={skill} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {skill}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function InterviewFooter({ recorder, waveRef, loading, cameraOn, onToggleCamera }) {
  const isRecording = recorder.micState === "recording";
  const isReviewing = recorder.micState === "review";

  return (
    <section className="rounded-3xl border border-slate-100 bg-slate-950 p-4 shadow-[0_6px_20px_rgba(15,23,42,0.14)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative h-16 flex-1 overflow-hidden rounded-xl bg-slate-900">
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
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-2 py-1 text-[11px] font-semibold text-slate-300">
            <Mic size={12} /> Audio
          </div>
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
                <Send size={16} /> Submit Answer
              </button>
            </>
          ) : isRecording ? (
            <>
              <span className="font-mono text-base font-semibold text-red-300">{recorder.fmt(recorder.recSecs)}</span>
              <button
                onClick={recorder.stopMic}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
              >
                <Square size={16} fill="currentColor" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={recorder.startMic}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-card transition hover:bg-emerald-600"
              >
                <Mic size={20} />
              </button>
              <button
                onClick={onToggleCamera}
                title="Toggle camera"
                className={clsx(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border text-white transition",
                  cameraOn
                    ? "border-white/20 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-white/20 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                )}
              >
                {cameraOn ? <Camera size={16} /> : <CameraOff size={16} />}
              </button>
            </>
          )}
        </div>
      </div>
      {recorder.errMsg && (
        <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-200">
          {recorder.errMsg}
        </p>
      )}
    </section>
  );
}

function InterviewSidebar({ questionNumber, atsScore, overallScore, onNext = null, totalQuestions = 10 }) {
  const completed = Math.max(0, questionNumber - 1);
  const remaining = totalQuestions - questionNumber + 1;

  return (
    <aside className="flex flex-col gap-4">
      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ListChecks size={16} className="text-emerald-500" /> Interview Progress
        </p>
        <div className="mt-4 grid grid-cols-10 gap-1.5">
          {Array.from({ length: totalQuestions }).map((_, index) => (
            <span key={index} className={clsx("h-2 rounded-full", index < questionNumber ? "bg-emerald-500" : "bg-slate-200")} />
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{completed} completed · {remaining} remaining</p>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Award size={16} className="text-emerald-500" /> ATS Score
        </p>
        <p className="mt-3 text-2xl font-bold text-slate-950">
          {atsScore}<span className="ml-1 text-base font-semibold text-slate-400">/100</span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={clsx("h-full rounded-full transition-all", scoreBarClass(atsScore))} style={{ width: `${Math.min(100, Math.max(0, atsScore))}%` }} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.08)]">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Target size={16} className="text-emerald-500" /> Overall Score
        </p>
        <p className="mt-3 text-2xl font-bold text-slate-950">
          {overallScore ?? "--"}<span className="ml-1 text-base font-semibold text-slate-400">/10</span>
        </p>
        {overallScore !== null ? (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className={clsx("h-full rounded-full transition-all", scoreBarClass(overallScore * 10))} style={{ width: `${Math.min(100, overallScore * 10)}%` }} />
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-400">Updates after each answer.</p>
        )}
      </section>

      {onNext && (
        <button
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(5,150,105,0.3)] transition hover:bg-emerald-600"
        >
          Next Question <ArrowRight size={16} />
        </button>
      )}
    </aside>
  );
}

function TranscriptTab({ transcript }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FileText size={15} />
          </span>
          Transcript
        </p>
        {transcript && (
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            {transcript.trim().split(/\s+/).length} words
          </span>
        )}
      </div>
      <p className="whitespace-pre-wrap p-5 text-sm leading-7 text-slate-700">{transcript}</p>
    </div>
  );
}

function FeedbackTab({ feedback, metrics }) {
  const entries = metrics ? Object.entries(metrics) : [];
  const strengths = entries.filter(([, value]) => value >= 7);
  const weak = entries.filter(([, value]) => value < 7);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Sparkles size={15} />
            </span>
            Overall Summary
          </p>
        </div>
        <p className="p-5 text-sm leading-7 text-slate-700">
          {feedback || "No written feedback was provided for this answer."}
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={15} />
              </span>
              Strengths
            </p>
          </div>
          {strengths.length > 0 ? (
            <ul className="space-y-2.5 p-5">
              {strengths.map(([key, value]) => (
                <li key={key} className="flex items-center gap-2 text-sm leading-6 text-slate-700">
                  <span className="font-medium">{METRIC_LABELS[key] ?? key}</span>
                  <span className="ml-auto rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{value}/10</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-sm text-slate-400">No metric crossed 7/10 on this answer.</p>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <AlertCircle size={15} />
              </span>
              Areas to Improve
            </p>
          </div>
          {weak.length > 0 ? (
            <ul className="space-y-2.5 p-5">
              {weak.map(([key, value]) => (
                <li key={key} className="flex items-center gap-2 text-sm leading-6 text-slate-700">
                  <span className="font-medium">{METRIC_LABELS[key] ?? key}</span>
                  <span className="ml-auto rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{value}/10</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-sm text-slate-400">Everything scored 7/10 or above. Nice work.</p>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Target size={15} />
            </span>
            Suggestions
          </p>
        </div>
        {weak.length > 0 ? (
          <ul className="space-y-2.5 p-5">
            {weak.map(([key]) => (
              <li key={key} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                <ArrowRight size={15} className="mt-1 flex-shrink-0 text-sky-500" />
                Practice {METRIC_LABELS[key] ?? key} in your next answer — keep your response structured and specific.
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-sm text-slate-400">Keep this momentum going into the next question.</p>
        )}
      </section>
    </div>
  );
}

function EvaluationTab({ metrics }) {
  const entries = metrics ? Object.entries(metrics) : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
      <div className="border-b border-slate-100 px-5 py-3.5">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <BarChart3 size={15} />
          </span>
          Detailed Evaluation
        </p>
      </div>
      {entries.length > 0 ? (
        <div className="space-y-5 p-5">
          {entries.map(([key, value]) => (
            <MetricBar key={key} label={METRIC_LABELS[key] ?? key} value={value} color={METRIC_COLORS[key]} />
          ))}
        </div>
      ) : (
        <p className="p-5 text-sm text-slate-400">No evaluation available for this answer.</p>
      )}
    </div>
  );
}

function StrengthCard({ metrics }) {
  const entries = metrics ? Object.entries(metrics).filter(([, value]) => value >= 7) : [];

  return (
    <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <TrendingUp size={15} />
        </span>
        What You Did Well
      </p>
      {entries.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {entries.map(([key, value]) => (
            <li key={key} className="flex items-start gap-2 text-sm leading-6 text-emerald-800">
              <CheckCircle2 size={15} className="mt-1 flex-shrink-0 text-emerald-500" />
              <span><span className="font-semibold">{METRIC_LABELS[key] ?? key}</span> — you scored {value}/10.</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-emerald-700/70">No metric reached 7/10 on this answer — keep practicing.</p>
      )}
    </section>
  );
}

function ImprovementCard({ metrics }) {
  const entries = metrics ? Object.entries(metrics).filter(([, value]) => value < 7) : [];

  return (
    <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
          <TrendingDown size={15} />
        </span>
        Focus On Next
      </p>
      {entries.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {entries.map(([key, value]) => (
            <li key={key} className="flex items-start gap-2 text-sm leading-6 text-amber-800">
              <AlertCircle size={15} className="mt-1 flex-shrink-0 text-amber-500" />
              <span><span className="font-semibold">{METRIC_LABELS[key] ?? key}</span> — currently at {value}/10.</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-amber-700/70">All metrics scored 7/10 or above — keep it up.</p>
      )}
    </section>
  );
}

function LiveInterview({
  session,
  question,
  questionNumber,
  totalQuestions,
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
  const [cameraOn, setCameraOn] = useState(true);
  const [activeTab, setActiveTab] = useState("transcript");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewedQuestion, setReviewedQuestion] = useState(questionNumber);
  const hadData = useRef(false);
  const recorder = useRecorder(videoRef, waveRef, onAnswer, loading);

  const hasData = Boolean(transcript || feedback || metrics);
  const answered = reviewOpen && hasData;

  useEffect(() => {
    if (hasData && !hadData.current) {
      setReviewOpen(true);
      setReviewedQuestion(questionNumber - 1);
      setActiveTab("transcript");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (!hasData) {
      setReviewOpen(false);
    }
    hadData.current = hasData;
  }, [hasData]);

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
  const cameraVisible = recorder.hasCamera && cameraOn;
  const timeLeft = Math.max(0, INTERVIEW_TOTAL_SECONDS - seconds);
  const metricEntries = metrics ? Object.entries(metrics) : [];
  const overallScore = metricEntries.length
    ? (metricEntries.reduce((sum, [, value]) => sum + value, 0) / metricEntries.length).toFixed(1)
    : null;

  function toggleCamera() {
    if (cameraOn) {
      const element = videoRef.current;
      element?.srcObject?.getVideoTracks().forEach((track) => track.stop());
      if (element) element.srcObject = null;
      setCameraOn(false);
    } else {
      setCameraOn(true);
      recorder.startCamera();
    }
  }

  function nextQuestion() {
    setReviewOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reviewFeedback() {
    setActiveTab("feedback");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderVideo(sizeClass) {
    return (
      <div
        className={clsx(
          "relative aspect-video w-full overflow-hidden bg-slate-950 shadow-card",
          sizeClass
        )}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {!cameraVisible && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950 text-slate-500">
            <VideoOff size={answered ? 18 : 42} />
            <p className="text-xs font-medium sm:text-sm">Camera off</p>
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          {cameraVisible ? <Video size={12} /> : <VideoOff size={12} />}
          {isRecording ? "Recording" : "Live"}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <InterviewHeader
          session={session}
          questionNumber={answered ? reviewedQuestion : questionNumber}
          answered={answered}
          timeLeft={timeLeft}
          tabWarnings={tabWarnings}
          onEnd={onEnd}
          totalQuestions={totalQuestions}
        />

        {error && !loading && (
          <div className="flex gap-2 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <main className={answered ? "relative space-y-5" : "relative flex flex-col gap-4"}>
            {answered ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center">
                  {renderVideo("shrink-0 rounded-xl sm:w-40 lg:w-52")}
                  <div className="min-w-0 flex-1">
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      <CheckCircle2 size={13} /> Answer submitted
                    </p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-slate-950">
                      Question {reviewedQuestion} — here's how you did
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Review your transcript, feedback, and detailed scores below.
                    </p>
                  </div>
                  {overallScore && (
                    <div className="flex shrink-0 flex-col items-center rounded-2xl bg-emerald-50 px-4 py-2.5">
                      <span className="text-2xl font-bold leading-none text-emerald-700">
                        {overallScore}<span className="text-sm font-semibold text-emerald-600">/10</span>
                      </span>
                      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Overall</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-card">
                  {FEEDBACK_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                        activeTab === tab.id
                          ? "bg-emerald-500 text-white shadow-card"
                          : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      <tab.icon size={15} /> {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === "transcript" && <TranscriptTab transcript={transcript} />}
                {activeTab === "feedback" && <FeedbackTab feedback={feedback} metrics={metrics} />}
                {activeTab === "evaluation" && <EvaluationTab metrics={metrics} />}

                <div className="grid gap-5 md:grid-cols-2">
                  <StrengthCard metrics={metrics} />
                  <ImprovementCard metrics={metrics} />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    onClick={reviewFeedback}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-card transition hover:bg-slate-50"
                  >
                    <Eye size={16} /> Review Feedback
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-10 text-sm text-slate-500 shadow-card">
                <Loader2 size={18} className="animate-spin text-emerald-500" /> Evaluating your answer...
              </div>
            ) : (
              <>
                {renderVideo("rounded-3xl shadow-[0_10px_30px_rgba(2,44,31,0.3)] xl:aspect-auto xl:h-[calc(100vh-470px)] xl:max-h-[460px] xl:min-h-[200px]")}
                <QuestionCard question={question} questionNumber={questionNumber} skills={session.skills_found ?? []} />
                <InterviewFooter
                  recorder={recorder}
                  waveRef={waveRef}
                  loading={loading}
                  cameraOn={cameraVisible}
                  onToggleCamera={toggleCamera}
                />
              </>
            )}
          </main>

          <InterviewSidebar
            questionNumber={questionNumber}
            atsScore={session.ats_score ?? 0}
            overallScore={overallScore}
            onNext={answered ? nextQuestion : null}
            totalQuestions={totalQuestions}
          />
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "activeInterviewSession";

function formatLockDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function GapCountdown({ lastInterviewAt, gapDays }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!lastInterviewAt || !gapDays) return null;

  const unlocksAt = new Date(lastInterviewAt).getTime() + gapDays * 24 * 60 * 60 * 1000;
  const diff = Math.max(0, unlocksAt - now);

  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");

  const units = [
    { label: "DAYS", value: days },
    { label: "HRS", value: hours },
    { label: "MIN", value: minutes },
    { label: "SEC", value: seconds },
  ];

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white shadow-lg sm:h-20 sm:w-20 sm:text-2xl">
            {pad(value)}
          </div>
          <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function InterviewPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("setup");
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [metrics, setMetrics] = useState(null);
  const resumeAttempted = useRef(false);
  const [lockStatus, setLockStatus] = useState(null);
  const [lockLoading, setLockLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/mentorship/lock-status")
      .then((data) => setLockStatus(data))
      .catch(() => setLockStatus({ allowed: true }))
      .finally(() => setLockLoading(false));
  }, []);

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
        setTotalQuestions(data.max_questions ?? 10);
        setPhase("live");
      })
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function handleStart(domain, role, file, useSaved = false) {
    const data = await startInterview(domain, role, file, useSaved);
    try {
      await apiFetch("/api/auth/profile/targeting", {
        method: "PATCH",
        body: JSON.stringify({ stream: domain, interested_role: role }),
      });
    } catch (_e) {}
    const interviewSession = { ...data, domain, role };
    setSession(interviewSession);
    setQuestion(interviewSession.question);
    setQuestionNumber(interviewSession.question_number);
    setTotalQuestions(interviewSession.max_questions ?? 10);
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
    if (lockLoading) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        </div>
      );
    }
    if (lockStatus && lockStatus.allowed === false) {
      const isGapLock = lockStatus.reason === "gap_restriction";
      return (
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <Timer className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Interview Locked</h2>
          {isGapLock ? (
            <>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                You can start your next interview after the gap period ends.
              </p>
              <GapCountdown
                lastInterviewAt={lockStatus.lastInterviewAt}
                gapDays={lockStatus.gapDays}
              />
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
                Gap restriction: {lockStatus.gapDays} day(s) between interviews
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                {lockStatus.reason || "You can start your next interview after the gap period."}
              </p>
              {lockStatus.nextUnlockAt && (
                <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800">
                  Available on {formatLockDate(lockStatus.nextUnlockAt)}
                  {lockStatus.daysRemaining > 0 && ` — ${lockStatus.daysRemaining} day${lockStatus.daysRemaining !== 1 ? "s" : ""} left`}
                </p>
              )}
            </>
          )}
          <button
            onClick={() => navigate("/progress")}
            className="mt-8 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View Progress
          </button>
        </div>
      );
    }
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
        totalQuestions={totalQuestions}
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
