import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "../../navigation";
import LoadingSkeleton from "./LoadingSkeleton";
import ResultSummary from "./ResultSummary";
import { getStudentResult } from "@/lib/api";

function formatDateTime(value) {
  if (!value) return "Open";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ResultDetails({ attemptId, backPath = "/aptitude/results" }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStudentResult(attemptId)
      .then(setData)
      .catch((err) => setError(err.message || "Unable to load result"));
  }, [attemptId]);

  if (error && !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return <LoadingSkeleton label="Loading result" />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">Result review</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{data.assessment.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.assessment.concept} · {data.assessment.difficulty}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          Back to results page
        </button>
      </div>

      <ResultSummary attempt={data.attempt} assessment={data.assessment} />

      <section className="surface rounded-2xl border border-slate-200 bg-slate-50 p-5 mt-6">
        <h2 className="text-lg font-black text-slate-950">Topic-wise performance</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.topic_analytics?.length ? (
            data.topic_analytics.map((topic) => (
              <div key={topic.concept} className="rounded-md border border-slate-200 bg-white p-4">
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
            ))
          ) : (
            <p className="text-sm text-slate-500">No topic analytics available.</p>
          )}
        </div>
      </section>

      <section className="space-y-4 mt-6">
        {data.answers.map((answer, index) => (
          <article key={answer.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-black text-slate-950">Question {index + 1}</h3>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  answer.is_correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}
              >
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
                      : 'border-slate-200 bg-white'
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
    </div>
  );
}
