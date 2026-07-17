import { useEffect, useState, useCallback, Component } from "react";
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

const PLANS = [
  {
    key: "1month",
    name: "1 Month",
    interviews: 4,
    gapDays: 5,
    price: 499,
    tagline: "Get started",
    features: [
      "4 mock interviews",
      "5-day gap between sessions",
      "AI-powered feedback",
      "Performance reports",
    ],
  },
  {
    key: "3month",
    name: "3 Months",
    interviews: 12,
    gapDays: 5,
    price: 1199,
    tagline: "Best value",
    features: [
      "12 mock interviews",
      "5-day gap between sessions",
      "AI-powered feedback",
      "Performance reports",
      "Priority scheduling",
      "Journey tracking",
    ],
    highlight: true,
  },
  {
    key: "6month",
    name: "6 Months",
    interviews: 24,
    gapDays: 5,
    price: 1999,
    tagline: "Comprehensive prep",
    features: [
      "24 mock interviews",
      "5-day gap between sessions",
      "AI-powered feedback",
      "Performance reports",
      "Priority scheduling",
      "Journey tracking",
      "Advanced analytics",
    ],
  },
];

const levelColors = ["bg-slate-400", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
const levelNames = ["Foundation", "Professional", "Advanced", "Expert", "Mentor", "Placement Master"];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

const PLAN_GAP_DAYS = { "1month": 5, "3month": 5, "6month": 5 };
const PLAN_DISPLAY_NAMES = { "1month": "1 Month Plan", "3month": "3 Month Plan", "6month": "6 Month Plan" };

function getGapDays(planKey) {
  return PLAN_GAP_DAYS[planKey] || 5;
}

function formatDateDetailed(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "short" });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${day} ${month} ${year}, ${time}`;
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

  const [subscription, setSubscription] = useState(null);
  const [lockStatus, setLockStatus] = useState(null);
  const [journey, setJourney] = useState(null);
  const [progress, setProgress] = useState(null);
  const [trends, setTrends] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribing, setSubscribing] = useState("");
  const [now, setNow] = useState(Date.now());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const results = await Promise.allSettled([
        apiFetch("/api/mentorship/subscription"),
        apiFetch("/api/mentorship/lock-status"),
        apiFetch("/api/mentorship/journey"),
        apiFetch("/api/mentorship/progress"),
        apiFetch("/api/mentorship/progress/trends"),
        apiFetch("/api/mentorship/progress/readiness"),
        apiFetch("/api/mentorship/levels"),
        apiFetch("/api/mentorship/journey/interviews"),
      ]);

      const get = (i, fallback) => results[i].status === "fulfilled" ? results[i].value : fallback;

      const subResponse = get(0, {});
      const sub = subResponse.subscription || null;
      setSubscription(sub);
      const lockRaw = get(1, null);
      const lockFromSub = subResponse.lock_status || {};
      const resolvedUsed = lockRaw?.interviewsUsed ?? lockFromSub.interviewsUsed ?? sub?.interviews_used ?? 0;
      const resolvedTotal = lockRaw?.interviewsTotal ?? lockFromSub.interviewsTotal ?? sub?.interviews_total ?? 0;

      console.log("=== fetchData Debug ===");
      console.log("subResponse:", JSON.stringify(subResponse, null, 2));
      console.log("lockRaw:", JSON.stringify(lockRaw, null, 2));
      console.log("lockFromSub:", JSON.stringify(lockFromSub, null, 2));
      console.log("resolvedUsed:", resolvedUsed, "resolvedTotal:", resolvedTotal);
      setLockStatus({
        allowed: lockRaw?.allowed ?? lockFromSub.allowed ?? true,
        interviewsUsed: lockRaw?.interviewsUsed ?? lockFromSub.interviewsUsed ?? sub?.interviews_used ?? 0,
        interviewsTotal: lockRaw?.interviewsTotal ?? lockFromSub.interviewsTotal ?? sub?.interviews_total ?? 0,
        remaining: lockRaw?.remaining ?? lockFromSub.remaining ?? null,
        nextUnlockAt: lockRaw?.nextUnlockAt ?? lockFromSub.nextUnlockAt ?? null,
        daysRemaining: lockRaw?.daysRemaining ?? lockFromSub.daysRemaining ?? 0,
        lastInterviewAt: lockRaw?.lastInterviewAt ?? lockFromSub.lastInterviewAt ?? sub?.last_interview_at ?? null,
        gapDays: lockRaw?.gapDays ?? lockFromSub.gapDays ?? null,
        reason: lockRaw?.reason ?? lockFromSub.reason ?? null,
      });
      setJourney(get(2, {}).journey || null);
      const rawProgress = get(3, {}).progress || {};
      setProgress({ ...rawProgress, average_score: rawProgress.scores?.overall || 0 });
      const rawTrends = get(4, {}).trends || {};
      const trendsArray = Array.isArray(rawTrends)
        ? rawTrends
        : (rawTrends.overall || []).map((t, i) => ({ score: t.value, date: t.date, session_id: i }));
      setTrends(trendsArray);
      setReadiness(get(5, {}).readiness || null);
      setLevels(get(6, {}).levels || []);
      setCurrentLevel(get(6, {}).current_level || 1);
      const rawInterviews = get(7, {}).interviews || [];
      const mappedInterviews = rawInterviews.map((iv) => ({
        ...iv,
        number: iv.interview_number ?? iv.number,
        score: iv.overall_score ?? iv.score,
        date: iv.completed_at ?? iv.date,
      }));
      console.log("mappedInterviews:", JSON.stringify(mappedInterviews, null, 2));
      setInterviews(mappedInterviews);
    } catch (err) {
      setError(err.message || "Failed to load progress data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        fetchData();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fetchData]);

  async function handleSubscribe(planKey) {
    setSubscribing(planKey);
    setError("");
    try {
      const data = await apiFetch("/api/mentorship/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan_key: planKey }),
      });
      setSubscription(data.subscription);
    } catch (err) {
      setError(err.message || "Unable to complete subscription.");
    } finally {
      setSubscribing("");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
      </div>
    );
  }

  const isActive = !!subscription;
  const interviewsUsed = lockStatus?.interviewsUsed ?? subscription?.interviews_used ?? 0;
  const interviewsTotal = lockStatus?.interviewsTotal ?? subscription?.interviews_total ?? 0;
  const interviewsRemaining = lockStatus?.remaining ?? Math.max(0, interviewsTotal - interviewsUsed);
  const usagePercent = interviewsTotal > 0 ? Math.min(100, Math.round((interviewsUsed / interviewsTotal) * 100)) : 0;
  const totalInterviewsDone = progress?.total_interviews || 0;
  const currentThreshold = levels[currentLevel - 1]?.unlock_after_interviews || 0;
  const nextThreshold = levels[currentLevel]?.unlock_after_interviews;
  const levelProgress = nextThreshold != null
    ? Math.min(100, Math.round(((totalInterviewsDone - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100;
  const maxTrendScore = Math.max(...trends.map((t) => t.score || 0), 1);

  const isExpired = subscription?.status === "expired" || (subscription?.expires_at && new Date(subscription.expires_at) < new Date());
  const isUnlimited = interviewsTotal === -1;
  const isLimitReached = !isUnlimited && interviewsTotal > 0 && interviewsUsed >= interviewsTotal;

  let nextAvailableTime = null;
  let isAvailableNow = false;

  if (isExpired) {
    isAvailableNow = false;
  } else if (lockStatus?.allowed) {
    isAvailableNow = true;
    nextAvailableTime = null;
  } else if (lockStatus?.nextUnlockAt) {
    nextAvailableTime = new Date(lockStatus.nextUnlockAt).getTime();
    isAvailableNow = now >= nextAvailableTime;
  } else if (isLimitReached) {
    isAvailableNow = false;
  } else if (interviewsUsed === 0) {
    isAvailableNow = true;
    nextAvailableTime = null;
  } else {
    isAvailableNow = true;
  }

  const countdownText = (!isAvailableNow && nextAvailableTime != null && now < nextAvailableTime)
    ? formatCountdown(nextAvailableTime) : null;

  console.log("=== Current Plan Debug ===");
  console.log("Current Time:", new Date().toISOString());
  console.log("Subscription Response:", subscription);
  console.log("Lock Status Response:", lockStatus);
  console.log("Interview History:", interviews);
  console.log("Total Interviews:", interviewsTotal);
  console.log("Completed Interviews:", interviewsUsed);
  console.log("Remaining Interviews:", interviewsRemaining);
  console.log("Latest Interview Time:", lockStatus?.lastInterviewAt || "N/A");
  console.log("Cooldown Hours:", lockStatus?.gapDays ? lockStatus.gapDays * 24 : "N/A");
  console.log("Calculated Next Available:", nextAvailableTime ? new Date(nextAvailableTime).toISOString() : "N/A");
  console.log("Available Now:", isAvailableNow);
  console.log("Progress %:", usagePercent);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

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
                    {journey?.target_career_goal || "Your Progress"}
                  </h1>
                  <p className="text-sm text-slate-500">
                    Level {currentLevel} — {levelNames[currentLevel - 1] || "Getting Started"}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Progress to Level {Math.min(currentLevel + 1, 6)}</span>
                  <span className="text-slate-500">{totalInterviewsDone} / {nextThreshold != null ? nextThreshold : "—"}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${levelColors[currentLevel - 1] || "bg-brand-500"}`}
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{progress?.total_interviews || 0}</span> interviews completed
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Readiness: <span className="font-medium">{readiness?.score || 0}%</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{progress?.average_score || 0}</p>
                <p className="text-xs font-medium text-slate-500">Avg Score</p>
              </div>
              <div className="rounded-lg bg-brand-50 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-brand-700">{readiness?.score || 0}%</p>
                <p className="text-xs font-medium text-brand-600">Readiness</p>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription status (active) */}
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
                      {PLAN_DISPLAY_NAMES[subscription.plan_key] || subscription.plan_key?.replace(/_/g, " ").replace(/(\d)([a-z])/g, "$1 $2") || "Plan"}
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                      {isExpired ? "Expired" : "Expires"} {formatDateDetailed(subscription.expires_at)}
                    </p>
                  </div>
                </div>
              </div>
              <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                isExpired ? "bg-red-50 text-red-700"
                  : subscription.status === "active" ? "bg-emerald-50 text-emerald-700"
                  : subscription.status === "completed" ? "bg-slate-100 text-slate-600"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {isExpired ? "Expired"
                  : subscription.status === "active" ? "Active"
                  : subscription.status === "completed" ? "Completed"
                  : subscription.status || "Unknown"}
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" />
                  <p className="text-xs font-semibold text-slate-500">Interviews Used</p>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {isUnlimited ? interviewsUsed : <>{interviewsUsed}<span className="text-sm font-medium text-slate-400"> / {interviewsTotal}</span></>}
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
                      Unlocks {formatDateDetailed(nextAvailableTime)}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-slate-900">—</p>
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
                  <p className="mt-2 text-2xl font-bold text-slate-900">{interviewsRemaining}</p>
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
                  onClick={() => document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" })}
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
            {interviews.length > 3 && (
              <button onClick={() => navigate("/reports")} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                View all
              </button>
            )}
          </div>
          {interviews.length === 0 ? (
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
                      <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="px-4 py-3 font-medium text-slate-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {interviews.slice(0, 5).map((interview) => (
                      <tr key={interview.session_id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">#{interview.number || interview.session_id?.slice(-4)}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {interview.date ? new Date(interview.date).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            (interview.score || 0) >= 80 ? "bg-emerald-50 text-emerald-700"
                              : (interview.score || 0) >= 60 ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}>
                            {interview.score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            interview.status === "completed" ? "text-emerald-600" : "text-slate-400"
                          }`}>
                            {interview.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {interview.status || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate("/report", { state: { sessionId: interview.session_id } })}
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
          )}
          {trends.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-400" /> Below 60</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" /> 60–79</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> 80+</span>
            </div>
          )}
        </section>

        {/* Level progression */}
        {levels.length > 0 && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Level Progression</h2>
            <div className="flex flex-col gap-3">
              {levels.map((lvl) => {
                const isActiveLvl = lvl.level === currentLevel;
                const isCompleted = lvl.level < currentLevel;
                return (
                  <div
                    key={lvl.level}
                    className={`flex items-center gap-4 rounded-lg border p-3 sm:p-4 transition ${
                      isActiveLvl ? "border-brand-300 bg-brand-50"
                        : isCompleted ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-100 bg-slate-50 opacity-60"
                    }`}
                  >
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${levelColors[lvl.level - 1] || "bg-slate-400"}`}>
                      {lvl.level}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isActiveLvl ? "text-brand-900" : "text-slate-800"}`}>
                        {lvl.name || `Level ${lvl.level}`}
                      </p>
                      <p className="text-xs text-slate-500">Unlocks after {lvl.unlock_after_interviews || 0} interviews</p>
                    </div>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    {isActiveLvl && <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Current</span>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Plans (only if no active subscription, limit reached, or expired) */}
        {(!isActive || isLimitReached || isExpired) && (
          <section id="plans-section" className="mb-8">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Choose a Plan</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Subscription Plans</h2>
              <p className="mt-1 text-sm text-slate-500">Pick the plan that fits your preparation timeline.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {PLANS.map((plan) => {
                const isSubscribed = subscription?.plan_key === plan.key;
                return (
                  <article
                    key={plan.key}
                    className={`relative rounded-lg border bg-white p-6 transition ${
                      plan.highlight ? "border-brand-300 shadow-lg shadow-brand-100/50" : "border-slate-200"
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold uppercase text-white">
                        <Star className="h-3 w-3" /> Best Value
                      </div>
                    )}
                    <div className="mt-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{plan.tagline}</p>
                      <h3 className="mt-2 text-xl font-bold text-slate-900">{plan.name}</h3>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                      <span className="text-sm text-slate-500">/ {plan.key.replace("_", " ")}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-brand-600" />{plan.interviews} interviews</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-brand-600" />{plan.gapDays}-day gap</span>
                    </div>
                    <ul className="mt-5 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={subscribing === plan.key || (isSubscribed && !isLimitReached)}
                      className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
                        plan.highlight
                          ? "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      }`}
                    >
                      {subscribing === plan.key ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing</>
                      ) : isSubscribed && isExpired ? "Renew Plan" : isSubscribed && isLimitReached ? "Renew Plan" : isSubscribed && !isLimitReached ? "Current Plan" : "Subscribe"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}
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
