import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Mic,
  Send,
  Square,
  Video,
  VideoOff,
  Trophy,
  ArrowRight,
} from "lucide-react";
import clsx from "clsx";
import { METRIC_LABELS } from "@/src/constants";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "@/lib/api";
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

function LiveInterview({ sessionId, firstQuestion, questionNumber, totalQuestions, atsScore, skillsFound, onComplete }) {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion);
  const [questionNum, setQuestionNum] = useState(questionNumber || 1);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [videoOn, setVideoOn] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const { startRecording, stopRecording, audioBlob } = useRecorder();

  useEffect(() => {
    let mounted = true;
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch {
        setVideoOn(false);
      }
    }
    setupCamera();
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  function toggleVideo() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => (t.enabled = !t.enabled));
      setVideoOn((v) => !v);
    }
  }

  const handleSubmitAnswer = useCallback(async () => {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch("/api/mentorship/interview/answer", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, answer: answer.trim() }),
      });

      const metrics = res.metrics || {};
      const fb = {
        feedback: res.feedback || "",
        metrics,
        strengths: res.strengths || [],
        improvements: res.improvements || [],
      };
      setFeedback(fb);
      setShowFeedback(true);

      if (res.completed) {
        setCompleted(true);
        try {
          const endRes = await apiFetch("/api/mentorship/interview/end", {
            method: "POST",
            body: JSON.stringify({ session_id: sessionId }),
          });
          setReport(endRes);
          onComplete?.(endRes);
        } catch (endErr) {
          setError(endErr.message || "Failed to generate report");
        }
      } else {
        setCurrentQuestion(res.next_question || "");
        setQuestionNum(res.question_number || questionNum + 1);
      }
      setAnswer("");
    } catch (err) {
      setError(err.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  }, [answer, submitting, sessionId, questionNum, onComplete]);

  if (completed && report) {
    const overall = report.overall || {};
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Trophy className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Interview Complete!</h2>
            <p className="mt-2 text-sm text-slate-500">Here's your performance summary</p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">{overall.percentage || 0}%</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Overall Score</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">{overall.grade || "—"}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Grade</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-3xl font-bold text-slate-900">{report.level_update?.newLevel || "—"}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Level</p>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Performance Metrics</h3>
            {Object.entries(overall.metrics || {}).map(([key, val]) => (
              <MetricBar key={key} label={METRIC_LABELS[key] || key} value={val} />
            ))}
          </div>

          {report.strengths?.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-emerald-700">Strengths</h3>
              <ul className="space-y-1">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.areas_to_improve?.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-amber-700">Areas to Improve</h3>
              <ul className="space-y-1">
                {report.areas_to_improve.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => navigate("/progress")} className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition">
              View Progress
            </button>
            <button onClick={() => navigate("/reports")} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              View Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                <span>Question {questionNum} of {totalQuestions || 10}</span>
              </div>
              {atsScore != null && (
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  ATS: {atsScore}
                </span>
              )}
            </div>

            <div className="mb-5 rounded-xl bg-slate-50 p-5">
              <p className="text-base font-medium leading-relaxed text-slate-900">{currentQuestion}</p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold text-slate-600">Your Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={5}
                placeholder="Type your answer here..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              />
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4" /> Submit Answer</>
              )}
            </button>
          </div>

          {showFeedback && feedback && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-emerald-800">AI Feedback</h3>
              {feedback.feedback && <p className="mb-3 text-sm text-slate-700">{feedback.feedback}</p>}
              <div className="space-y-2">
                {Object.entries(feedback.metrics || {}).map(([key, val]) => (
                  <MetricBar key={key} label={METRIC_LABELS[key] || key} value={val} />
                ))}
              </div>
              <button
                onClick={() => setShowFeedback(false)}
                className="mt-4 flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Next Question <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 overflow-hidden rounded-xl bg-slate-900">
              <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
            </div>
            <div className="flex gap-2">
              <button onClick={toggleVideo} className={clsx("flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition", videoOn ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-red-100 text-red-700")}>
                {videoOn ? <><Video className="mr-1 inline h-3.5 w-3.5" /> Video On</> : <><VideoOff className="mr-1 inline h-3.5 w-3.5" /> Video Off</>}
              </button>
            </div>
          </div>

          {skillsFound?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold text-slate-500">Skills Found</h3>
              <div className="flex flex-wrap gap-1.5">
                {skillsFound.map((s, i) => (
                  <span key={i} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-xs font-semibold text-slate-500">Progress</h3>
            <div className="flex gap-1">
              {Array.from({ length: totalQuestions || 10 }).map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    "h-2 flex-1 rounded-full transition-colors",
                    i < questionNum - 1 ? "bg-emerald-500" : i === questionNum - 1 ? "bg-brand-500" : "bg-slate-200"
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">{questionNum - 1} / {totalQuestions || 10} answered</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MentorshipInterviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questionData, setQuestionData] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    async function loadSession() {
      try {
        const res = await apiFetch(`/api/mentorship/journey/interviews`);
        const interview = (res.interviews || []).find((iv) => iv.session_id === sessionId);
        if (interview && interview.status === "completed") {
          navigate("/progress");
          return;
        }
      } catch {
        // ignore — session may still be active
      }

      try {
        const sessionRes = await apiFetch(`/api/session/${sessionId}`);
        const firstQuestion = sessionRes?.question ?? sessionRes?.current_question;
        if (firstQuestion) {
          setQuestionData({
            sessionId,
            firstQuestion,
            questionNumber: sessionRes.question_number || sessionRes.question_count || 1,
            totalQuestions: sessionRes.max_questions ?? 10,
            atsScore: sessionRes.ats_analysis?.ats_score,
            skillsFound: (sessionRes.ats_analysis?.skills_found || []).slice(0, 5),
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load interview session");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h2 className="text-lg font-bold text-slate-900">Interview Error</h2>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <button onClick={() => navigate("/progress")} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Back to Progress
        </button>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
        <h2 className="text-lg font-bold text-slate-900">Session Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">This interview session could not be loaded.</p>
        <button onClick={() => navigate("/progress")} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Back to Progress
        </button>
      </div>
    );
  }

  return (
    <LiveInterview
      sessionId={questionData.sessionId}
      firstQuestion={questionData.firstQuestion}
      questionNumber={questionData.questionNumber}
      totalQuestions={questionData.totalQuestions}
      atsScore={questionData.atsScore}
      skillsFound={questionData.skillsFound}
      onComplete={() => {}}
    />
  );
}
