import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ResultSummary from '../../components/ResultSummary';
import { apiFetch } from '../../utils/api';

export default function ResultDetails() {
  const { attemptId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch(`/student/results/${attemptId}`).then(setData);
  }, [attemptId]);

  if (!data) return <LoadingSkeleton label="Loading result" />;

  return (
    <section className="page-stack mx-auto max-w-7xl">
      <div className="page-hero">
        <p className="eyebrow">Result Review</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">{data.assessment.title}</h2>
        <p className="text-sm text-slate-500">
          {data.assessment.concept} · {data.assessment.difficulty}
        </p>
      </div>
      <ResultSummary attempt={data.attempt} assessment={data.assessment} />

      <section className="surface p-5">
        <h3 className="font-black text-slate-900">Topic-wise Performance</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.topic_analytics.map((topic) => (
            <div key={topic.concept} className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex justify-between gap-3 text-sm font-semibold">
                <span>{topic.concept}</span>
                <span>{topic.accuracy}%</span>
              </div>
              <div className="mt-3 h-2 rounded bg-slate-100">
                <div className="h-2 rounded bg-emerald-900" style={{ width: `${topic.accuracy}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {topic.correct}/{topic.total} correct · Score {topic.score}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {data.answers.map((answer, index) => (
          <article key={answer.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-black text-slate-900">Question {index + 1}</h3>
              <span className={`badge ${answer.is_correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {answer.is_correct ? 'Correct' : 'Incorrect'} · {answer.marks_awarded} marks
              </span>
            </div>
            <p className="mt-3 text-slate-800">{answer.question_text}</p>
            <div className="mt-4 grid gap-2">
              {Object.entries(answer.options).map(([key, value]) => (
                <div
                  key={key}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    key === answer.correct_option
                      ? 'border-emerald-200 bg-emerald-50'
                      : key === answer.selected_option
                        ? 'border-red-200 bg-red-50'
                        : 'border-slate-200'
                  }`}
                >
                  <span className="font-bold">{key}.</span> {value}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <span className="font-bold">Selected:</span> {answer.selected_option || 'Unanswered'} ·{' '}
                <span className="font-bold">Correct:</span> {answer.correct_option}
              </p>
              <p className="mt-3">
                <span className="font-bold">Explanation:</span> {answer.explanation}
              </p>
              {answer.shortcut ? (
                <p className="mt-3">
                  <span className="font-bold">Shortcut:</span> {answer.shortcut}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
