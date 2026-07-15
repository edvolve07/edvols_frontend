import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiFetch } from '../../utils/api';

const STATUS_ICONS = {
  accepted: CheckCircle2,
  wrong_answer: XCircle,
  time_limit_exceeded: Clock,
  runtime_error: AlertTriangle,
  compilation_error: AlertTriangle,
  pending: Loader2,
  running: Loader2,
};

const STATUS_COLORS = {
  accepted: 'text-emerald-600',
  wrong_answer: 'text-red-600',
  time_limit_exceeded: 'text-amber-600',
  runtime_error: 'text-red-600',
  compilation_error: 'text-orange-600',
  pending: 'text-slate-400',
  running: 'text-emerald-600',
};

const STATUS_LABELS = {
  accepted: 'Accepted',
  wrong_answer: 'Wrong Answer',
  time_limit_exceeded: 'TLE',
  runtime_error: 'Runtime Error',
  compilation_error: 'Compile Error',
  pending: 'Pending',
  running: 'Running',
};

function formatDuration(ms) {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function Submissions() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch('/programming/student/submissions').then(setData);
  }, []);

  if (!data) return <LoadingSkeleton label="Loading submissions" />;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero">
        <p className="eyebrow">Programming Practice</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">My Submissions</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          View your past code submissions and results
        </p>
      </div>

      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="dashboard-table w-full min-w-[800px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th>Problem</th>
                <th>Language</th>
                <th>Status</th>
                <th>Test Cases</th>
                <th>Time</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.submissions.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="6">
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                data.submissions.map((sub) => {
                  const Icon = STATUS_ICONS[sub.status] || AlertTriangle;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70">
                      <td>
                        <Link
                          to={`/programming/practice/problems/${sub.problem_id}`}
                          className="font-semibold text-emerald-800 hover:underline"
                        >
                          {sub.problem_title}
                        </Link>
                        <p className="text-xs text-slate-500">{sub.problem_difficulty} · {sub.problem_concept}</p>
                      </td>
                      <td className="font-mono text-xs uppercase">{sub.language}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${STATUS_COLORS[sub.status] || ''}`}>
                          <Icon className="h-4 w-4" />
                          {STATUS_LABELS[sub.status] || sub.status}
                        </span>
                      </td>
                      <td>
                        {sub.passed_test_cases}/{sub.total_test_cases}
                      </td>
                      <td>{formatDuration(sub.execution_time_ms)}</td>
                      <td className="text-xs text-slate-500">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
