import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { DEFAULT_LANGUAGE_IDS, PROGRAMMING_LANGUAGES as LANGUAGES, emptyStarterCode } from '@/src/portal/utils/programmingLanguages';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const CONCEPTS = [
  'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
  'Dynamic Programming', 'Sorting', 'Searching', 'Recursion',
  'Mathematics', 'Bit Manipulation', 'Stack', 'Queue', 'Hash Table',
  'Greedy', 'Backtracking',
];

const EMPTY_PROBLEM = () => ({
  title: '',
  description: '',
  constraints: '',
  input_format: '',
  output_format: '',
  difficulty: 'Easy',
  concept: 'Arrays',
  marks: 10,
  time_limit: 2,
  memory_limit: 256,
  languages: DEFAULT_LANGUAGE_IDS,
  sample_test_cases: [{ input: '', output: '', explanation: '' }],
  hidden_test_cases: [{ input: '', output: '' }],
  starter_code: emptyStarterCode(),
});

function ProblemCard({ problem, index, total, onUpdate, onRemove, canRemove }) {
  function update(field, value) {
    onUpdate(index, field, value);
  }

  function updateTestCase(type, tcIndex, field, value) {
    const key = type === 'sample' ? 'sample_test_cases' : 'hidden_test_cases';
    const updated = [...problem[key]];
    updated[tcIndex] = { ...updated[tcIndex], [field]: value };
    onUpdate(index, key, updated);
  }

  function addTestCase(type) {
    const newTc = type === 'sample' ? { input: '', output: '', explanation: '' } : { input: '', output: '' };
    const key = type === 'sample' ? 'sample_test_cases' : 'hidden_test_cases';
    onUpdate(index, key, [...problem[key], newTc]);
  }

  function removeTestCase(type, tcIndex) {
    const key = type === 'sample' ? 'sample_test_cases' : 'hidden_test_cases';
    const updated = problem[key].filter((_, j) => j !== tcIndex);
    onUpdate(index, key, updated.length > 0 ? updated : [{ input: '', output: '', explanation: '' }]);
  }

  function toggleLanguage(lang) {
    const langs = problem.languages.includes(lang)
      ? problem.languages.filter((l) => l !== lang)
      : [...problem.languages, lang];
    onUpdate(index, 'languages', langs.length > 0 ? langs : [lang]);
  }

  function updateStarterCode(lang, value) {
    onUpdate(index, 'starter_code', { ...problem.starter_code, [lang]: value });
  }

  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
            {index + 1}
          </span>
          <div>
            <p className="font-bold text-slate-900">{problem.title || 'Untitled Problem'}</p>
            <p className="text-xs text-slate-400">
              {problem.difficulty} · {problem.concept} · {problem.marks} marks
            </p>
          </div>
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="rounded-lg border border-red-200 bg-white p-2 text-red-500 hover:bg-red-50"
            title="Remove problem"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Problem Title
            <input
              value={problem.title}
              onChange={(e) => update('title', e.target.value)}
              className="field mt-1"
              placeholder="e.g., Two Sum"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Description
            <textarea
              value={problem.description}
              onChange={(e) => update('description', e.target.value)}
              className="field mt-1 min-h-[80px]"
              placeholder="Describe the problem clearly..."
            />
          </label>

          <div>
            <label className="text-sm font-semibold text-slate-700">Difficulty</label>
            <select
              value={problem.difficulty}
              onChange={(e) => update('difficulty', e.target.value)}
              className="field mt-1"
            >
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Concept</label>
            <select
              value={problem.concept}
              onChange={(e) => update('concept', e.target.value)}
              className="field mt-1"
            >
              {CONCEPTS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Marks</label>
            <input
              type="number"
              value={problem.marks}
              onChange={(e) => update('marks', Math.max(1, parseInt(e.target.value) || 1))}
              className="field mt-1"
              min={1}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Time Limit (s)</label>
            <input
              type="number"
              value={problem.time_limit}
              onChange={(e) => update('time_limit', Math.max(1, Math.min(15, parseInt(e.target.value) || 2)))}
              className="field mt-1"
              min={1}
              max={15}
            />
          </div>

          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Constraints
            <textarea
              value={problem.constraints}
              onChange={(e) => update('constraints', e.target.value)}
              className="field mt-1"
              rows={2}
              placeholder="e.g., 1 <= nums.length <= 10^4"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Input Format
            <textarea
              value={problem.input_format}
              onChange={(e) => update('input_format', e.target.value)}
              className="field mt-1"
              rows={2}
              placeholder="e.g., First line contains N..."
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Output Format
            <textarea
              value={problem.output_format}
              onChange={(e) => update('output_format', e.target.value)}
              className="field mt-1"
              rows={2}
              placeholder="e.g., Print the sum..."
            />
          </label>

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-slate-700">Supported Languages</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => toggleLanguage(l.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    problem.languages.includes(l.id)
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sample Test Cases</p>
                <button
                  onClick={() => addTestCase('sample')}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              <div className="space-y-3">
                {problem.sample_test_cases.map((tc, tci) => (
                  <div key={tci} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Sample {tci + 1}</span>
                      <button onClick={() => removeTestCase('sample', tci)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        value={tc.input}
                        onChange={(e) => updateTestCase('sample', tci, 'input', e.target.value)}
                        className="field font-mono text-xs"
                        placeholder="Input"
                      />
                      <input
                        value={tc.output}
                        onChange={(e) => updateTestCase('sample', tci, 'output', e.target.value)}
                        className="field font-mono text-xs"
                        placeholder="Expected output"
                      />
                      <input
                        value={tc.explanation || ''}
                        onChange={(e) => updateTestCase('sample', tci, 'explanation', e.target.value)}
                        className="field text-xs"
                        placeholder="Explanation (optional)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Hidden Test Cases</p>
                <button
                  onClick={() => addTestCase('hidden')}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              <div className="space-y-3">
                {problem.hidden_test_cases.map((tc, tci) => (
                  <div key={tci} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Hidden {tci + 1}</span>
                      <button onClick={() => removeTestCase('hidden', tci)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        value={tc.input}
                        onChange={(e) => updateTestCase('hidden', tci, 'input', e.target.value)}
                        className="field font-mono text-xs"
                        placeholder="Input"
                      />
                      <input
                        value={tc.output}
                        onChange={(e) => updateTestCase('hidden', tci, 'output', e.target.value)}
                        className="field font-mono text-xs"
                        placeholder="Expected output"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Starter Code <span className="font-normal text-slate-400">(optional)</span></p>
          <div className="grid gap-3 sm:grid-cols-2">
            {LANGUAGES.filter((l) => problem.languages.includes(l.id)).map((l) => (
              <div key={l.id}>
                <label className="text-xs font-semibold text-slate-500">{l.label}</label>
                <textarea
                  value={problem.starter_code[l.id] || ''}
                  onChange={(e) => updateStarterCode(l.id, e.target.value)}
                  className="field mt-1 font-mono text-xs"
                  rows={3}
                  placeholder={`// ${l.label} starter code`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MasterAdminAssessmentForm() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!assessmentId;
  const [assessment, setAssessment] = useState({ title: '', description: '', status: 'draft' });
  const [problems, setProblems] = useState([EMPTY_PROBLEM()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      apiFetch(`/api/programming-assessment/master/assessments/${assessmentId}`).then((data) => {
        setAssessment({
          title: data.assessment.title,
          description: data.assessment.description,
          status: data.assessment.status,
        });
        if (data.problems.length > 0) {
          setProblems(data.problems.map((p) => ({
            title: p.title,
            description: p.description,
            constraints: p.constraints || '',
            input_format: p.input_format || '',
            output_format: p.output_format || '',
            difficulty: p.difficulty,
            concept: p.concept,
            marks: p.marks,
            time_limit: p.time_limit,
            memory_limit: p.memory_limit,
            languages: p.languages,
            sample_test_cases: p.sample_test_cases.length > 0 ? p.sample_test_cases : [{ input: '', output: '', explanation: '' }],
            hidden_test_cases: p.hidden_test_cases.length > 0 ? p.hidden_test_cases : [{ input: '', output: '' }],
            starter_code: { ...emptyStarterCode(), ...(p.starter_code || {}) },
          })));
        }
      });
    }
  }, [assessmentId]);

  function updateProblem(index, field, value) {
    setProblems((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function removeProblem(index) {
    if (problems.length <= 1) return;
    setProblems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!assessment.title.trim()) return alert('Assessment title is required');
    for (let i = 0; i < problems.length; i++) {
      if (!problems[i].title.trim()) return alert(`Problem ${i + 1} is missing a title`);
    }
    setSaving(true);
    try {
      let id = assessmentId;
      if (!isEdit) {
        const created = await apiFetch('/api/programming-assessment/master/assessments', {
          method: 'POST',
          body: JSON.stringify(assessment),
        });
        id = created.assessment.id;
      } else {
        await apiFetch(`/api/programming-assessment/master/assessments/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(assessment),
        });
      }
      await apiFetch(`/api/programming-assessment/master/assessments/${id}/problems`, {
        method: 'PUT',
        body: JSON.stringify({ problems }),
      });
      navigate('/master-admin/programming/assessments');
    } catch (err) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/master-admin/programming/assessments')}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Assessments
      </button>

      <div className="page-hero flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Coding Tests</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">
            {isEdit ? 'Edit Assessment' : 'Create Coding Assessment'}
          </h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary shrink-0 gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Assessment'}
        </button>
      </div>

      <div className="surface p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">Assessment Details</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Title
            <input
              value={assessment.title}
              onChange={(e) => setAssessment({ ...assessment, title: e.target.value })}
              className="field mt-1"
              placeholder="e.g., Arrays & Strings Test"
            />
          </label>
          <div>
            <label className="text-sm font-semibold text-slate-700">Status</label>
            <select
              value={assessment.status}
              onChange={(e) => setAssessment({ ...assessment, status: e.target.value })}
              className="field mt-1"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Description <span className="text-slate-400 font-normal">(optional)</span>
            <textarea
              value={assessment.description}
              onChange={(e) => setAssessment({ ...assessment, description: e.target.value })}
              className="field mt-1"
              rows={2}
              placeholder="Brief description..."
            />
          </label>
        </div>
      </div>

      <div className="space-y-5">
        {problems.map((problem, pi) => (
          <ProblemCard
            key={pi}
            problem={problem}
            index={pi}
            total={problems.length}
            onUpdate={updateProblem}
            onRemove={() => removeProblem(pi)}
            canRemove={problems.length > 1}
          />
        ))}
      </div>

      <button
        onClick={() => setProblems((prev) => [...prev, EMPTY_PROBLEM()])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white py-4 text-sm font-semibold text-slate-500 transition hover:border-emerald-300 hover:text-emerald-600"
      >
        <Plus className="h-5 w-5" />
        Add Problem
      </button>
    </div>
  );
}
