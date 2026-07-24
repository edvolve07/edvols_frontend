import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Crown,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Lock,
  Star,
  Zap,
  TrendingUp,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    key: "1_month",
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
    key: "3_month",
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
      "Mentorship journey tracking",
    ],
    highlight: true,
  },
  {
    key: "6_month",
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
      "Mentorship journey tracking",
      "Advanced analytics",
    ],
  },
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [lockStatus, setLockStatus] = useState(null);
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [subData, lockData, journeyData] = await Promise.all([
        apiFetch("/api/mentorship/subscription"),
        apiFetch("/api/mentorship/lock-status"),
        apiFetch("/api/mentorship/journey"),
      ]);
      setSubscription(subData.subscription || null);
      setLockStatus(lockData);
      setJourney(journeyData.journey || null);
    } catch (err) {
      setError(err.message || "Unable to load subscription details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-600" /> Loading...
      </div>
    );
  }

  const isActive = subscription && subscription.status === "active";
  const isEnterprise = !!subscription?.level_access || subscription?.plan_key?.startsWith("level_1_");
  const interviewsUsed = subscription?.interviews_used || 0;
  const interviewsTotal = subscription?.interviews_total || 1;
  const usagePercent = Math.min(100, Math.round((interviewsUsed / interviewsTotal) * 100));
  const canStart = lockStatus?.allowed !== false;

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <section className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Subscription & Mentorship
          </h1>
          <p className="mt-1.5 text-base text-slate-500">
            {isEnterprise
              ? "Manage your enterprise placement journey and track your interview progress."
              : "Manage your mentorship plan and track your interview journey."}
          </p>
        </div>
      </section>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {isActive ? (
        <section className="mb-8 overflow-hidden rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Current Plan</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {subscription.plan_key?.replace(/_/g, " ")}
                  </h2>
                  <p className="text-sm font-medium text-slate-500">
                    Expires {formatDate(subscription.expires_at)}
                  </p>
                </div>
              </div>
            </div>
            <span className="rounded-lg bg-accent-50 px-3 py-1.5 text-xs font-semibold uppercase text-accent-700">
              Active
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                <p className="text-xs font-semibold text-slate-500">Interviews Used</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {interviewsUsed}
                <span className="text-sm font-medium text-slate-400"> / {interviewsTotal}</span>
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-600" />
                <p className="text-xs font-semibold text-slate-500">Next Available</p>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {lockStatus?.nextUnlockAt
                  ? formatDateTime(lockStatus.nextUnlockAt)
                  : canStart
                    ? "Available now"
                    : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-600" />
                <p className="text-xs font-semibold text-slate-500">Remaining</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {Math.max(0, interviewsTotal - interviewsUsed)}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Interviews completed</span>
              <span className="font-semibold text-slate-900">{usagePercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {canStart && (
            <button
              onClick={() => navigate("/interview")}
              className="btn-primary mt-5 inline-flex items-center gap-2 px-5 py-3"
            >
              Start Interview <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </section>
      ) : null}

      {!isEnterprise && (
      <section className="mb-8">
        <div className="mb-5">
          <p className="eyebrow">Choose a Plan</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Subscription Plans</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pick the plan that fits your preparation timeline.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isSubscribed = subscription?.plan_key === plan.key;
            return (
              <article
                key={plan.key}
                className={`relative rounded-lg border bg-white p-6 transition ${
                  plan.highlight
                    ? "border-brand-300 shadow-lg shadow-brand-100/50"
                    : "border-slate-200"
                }`}
              >
                {plan.highlight ? (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold uppercase text-white">
                    <Star className="h-3 w-3" /> Best Value
                  </div>
                ) : null}

                <div className="mt-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {plan.tagline}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">{plan.name}</h3>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                  <span className="text-sm text-slate-500">
                    / {plan.key.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-brand-600" />
                    {plan.interviews} interviews
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-brand-600" />
                    {plan.gapDays}-day gap
                  </span>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={subscribing === plan.key || isSubscribed}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${
                    plan.highlight
                      ? "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  }`}
                >
                  {subscribing === plan.key ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                    </>
                  ) : isSubscribed ? (
                    "Current Plan"
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      )}

      {isActive && journey ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="eyebrow">Mentorship Journey</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Your Progress</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Career Goal</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {journey.career_goal || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Current Level</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">
                {journey.current_level || "Beginner"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Total Interviews</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {journey.total_interviews || 0}
              </p>
            </div>
          </div>

          {journey.recent_interviews?.length ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Recent Interviews</h3>
              <div className="mt-3 space-y-3">
                {journey.recent_interviews.map((item) => (
                  <div
                    key={item.id || item._id}
                    className="flex items-center gap-4 rounded-lg border border-slate-100 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/30"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.role || "Mock Interview"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.domain || "General"} · {formatDateTime(item.completed_at)}
                      </p>
                    </div>
                    {Number.isFinite(Number(item.score)) ? (
                      <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
                        {Math.round(Number(item.score))}%
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-900">No interviews yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Start your first mock interview to begin your journey.
              </p>
              <button
                onClick={() => navigate("/interview")}
                className="btn-primary mt-4 inline-flex items-center gap-2 px-5 py-3"
              >
                Start Interview <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      ) : isActive ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="eyebrow">Mentorship Journey</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Your Progress</h2>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-900">Journey data loading...</p>
            <p className="mt-1 text-sm text-slate-500">
              Your mentorship journey will appear here once you start.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
