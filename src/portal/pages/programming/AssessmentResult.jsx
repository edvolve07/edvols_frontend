import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const STATUS_ICONS = {
  accepted: CheckCircle2,
  wrong_answer: XCircle,
  time_limit_exceeded: Clock,
  runtime_error: AlertTriangle,
  compilation_error: AlertTriangle,
};

const STATUS_COLORS = {
  accepted: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  wrong_answer: 'text-red-600 bg-red-50 border-red-200',
  time_limit_exceeded: 'text-amber-600 bg-amber-50 border-amber-200',
  runtime_error: 'text-red-600 bg-red-50 border-red-200',
  compilation_error: 'text-orange-600 bg-orange-50 border-orange-200',
  pending: 'text-slate-600 bg-slate-50 border-slate-200',
};

const STATUS_LABELS = {
  accepted: 'Accepted',
  wrong_answer: 'Wrong Answer',
  time_limit_exceeded: 'Time Limit Exceeded',
  runtime_error: 'Runtime Error',
  compilation_error: 'Compilation Error',
  pending: 'Not Submitted',
};

export default function AssessmentResult() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch(`/api/programming-assessment/student/results/${attemptId}`).then(setData);
  }, [attemptId]);

  if (!data) return <LoadingSkeleton label="Loading results" />;

  const { result, problems } = data;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <Link
        to="/programming/assessments"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Assessments
      </Link>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h1 className="text-2xl font-black text-emerald-800">{result.assessment_title}</h1>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-emerald-600">Score</p>
            <p className="text-2xl font-black text-emerald-900">{result.obtained_marks}/{result.total_marks}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-600">Percentage</p>
            <p className="text-2xl font-black text-emerald-900">{result.percentage}%</p>
          </div>
          <div>
            <p className="text-xs text-emerald-600">Started</p>
            <p className="text-sm font-semibold text-emerald-800">{new Date(result.started_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-600">Submitted</p>
            <p className="text-sm font-semibold text-emerald-800">{new Date(result.submitted_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {problems.map((p) => {
          const StatusIcon = p.answer ? STATUS_ICONS[p.answer.status] || null : null;
          return (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{p.title}</h3>
                    <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${
                      p.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      p.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {p.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{p.concept} · {p.marks} marks</p>
                </div>
                {p.answer ? (
                  <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 ${STATUS_COLORS[p.answer.status] || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                    {StatusIcon ? <StatusIcon className="h-4 w-4" /> : null}
                    <span className="text-xs font-bold">{STATUS_LABELS[p.answer.status] || p.answer.status}</span>
                    <span className="text-xs opacity-70">({p.answer.marks_awarded}/{p.marks})</span>
                  </div>
                ) : (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                    Not submitted
                  </div>
                )}
              </div>

              {p.answer?.code ? (
                <details className="px-5 py-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-700">
                    View Code
                  </summary>
                  <pre className="mt-2 rounded-md bg-slate-900 p-3 text-xs text-green-300 overflow-x-auto">
                    {p.answer.code}
                  </pre>
                </details>
              ) : null}

              {p.answer?.test_results?.length ? (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {p.answer.test_results.map((tr, i) => (
                    <div key={i} className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {tr.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-semibold text-slate-900">Test Case {i + 1}</span>
                        {tr.execution_time_ms ? (
                          <span className="text-xs text-slate-500">({tr.execution_time_ms}ms)</span>
                        ) : null}
                      </div>
                      {tr.error ? (
                        <p className="mt-1 text-xs text-red-600 font-mono whitespace-pre-wrap">{tr.error}</p>
                      ) : null}
                      {tr.input || tr.expected_output ? (
                        <div className="mt-1 grid gap-1 text-xs">
                          {tr.input ? (
                            <div>
                              <span className="font-semibold text-slate-500">Input:</span>
                              <pre className="mt-0.5 rounded bg-slate-100 p-1.5">{tr.input}</pre>
                            </div>
                          ) : null}
                          {tr.expected_output ? (
                            <div>
                              <span className="font-semibold text-slate-500">Expected:</span>
                              <pre className="mt-0.5 rounded bg-slate-100 p-1.5">{tr.expected_output}</pre>
                            </div>
                          ) : null}
                          {tr.actual_output ? (
                            <div>
                              <span className="font-semibold text-slate-500">Output:</span>
                              <pre className="mt-0.5 rounded bg-slate-100 p-1.5">{tr.actual_output}</pre>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
