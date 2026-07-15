import { Trash2 } from 'lucide-react';

const fields = [
  ['option_a', 'Option A'],
  ['option_b', 'Option B'],
  ['option_c', 'Option C'],
  ['option_d', 'Option D'],
];

export default function QuestionEditorCard({ question, index, onChange, onDelete }) {
  function update(key, value) {
    onChange(index, { ...question, [key]: value });
  }

  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black text-slate-900">Question {index + 1}</h3>
        <button
          onClick={() => onDelete(index)}
          className="focus-ring rounded-md border border-red-100 p-2 text-red-600 hover:bg-red-50"
          type="button"
          title="Delete question"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Question text
        <textarea
          value={question.question_text}
          onChange={(event) => update('question_text', event.target.value)}
          className="field min-h-24"
        />
      </label>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className="block text-sm font-semibold text-slate-700">
            {label}
            <input
              value={question[key]}
              onChange={(event) => update(key, event.target.value)}
              className="field"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="block text-sm font-semibold text-slate-700">
          Correct
          <select
            value={question.correct_option}
            onChange={(event) => update('correct_option', event.target.value)}
            className="field"
          >
            {['A', 'B', 'C', 'D'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Concept
          <input
            value={question.concept}
            onChange={(event) => update('concept', event.target.value)}
            className="field"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Marks
          <input
            type="number"
            min="0"
            step="0.25"
            value={question.marks}
            onChange={(event) => update('marks', Number(event.target.value))}
            className="field"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Negative
          <input
            type="number"
            min="0"
            step="0.25"
            value={question.negative_marks}
            onChange={(event) => update('negative_marks', Number(event.target.value))}
            className="field"
          />
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Explanation
          <textarea
            value={question.explanation}
            onChange={(event) => update('explanation', event.target.value)}
            className="field min-h-24"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Shortcut
          <textarea
            value={question.shortcut}
            onChange={(event) => update('shortcut', event.target.value)}
            className="field min-h-24"
          />
        </label>
      </div>
    </article>
  );
}
