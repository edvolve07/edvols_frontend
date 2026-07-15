import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Timer from '../../components/Timer';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../utils/api';

function getResumeKey(attemptId) {
  return `vithai_attempt_resume_${attemptId}`;
}

function getStoredResume(attemptId) {
  try {
    return JSON.parse(localStorage.getItem(getResumeKey(attemptId)) || '{}');
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

export default function StartAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const startRequestSent = useRef(false);
  const [data, setData] = useState(null);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [extraTimeMinutes, setExtraTimeMinutes] = useState(0);
  const [effectiveDurationMinutes, setEffectiveDurationMinutes] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (startRequestSent.current) return;
    startRequestSent.current = true;

    apiFetch(`/student/assessments/${id}/start`, { method: 'POST' })
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
          payload.assessment.duration_minutes + (payload.attempt.extra_time_minutes || 0),
        );
      })
      .catch((error) => {
        startRequestSent.current = false;
        toast.error(error.message);
      });
  }, [id, toast]);

  useEffect(() => {
    if (!data?.attempt?.id) return;

    localStorage.setItem(
      getResumeKey(data.attempt.id),
      JSON.stringify({
        started,
        current,
        updated_at: new Date().toISOString(),
      }),
    );
  }, [started, current, data?.attempt?.id]);

  const submit = useCallback(async () => {
    if (!data || submitting) return;
    setSubmitting(true);
    try {
      await apiFetch(`/student/attempts/${data.attempt.id}/submit`, { method: 'POST' });
      localStorage.removeItem(getResumeKey(data.attempt.id));
      document.exitFullscreen?.().catch(() => {});
      toast.success('Assessment submitted');
      navigate(`/student/results/${data.attempt.id}`);
    } catch (error) {
      toast.error(error.message);
      setSubmitting(false);
    }
  }, [data, submitting, navigate, toast]);

  const syncAttemptTime = useCallback(
    async ({ showErrors = false } = {}) => {
      if (!data?.attempt?.id) return;

      try {
        const payload = await apiFetch(`/student/attempts/${data.attempt.id}/time`);
        setExtraTimeMinutes(payload.attempt.extra_time_minutes || 0);
        setEffectiveDurationMinutes(payload.attempt.effective_duration_minutes);
        if (payload.attempt.status === 'submitted') {
          navigate(`/student/results/${data.attempt.id}`);
        }
      } catch (error) {
        if (showErrors) {
          toast.error(error.message);
        }
      }
    },
    [data?.attempt?.id, navigate, toast],
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
      toast.error("Tab switch detected — submitting assessment");
      submit();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [started, submit, toast]);

  useEffect(() => {
    if (!started) return undefined;
    function onFullscreenChange() {
      if (document.fullscreenElement) {
        document.documentElement.dataset.assessmentFullscreen = "true";
      } else {
        delete document.documentElement.dataset.assessmentFullscreen;
      }
    }
    function tryFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("click", tryFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("click", tryFullscreen);
      delete document.documentElement.dataset.assessmentFullscreen;
    };
  }, [started]);

  useEffect(() => {
    if (!started || !data?.attempt?.id) return undefined;

    syncAttemptTime();
    const id = window.setInterval(() => {
      syncAttemptTime();
    }, 3000);

    return () => window.clearInterval(id);
  }, [started, data?.attempt?.id, syncAttemptTime]);

  async function startSecureAssessment() {
    setStarted(true);
    try {
      await document.documentElement.requestFullscreen?.();
      document.documentElement.dataset.assessmentFullscreen = "true";
    } catch {
      // Fullscreen not supported — assessment still runs
    }
  }

  async function selectAnswer(questionId, option) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [questionId]: option }));
    try {
      await apiFetch(`/student/attempts/${data.attempt.id}/answers`, {
        method: 'PUT',
        body: JSON.stringify({ question_id: questionId, selected_option: option }),
      });
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (!data) return <LoadingSkeleton label="Preparing assessment" />;

  if (!started) {
    return (
      <section className="mx-auto max-w-3xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-card-hover">
        <div className="bg-night p-6 text-white">
          <p className="text-xs font-bold uppercase text-teal-300">Ready to begin</p>
          <h2 className="mt-2 text-3xl font-black">{data.assessment.title}</h2>
        </div>
        <div className="p-6">
        <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <p className="rounded-md bg-slate-50 px-4 py-3 font-semibold">Duration: {effectiveDurationMinutes || data.assessment.duration_minutes} minutes</p>
          <p className="rounded-md bg-slate-50 px-4 py-3 font-semibold">Total Marks: {data.assessment.total_marks}</p>
          <p className="rounded-md bg-slate-50 px-4 py-3 font-semibold">Questions: {data.questions.length}</p>
          <p className="rounded-md bg-slate-50 px-4 py-3 font-semibold">Passing Marks: {data.assessment.passing_marks}</p>
        </div>
        <div className="mt-6 rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>
              Fullscreen mode is required. Tab switching or exiting fullscreen
              triggers automatic submission.
            </p>
          </div>
        </div>
        <button
          onClick={startSecureAssessment}
          className="btn-primary mt-6"
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
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Live Assessment</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">{data.assessment.title}</h2>
          <p className="text-sm text-slate-500">
            Question {current + 1} of {data.questions.length}
            {extraTimeMinutes ? ` · Extra time ${extraTimeMinutes}m` : ''}
          </p>
        </div>
        <Timer
          startedAt={data.attempt.started_at}
          durationMinutes={effectiveDurationMinutes || data.assessment.duration_minutes}
          onExpire={submit}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <article className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold leading-7 text-slate-900">{question.question_text}</p>
          <div className="mt-6 grid gap-3">
            {Object.entries(question.options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => selectAnswer(question.id, key)}
                className={`focus-ring flex items-start gap-3 rounded-md border p-4 text-left ${
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
              disabled={current === 0}
              onClick={() => setCurrent((value) => value - 1)}
              className="btn-secondary disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              disabled={current === data.questions.length - 1}
              onClick={() => setCurrent((value) => value + 1)}
              className="btn-secondary disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </article>

        <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-black text-slate-900">Navigator</p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {data.questions.map((item, index) => (
              <button
                key={item.id}
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
            disabled={submitting}
            onClick={submit}
            className="btn-dark mt-5 w-full"
          >
            <CheckCircle className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </aside>
      </div>
    </section>
  );
}
