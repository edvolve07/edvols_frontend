import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Eye, Pencil, Rocket, Trash2 } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { apiFetch, formatDateTime } from '../../utils/api';

export default function AdminAssessments() {
  const toast = useToast();
  const [assessments, setAssessments] = useState(null);
  const [durationExtensions, setDurationExtensions] = useState({});
  const [savingAssessmentId, setSavingAssessmentId] = useState(null);

  async function load() {
    const data = await apiFetch('/admin/assessments');
    setAssessments(data.assessments);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    if (!window.confirm('Remove this assessment from active listings? Historical attempts stay saved.')) return;
    await apiFetch(`/admin/assessments/${id}`, { method: 'DELETE' });
    toast.success('Assessment deleted');
    load();
  }

  async function setStatus(id, status) {
    await apiFetch(`/admin/assessments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    toast.success(status === 'published' ? 'Assessment published' : 'Assessment unpublished');
    load();
  }

  async function extendAssessmentDuration(id) {
    const minutes = Number(durationExtensions[id] || 5);
    setSavingAssessmentId(id);
    try {
      await apiFetch(`/admin/assessments/${id}/extend-duration`, {
        method: 'PATCH',
        body: JSON.stringify({ minutes }),
      });
      toast.success(`Assessment duration extended by ${minutes} minutes`);
      setDurationExtensions((current) => ({ ...current, [id]: 5 }));
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingAssessmentId(null);
    }
  }

  if (!assessments) return <LoadingSkeleton label="Loading assessments" />;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Assessment Library</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Assessments</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Review, publish, edit questions, extend duration, and inspect results.
          </p>
        </div>
        <Link
          to="/admin/assessments/create"
          className="btn-primary"
        >
          Create Assessment
        </Link>
      </div>
      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="dashboard-table w-full min-w-[1080px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th>Title</th>
                <th>Concept</th>
                <th>Difficulty</th>
                <th>Target</th>
                <th>Duration</th>
                <th>Extend Time</th>
                <th>Questions</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-slate-50/70">
                  <td className="font-semibold text-slate-900">{assessment.title}</td>
                  <td>{assessment.concept}</td>
                  <td>{assessment.difficulty}</td>
                  <td>
                    <span className={`badge ${
                      assessment.target_audience === 'department'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}>
                      {assessment.target_audience === 'department' ? 'Dept-wise' : 'All'}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      {assessment.duration_minutes}m
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={durationExtensions[assessment.id] ?? 5}
                        onChange={(event) =>
                          setDurationExtensions((current) => ({
                            ...current,
                            [assessment.id]: event.target.value,
                          }))
                        }
                        className="w-20 rounded-md border border-slate-200 px-2 py-1 focus-ring"
                      />
                      <button
                        onClick={() => extendAssessmentDuration(assessment.id)}
                        disabled={savingAssessmentId === assessment.id}
                        className="focus-ring rounded-md bg-emerald-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {savingAssessmentId === assessment.id ? 'Adding...' : 'Add min'}
                      </button>
                    </div>
                  </td>
                  <td>{assessment.total_questions}</td>
                  <td>
                    <span
                      className={`badge ${
                        assessment.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {assessment.status}
                    </span>
                  </td>
                  <td>{formatDateTime(assessment.created_at)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link title="View results" to={`/admin/assessments/${assessment.id}/results`} className="rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link title="Edit questions" to={`/admin/assessments/${assessment.id}/questions`} className="rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        title={assessment.status === 'published' ? 'Unpublish' : 'Publish'}
                        onClick={() =>
                          setStatus(
                            assessment.id,
                            assessment.status === 'published' ? 'draft' : 'published',
                          )
                        }
                        className="rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50"
                      >
                        <Rocket className="h-4 w-4" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => remove(assessment.id)}
                        className="rounded-md border border-red-100 bg-white p-2 text-red-600 hover:bg-red-50"
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
    </section>
  );
}
