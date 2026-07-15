import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "../../navigation";
import LoadingSkeleton from "./LoadingSkeleton";
import Timer from "./Timer";
import {
  getStudentAttemptTime,
  logProctoringEvent,
  saveStudentAnswer,
  startStudentAssessment,
  submitStudentAttempt,
} from "@/lib/api";

function getResumeKey(attemptId) {
  return `edvols_attempt_resume_${attemptId}`;
}

function getStoredResume(attemptId) {
  try {
    return JSON.parse(localStorage.getItem(getResumeKey(attemptId)) || "{}") || {};
  } catch {
    return {};
  }
}

function findResumeIndex(questions, selectedAnswers, storedIndex) {
  if (Number.isInteger(storedIndex) && storedIndex >= 0 && storedIndex < questions.length) {
    return storedIndex;
  }

  const firstUnanswered = questions.findIndex((question) => !selectedAnswers[question.id]);
  return firstUnanswered === -1 ? Math.max(0, questions.length - 1) : firstUnanswered;
}

export default function StartAssessment({ assessmentId }) {
  const navigate = useNavigate();
  const startRequestSent = useRef(false);
  const [data, setData] = useState(null);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [extraTimeMinutes, setExtraTimeMinutes] = useState(0);
  const [effectiveDurationMinutes, setEffectiveDurationMinutes] = useState(0);
  const [proctorEvents, setProctorEvents] = useState(0);
  const [snapshotMessage, setSnapshotMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (startRequestSent.current) return;
    startRequestSent.current = true;

    startStudentAssessment(assessmentId)
      .then((payload) => {
        const selectedAnswers = payload.selected_answers || {};
        const stored = getStoredResume(payload.attempt.id);
        const shouldResume = Boolean(stored.started || Object.keys(selectedAnswers).length > 0);

        setData(payload);
        setAnswers(selectedAnswers);
        setStarted(shouldResume);
        setCurrent(findResumeIndex(payload.questions, selectedAnswers, stored.current));
        setExtraTimeMinutes(payload.attempt.extra_time_minutes || 0);
        setEffectiveDurationMinutes(
          payload.assessment.duration_minutes + (payload.attempt.extra_time_minutes || 0)
        );
      })
      .catch((err) => {
        startRequestSent.current = false;
        setError(err.message || "Unable to start assessment.");
      });
  }, [assessmentId]);

  useEffect(() => {
    if (!data?.attempt?.id) return;
    localStorage.setItem(
      getResumeKey(data.attempt.id),
      JSON.stringify({
        started,
        current,
        updated_at: new Date().toISOString(),
      })
    );
  }, [started, current, data?.attempt?.id]);

  const submit = useCallback(async () => {
    if (!data || submitting) return;
    setSubmitting(true);
    try {
      await submitStudentAttempt(data.attempt.id);
      localStorage.removeItem(getResumeKey(data.attempt.id));
      document.exitFullscreen?.().catch(() => {});
      navigate(`/aptitude/results/${data.attempt.id}`);
    } catch (err) {
      setError(err.message || "Unable to submit assessment.");
      setSubmitting(false);
    }
  }, [data, navigate, submitting]);

  const syncAttemptTime = useCallback(
    async ({ showErrors = false } = {}) => {
      if (!data?.attempt?.id) return;
      try {
        const payload = await getStudentAttemptTime(data.attempt.id);
        setExtraTimeMinutes(payload.attempt.extra_time_minutes || 0);
        setEffectiveDurationMinutes(payload.attempt.effective_duration_minutes);
        if (payload.attempt.status === "submitted") {
          navigate(`/aptitude/results/${data.attempt.id}`);
        }
      } catch (err) {
        if (showErrors) {
          setError(err.message || "Unable to sync attempt time.");
        }
      }
    },
    [data?.attempt?.id, navigate]
  );

  const logEvent = useCallback(
    async (eventType, metadata = {}) => {
      if (!data?.attempt?.id) return;
      try {
        const payload = await logProctoringEvent(data.attempt.id, eventType, metadata, "aptitude");
        setProctorEvents(payload.total_events || 0);
      } catch {
        setProctorEvents((count) => count + 1);
      }
    },
    [data?.attempt?.id]
  );

  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (!started) return undefined;
    function onVisibility() {
      if (!document.hidden) {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        }
        return;
      }
      if (autoSubmitted.current) return;
      autoSubmitted.current = true;
      logEvent("tab_switch", { question_index: current });
      submit();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [current, logEvent, started, submit]);

  useEffect(() => {
    if (!started) return undefined;
    function tryFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    }
    document.addEventListener("click", tryFullscreen);
    return () => document.removeEventListener("click", tryFullscreen);
  }, [started]);

  useEffect(() => {
    if (!started) return undefined;
    function onFullscreenChange() {
      if (document.fullscreenElement) {
        document.documentElement.dataset.assessmentFullscreen = "true";
      } else {
        delete document.documentElement.dataset.assessmentFullscreen;
        logEvent("fullscreen_exit", { question_index: current });
      }
    }
    function blockClipboard(event) {
      event.preventDefault();
      logEvent(event.type, { question_index: current });
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("paste", blockClipboard);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
      delete document.documentElement.dataset.assessmentFullscreen;
    };
  }, [current, logEvent, started]);

  useEffect(() => {
    if (!started || !data?.attempt?.id) return undefined;
    syncAttemptTime();
    const id = window.setInterval(() => {
      syncAttemptTime();
    }, 3000);
    return () => window.clearInterval(id);
  }, [started, data?.attempt?.id, syncAttemptTime]);

  async function selectAnswer(questionId, option) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [questionId]: option }));
    try {
      await saveStudentAnswer(data.attempt.id, questionId, option);
    } catch (err) {
      setError(err.message || "Unable to save answer.");
    }
  }

  async function startSecureAssessment() {
    setStarted(true);
    try {
      await document.documentElement.requestFullscreen?.();
      document.documentElement.dataset.assessmentFullscreen = "true";
    } catch {
      await logEvent("fullscreen_exit", { reason: "fullscreen_request_failed" });
    }
  }

  async function captureSnapshot() {
    setSnapshotMessage("");
    try {
      const stream = await navigator.mediaDevices?.getUserMedia?.({ video: true });
      if (!stream) throw new Error("Camera unavailable");
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings?.() || {};
      track.stop();
      await logEvent("webcam_snapshot", {
        question_index: current,
        width: settings.width || null,
        height: settings.height || null,
      });
      setSnapshotMessage("Snapshot logged.");
    } catch {
      setSnapshotMessage("Camera snapshot unavailable.");
      await logEvent("webcam_snapshot", { question_index: current, failed: true });
    }
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return <LoadingSkeleton label="Preparing assessment" />;

  if (!started) {
    return (
      <section className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="bg-slate-950 p-6 text-white">
          <p className="text-xs font-bold uppercase text-teal-300">Ready to begin</p>
          <h2 className="mt-2 text-3xl font-black">{data.assessment.title}</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <p className="rounded-md bg-slate-50 px-4 py-3 font-semibold">
              Duration: {effectiveDurationMinutes || data.assessment.duration_minutes} minutes
            </p>
            <p className="rounded-md bg-slate-50 px-4 py-3 font-semibold">
              Total Marks: {data.assessment.total_marks}
            </p>
            <p className="rounded-md bg-slate-50 px-4 py-3 font-semibold">
              Questions: {data.questions.length}
            </p>
            <p className="rounded-md bg-slate-50 px-4 py-3 font-semibold">
              Passing Marks: {data.assessment.passing_marks}
            </p>
          </div>
          <div className="mt-6 rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>
                Fullscreen mode is recommended. Tab switching, fullscreen exits, copy/paste, and optional webcam snapshots are logged.
              </p>
            </div>
          </div>
          <button
            onClick={startSecureAssessment}
            className="btn-primary mt-6 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Start
          </button>
        </div>
      </section>
    );
  }

  const question = data.questions[current];
  const selected = answers[question.id];

  return (
    <section className="page-stack mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="page-hero flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Live Assessment</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{data.assessment.title}</h2>
          <p className="text-sm text-slate-500">
            Question {current + 1} of {data.questions.length} · Proctor events {proctorEvents}
            {extraTimeMinutes ? ` · Extra time ${extraTimeMinutes}m` : ""}
          </p>
        </div>
        <Timer
          startedAt={data.attempt.started_at}
          durationMinutes={effectiveDurationMinutes || data.assessment.duration_minutes}
          onExpire={submit}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold leading-7 text-slate-950">{question.question_text}</p>
          <div className="mt-6 grid gap-3">
            {Object.entries(question.options).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => selectAnswer(question.id, key)}
                className={`focus-ring flex w-full items-start gap-3 rounded-md border p-4 text-left ${
                  selected === key
                    ? 'border-brand bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-current text-sm font-bold">
                  {key}
                </span>
                <span className="text-sm font-semibold">{value}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => setCurrent((value) => value - 1)}
              className="btn-secondary rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              type="button"
              disabled={current === data.questions.length - 1}
              onClick={() => setCurrent((value) => value + 1)}
              className="btn-secondary rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-black text-slate-950">Navigator</p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {data.questions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrent(index)}
                className={`h-10 rounded-md border text-sm font-bold ${
                  index === current
                    ? 'border-brand bg-emerald-900 text-white'
                    : answers[item.id]
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="btn-dark mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
          <button
            type="button"
            onClick={captureSnapshot}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Camera className="h-4 w-4" />
            Webcam Snapshot
          </button>
          {snapshotMessage ? <p className="mt-2 text-xs font-semibold text-slate-500">{snapshotMessage}</p> : null}
        </aside>
      </div>
    </section>
  );
}
