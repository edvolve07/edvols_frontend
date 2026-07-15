import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { apiFetch, formatDateTime } from '../../utils/api';

export default function AssessmentResults() {
  const { id } = useParams();
  const toast = useToast();
  const [results, setResults] = useState(null);
  const [extensions, setExtensions] = useState({});
  const [savingAttemptId, setSavingAttemptId] = useState(null);

  async function loadResults() {
    apiFetch(`/admin/assessments/${id}/results`).then((data) => setResults(data.results));
  }

  useEffect(() => {
    loadResults();
  }, [id]);

  async function extendAttempt(attemptId) {
    const minutes = Number(extensions[attemptId] || 5);
    setSavingAttemptId(attemptId);
    try {
      await apiFetch(`/admin/attempts/${attemptId}/extend`, {
        method: 'PATCH',
        body: JSON.stringify({ minutes }),
      });
      toast.success(`Added ${minutes} minutes`);
      setExtensions((current) => ({ ...current, [attemptId]: 5 }));
      await loadResults();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingAttemptId(null);
    }
  }

  if (!results) return <LoadingSkeleton label="Loading results" />;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero">
        <p className="eyebrow">Attempt Monitor</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">Assessment Results</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Inspect started and submitted attempts, add extra time for active students, and review pass status.
        </p>
      </div>
      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="dashboard-table w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Result</th>
                <th>Extra Time</th>
                <th>Started At</th>
                <th>Submitted At</th>
                <th>Extend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-slate-50/70">
                  <td className="font-semibold">{result.student_name}</td>
                  <td>{result.email}</td>
                  <td>
                    <span
                      className={`badge ${
                        result.status === 'in_progress'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {result.status === 'in_progress' ? 'In progress' : 'Submitted'}
                    </span>
                  </td>
                  <td>{result.status === 'submitted' ? result.score : '-'}</td>
                  <td>
                    {result.status === 'submitted' ? `${result.percentage}%` : '-'}
                  </td>
                  <td>
                    <span
                      className={
                        result.status !== 'submitted'
                          ? 'text-slate-500'
                          : result.passed
                            ? 'text-emerald-700'
                            : 'text-red-600'
                      }
                    >
                      {result.status !== 'submitted' ? 'Pending' : result.passed ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td>{result.extra_time_minutes || 0}m</td>
                  <td>{formatDateTime(result.started_at)}</td>
                  <td>{formatDateTime(result.submitted_at)}</td>
                  <td>
                    {result.status === 'in_progress' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={extensions[result.id] ?? 5}
                          onChange={(event) =>
                            setExtensions((current) => ({
                              ...current,
                              [result.id]: event.target.value,
                            }))
                          }
                          className="w-20 rounded-md border border-slate-200 px-2 py-1 focus-ring"
                        />
                        <button
                          onClick={() => extendAttempt(result.id)}
                          disabled={savingAttemptId === result.id}
                          className="focus-ring rounded-md bg-emerald-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                        >
                          {savingAttemptId === result.id ? 'Adding...' : 'Add min'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
