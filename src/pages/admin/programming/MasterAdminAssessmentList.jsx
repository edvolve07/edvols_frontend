import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Plus, ClipboardCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import LoadingSkeleton from '@/src/portal/components/LoadingSkeleton';

export default function MasterAdminAssessmentList() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch('/api/programming-assessment/master/assessments').then(setData);
  }, []);

  async function handleToggleStatus(assessment) {
    const newStatus = assessment.status === 'published' ? 'draft' : 'published';
    await apiFetch(`/api/programming-assessment/master/assessments/${assessment.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    setData((prev) => ({
      ...prev,
      assessments: prev.assessments.map((a) =>
        a.id === assessment.id ? { ...a, status: newStatus } : a
      ),
    }));
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this assessment?')) return;
    await apiFetch(`/api/programming-assessment/master/assessments/${id}`, { method: 'DELETE' });
    setData((prev) => ({
      ...prev,
      assessments: prev.assessments.filter((a) => a.id !== id),
    }));
  }

  if (!data) return <LoadingSkeleton label="Loading assessments" />;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Coding Tests</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">All Assessments</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage coding assessments across all admins and students.
          </p>
        </div>
        <button onClick={() => navigate('/master-admin/programming/assessments/create')} className="btn-primary">
          <Plus className="h-4 w-4" />
          New Coding Test
        </button>
      </div>

      {data.assessments.length === 0 ? (
        <div className="surface p-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-500">No assessments yet</p>
        </div>
      ) : (
        <div className="table-shell">
          <div className="overflow-x-auto">
            <table className="dashboard-table w-full min-w-[800px] text-sm">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Created By</th>
                  <th>Problems</th>
                  <th>Attempts</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="font-semibold text-slate-900">{a.title}</td>
                    <td className="text-slate-500">{a.created_by?.name || 'Unknown'}</td>
                    <td className="text-slate-500">{a.problem_count}</td>
                    <td className="text-slate-500">{a.attempt_count}</td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(a)}
                        className={`badge ${
                          a.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {a.status}
                      </button>
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/master-admin/programming/assessments/${a.id}/problems`)}
                          className="rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50"
                          title="Edit Problems"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/master-admin/programming/assessments/${a.id}/results`)}
                          className="rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50"
                          title="View Results"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="rounded-md border border-red-100 bg-white p-2 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
