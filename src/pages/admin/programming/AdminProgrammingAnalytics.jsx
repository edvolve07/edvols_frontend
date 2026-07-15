import { useEffect, useState, useCallback } from 'react';
import { BarChart3, Code2, Users, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';

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

export default function AdminProgrammingAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const payload = await apiFetch('/api/programming/admin/analytics/students');
      setData(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => refresh({ quiet: true }), 30 * 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (!data) {
    return (
      <section className="page-stack mx-auto max-w-6xl">
        <div className="h-32 animate-pulse rounded-2xl bg-white" />
      </section>
    );
  }

  const topPerformer = data.student_performance?.length
    ? data.student_performance.reduce((best, s) => (s.acceptance_rate > (best.acceptance_rate || 0) ? s : best), data.student_performance[0])
    : null;

  return (
    <section className="page-stack mx-auto max-w-6xl">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Lecturer workspace</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Programming Analytics</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            View your students&apos; coding performance and submission analytics.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Users size={19} />
          </div>
          <p className="font-display text-2xl font-semibold text-slate-950 sm:text-3xl">{data.total_students}</p>
          <p className="mt-1 text-sm text-slate-500">Active Students</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BarChart3 size={19} />
          </div>
          <p className="font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
            {data.student_performance?.reduce((sum, s) => sum + s.total_submissions, 0) || 0}
          </p>
          <p className="mt-1 text-sm text-slate-500">Total Submissions</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp size={19} />
          </div>
          <p className="font-display text-2xl font-semibold text-slate-950 sm:text-3xl">{topPerformer?.acceptance_rate || 0}%</p>
          <p className="mt-1 text-sm text-slate-500">Best Student Rate</p>
          {topPerformer ? (
            <p className="mt-1 text-xs text-slate-400">{topPerformer.student_name}</p>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Student Performance</h2>
              <p className="mt-1 text-sm text-slate-500">
                {data.student_performance?.length || 0} student{data.student_performance?.length !== 1 ? 's' : ''} with submissions.
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Total Submissions</th>
                <th className="px-4 py-3">Accepted</th>
                <th className="px-4 py-3">Acceptance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.student_performance?.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="4">
                    No student submissions yet.
                  </td>
                </tr>
              ) : (
                data.student_performance?.map((student) => (
                  <tr key={student.student_id} className="text-slate-600 hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{student.student_name}</p>
                      <p className="text-xs text-slate-500">{student.student_email}</p>
                    </td>
                    <td className="px-4 py-3">{student.total_submissions}</td>
                    <td className="px-4 py-3">{student.accepted}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${student.acceptance_rate >= 70 ? 'text-emerald-600' : student.acceptance_rate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {student.acceptance_rate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
