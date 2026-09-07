import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Award,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Code2,
  Compass,
  Download,
  FileText,
  Flame,
  ListChecks,
  Mic2,
  Sparkles,
  Star,
  Sun,
  Sunset,
  Moon,
  Target,
  Trophy,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import { METRIC_LABELS } from "@/src/constants";
import { Link } from "@/src/navigation";
import { useAuth } from "@/src/portal/context/AuthContext";
import { apiFetch, downloadCertificatePdf } from "@/lib/api";
import { getTimeBasedGreeting } from "@/src/utils/timeGreeting";
import { Reveal, StaggerChildren } from "@/src/animations";

const moduleLabels = {
  aptitude: "Aptitude",
  ai_interview: "Interview",
  programming: "Programming",
  both: "All modules",
};

const typeMeta = {
  aptitude: { icon: BrainCircuit, tone: "text-emerald-600", label: "Aptitude" },
  interview: { icon: Mic2, tone: "text-sky-600", label: "Interview" },
  programming: { icon: Code2, tone: "text-amber-600", label: "Coding" },
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
  return typeMeta[type] || { icon: Target, tone: "text-emerald-600", label: "Practice" };
}

function roleHome(role) {
  if (role === "master_admin") return "/master-admin/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [journey, setJourney] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [certificateBusy, setCertificateBusy] = useState("");
  const [greeting, setGreeting] = useState(() => getTimeBasedGreeting());

  const adminHome = roleHome(user?.role);
  const levelNames = ["Foundation", "Professional", "Advanced", "Expert", "Mentor", "Placement Master"];

  useEffect(() => {
    if (adminHome) return undefined;

    let isMounted = true;
    let intervalId;

    async function loadDashboard({ quiet = false } = {}) {
      if (!quiet) setLoading(true);
      try {
        const [dashData, journeyData] = await Promise.allSettled([
          apiFetch("/api/student/dashboard"),
          apiFetch("/api/mentorship/journey"),
        ]);
        if (isMounted) {
          if (dashData.status === "fulfilled") {
            setDashboard(dashData.value);
          }
          if (journeyData.status === "fulfilled") {
            setJourney(journeyData.value.journey || null);
          }
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

  if (adminHome) return <Navigate to={adminHome} replace />;

  return (
    <div className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8 space-y-7 text-slate-800">
      {/* ── 1. Clean Understated Header ── */}
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {greeting}, {firstName}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Consistency is the bridge between preparation and placement. Every practice session compounds into confidence.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-2 text-xs font-bold text-amber-900 shadow-sm">
              <Flame className="h-4 w-4 text-amber-500" />
              <span>{dashboard?.study_streak?.current || 1} Day Streak</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <Target className="h-4 w-4 text-emerald-600" />
              <span>Target: {user?.target_role || "Software Engineer"}</span>
            </div>
          </div>
        </div>
      </Reveal>

      {analyticsError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {analyticsError}
        </div>
      ) : null}

      {/* ── 2. Unified Metric Strip (Linear / Stripe Style) ── */}
      <Reveal>
        <div className="grid grid-cols-2 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-sm sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
          {/* Progress */}
          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Overall Curriculum</span>
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-bold">Track</span>
            </div>
            <p className="mt-2 font-display text-3xl font-black tracking-tight text-slate-900">
              {formatPercent(dashboard?.overall_progress)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[11px] font-medium text-slate-400">{enabledModuleLabels.length} active</span>
            </div>
          </div>

          {/* Mock Interviews */}
          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Mock Interviews</span>
              <span className="text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded text-[11px] font-bold">AI Sessions</span>
            </div>
            <p className="mt-2 font-display text-3xl font-black tracking-tight text-slate-900">
              {interviewAnalytics?.reports || 0}
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              <span className="font-semibold text-slate-700">{formatPercent(interviewAnalytics?.average_percentage)}</span> avg score
            </p>
          </div>

          {/* Coding Solved */}
          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Coding Problems</span>
              <span className="text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded text-[11px] font-bold">DSA</span>
            </div>
            <p className="mt-2 font-display text-3xl font-black tracking-tight text-slate-900">
              {programmingAnalytics?.solved_unique || 0}
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              <span className="font-semibold text-slate-700">{programmingAnalytics?.total_submissions || 0}</span> submissions
            </p>
          </div>

          {/* Aptitude Completed */}
          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Aptitude Completed</span>
              <span className="text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded text-[11px] font-bold">Tests</span>
            </div>
            <p className="mt-2 font-display text-3xl font-black tracking-tight text-slate-900">
              {dashboard?.submitted_attempts || 0}
            </p>
            <p className="mt-3 text-xs font-medium text-slate-500">
              <span className="font-semibold text-slate-700">{dashboard?.available_assessments || 0}</span> tests available
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── 3. Command Center: Next Up Session & Placement Benchmark ── */}
      <Reveal>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* Next Recommended Session */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 -translate-y-12 translate-x-12 rounded-full bg-emerald-50/50 pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200/60">
                  <Sparkles size={12} className="text-emerald-600" />
                  Recommended Next Step
                </span>
                <span className="text-xs font-semibold text-slate-500">{continueItem?.meta || "Placement Track"}</span>
              </div>

              <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {continueItem?.title || "Comprehensive Aptitude & Coding Readiness"}
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xl">
                {continueItem?.description || "Sharpen your analytical problem-solving speed and algorithmic thinking to match top placement requirements."}
              </p>

              <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
                  <span>Track Completion</span>
                  <span className="font-bold text-slate-900">{formatPercent(continueItem?.progress ?? progress)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, Number(continueItem?.progress || progress)))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CalendarDays size={14} />
                <span>Last active: {formatRelativeTime(continueItem?.updated_at || dashboard?.generated_at)}</span>
              </div>

              <Link
                href={continueItem?.href || "/aptitude"}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 text-sm shadow-sm transition-all active:scale-95"
              >
                <span>{continueItem?.action || "Resume Session"}</span>
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          {/* Placement Readiness Benchmark Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Placement Benchmark</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                  {readiness.label}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display text-5xl font-black text-slate-900">{readiness.score}</span>
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-700">/ 100 Index</span>
                  <p>Target: 75+ for Tier-1 Product Roles</p>
                </div>
              </div>

              {/* Granular Breakdown */}
              <div className="mt-5 space-y-2.5">
                {Object.entries({
                  Aptitude: readiness.components?.aptitude,
                  Coding: readiness.components?.coding,
                  Interview: readiness.components?.interview,
                  Consistency: readiness.components?.consistency,
                  Resume: readiness.components?.resume,
                }).map(([label, value]) => {
                  const pct = Math.max(0, Math.min(100, Math.round(Number(value) * 100)));
                  return (
                    <div key={label} className="flex items-center gap-3 text-xs">
                      <span className="w-20 font-medium text-slate-600">{label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right font-semibold text-slate-900">{formatPercent(value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Engagement Tier</span>
              <span className="font-bold text-slate-800">{engagement.rank} • {engagement.xp} XP</span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── 4. Practice Curriculum (The 3 Core Modules) ── */}
      <Reveal>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Practice Curriculum</h2>
              <p className="text-xs text-slate-500">Curated modules designed to build speed, accuracy, and verbal confidence</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Mock Interview */}
            {hasInterview ? (
              <Link
                href="/interview"
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
                      <Mic2 size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                      Speech Analytics
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    AI Mock Interview
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    Real-time conversational interviews covering technical design and behavioral questions with instant scoring.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold">
                  <span className="text-slate-500">{interviewAnalytics?.reports || 0} sessions completed</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform">
                    Launch <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ) : null}

            {/* Coding Practice */}
            {hasProgramming ? (
              <Link
                href="/programming/assessments"
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
                      <Code2 size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                      DSA & Systems
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Coding Practice
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    Algorithmic challenges across Python, Java, C++, and JS with automated test evaluation and edge-case testing.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold">
                  <span className="text-slate-500">{programmingAnalytics?.solved_unique || 0} unique solved</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform">
                    Solve <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ) : null}

            {/* Aptitude Practice */}
            {hasAptitude ? (
              <Link
                href="/aptitude"
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
                      <BrainCircuit size={20} />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                      Speed & Logic
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Aptitude Assessments
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    Quantitative mathematics, logical deduction, and verbal comprehension designed for placement screening rounds.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold">
                  <span className="text-slate-500">{dashboard?.available_assessments || 0} tests available</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform">
                    Practice <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </Reveal>

      {/* ── 5. AI Voice Interview Studio Dock (Minimalist, human-crafted) ── */}
      <Reveal>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7 text-white shadow-md">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-950 border border-emerald-800/60 text-emerald-400">
                <Mic2 size={22} />
                <div className="absolute -bottom-1 flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-wave-1" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-wave-2" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-wave-3" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-wave-4" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-wave-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Live Voice Interview Studio</h3>
                  <span className="rounded-full bg-emerald-900/60 border border-emerald-700/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Voice Agent
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400 leading-relaxed max-w-2xl">
                  Simulate real company phone & panel rounds. Practice spontaneous answering with our low-latency voice agent with 2-minute timed question pacing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/communication/report"
                className="rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors"
              >
                Past Analytics
              </Link>
              <Link
                href="/communication"
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-colors shadow-sm"
              >
                Launch Voice Session
              </Link>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── 6. Bottom Split: Roadmap & Activity ── */}
      <Reveal>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          {/* Left Column: Roadmap & Weekly Goal */}
          <div className="space-y-6">
            {/* Personalized Learning Path */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personalized Preparation Path</h3>
                  <p className="text-xs text-slate-500">Modules prioritized according to your weakest score components</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {(dashboard?.learning_path || []).slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex items-center justify-between py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/60 px-2 -mx-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase text-emerald-700">{item.category}</span>
                        <span
                          className={clsx(
                            "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                            item.priority === "high"
                              ? "bg-red-50 text-red-700"
                              : item.priority === "medium"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {item.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                      <span>{item.duration || "30m"}</span>
                      <ChevronRight size={15} className="text-slate-400 group-hover:text-emerald-700 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Goal completion */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Trophy size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Weekly Practice Goal</p>
                  <p className="text-xs text-slate-500">{weeklyGoal.completed} of {weeklyGoal.target} target sessions achieved this week</p>
                </div>
              </div>
              <div className="w-32 hidden sm:block">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${Math.min(100, Math.round(((weeklyGoal.completed || 0) / Math.max(1, weeklyGoal.target || 5)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Activity Feed & Career Health */}
          <div className="space-y-6">
            {/* Career Focus & Resume Health */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">ATS Resume & Profile</h4>
                </div>
                <Link
                  href="/resume-builder"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  Open Builder →
                </Link>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                <span className="font-medium text-slate-600">ATS Match Readiness</span>
                <span className="font-bold text-slate-900">{dashboard?.resume_score || 85}% Compatible</span>
              </div>
            </div>

            {/* Recent Activity Log */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Recent Activity</h4>
                <span className="text-[11px] text-slate-400">Latest Attempts</span>
              </div>

              <div className="divide-y divide-slate-100">
                {(dashboard?.recent_activity || []).slice(0, 4).map((activity, idx) => {
                  const meta = getTypeMeta(activity.type);
                  const Icon = meta.icon;
                  return (
                    <div key={activity.id || idx} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{activity.title || activity.name || "Practice"}</p>
                          <p className="text-[10px] text-slate-400">{formatRelativeTime(activity.created_at || activity.date)}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0 ml-2">
                        {Number.isFinite(Number(activity.score)) ? formatPercent(activity.score) : "Completed"}
                      </span>
                    </div>
                  );
                })}

                {!dashboard?.recent_activity?.length ? (
                  <p className="py-4 text-center text-xs text-slate-400">No recent submissions found.</p>
                ) : null}
              </div>
            </div>

            {/* Certificate Milestone */}
            {journey?.certificates?.milestones?.length ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-amber-500" />
                    <h4 className="text-sm font-bold text-slate-900">Milestone Certificates</h4>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {journey.certificates.milestones.slice(0, 2).map((m) => (
                    <div key={m.milestone} className="flex items-center justify-between text-xs rounded-xl bg-slate-50 p-2.5">
                      <span className="font-semibold text-slate-800 truncate pr-2">{m.title || `Level ${m.milestone}`}</span>
                      <button
                        type="button"
                        onClick={() => (m.claimed && m.certificate_id ? downloadCertificatePdf(m.certificate_id) : issueCertificate(m.milestone))}
                        disabled={certificateBusy === m.milestone}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 shrink-0"
                      >
                        {m.claimed ? "Download" : "Claim"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Radar / Focus Metrics */}
            {focusMetrics.length ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">Speech Focus Radar</h4>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {focusMetrics.map((metric) => (
                    <div key={metric.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">{metric.label}</span>
                        <span className="font-bold text-slate-900">{metric.value}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
