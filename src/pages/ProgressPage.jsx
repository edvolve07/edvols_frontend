import { useState, Component } from "react";
import {
  Loader2,
  Target,
  TrendingUp,
  FileText,
  Award,
  Clock,
  Crown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Star,
  Zap,
  Lock,
} from "lucide-react";
import { usePlacementProgress } from "@/hooks/usePlacementProgress";
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

function formatDate(value) {
  if (!value) return "\u2014";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

function formatDateTime(value) {
  if (!value) return "\u2014";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function formatCountdown(targetMs) {
  const diff = targetMs - Date.now();
  if (diff <= 0) return null;
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function ProgressPageInner() {
  const navigate = useNavigate();
  const { data: p, loading, error } = usePlacementProgress();
  const [now] = useState(Date.now());

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
    completedInterviews, allowedInterviews, remainingInterviews,
    progressPercentage, currentPlan, nextInterviewAvailable,
    levels, recentInterviews, trends, targetCareerGoal,
  } = p;

  const isActive = !!currentPlan;
  const isUnlimited = allowedInterviews === -1;
  const isExpired = currentPlan?.status === "expired";
  const isLimitReached = !isUnlimited && allowedInterviews > 0 && completedInterviews >= allowedInterviews;

  let isAvailableNow = false;
  let nextAvailableTime = null;
  if (isExpired) {
    isAvailableNow = false;
  } else if (nextInterviewAvailable) {
    const t = new Date(nextInterviewAvailable).getTime();
    isAvailableNow = now >= t;
    nextAvailableTime = t;
  } else if (isLimitReached) {
    isAvailableNow = false;
  } else {
    isAvailableNow = true;
  }

  const countdownText = (!isAvailableNow && nextAvailableTime != null && now < nextAvailableTime)
    ? formatCountdown(nextAvailableTime) : null;

  const usagePercent = allowedInterviews > 0 ? Math.min(100, Math.round((completedInterviews / allowedInterviews) * 100)) : 0;
  const maxTrendScore = Math.max(...trends.map((t) => t.score || 0), 1);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Hero summary */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
                  <Target className="h-5 w-5 text-brand-700" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {targetCareerGoal || "Your Progress"}
                  </h1>
                  <p className="text-sm text-slate-500">
                    Level {currentLevel} &mdash; {currentLevelName}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Progress to Level {Math.min(currentLevel + 1, 6)}</span>
                  <span className="text-slate-500">{completedInterviews} / {levels.find(l => l.id === currentLevel + 1)?.requiredInterviews ? levels.find(l => l.id === currentLevel + 1).requiredInterviews + (levels.find(l => l.id === currentLevel)?.requiredInterviews || 0) : "\u2014"}</span>
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
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{averageScore}</p>
                <p className="text-xs font-medium text-slate-500">Avg Score</p>
              </div>
              <div className="rounded-lg bg-brand-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-brand-700">{placementReadiness}%</p>
                <p className="text-xs font-medium text-brand-600">Readiness</p>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription status */}
        {isActive && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Plan</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {currentPlan.name || "Plan"}
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                      {isExpired ? "Expired" : "Expires"} {formatDate(currentPlan.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>
              <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                isExpired ? "bg-red-50 text-red-700"
                  : currentPlan.status === "active" ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {isExpired ? "Expired" : currentPlan.status === "active" ? "Active" : currentPlan.status || "Unknown"}
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" />
                  <p className="text-xs font-semibold text-slate-500">Interviews Used</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {completedInterviews}<span className="text-sm font-medium text-slate-400"> / {allowedInterviews}</span>
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-600" />
                  <p className="text-xs font-semibold text-slate-500">Next Available</p>
                </div>
                {isExpired ? (
                  <p className="mt-2 text-sm font-semibold text-red-600">Subscription Expired</p>
                ) : isLimitReached ? (
                  <p className="mt-2 text-sm font-semibold text-amber-600">Interview Limit Reached</p>
                ) : isAvailableNow ? (
                  <p className="mt-2 text-sm font-semibold text-emerald-600">Available Now</p>
                ) : countdownText ? (
                  <>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Available in {countdownText}</p>
                    <p className="mt-1 text-xs text-amber-600 font-medium">
                      Unlocks {formatDateTime(nextAvailableTime)}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-slate-900">\u2014</p>
                )}
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-600" />
                  <p className="text-xs font-semibold text-slate-500">Remaining</p>
                </div>
                {isExpired || isLimitReached ? (
                  <p className="mt-2 text-2xl font-bold text-slate-900">0</p>
                ) : isUnlimited ? (
                  <p className="mt-2 text-lg font-bold text-brand-700">Unlimited Interviews</p>
                ) : (
                  <p className="mt-2 text-2xl font-bold text-slate-900">{remainingInterviews}</p>
                )}
              </div>
            </div>
            {!isUnlimited && (
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Interviews completed</span>
                  <span className="font-semibold text-slate-900">{usagePercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${usagePercent}%` }} />
                </div>
              </div>
            )}
            {isLimitReached && !isExpired && (
              <div className="mt-4">
                <button
                  onClick={() => navigate("/subscription")}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade Plan
                </button>
              </div>
            )}
          </section>
        )}

        {/* Recent interviews */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Interviews</h2>
            {recentInterviews.length > 3 && (
              <button onClick={() => navigate("/reports")} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </button>
            )}
          </div>
          {recentInterviews.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-600">No interviews yet</p>
              <p className="mt-1 text-sm text-slate-400">Start your first interview to see your progress here</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 font-medium text-slate-600">Interview</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Date</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Score</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Grade</th>
                      <th className="px-4 py-3 font-medium text-slate-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentInterviews.slice(0, 5).map((iv) => (
                      <tr key={iv.id || iv.sessionId} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">#{iv.interviewNumber || "\u2014"}</span>
                          {iv.blueprintTitle && <span className="ml-2 text-xs text-slate-500">{iv.blueprintTitle}</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {iv.completedAt ? new Date(iv.completedAt).toLocaleDateString() : "\u2014"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            (iv.score || 0) >= 80 ? "bg-emerald-50 text-emerald-700"
                              : (iv.score || 0) >= 60 ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}>
                            {iv.score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-600">{iv.grade || "\u2014"}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate("/report", { state: { sessionId: iv.sessionId } })}
                            className="text-sm font-medium text-brand-600 hover:text-brand-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Score trends */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Score Trends</h2>
          {trends.length === 0 ? (
            <div className="py-8 text-center">
              <TrendingUp className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-400">Complete interviews to see your trends</p>
            </div>
          ) : (
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
          )}
          {trends.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-400" /> Below 60</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" /> 60&ndash;79</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> 80+</span>
            </div>
          )}
        </section>

        {/* Level progression */}
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Level Progression</h2>
            <span className="text-xs text-slate-500">Access up to Level {p.accessLevel}</span>
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
      </div>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <ErrorBoundary>
      <ProgressPageInner />
    </ErrorBoundary>
  );
}
