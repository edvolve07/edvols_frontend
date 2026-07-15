import { useEffect, useState, useCallback } from "react";
import { BarChart3, FileText, Loader2, Mic2, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ReportPage from "@/src/pages/ReportPage";

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

export default function AdminInterviewAnalytics() {
  const [data, setData] = useState(null);
  const [selectedSession, setSelectedSession] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const payload = await apiFetch("/api/admin/analytics/interviews");
      setData(payload);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load interview analytics.");
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
        Loading interview analytics
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:mb-6 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-600">Admin analytics</p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Interview Analytics
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Review every saved interview report, ATS score, grade, and complete report breakdown.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Interview reports" value={data.total_reports} icon={Mic2} />
        <StatCard label="Average score" value={`${Math.round(data.average_percentage || 0)}%`} icon={BarChart3} tone="green" />
        <StatCard
          label="Average ATS"
          value={`${Math.round(
            data.reports.length
              ? data.reports.reduce((sum, report) => sum + Number(report.ats_score || 0), 0) / data.reports.length
              : 0,
          )}%`}
          icon={FileText}
          tone="amber"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Recent Interview Reports</h2>
          <p className="mt-1 text-sm text-slate-500">Open More details to see the full report immediately.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm sm:min-w-[920px]">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Interview</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">ATS</th>
                <th className="px-4 py-3">Generated</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.reports.length ? (
                data.reports.map((report) => (
                  <tr key={report.session_id} className="text-slate-600">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{report.student_name || "Unknown student"}</p>
                      <p className="text-xs text-slate-500">{report.student_email || report.report_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{report.role || "Role"}</p>
                      <p className="text-xs text-slate-500">{report.domain || "Interview"}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-950">{Math.round(report.percentage)}%</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {report.grade} {report.grade_label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{report.ats_score}/100</td>
                    <td className="px-4 py-3">{report.generated_date || formatDateTime(report.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedSession(report.session_id)}
                        className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-emerald-600"
                      >
                        More details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="7">
                    No interview reports yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedSession ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-slate-950/60 p-0 sm:p-4">
          <div className="mx-auto min-h-screen max-w-6xl overflow-hidden bg-slate-50 shadow-2xl sm:min-h-0 sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
              <h2 className="text-lg font-semibold text-slate-950">Interview report details</h2>
              <button
                type="button"
                onClick={() => setSelectedSession("")}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>
            <ReportPage sessionId={selectedSession} showQuestionBreakdownInline />
          </div>
        </div>
      ) : null}
    </div>
  );
}
