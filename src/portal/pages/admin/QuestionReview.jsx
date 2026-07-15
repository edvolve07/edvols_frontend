import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionList from '../../components/QuestionList';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../utils/api';

export default function QuestionReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await apiFetch(`/admin/assessments/${id}`);
    setAssessment(data.assessment);
    setQuestions(data.questions);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save(status = null) {
    setSaving(true);
    try {
      const data = await apiFetch(`/admin/assessments/${id}/questions`, {
        method: 'PUT',
        body: JSON.stringify({ questions }),
      });
      setAssessment(data.assessment);
      setQuestions(data.questions);
      if (status) {
        const updated = await apiFetch(`/admin/assessments/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        setAssessment(updated.assessment);
      }
      toast.success(status === 'published' ? 'Saved and published' : 'Questions saved');
      if (status === 'published') {
        navigate('/admin/assessments');
        return;
      }
    } catch (error) {
      toast.error(error.details?.join(', ') || error.message);
    } finally {
      setSaving(false);
    }
  }

  if (!assessment) return <LoadingSkeleton label="Loading questions" />;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Question Review</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{assessment.title}</h2>
          <p className="text-sm text-slate-500">
            {questions.length} questions · {assessment.status}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={() => save()}
            className="btn-secondary"
          >
            {saving ? 'Saving...' : 'Save edits'}
          </button>
          <button
            disabled={saving}
            onClick={() => save('published')}
            className="btn-primary"
          >
            Publish assessment
          </button>
        </div>
      </div>
      <QuestionList
        questions={questions}
        setQuestions={setQuestions}
        defaults={{ concept: assessment.concept, difficulty: assessment.difficulty }}
      />
    </section>
  );
}
