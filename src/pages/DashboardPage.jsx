import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Award,
  BarChart3,
  Bot,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Code2,
  Download,
  FileText,
  ListChecks,
  Mic2,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import clsx from "clsx";
import { METRIC_LABELS } from "@/src/constants";
import { Link } from "@/src/navigation";
import { useAuth } from "@/src/portal/context/AuthContext";
import { apiFetch, downloadCertificatePdf } from "@/lib/api";
import { getTimeBasedGreeting } from "@/src/utils/timeGreeting";

const moduleLabels = {
  aptitude: "Aptitude",
  ai_interview: "Interview",
  programming: "Programming",
  both: "All modules",
};

const toneClass = {
  brand: "bg-brand-800 text-white",
  green: "bg-accent-600 text-white",
  amber: "bg-amber-500 text-white",
  blue: "bg-brand-600 text-white",
};

const typeMeta = {
  aptitude: { icon: BrainCircuit, tone: "bg-brand-700", label: "Aptitude" },
  interview: { icon: Mic2, tone: "bg-brand-600", label: "Interview" },
  programming: { icon: Code2, tone: "bg-amber-500", label: "Coding" },
};

function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number)}%` : "0%";
}

function metricToPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, Math.round(number * 10)));
}

function formatDateTime(value) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRelativeTime(value) {
  if (!value) return "New";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "New";
  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateTime(value);
}

function getTypeMeta(type) {
  return typeMeta[type] || { icon: Target, tone: "bg-emerald-600", label: "Practice" };
}

function roleHome(role) {
  if (role === "master_admin") return "/master-admin/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [certificateBusy, setCertificateBusy] = useState("");
  const [greeting, setGreeting] = useState(() => getTimeBasedGreeting());

  const adminHome = roleHome(user?.role);

  useEffect(() => {
    if (adminHome) return undefined;

    let isMounted = true;
    let intervalId;

    async function loadDashboard({ quiet = false } = {}) {
      if (!quiet) setLoading(true);
      try {
        const data = await apiFetch("/api/student/dashboard");
        if (isMounted) {
          setDashboard(data);
          setAnalyticsError("");
        }
      } catch (error) {
        if (isMounted) setAnalyticsError(error.message || "Unable to load your dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    intervalId = window.setInterval(() => loadDashboard({ quiet: true }), 30 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [adminHome]);

  useEffect(() => {
    const updateGreeting = () => setGreeting(getTimeBasedGreeting());
    const intervalId = window.setInterval(updateGreeting, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const modules = dashboard?.user?.modules_access || user?.modules_access || ["both"];
  const hasAllModules = modules.includes("both");
  const hasAptitude = hasAllModules || modules.includes("aptitude");
  const hasInterview = hasAllModules || modules.includes("ai_interview");
  const hasProgramming = hasAllModules || modules.includes("programming");
  const enabledModuleLabels = hasAllModules
    ? ["Aptitude", "Interview", "Programming"]
    : modules.map((module) => moduleLabels[module]).filter(Boolean);

  const interviewAnalytics = dashboard?.interview_analytics || null;
  const programmingAnalytics = dashboard?.programming_analytics || null;
  const weeklyGoal = dashboard?.weekly_goal || { target: 5, completed: 0, raw_completed: 0 };
  const continueItem = dashboard?.continue_learning?.[0] || dashboard?.recommendations?.[0] || null;
  const continueMeta = getTypeMeta(continueItem?.type);
  const ContinueIcon = continueMeta.icon;
  const progress = Math.max(0, Math.min(100, Number(dashboard?.overall_progress || 0)));
  const readiness = dashboard?.placement_readiness || { score: 0, label: "Needs Foundation", components: {} };
  const engagement = dashboard?.engagement || { xp: 0, rank: "Starter", badges: [] };
  const firstName = (user?.name || "Learner").split(" ")[0];

  async function issueCertificate(milestone) {
    setCertificateBusy(milestone);
    setAnalyticsError("");
    try {
      const data = await apiFetch(`/api/student/certificates/${milestone}/issue`, { method: "POST" });
      setDashboard((current) => ({
        ...current,
        certificates: {
          ...(current?.certificates || {}),
          issued: [
            data.certificate,
            ...((current?.certificates?.issued || []).filter((item) => item.milestone !== milestone)),
          ],
        },
      }));
    } catch (error) {
      setAnalyticsError(error.message || "Unable to generate certificate.");
    } finally {
      setCertificateBusy("");
    }
  }

  const focusMetrics = useMemo(() => {
    const latestMetrics = interviewAnalytics?.latest_metrics || {};
    return ["confidence", "fluency", "knowledge", "skill_relevance"]
      .map((key) => ({
        key,
        label: METRIC_LABELS[key] || key,
        value: metricToPercent(latestMetrics[key]),
      }))
      .filter((metric) => metric.value !== null);
  }, [interviewAnalytics?.latest_metrics]);

  const statCards = useMemo(() => {
    const cards = [
      {
        label: "Overall Progress",
        value: formatPercent(dashboard?.overall_progress),
        caption: `${enabledModuleLabels.length || 0} enabled module${enabledModuleLabels.length === 1 ? "" : "s"}`,
        icon: BarChart3,
        tone: "brand",
      },
    ];

    if (hasAptitude) {
      cards.push({
        label: "Aptitude Attempts",
        value: dashboard?.submitted_attempts || 0,
        caption: `${dashboard?.available_assessments || 0} assessment${dashboard?.available_assessments === 1 ? "" : "s"} available`,
        icon: BrainCircuit,
        tone: "green",
      });
    }

    if (hasInterview) {
      cards.push({
        label: "Mock Interviews",
        value: interviewAnalytics?.reports || 0,
        caption: `${formatPercent(interviewAnalytics?.average_percentage)} average`,
        icon: Mic2,
        tone: "blue",
      });
    }

    if (hasProgramming) {
      cards.push({
        label: "Coding Solved",
        value: programmingAnalytics?.solved_unique || 0,
        caption: `${programmingAnalytics?.total_submissions || 0} submission${programmingAnalytics?.total_submissions === 1 ? "" : "s"}`,
        icon: Code2,
        tone: "amber",
      });
    }

    cards.push({
      label: "Interviews Saved",
      value: interviewAnalytics?.reports || 0,
      caption: `${interviewAnalytics?.average_percentage || 0}% avg score`,
      icon: Mic2,
      tone: "purple",
    });

    return cards.slice(0, 4);
  }, [
    dashboard?.available_assessments,
    dashboard?.overall_progress,
    dashboard?.submitted_attempts,
    enabledModuleLabels.length,
    hasAptitude,
    hasInterview,
    hasProgramming,
    interviewAnalytics?.average_percentage,
    interviewAnalytics?.reports,
    programmingAnalytics?.solved_unique,
    programmingAnalytics?.total_submissions,
  ]);

  if (adminHome) return <Navigate to={adminHome} replace />;

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <section className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1.5 text-base text-slate-500">
            Your dashboard is synced to your current role, module access, and latest progress.
          </p>
        </div>
      </section>

      {analyticsError ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {analyticsError}
        </div>
      ) : null}

      <section className="mb-7 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Placement Readiness Score</p>
              <h2 className="mt-3 text-5xl font-bold leading-none text-slate-900">{readiness.score}</h2>
              <p className="mt-2 text-sm font-semibold text-brand-700">{readiness.label}</p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-700">
              <Award className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {Object.entries({
              Aptitude: readiness.components?.aptitude,
              Coding: readiness.components?.coding,
              Interview: readiness.components?.interview,
              Consistency: readiness.components?.consistency,
              Resume: readiness.components?.resume,
            }).map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{formatPercent(value)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Streaks, Badges, XP</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{engagement.rank} Rank</h2>
            </div>
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">{engagement.xp || 0} XP</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {(engagement.badges || []).map((badge) => (
              <span key={badge.title} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">
                {badge.title}
              </span>
            ))}
            {!engagement.badges?.length ? (
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                Complete milestones to earn badges
              </span>
            ) : null}
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${readiness.score || 0}%` }} />
          </div>
        </article>
      </section>

      <section className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, caption, icon: Icon, tone }) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-5">
              <div className={clsx("grid h-16 w-16 shrink-0 place-items-center rounded-full", toneClass[tone])}>
                <Icon size={26} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="mt-1 text-3xl font-bold leading-none text-slate-900">{loading && !dashboard ? "--" : value}</p>
                <p className="mt-4 text-xs font-semibold text-brand-700">{caption}</p>
                {label === "Overall Progress" ? (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="mb-7 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
            <Trophy size={22} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Weekly Goal</p>
            <p className="text-sm text-slate-500">
              {weeklyGoal.completed || 0} of {weeklyGoal.target || 5} sessions complete
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-7 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-7">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Continue Learning</h2>
            {continueItem ? (
              <div className="mt-7 grid gap-5 md:grid-cols-[104px_1fr_auto] md:items-center">
                <div className={clsx("grid h-24 w-24 place-items-center rounded-lg text-white", continueMeta.tone)}>
                  <ContinueIcon size={44} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{continueItem.title}</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">{continueItem.meta || continueMeta.label}</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(0, Math.min(100, Number(continueItem.progress || progress)))}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">
                      {formatPercent(continueItem.progress ?? progress)}
                    </span>
                  </div>
                  <p className="mt-5 text-sm text-slate-500">
                    Latest update: {formatDateTime(continueItem.updated_at || dashboard?.generated_at)}
                  </p>
                </div>
                <Link href={continueItem.href || "/aptitude"} className="btn-primary whitespace-nowrap px-5 py-3">
                  {continueItem.action || "Continue"}
                </Link>
              </div>
            ) : (
              <div className="mt-7 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6">
                <p className="font-semibold text-slate-900">No progress yet</p>
                <p className="mt-2 text-sm text-slate-500">Start a practice session and this area will track your next step.</p>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Student Learning Path</h2>
              <span className="text-xs font-semibold uppercase text-slate-400">Personalized</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(dashboard?.learning_path || []).slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-brand-700">{item.category}</p>
                      <h3 className="mt-1 font-semibold text-slate-900">{item.title}</h3>
                    </div>
                    <span
                      className={clsx(
                        "rounded-md px-2 py-1 text-[11px] font-semibold uppercase",
                        item.priority === "high"
                          ? "bg-red-50 text-red-600"
                          : item.priority === "medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-accent-50 text-accent-700",
                      )}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.task}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(0, Math.min(100, Number(item.progress || 0)))}%` }} />
                  </div>
                </Link>
              ))}
              {!dashboard?.learning_path?.length ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2">
                  Your learning path will appear after your first activity.
                </div>
              ) : null}
            </div>
          </section>

          {hasInterview ? (
            <section className="overflow-hidden rounded-lg border border-brand-100 bg-brand-50 p-6">
              <div className="grid gap-6 md:grid-cols-[1fr_310px] md:items-center">
                <div>
                  <h2 className="text-xl font-bold text-brand-900">AI interview feedback</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                    Latest average: {formatPercent(interviewAnalytics?.average_percentage)} across {interviewAnalytics?.reports || 0} saved report{interviewAnalytics?.reports === 1 ? "" : "s"}.
                  </p>
                  <Link href="/interview" className="btn-primary mt-5 px-5 py-3">
                    Try AI Mock Interview
                  </Link>
                </div>
                <div className="relative hidden h-36 md:block">
                  <div className="absolute right-6 top-1 grid h-28 w-28 place-items-center rounded-full bg-white">
                    <Bot size={58} className="text-brand-700" />
                  </div>
                  <div className="absolute bottom-5 left-4 h-12 w-24 rounded-lg bg-white/70" />
                  <div className="absolute right-0 top-16 h-14 w-24 rounded-lg bg-brand-100/80" />
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays size={18} className="text-slate-500" />
              <h2 className="text-lg font-bold text-slate-900">Role Focus</h2>
            </div>
            <h3 className="text-lg font-bold text-brand-700">
              {dashboard?.user?.interested_role || user?.interested_role || "Skill preparation"}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-600">
              {enabledModuleLabels.length ? enabledModuleLabels.join(", ") : "Student workspace"}
            </p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Weekly goal: {weeklyGoal.raw_completed || weeklyGoal.completed || 0}/{weeklyGoal.target || 5} sessions
              </p>
              <Link href={hasInterview ? "/interview" : hasProgramming ? "/programming/practice" : "/aptitude"} className="btn-primary whitespace-nowrap px-5 py-3">
                Practice
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-700" />
              <h2 className="text-lg font-bold text-slate-900">Resume Builder</h2>
            </div>
            <p className="text-sm text-slate-600">
              Latest ATS score: <span className="font-semibold text-brand-800">{dashboard?.resume_builder?.latest_version?.ats_score || 0}</span>
            </p>
            {dashboard?.resume_builder?.latest_version?.improvements?.length ? (
              <p className="mt-3 text-xs leading-5 text-slate-500">{dashboard.resume_builder.latest_version.improvements[0]}</p>
            ) : null}
            <Link href="/resume-builder" className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50">
              Improve Resume
            </Link>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-700" />
              <h2 className="text-lg font-bold text-slate-900">Certificates</h2>
            </div>
            <div className="space-y-3">
              {(dashboard?.certificates?.issued || []).map((certificate) => (
                <div key={certificate.id || certificate._id} className="rounded-lg border border-brand-100 bg-brand-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{certificate.title}</p>
                  <button
                    type="button"
                    onClick={() => downloadCertificatePdf(certificate.id || certificate._id)}
                    className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-brand-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </button>
                </div>
              ))}
              {(dashboard?.certificates?.milestones || [])
                .filter((milestone) => milestone.eligible && !(dashboard?.certificates?.issued || []).some((item) => item.milestone === milestone.milestone))
                .map((milestone) => (
                  <button
                    key={milestone.milestone}
                    type="button"
                    onClick={() => issueCertificate(milestone.milestone)}
                    disabled={certificateBusy === milestone.milestone}
                    className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-left text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
                  >
                    {certificateBusy === milestone.milestone ? "Generating..." : `Generate: ${milestone.title}`}
                  </button>
                ))}
              {!dashboard?.certificates?.issued?.length && !(dashboard?.certificates?.milestones || []).some((milestone) => milestone.eligible) ? (
                <p className="text-sm text-slate-500">Eligible certificates will appear after milestone completion.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              <Link href="/reports" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                View all
              </Link>
            </div>
            <div className="space-y-5">
              {(dashboard?.recent_activity || []).map((activity) => {
                const meta = getTypeMeta(activity.type);
                const Icon = activity.score >= 80 || activity.result === "Accepted" ? CheckCircle2 : activity.type === "aptitude" ? Star : meta.icon;
                return (
                  <Link key={`${activity.type}-${activity.id}`} href={activity.href || "/dashboard"} className="flex items-center gap-4 rounded-lg transition hover:bg-brand-50/60">
                    <div className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-full text-white", meta.tone)}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{activity.title}</p>
                      <p className="text-sm text-slate-500">{activity.meta}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{formatRelativeTime(activity.occurred_at)}</p>
                      <p className="mt-1 text-sm font-semibold capitalize text-brand-700">
                        {Number.isFinite(Number(activity.score)) ? formatPercent(activity.score) : activity.result}
                      </p>
                    </div>
                  </Link>
                );
              })}

              {!dashboard?.recent_activity?.length ? (
                <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No activity yet.
                </p>
              ) : null}
            </div>
          </section>

          {focusMetrics.length ? (
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Focus Metrics</h2>
              <div className="mt-5 space-y-4">
                {focusMetrics.map((metric) => (
                  <div key={metric.key}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-600">{metric.label}</span>
                      <span className="font-semibold text-slate-900">{metric.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${metric.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
