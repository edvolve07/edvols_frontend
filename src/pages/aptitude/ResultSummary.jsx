export default function ResultSummary({ attempt, assessment }) {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Score</p>
        <p className="mt-1 text-3xl font-black text-slate-900">
          {attempt.score}/{assessment.total_marks}
        </p>
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Percentage</p>
        <p className="mt-1 text-3xl font-black text-slate-900">{attempt.percentage}%</p>
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Passing Marks</p>
        <p className="mt-1 text-3xl font-black text-slate-900">{assessment.passing_marks}</p>
      </div>
      <div
        className={`rounded-md border p-5 shadow-sm ${
          attempt.passed
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}
      >
        <p className="text-sm font-semibold">Result</p>
        <p className="mt-1 text-3xl font-black">{attempt.passed ? 'Pass' : 'Fail'}</p>
      </div>
    </section>
  );
}
