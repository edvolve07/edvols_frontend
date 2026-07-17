import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Play,
  Clock,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const levelColors = ["bg-slate-400", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
const levelNames = ["Foundation", "Professional", "Advanced", "Expert", "Mentor", "Placement Master"];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? "bg-emerald-100 text-emerald-700"
    : score >= 60 ? "bg-amber-100 text-amber-700"
    : "bg-rose-100 text-rose-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${color}`}>
      {score}%
    </span>
  );
}

export default function InterviewReplayPage() {
  const navigate = useNavigate();
  const [replays, setReplays] = useState([]);
  const [selectedReplay, setSelectedReplay] = useState(null);
  const [replayDetail, setReplayDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const fetchReplays = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiFetch("/api/mentorship/interview/replays");
      setReplays(data.replays || []);
    } catch (err) {
      setError(err.message || "Failed to load replays");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReplays();
  }, [fetchReplays]);

  const loadReplayDetail = async (sessionId) => {
    if (selectedReplay === sessionId) {
      setSelectedReplay(null);
      setReplayDetail(null);
      return;
    }
    try {
      setLoadingDetail(true);
      setSelectedReplay(sessionId);
      const data = await apiFetch(`/api/mentorship/interview/replay/${sessionId}`);
      setReplayDetail(data.replay);
    } catch (err) {
      setError(err.message || "Failed to load replay details");
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Interview Replays</h1>
        <p className="mt-1 text-slate-500">Review your past interviews question by question</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      )}

      {replays.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-lg font-medium text-slate-600">No replays available yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Complete interviews to see your replays here (unlocked at Level 5)
          </p>
          <button
            type="button"
            onClick={() => navigate("/progress")}
            className="mt-6 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Go to Progress
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {replays.map((replay) => (
            <div
              key={replay.session_id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => loadReplayDetail(replay.session_id)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white font-bold ${levelColors[(replay.level_at_time || 1) - 1] || "bg-slate-400"}`}>
                    {replay.interview_number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Interview #{replay.interview_number}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(replay.completed_at)}
                      </span>
                      <span>
                        Level {replay.level_at_time} — {levelNames[(replay.level_at_time || 1) - 1]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ScoreBadge score={replay.overall_score} />
                  {selectedReplay === replay.session_id ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {selectedReplay === replay.session_id && (
                <div className="border-t border-slate-100 px-5 pb-5">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                    </div>
                  ) : replayDetail ? (
                    <div className="pt-4">
                      <div className="mb-4 grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-slate-50 p-3 text-center">
                          <p className="text-2xl font-bold text-slate-900">{replayDetail.total_questions}</p>
                          <p className="text-xs text-slate-500">Questions</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-center">
                          <p className="text-2xl font-bold text-slate-900">{replayDetail.overall?.percentage || 0}%</p>
                          <p className="text-xs text-slate-500">Overall</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-center">
                          <p className="text-2xl font-bold text-slate-900">{replayDetail.overall?.grade || "—"}</p>
                          <p className="text-xs text-slate-500">Grade</p>
                        </div>
                      </div>

                      {replayDetail.strengths?.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-emerald-700">Strengths</h4>
                          <ul className="mt-1 space-y-1">
                            {replayDetail.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {replayDetail.areas_to_improve?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-amber-700">Areas to Improve</h4>
                          <ul className="mt-1 space-y-1">
                            {replayDetail.areas_to_improve.map((a, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {replayDetail.questions?.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-slate-700">Questions & Answers</h4>
                          <div className="space-y-2">
                            {replayDetail.questions.map((q, i) => (
                              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50">
                                <button
                                  type="button"
                                  onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
                                  className="flex w-full items-center justify-between p-3 text-left"
                                >
                                  <span className="text-sm font-medium text-slate-700">
                                    Q{i + 1}: {q.question?.substring(0, 80)}...
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <ScoreBadge score={q.evaluation?.overall || 0} />
                                    {expandedQuestion === i ? (
                                      <ChevronUp className="h-4 w-4 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    )}
                                  </div>
                                </button>
                                {expandedQuestion === i && (
                                  <div className="border-t border-slate-100 px-3 pb-3">
                                    <div className="mt-2 rounded-lg bg-white p-3">
                                      <p className="text-xs font-semibold text-slate-500">Your Answer</p>
                                      <p className="mt-1 text-sm text-slate-700">{q.answer || "No answer recorded"}</p>
                                    </div>
                                    {q.evaluation?.feedback && (
                                      <div className="mt-2 rounded-lg bg-brand-50 p-3">
                                        <p className="text-xs font-semibold text-brand-700">AI Feedback</p>
                                        <p className="mt-1 text-sm text-slate-700">{q.evaluation.feedback}</p>
                                      </div>
                                    )}
                                    <div className="mt-2 flex gap-4 text-xs text-slate-500">
                                      <span>Confidence: {q.evaluation?.confidence || 0}/10</span>
                                      <span>Knowledge: {q.evaluation?.knowledge || 0}/10</span>
                                      <span>Fluency: {q.evaluation?.fluency || 0}/10</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate(`/mentorship/report/${replay.session_id}`)}
                          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                        >
                          View Full Report
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
