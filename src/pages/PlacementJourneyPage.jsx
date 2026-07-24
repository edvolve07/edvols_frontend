import { useEffect, useState, useCallback, Component } from "react";
import {
  Loader2,
  Target,
  TrendingUp,
  CheckCircle2,
  Award,
  ArrowRight,
  Clock,
  FileText,
  Briefcase,
  BarChart3,
  Zap,
  ChevronRight,
  Play,
  AlertCircle,
  Lock,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-500">{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const levelColors = ["bg-slate-400", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
const levelNames = ["Foundation", "Professional", "Advanced", "Expert", "Mentor", "Placement Master"];

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function PlacementJourneyInner() {
  const navigate = useNavigate();
  const [journey, setJourney] = useState(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [accessLevel, setAccessLevel] = useState(6);
  const [interviews, setInterviews] = useState([]);
  const [trends, setTrends] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const results = await Promise.allSettled([
        apiFetch("/api/mentorship/journey"),
        apiFetch("/api/mentorship/levels"),
        apiFetch("/api/mentorship/journey/interviews"),
        apiFetch("/api/mentorship/progress/trends"),
        apiFetch("/api/mentorship/progress/readiness"),
        apiFetch("/api/mentorship/resume/comparisons"),
      ]);

      const get = (i, fallback) => results[i].status === "fulfilled" ? results[i].value : fallback;

      setJourney(get(0, {}).journey || null);
      setLevels(get(1, {}).levels || []);
      setCurrentLevel(get(1, {}).current_level || 1);
      const backendAccessLevel = get(1, {}).journey_access_level;
      if (backendAccessLevel !== undefined && backendAccessLevel !== null) {
        setAccessLevel(backendAccessLevel);
      }
      const rawInterviews = get(2, {}).interviews || [];
      setInterviews(rawInterviews.map((iv) => ({
        ...iv,
        number: iv.interview_number ?? iv.number,
        score: iv.overall_score ?? iv.score,
        date: iv.completed_at ?? iv.date,
      })));
      const rawTrends = get(3, {}).trends || {};
      const trendsArray = Array.isArray(rawTrends)
        ? rawTrends
        : (rawTrends.overall || []).map((t, i) => ({ score: t.value, date: t.date, session_id: i }));
      setTrends(trendsArray);
      setReadiness(get(4, {}).readiness || null);
      setComparisons(get(5, {}).comparisons || []);
    } catch (err) {
      setError(err.message || "Failed to load journey data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      </div>
    );
  }

  const maxTrendScore = Math.max(...trends.map((t) => t.score || 0), 1);
  const completedInterviews = interviews.filter((i) => i.status === "completed");

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Hero */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                  <Briefcase className="h-5 w-5 text-brand-700" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {journey?.target_career_goal || "Placement Journey"}
                  </h1>
                  <p className="text-sm text-slate-500">
                    Level {currentLevel} — {levelNames[currentLevel - 1] || "Getting Started"}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Level Progress</span>
                  <span className="text-slate-500">
                    {completedInterviews.length} / {levels[currentLevel]?.unlock_after_interviews || "—"} interviews
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${levelColors[currentLevel - 1] || "bg-brand-500"}`}
                    style={{ width: `${(() => {
                      const done = completedInterviews.length;
                      const cur = levels[currentLevel - 1]?.unlock_after_interviews || 0;
                      const next = levels[currentLevel]?.unlock_after_interviews;
                      return next != null ? Math.min(100, ((done - cur) / (next - cur)) * 100) : 100;
                    })()}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{completedInterviews.length}</span> interviews completed
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Readiness: <span className="font-medium">{readiness?.score || 0}%</span>
                </div>
                {journey?.target_career_goal && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Target className="h-4 w-4 text-brand-500" />
                    Target: <span className="font-medium">{journey.target_career_goal}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <div className="rounded-lg bg-brand-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-brand-700">{readiness?.score || 0}%</p>
                <p className="text-xs font-medium text-brand-600">Placement Ready</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{journey?.overall_score || 0}</p>
                <p className="text-xs font-medium text-slate-500">Overall Score</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={() => navigate("/interview")}
            className="group flex items-center gap-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left transition hover:border-brand-300 hover:bg-brand-100 sm:p-5"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition group-hover:bg-brand-700">
              <Play className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-brand-900">Start Interview</p>
              <p className="mt-0.5 text-xs text-brand-600">Upload resume and begin</p>
            </div>
            <ArrowRight className="h-4 w-4 text-brand-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
          </button>

          <button
            onClick={() => navigate("/reports")}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 sm:p-5"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">View Reports</p>
              <p className="mt-0.5 text-xs text-slate-500">Detailed performance analysis</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </button>

          <button
            onClick={() => navigate("/resume-builder")}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 sm:p-5"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Resume Builder</p>
              <p className="mt-0.5 text-xs text-slate-500">Build and improve your resume</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </button>
        </section>

        {/* Level progression */}
        {levels.length > 0 && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Level Progression</h2>
              <span className="text-xs text-slate-500">Access up to Level {accessLevel}</span>
            </div>
            <div className="flex flex-col gap-3">
              {levels.map((lvl) => {
                const isAccessible = lvl.accessible;
                const isActiveLvl = isAccessible && lvl.level === currentLevel;
                const isCompleted = isAccessible && lvl.level < currentLevel;
                const isLocked = !isAccessible;
                return (
                  <div
                    key={lvl.level}
                    className={`flex items-center gap-4 rounded-lg border p-3 sm:p-4 transition ${
                      isActiveLvl ? "border-brand-300 bg-brand-50"
                        : isCompleted ? "border-emerald-200 bg-emerald-50"
                        : isLocked ? "border-slate-100 bg-slate-50 opacity-50"
                        : "border-slate-100 bg-slate-50 opacity-60"
                    }`}
                  >
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      isLocked ? "bg-slate-300" : (levelColors[lvl.level - 1] || "bg-slate-400")
                    }`}>
                      {isLocked ? <Lock className="h-4 w-4" /> : lvl.level}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isActiveLvl ? "text-brand-900" : isLocked ? "text-slate-400" : "text-slate-800"}`}>
                        {lvl.name || `Level ${lvl.level}`}
                      </p>
                      <p className={`text-xs ${isLocked ? "text-slate-300" : "text-slate-500"}`}>
                        {isLocked ? "Locked — complete previous levels to unlock" : `Unlocks after ${lvl.unlock_after_interviews || 0} interviews`}
                      </p>
                      {!isLocked && (lvl.features || lvl.unlocked_features)?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {(lvl.features || lvl.unlocked_features).map((feat) => (
                            <span key={feat} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              <Zap className="h-2.5 w-2.5" />{feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    {isActiveLvl && <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Current</span>}
                    {isLocked && <Lock className="h-4 w-4 text-slate-300" />}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent interviews */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Journey Interviews</h2>
            {interviews.length > 5 && (
              <button onClick={() => navigate("/reports")} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </button>
            )}
          </div>
          {interviews.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-600">No interviews yet</p>
              <p className="mt-1 text-sm text-slate-400">Start your first interview to begin your placement journey</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.slice(0, 5).map((interview, idx) => (
                <div
                  key={interview.session_id || idx}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/30"
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    (interview.score || 0) >= 80 ? "bg-emerald-500"
                      : (interview.score || 0) >= 60 ? "bg-amber-400"
                      : "bg-rose-400"
                  }`}>
                    {interview.number || idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Interview #{interview.number || idx + 1}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        interview.status === "completed" ? "text-emerald-600" : "text-slate-400"
                      }`}>
                        {interview.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                        {interview.status || "—"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {interview.date ? formatDateTime(interview.date) : "—"}
                      {interview.grade && <span className="ml-2">Grade: {interview.grade}</span>}
                    </p>
                  </div>
                  {Number.isFinite(Number(interview.score)) && (
                    <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      (interview.score || 0) >= 80 ? "bg-emerald-50 text-emerald-700"
                        : (interview.score || 0) >= 60 ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {Math.round(Number(interview.score))}%
                    </span>
                  )}
                  <button
                    onClick={() => navigate("/report", { state: { sessionId: interview.session_id } })}
                    className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Score trends */}
        {trends.length > 0 && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Score Trends</h2>
            <div className="flex items-end gap-3 sm:gap-4" style={{ height: "160px" }}>
              {trends.slice(-5).map((trend, idx) => {
                const height = Math.max(((trend.score || 0) / maxTrendScore) * 100, 8);
                return (
                  <div key={trend.session_id || idx} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">{trend.score || 0}</span>
                    <div className="w-full" style={{ height: `${height}%` }}>
                      <div
                        className={`h-full w-full rounded-t-lg transition-all duration-500 ${
                          (trend.score || 0) >= 80 ? "bg-emerald-500"
                            : (trend.score || 0) >= 60 ? "bg-amber-400"
                            : "bg-rose-400"
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {trend.date ? new Date(trend.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : `#${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-400" /> Below 60</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" /> 60–79</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> 80+</span>
            </div>
          </section>
        )}

        {/* Resume versions */}
        {comparisons.length > 0 && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Resume Versions</h2>
              <button
                onClick={() => navigate("/resume-builder")}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Open builder <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comparisons.map((comp, idx) => (
                <div
                  key={comp._id || idx}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:border-slate-200"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-200">
                    <FileText className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {comp.name || `Version ${idx + 1}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {comp.uploaded_at ? new Date(comp.uploaded_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                  {comp.improvement !== undefined && (
                    <span className={`text-xs font-semibold ${comp.improvement >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {comp.improvement >= 0 ? "+" : ""}{comp.improvement}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function PlacementJourneyPage() {
  return (
    <ErrorBoundary>
      <PlacementJourneyInner />
    </ErrorBoundary>
  );
}
