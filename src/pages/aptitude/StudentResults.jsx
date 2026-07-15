import { useEffect, useState, useCallback } from "react";
import { ArrowRight, BarChart3, CheckCircle2, ClipboardCheck, Flame, Trophy, XCircle } from "lucide-react";
import { useNavigate } from "../../navigation";
import LoadingSkeleton from "./LoadingSkeleton";
import { getStudentResults, apiFetch } from "@/lib/api";

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
  if (!value) return "Open";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function StudentResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const data = await getStudentResults();
      setResults(data.results || []);
    } catch (err) {
      if (!quiet) setError(err.message || "Unable to load results");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

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

  if (loading || !results) return <LoadingSkeleton label="Loading results" />;

  const passedCount = results.filter((result) => result.passed).length;
  const averageScore = results.length
    ? Math.round(results.reduce((sum, result) => sum + (Number(result.percentage) || 0), 0) / results.length)
    : 0;

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <div className="mb-7">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Performance Archive</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal text-emerald-900 sm:text-3xl">My aptitude results</h1>
          <p className="mt-2 max-w-2xl text-base text-slate-700">
            Review submitted attempts, scores, pass status, and detailed result pages.
          </p>
          {error && <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        </div>
      </div>

      <section className="mb-7 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-card">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 text-white shadow-card">
              <ClipboardCheck size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Attempts</p>
              <p className="mt-1 text-3xl font-black text-emerald-950">{results.length}</p>
              <p className="mt-3 text-xs font-semibold text-emerald-700">All submissions</p>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-card">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-card">
              <Trophy size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Average Score</p>
              <p className="mt-1 text-3xl font-black text-emerald-950">{averageScore}%</p>
              <p className="mt-3 text-xs font-semibold text-emerald-700">Keep improving</p>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-card">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 text-white shadow-card">
              <Flame size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Passed</p>
              <p className="mt-1 text-3xl font-black text-emerald-950">{passedCount}</p>
              <p className="mt-3 text-xs font-semibold text-orange-600">out of {results.length}</p>
            </div>
          </div>
        </article>
      </section>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-card">
          No submitted attempts yet.
        </div>
      ) : (
        <div className="grid gap-7 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-card">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-emerald-950">Recent results</h2>
              <span className="text-sm font-black text-emerald-700">View all</span>
            </div>
            <div className="space-y-4">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => navigate(`/aptitude/results/${result.id}`)}
                  className="w-full rounded-xl border border-emerald-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-card-hover"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-white ${result.passed ? "bg-emerald-600" : "bg-red-500"}`}>
                        {result.passed ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-emerald-950">{result.assessment_title}</h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {result.concept} • {result.difficulty} • {formatDateTime(result.submitted_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-950">{result.percentage}%</p>
                      <p className={result.passed ? "text-sm font-bold text-emerald-700" : "text-sm font-bold text-red-600"}>
                        {result.passed ? "Passed" : "Failed"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-card">
              <h2 className="text-lg font-black text-emerald-950">Score Trend</h2>
              <div className="mt-5 space-y-4">
                {results.slice(0, 4).map((result) => (
                  <div key={`${result.id}-trend`}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="truncate font-semibold text-slate-700">{result.assessment_title}</span>
                      <span className="font-black text-emerald-800">{result.percentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-emerald-50">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(Number(result.percentage) || 0, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-card">
              <div className="mb-5 flex items-center gap-2">
                <BarChart3 size={18} className="text-emerald-700" />
                <h2 className="text-lg font-black text-emerald-950">Recent Activity</h2>
              </div>
              <div className="space-y-5">
                {results.slice(0, 4).map((result, index) => (
                  <div key={`${result.id}-activity`} className="flex items-center gap-4">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white ${result.passed ? "bg-emerald-600" : "bg-amber-400"}`}>
                      {result.passed ? <CheckCircle2 size={18} /> : <Trophy size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-emerald-950">{result.assessment_title}</p>
                      <p className="text-sm text-slate-600">{result.concept} • {result.difficulty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{index === 0 ? "2h ago" : index === 1 ? "Yesterday" : "2 days ago"}</p>
                      <p className="mt-1 text-sm font-black text-emerald-700">+{result.passed ? 25 : 10} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-card">
              <h2 className="text-lg font-black text-emerald-900">Next recommendation</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Revisit questions below 70% first, then take one medium-difficulty quiz to reinforce the topic.
              </p>
              <button
                type="button"
                onClick={() => navigate("/aptitude")}
                className="btn-primary mt-5 px-5 py-3"
              >
                Practice now <ArrowRight size={16} />
              </button>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
