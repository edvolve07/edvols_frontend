import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Mic2 } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
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

export default function StudentResults() {
  const [results, setResults] = useState(null);
  const [interviewReports, setInterviewReports] = useState(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [assessmentData, reportData] = await Promise.all([
        apiFetch('/student/results'),
        apiFetch('/reports'),
      ]);
      setResults(assessmentData.results || []);
      setInterviewReports(reportData.reports || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load reports');
      setResults([]);
      setInterviewReports([]);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 30 * 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (!results || !interviewReports) return <LoadingSkeleton label="Loading results" />;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Performance Archive</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Reports and Results</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review interview reports, submitted assessments, scores, pass status, explanations, and topic analytics.
          </p>
          {error ? <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        </div>
      </div>

      <section className="surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Mic2 className="h-5 w-5 text-emerald-800" />
          <h3 className="text-lg font-black text-slate-900">Interview Reports</h3>
        </div>
        <div className="grid gap-4">
          {interviewReports.map((report) => (
            <Link
              key={report.session_id}
              to={`/reports?session=${report.session_id}`}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-card-hover"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-slate-900">{report.role || 'Interview report'}</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {report.domain || 'Interview'} · {formatDateTime(report.created_at)} · {report.report_id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">{report.grade || '--'}</p>
                  <p className="text-sm font-bold text-emerald-800">{Math.round(report.percentage || 0)}%</p>
                </div>
              </div>
            </Link>
          ))}
          {!interviewReports.length ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
              No interview reports yet.
            </div>
          ) : null}
        </div>
      </section>

      <section className="surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-800" />
          <h3 className="text-lg font-black text-slate-900">Assessment Results</h3>
        </div>
      <div className="grid gap-4">
        {results.map((result) => (
          <Link
            key={result.id}
            to={`/student/results/${result.id}`}
            className="rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-card-hover"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900">{result.assessment_title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {result.concept} · {result.difficulty} · {formatDateTime(result.submitted_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">{result.percentage}%</p>
                <p className={result.passed ? 'text-sm font-bold text-emerald-700' : 'text-sm font-bold text-red-600'}>
                  {result.passed ? 'Passed' : 'Failed'}
                </p>
              </div>
            </div>
          </Link>
        ))}
        {!results.length ? (
          <div className="surface p-8 text-center text-sm font-semibold text-slate-500">
            No submitted attempts yet.
          </div>
        ) : null}
      </div>
      </section>
    </section>
  );
}
