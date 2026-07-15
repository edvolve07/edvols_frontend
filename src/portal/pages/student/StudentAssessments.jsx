import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import AssessmentCard from '../../components/AssessmentCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiFetch } from '../../utils/api';

export default function StudentAssessments() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState(null);

  useEffect(() => {
    apiFetch('/student/assessments').then((data) => setAssessments(data.assessments));
  }, []);

  if (!assessments) return <LoadingSkeleton label="Loading assessments" />;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero">
        <p className="eyebrow">Assessment Library</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">Available Assessments</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Choose a published assessment and continue with your latest in-progress attempt when available.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {assessments.map((assessment) => {
          const assessmentId = assessment.id || assessment._id;
          return (
          <AssessmentCard
            key={assessmentId}
            assessment={assessment}
            action={
              <button
                type="button"
                onClick={() => navigate(`/student/assessments/${assessmentId}/start`)}
                disabled={!assessmentId}
                className="btn-primary"
              >
                <Play className="h-4 w-4" />
                Start Assessment
              </button>
            }
          />
        );
        })}
        {!assessments.length ? (
          <div className="surface p-8 text-center text-sm font-semibold text-slate-500">
            No published assessments are available right now.
          </div>
        ) : null}
      </div>
    </section>
  );
}
