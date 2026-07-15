import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import LoadingSkeleton from '@/src/portal/components/LoadingSkeleton';

export default function MasterAdminAssessmentResults() {
  const { assessmentId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch(`/api/programming-assessment/master/assessments/${assessmentId}/results`).then(setData);
  }, [assessmentId]);

  if (!data) return <LoadingSkeleton label="Loading results" />;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <Link
        to="/master-admin/programming/assessments"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Assessments
      </Link>

      <div className="page-hero">
        <p className="eyebrow">Results</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">{data.assessment.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {data.results.length} student{data.results.length !== 1 ? 's' : ''} submitted
        </p>
      </div>

      {data.results.length === 0 ? (
        <div className="surface p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-500">No submissions yet</p>
        </div>
      ) : (
        <div className="table-shell">
          <div className="overflow-x-auto">
            <table className="dashboard-table w-full min-w-[700px] text-sm">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="font-semibold text-slate-900">{r.student_name}</td>
                    <td className="text-slate-500">{r.student_email}</td>
                    <td>
                      {r.status === 'submitted' ? (
                        <span className="badge bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Submitted
                        </span>
                      ) : (
                        <span className="badge bg-amber-50 text-amber-700">
                          <Clock className="mr-1 h-3 w-3" /> In Progress
                        </span>
                      )}
                    </td>
                    <td className="font-semibold">{r.obtained_marks}/{r.total_marks}</td>
                    <td>
                      <span className={`font-bold ${
                        r.percentage >= 70 ? 'text-emerald-600' : r.percentage >= 40 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
