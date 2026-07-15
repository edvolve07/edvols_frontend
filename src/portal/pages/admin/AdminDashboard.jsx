import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, FilePlus2 } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import StatCard from '../../components/StatCard';
import { apiFetch, formatDateTime } from '../../utils/api';

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

function formatDuration(seconds) {
  if (!seconds) return '0m';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const payload = await apiFetch('/admin/dashboard');
      setStats(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => refresh({ quiet: true }), 30 * 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (!stats) return <LoadingSkeleton label="Loading dashboard" />;

  return (
    <div className="page-stack mx-auto max-w-7xl">
      <section className="page-hero">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Admin Overview</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Assessment command center</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor publishing, submissions, pass rates, and student performance from one focused dashboard.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/assessments/create" className="btn-primary">
              <FilePlus2 className="h-4 w-4" />
              Create Assessment
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Assessments" value={stats.assessments} />
        <StatCard label="Published" value={stats.published} tone="mint" />
        <StatCard label="Students" value={stats.students} tone="coral" />
        <StatCard label="Submissions" value={stats.submitted_attempts} tone="slate" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="In Progress" value={stats.in_progress_attempts} />
        <StatCard label="Pass Rate" value={`${stats.pass_rate}%`} tone="mint" />
        <StatCard label="Average Score" value={`${stats.average_percentage}%`} tone="coral" />
      </div>

      <section className="table-shell">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-800" />
              <h3 className="text-lg font-black text-slate-900">Student Submission Analytics</h3>
            </div>
            <p className="text-sm text-slate-500">Latest submitted attempts across all assessments</p>
          </div>
          <Link to="/admin/assessments" className="inline-flex items-center gap-1 text-sm font-black text-emerald-800">
            Manage assessments <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="dashboard-table w-full min-w-[1050px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th>Student</th>
                <th>Assessment</th>
                <th>Concept</th>
                <th>Difficulty</th>
                <th>Marks</th>
                <th>Percentage</th>
                <th>Time Taken</th>
                <th>Result</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.submissions?.length ? (
                stats.submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-slate-50/70">
                    <td>
                      <p className="font-semibold text-slate-900">{submission.student_name}</p>
                      <p className="text-xs text-slate-500">{submission.email}</p>
                    </td>
                    <td className="font-semibold">{submission.assessment_title}</td>
                    <td>{submission.concept}</td>
                    <td>{submission.difficulty}</td>
                    <td>
                      {submission.score}/{submission.total_marks}
                      <p className="text-xs text-slate-500">Pass: {submission.passing_marks}</p>
                    </td>
                    <td>
                      <span className="font-bold text-slate-900">{submission.percentage}%</span>
                    </td>
                    <td>
                      {formatDuration(submission.time_taken_seconds)}
                      <p className="text-xs text-slate-500">Limit: {submission.duration_minutes}m</p>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          submission.passed
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {submission.passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td>{formatDateTime(submission.submitted_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="9">
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
