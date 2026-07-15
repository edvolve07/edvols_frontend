import { useEffect, useState, useCallback } from 'react';
import { MessageSquareText, TrendingUp, BarChart3 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import LoadingSkeleton from '@/src/portal/components/LoadingSkeleton';

export default function AdminCommunicationAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const payload = await apiFetch('/api/communication/admin/analytics');
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

  if (!data) return <LoadingSkeleton label="Loading analytics" />;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Lecturer workspace</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Interview Communication Analytics</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            View your students&apos; interview communication practice reports and performance.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MessageSquareText size={19} />
          </div>
          <p className="font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
            {data.total_reports}
          </p>
          <p className="mt-1 text-sm text-slate-500">Total Interview Sessions</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp size={19} />
          </div>
          <p className="font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
            {data.average_percentage}%
          </p>
          <p className="mt-1 text-sm text-slate-500">Average Score</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
                Student Interview Sessions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {data.total_reports} session{data.total_reports !== 1 ? 's' : ''} completed.
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.reports?.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="5">
                    No practice sessions yet.
                  </td>
                </tr>
              ) : (
                data.reports?.map((report) => (
                  <tr key={report.session_id} className="text-slate-600 hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{report.student_name}</p>
                      <p className="text-xs text-slate-500">{report.student_email}</p>
                    </td>
                    <td className="px-4 py-3">{report.category}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${
                        report.percentage >= 70 ? 'text-emerald-600' :
                        report.percentage >= 55 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {report.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        report.grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                        report.grade === 'B' ? 'bg-blue-50 text-blue-700' :
                        report.grade === 'C' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {report.grade} · {report.grade_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {report.generated_date || new Date(report.created_at).toLocaleDateString()}
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
