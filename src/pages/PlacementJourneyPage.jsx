import { useState, Component } from "react";
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
import { usePlacementProgress } from "@/src/hooks/usePlacementProgress";
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

function formatDateTime(value) {
  if (!value) return "\u2014";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function PlacementJourneyInner() {
  const navigate = useNavigate();
  const { data: p, loading, error } = usePlacementProgress();

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  if (!p) return null;

  const {
    currentLevel, currentLevelName, placementReadiness, averageScore,
    completedInterviews, progressPercentage, levels, recentInterviews,
    trends, accessLevel, targetCareerGoal,
  } = p;

  const maxTrendScore = Math.max(...trends.map((t) => t.score || 0), 1);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
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
                    {targetCareerGoal || "Placement Journey"}
                  </h1>
                  <p className="text-sm text-slate-500">
                    Level {currentLevel} &mdash; {currentLevelName}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Level Progress</span>
                  <span className="text-slate-500">
                    {completedInterviews} / {levels.find(l => l.id === currentLevel + 1)?.requiredInterviews ? levels.find(l => l.id === currentLevel + 1).requiredInterviews + (levels.find(l => l.id === currentLevel)?.requiredInterviews || 0) : "\u2014"} interviews
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${levelColors[currentLevel - 1] || "bg-brand-500"}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{completedInterviews}</span> interviews completed
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Readiness: <span className="font-medium">{placementReadiness}%</span>
                </div>
                {targetCareerGoal && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Target className="h-4 w-4 text-brand-500" />
                    Target: <span className="font-medium">{targetCareerGoal}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <div className="rounded-lg bg-brand-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-brand-700">{placementReadiness}%</p>
                <p className="text-xs font-medium text-brand-600">Placement Ready</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{averageScore}</p>
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
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Level Progression</h2>
            <span className="text-xs text-slate-500">Access up to Level {accessLevel}</span>
          </div>
          <div className="flex flex-col gap-3">
            {levels.map((lvl) => {
              const isActiveLvl = lvl.status === "current";
              const isCompleted = lvl.status === "completed";
              const isLocked = lvl.status === "locked";
              return (
                <div
                  key={lvl.id}
                  className={`flex items-center gap-4 rounded-lg border p-3 sm:p-4 transition ${
                    isActiveLvl ? "border-brand-300 bg-brand-50"
                      : isCompleted ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-100 bg-slate-50 opacity-50"
                  }`}
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    isLocked ? "bg-slate-300" : (levelColors[lvl.id - 1] || "bg-slate-400")
                  }`}>
                    {isLocked ? <Lock className="h-4 w-4" /> : lvl.id}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isActiveLvl ? "text-brand-900" : isLocked ? "text-slate-400" : "text-slate-800"}`}>
                      {lvl.name}
                    </p>
                    <p className={`text-xs ${isLocked ? "text-slate-300" : "text-slate-500"}`}>
                      {lvl.completedInterviews} / {lvl.requiredInterviews} interviews completed
                    </p>
                    {lvl.features?.length > 0 && !isLocked && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {lvl.features.map((feat) => (
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

        {/* Recent interviews */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Journey Interviews</h2>
            {recentInterviews.length > 5 && (
              <button onClick={() => navigate("/reports")} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </button>
            )}
          </div>
          {recentInterviews.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-600">No interviews yet</p>
              <p className="mt-1 text-sm text-slate-400">Start your first interview to begin your placement journey</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInterviews.slice(0, 5).map((iv, idx) => (
                <div
                  key={iv.id || idx}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/30"
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    (iv.score || 0) >= 80 ? "bg-emerald-500"
                      : (iv.score || 0) >= 60 ? "bg-amber-400"
                      : "bg-rose-400"
                  }`}>
                    {iv.interviewNumber || idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Interview #{iv.interviewNumber || idx + 1}
                      </p>
                      {iv.blueprintTitle && (
                        <span className="text-xs text-slate-500">{iv.blueprintTitle}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {iv.completedAt ? formatDateTime(iv.completedAt) : "\u2014"}
                      {iv.grade && <span className="ml-2">Grade: {iv.grade}</span>}
                    </p>
                  </div>
                  {Number.isFinite(Number(iv.score)) && (
                    <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      (iv.score || 0) >= 80 ? "bg-emerald-50 text-emerald-700"
                        : (iv.score || 0) >= 60 ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {Math.round(Number(iv.score))}%
                    </span>
                  )}
                  <button
                    onClick={() => navigate("/report", { state: { sessionId: iv.sessionId } })}
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
                  <div key={trend.sessionId || idx} className="flex flex-1 flex-col items-center gap-2">
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
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" /> 60&ndash;79</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> 80+</span>
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
