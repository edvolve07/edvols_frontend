import { useEffect, useState, useCallback } from "react";
import { BarChart3, BookOpenCheck, Clock3, Loader2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

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

function formatDuration(seconds) {
  if (!seconds) return "0m";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function StatCard({ label, value, icon: Icon, tone = "brand" }) {
  const tones = {
    brand: "bg-emerald-50 text-emerald-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={19} />
      </div>
      <p className="font-display text-2xl font-semibold text-slate-950 sm:text-3xl">{value ?? 0}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function AdminAptitudeAnalytics() {
  const [data, setData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const payload = await apiFetch("/api/admin/analytics/aptitude");
      setData(payload);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load aptitude analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => refresh({ quiet: true }), 30 * 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" />
        Loading aptitude analytics
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:mb-6 sm:p-6">
        <div>
          <p className="text-sm font-medium text-emerald-600">Admin analytics</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Aptitude Analytics
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Latest aptitude result for each student is shown first. Use More details to review every attempt made by that student.
          </p>
        </div>
      </section>

      <section className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        <StatCard label="Students with attempts" value={data.total_students} icon={BookOpenCheck} />
        <StatCard label="Total attempts" value={data.total_attempts} icon={Clock3} tone="green" />
        <StatCard
          label="Average latest score"
          value={`${Math.round(
            data.students.length
              ? data.students.reduce((sum, student) => sum + Number(student.latest_attempt?.percentage || 0), 0) /
                  data.students.length
              : 0,
          )}%`}
          icon={BarChart3}
          tone="amber"
        />
      </section>

      <section className="grid gap-4">
        {data.students.length ? (
          data.students.map((student) => {
            const latest = student.latest_attempt;
            return (
              <article key={student.student_id || student.email} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">{student.student_name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{student.email}</p>
                    <p className="mt-3 text-sm font-medium text-slate-700">{latest?.assessment_title || "Latest attempt"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {latest?.concept || "General"} · {latest?.difficulty || "Difficulty"} · {formatDateTime(latest?.submitted_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-semibold text-slate-950">{Math.round(latest?.percentage || 0)}%</p>
                    <p className={latest?.passed ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-600"}>
                      {latest?.passed ? "Passed" : "Failed"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">Attempts</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{student.attempt_count}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">Average</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">{Math.round(student.average_percentage)}%</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">Latest score</p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">
                      {latest?.score ?? 0}/{latest?.total_marks ?? 0}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(student)}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600"
                >
                  More details
                </button>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm font-semibold text-slate-500 shadow-card sm:p-8">
            No submitted aptitude attempts yet.
          </div>
        )}
      </section>

      {selectedStudent ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{selectedStudent.student_name}</h2>
                <p className="text-sm text-slate-500">{selectedStudent.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[74vh] overflow-auto">
              <table className="w-full min-w-[720px] text-left text-sm sm:min-w-[900px]">
                <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Assessment</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedStudent.attempts.map((attempt) => (
                    <tr key={attempt.id} className="text-slate-600">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">{attempt.assessment_title}</p>
                        <p className="text-xs text-slate-500">
                          {attempt.concept} · {attempt.difficulty}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">{Math.round(attempt.percentage)}%</p>
                        <p className="text-xs text-slate-500">
                          {attempt.score}/{attempt.total_marks}
                        </p>
                      </td>
                      <td className="px-4 py-3">{formatDuration(attempt.time_taken_seconds)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            attempt.passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                          }`}
                        >
                          {attempt.passed ? "Passed" : "Failed"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDateTime(attempt.submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
