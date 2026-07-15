import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BookOpenCheck, Code2, MessageSquareText, Mic2 } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import StatCard from '../../components/StatCard';
import { apiFetch, formatDateTime } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { getTimeBasedGreeting } from '@/src/utils/timeGreeting';

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

export default function StudentDashboard() {
  const { user } = useAuth();
  const userModules = user?.modules_access || ["both"];
  const hasAptitude = userModules.includes("aptitude") || userModules.includes("both");
  const hasInterview = userModules.includes("ai_interview") || userModules.includes("both");
  const hasProgramming = userModules.includes("programming") || userModules.includes("both");
  const hasCommunication = userModules.includes("communication") || userModules.includes("both");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState(() => getTimeBasedGreeting());

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const payload = await apiFetch('/student/dashboard');
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

  useEffect(() => {
    const updateGreeting = () => setGreeting(getTimeBasedGreeting());
    const intervalId = window.setInterval(updateGreeting, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!stats) return <LoadingSkeleton label="Loading dashboard" />;

  const interviewAnalytics = stats.interview_analytics || {};
  const programmingAnalytics = stats.programming_analytics || {};
  const totalReports = (stats.submitted_attempts || 0) + (interviewAnalytics.reports || 0);
  const firstName = (user?.name || 'Learner').split(' ')[0];

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Student Overview</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{greeting}, {firstName}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Track your progress across assessments, interviews, and coding practice.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/student/assessments" className="btn-primary">
            <BookOpenCheck className="h-4 w-4" />
            Start Practice
          </Link>
        </div>
      </div>

      {hasAptitude ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Available Assessments" value={stats.available_assessments} />
          <StatCard label="Submitted Attempts" value={stats.submitted_attempts} tone="mint" />
          <StatCard label="Passed Attempts" value={stats.passed_attempts} tone="coral" />
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {hasAptitude ? (
          <>
            <StatCard label="Pass Rate" value={`${stats.pass_rate}%`} tone="mint" />
            <StatCard label="Average Score" value={`${stats.average_percentage}%`} tone="coral" />
          </>
        ) : null}
        {hasInterview ? (
          <StatCard label="Interview Reports" value={interviewAnalytics.reports || 0} tone="mint" />
        ) : null}
        {hasProgramming ? (
          <>
            <StatCard label="Coding Accepted" value={programmingAnalytics.accepted || 0} tone="mint" />
            <StatCard label="Coding Submissions" value={programmingAnalytics.total_submissions || 0} tone="coral" />
          </>
        ) : null}
      </div>

      {hasInterview ? (
        <section className="surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mic2 className="h-5 w-5 text-emerald-800" />
              <h3 className="text-lg font-black text-slate-900">Interview Analytics</h3>
            </div>
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              View Reports <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Saved Interviews</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{interviewAnalytics.reports || 0}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Average Interview Score</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{interviewAnalytics.average_percentage || 0}%</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Latest ATS Score</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{interviewAnalytics.latest_ats_score || 0}%</p>
            </div>
          </div>
          <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200">
            {interviewAnalytics.recent_reports?.length ? (
              interviewAnalytics.recent_reports.slice(0, 5).map((report) => (
                <Link
                  key={report.session_id}
                  to={`/reports?session=${report.session_id}`}
                  className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <div>
                    <p className="font-bold text-slate-900">{report.role || 'Interview Report'}</p>
                    <p className="text-xs text-slate-500">
                      {report.domain || 'General'} · {report.generated_date || formatDateTime(report.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{report.percentage || 0}%</p>
                    <p className="text-xs text-slate-500">
                      {report.grade_label || report.grade || 'Ungraded'} · ATS {report.ats_score || 0}%
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="bg-white px-4 py-8 text-center text-sm text-slate-500">
                No interview reports saved yet.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {hasCommunication ? (
        <section className="surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-emerald-800" />
              <h3 className="text-lg font-black text-slate-900">Interview Communication</h3>
            </div>
            <Link
              to="/communication"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Practice Answers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Questions Answered</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{stats.communication?.total_sessions || 0}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Avg Communication Score</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{stats.communication?.average_percentage || 0}%</p>
            </div>
          </div>
        </section>
      ) : null}

      {hasProgramming ? (
        <section className="surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-emerald-800" />
              <h3 className="text-lg font-black text-slate-900">Programming Practice</h3>
            </div>
            <Link
              to="/programming"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Solve Problems <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Submissions</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{programmingAnalytics.total_submissions || 0}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Accepted</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{programmingAnalytics.accepted || 0}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Acceptance Rate</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{programmingAnalytics.acceptance_rate || 0}%</p>
            </div>
          </div>
        </section>
      ) : null}

      {hasAptitude ? (
        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-800" />
            <h3 className="text-lg font-black text-slate-900">Topic Performance</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {stats.topic_analytics?.length ? (
              stats.topic_analytics.map((topic) => (
                <div key={topic.concept} className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm font-semibold">
                    <span>{topic.concept}</span>
                    <span>{topic.average_percentage}% avg</span>
                  </div>
                  <div className="mt-3 h-2 rounded bg-slate-100">
                    <div
                      className="h-2 rounded bg-emerald-900"
                      style={{ width: `${Math.min(topic.average_percentage, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {topic.attempts} attempts · Best {topic.best_percentage}% · Pass rate {topic.pass_rate}%
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No topic analytics yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {hasAptitude ? (
        <section className="table-shell">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-black text-slate-900">My Submission Analytics</h3>
            <p className="text-sm text-slate-500">Your latest submitted attempts</p>
          </div>
          <div className="overflow-x-auto">
            <table className="dashboard-table w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50">
                <tr>
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
                {stats.recent_submissions?.length ? (
                  stats.recent_submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-slate-50/70">
                      <td className="font-semibold text-slate-900">{submission.assessment_title}</td>
                      <td>{submission.concept}</td>
                      <td>{submission.difficulty}</td>
                      <td>
                        {submission.score}/{submission.total_marks}
                        <p className="text-xs text-slate-500">Pass: {submission.passing_marks}</p>
                      </td>
                      <td className="font-bold text-slate-900">{submission.percentage}%</td>
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
                    <td className="px-4 py-8 text-center text-slate-500" colSpan="8">
                      No submissions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}
