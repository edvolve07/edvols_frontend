import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, ArrowRight, BrainCircuit, CalendarDays, CheckCircle2, Clock3, ListChecks, Play, Star, Target, Trophy } from "lucide-react";
import { useNavigate } from "../../navigation";
import LoadingSkeleton from "./LoadingSkeleton";
import { getStudentAssessments, isUnauthorizedError, apiFetch, startStudentAssessment } from "@/lib/api";

function formatRelativeTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "TBD";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  }).format(new Date(value));
}

const ACTIVITY_ICON = {
  aptitude: { icon: CheckCircle2, color: "bg-emerald-600" },
  interview: { icon: Star, color: "bg-amber-400" },
  programming: { icon: Target, color: "bg-emerald-600" },
};

function activityXP(type) {
  return type === "interview" ? 50 : type === "aptitude" ? 25 : 15;
}

export default function StudentAssessments() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      if (!quiet) setError("API request timed out. Backend may be offline.");
      if (!quiet) setLoading(false);
    }, 5000);

    try {
      const data = await getStudentAssessments();
      clearTimeout(timeout);
      setAssessments(data.assessments || []);
    } catch (err) {
      clearTimeout(timeout);
      if (isUnauthorizedError(err)) {
        navigate("/login", { replace: true });
        return;
      }
      if (!quiet) setError(err.message || "Unable to load assessments");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [navigate]);

  const refreshDashboard = useCallback(async () => {
    try {
      const data = await apiFetch("/api/student/dashboard");
      setDashboard(data);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    refreshDashboard();
    const id = window.setInterval(() => {
      refresh({ quiet: true });
      refreshDashboard();
    }, 30 * 1000);
    return () => window.clearInterval(id);
  }, [refresh, refreshDashboard]);

  const weeklyGoal = dashboard?.weekly_goal || { target: 5, completed: 0 };
  const overallProgress = dashboard?.overall_progress || 0;
  const recentActivity = dashboard?.recent_activity || [];
  const [forbiddenMsg, setForbiddenMsg] = useState("");

  async function handleStart(assessmentId) {
    try {
      await startStudentAssessment(assessmentId);
      navigate(`/aptitude/${assessmentId}/start`);
    } catch (err) {
      if (err.message?.includes("already submitted")) {
        setForbiddenMsg(err.message);
      } else {
        navigate(`/aptitude/${assessmentId}/start`);
      }
    }
  }

  if (loading) return <LoadingSkeleton label="Loading assessments" />;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-semibold">{error}</p>
          <p className="mt-2 text-sm">Make sure the backend API is running at http://localhost:8000</p>
        </div>
      </div>
    );
  }

  if (!assessments) return <LoadingSkeleton label="Loading assessments" />;

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <section className="mb-7">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Aptitude Practice</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal text-emerald-900 sm:text-3xl">
            Sharpen your problem-solving rhythm
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-700">
            Choose a focused test, build your streak, and keep your prep moving with crisp timed practice.
          </p>
        </div>
      </section>

      <section className="mb-7 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-card">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 text-white shadow-card">
              <BrainCircuit size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Available Tests</p>
              <p className="mt-1 text-3xl font-black text-emerald-950">{assessments.length}</p>
              <p className="mt-3 text-xs font-semibold text-emerald-700">Ready to start</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-card">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-card">
              <Trophy size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Overall Progress</p>
              <p className="mt-1 text-3xl font-black text-emerald-950">{overallProgress}%</p>
              <p className="mt-3 text-xs font-semibold text-emerald-700">{weeklyGoal.completed}/{weeklyGoal.target} weekly</p>
            </div>
          </div>
        </article>
      </section>

      {assessments.length === 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-card">
          No assessments are available right now.
        </div>
      ) : (
        <div className="grid gap-7 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-card">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-black text-emerald-950">Recommended for you</h2>
                <button className="text-sm font-black text-emerald-700 hover:text-emerald-900">View all</button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {assessments.slice(0, 2).map((assessment, index) => {
                  const assessmentId = assessment.id || assessment._id;
                  const amber = index === 1;
                  return (
                    <article
                      key={assessmentId}
                      className={`rounded-xl border p-5 ${
                        amber ? "border-amber-200 bg-amber-50/45" : "border-emerald-100 bg-emerald-50/35"
                      }`}
                    >
                      <div className="mb-5 flex items-center gap-4">
                        <div className={`grid h-14 w-14 place-items-center rounded-full text-white ${amber ? "bg-amber-500" : "bg-emerald-600"}`}>
                          {amber ? <Target size={23} /> : <BrainCircuit size={23} />}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-emerald-950">{assessment.title}</h3>
                          <p className="mt-1 text-xs text-slate-600">{assessment.concept} • {assessment.difficulty}</p>
                        </div>
                      </div>
                      <div className="mb-5 grid gap-2 text-sm text-slate-700">
                        <p className="flex items-center gap-2"><ListChecks size={15} /> {assessment.total_marks} marks</p>
                        <p className="flex items-center gap-2"><Clock3 size={15} /> {assessment.duration_minutes} mins</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStart(assessmentId)}
                        disabled={!assessmentId}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-black transition ${
                          amber
                            ? "border-amber-400 text-amber-700 hover:bg-amber-100"
                            : "border-emerald-400 text-emerald-800 hover:bg-emerald-100"
                        }`}
                      >
                        <Play size={16} />
                        Start Quiz
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-card">
              <h2 className="mb-5 text-xl font-black text-emerald-950">All aptitude tests</h2>
              <div className="grid gap-4">
                {assessments.map((assessment) => {
                  const assessmentId = assessment.id || assessment._id;
                  return (
                    <article
                      key={assessmentId}
                      className="group rounded-xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-card-hover"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                            <BrainCircuit size={22} />
                          </div>
                          <div>
                            <h2 className="text-lg font-black text-emerald-950">{assessment.title}</h2>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{assessment.concept}</span>
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{assessment.difficulty}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStart(assessmentId)}
                          disabled={!assessmentId}
                          className="btn-primary px-5 py-3"
                        >
                          Start <ArrowRight size={16} />
                        </button>
                      </div>
                      <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-4">
                        <div className="rounded-xl bg-emerald-50 px-3 py-3">Duration: {assessment.duration_minutes} min</div>
                        <div className="rounded-xl bg-emerald-50 px-3 py-3">Total marks: {assessment.total_marks}</div>
                        <div className="rounded-xl bg-emerald-50 px-3 py-3">Passing: {assessment.passing_marks}</div>
                        <div className="rounded-xl bg-emerald-50 px-3 py-3">Starts {formatDateTime(assessment.start_time)}</div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            
            {dashboard?.continue_learning?.[0] ? (
              <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-card">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays size={18} className="text-slate-600" />
                  <h2 className="text-lg font-black text-emerald-950">Continue Learning</h2>
                </div>
                <h3 className="text-lg font-black text-emerald-700">{dashboard.continue_learning[0].title}</h3>
                <p className="mt-1 text-sm font-medium text-slate-800">{dashboard.continue_learning[0].meta}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {dashboard.continue_learning[0].action}
                </p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-card">
              <h2 className="mb-5 text-lg font-black text-emerald-950">Recent Activity</h2>
              <div className="space-y-5">
                {recentActivity.slice(0, 4).length ? recentActivity.slice(0, 4).map((item) => {
                  const cfg = ACTIVITY_ICON[item.type] || { icon: Star, color: "bg-emerald-600" };
                  const Icon = cfg.icon;
                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white ${cfg.color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-emerald-950">{item.title}</p>
                        <p className="text-sm text-slate-600">{item.meta}</p>
                      </div>
                      <p className="text-sm font-black text-emerald-700">+{activityXP(item.type)} XP</p>
                    </div>
                  );
                }) : (
                  <p className="py-4 text-center text-sm text-slate-500">No recent activity yet.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}

      {forbiddenMsg ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setForbiddenMsg("")}>
          <div className="mx-4 max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-50">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h2 className="text-center text-lg font-black text-slate-950">Assessment Unavailable</h2>
            <p className="mt-3 text-center text-sm leading-6 text-slate-600">{forbiddenMsg}</p>
            <button
              type="button"
              onClick={() => setForbiddenMsg("")}
              className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              Go back
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
