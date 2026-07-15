import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiFetch } from '../../utils/api';
import { DEFAULT_LANGUAGE_IDS, PROGRAMMING_LANGUAGES as LANGUAGES, emptyStarterCode } from '../../utils/programmingLanguages';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const CONCEPTS = [
  'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
  'Dynamic Programming', 'Sorting', 'Searching', 'Recursion',
  'Mathematics', 'Bit Manipulation', 'Stack', 'Queue', 'Hash Table',
  'Greedy', 'Backtracking',
];
const emptyTestCase = (isSample) => ({
  input: '',
  output: '',
  ...(isSample ? { explanation: '' } : {}),
});

export default function AdminProblemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    constraints: '',
    input_format: '',
    output_format: '',
    hints: '',
    follow_up: '',
    difficulty: 'Easy',
    concept: 'Arrays',
    tags: '',
    company_tags: '',
    is_private_bank: true,
    time_limit: 2,
    memory_limit: 256,
    status: 'draft',
    languages: DEFAULT_LANGUAGE_IDS,
    sample_test_cases: [emptyTestCase(true)],
    hidden_test_cases: [emptyTestCase(false)],
    starter_code: emptyStarterCode(),
  });
  const [editorial, setEditorial] = useState({
    overview: '',
    brute_force: '',
    optimal_approach: '',
    complexity: '',
    pitfalls: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    Promise.all([
      apiFetch(`/programming/admin/problems/${id}`),
      apiFetch(`/programming/admin/problems/${id}/editorial`),
    ]).then(([problemData, editorialData]) => {
      const p = problemData.problem;
      setForm({
        title: p.title || '',
        description: p.description || '',
        constraints: p.constraints || '',
        input_format: p.input_format || '',
        output_format: p.output_format || '',
        hints: (p.hints || []).join('\n'),
        follow_up: p.follow_up || '',
        difficulty: p.difficulty || 'Easy',
        concept: p.concept || 'Arrays',
        tags: (p.tags || []).join(', '),
        company_tags: (p.company_tags || []).join(', '),
        is_private_bank: p.is_private_bank !== false,
        time_limit: p.time_limit || 2,
        memory_limit: p.memory_limit || 256,
        status: p.status || 'draft',
        languages: p.languages || ['javascript', 'python'],
        sample_test_cases: p.sample_test_cases?.length ? p.sample_test_cases : [emptyTestCase(true)],
        hidden_test_cases: p.hidden_test_cases?.length ? p.hidden_test_cases : [emptyTestCase(false)],
        starter_code: { ...emptyStarterCode(), ...(p.starter_code || {}) },
      });
      if (editorialData.editorial) {
        setEditorial({
          overview: editorialData.editorial.overview || '',
          brute_force: editorialData.editorial.brute_force || '',
          optimal_approach: editorialData.editorial.optimal_approach || '',
          complexity: editorialData.editorial.complexity || '',
          pitfalls: (editorialData.editorial.pitfalls || []).join('\n'),
        });
      }
      setLoading(false);
    });
  }, [id, isEdit]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateTestCase(type, index, key, value) {
    setForm((prev) => ({
      ...prev,
      [type]: prev[type].map((tc, i) => (i === index ? { ...tc, [key]: value } : tc)),
    }));
  }

  function addTestCase(type, isSample) {
    setForm((prev) => ({
      ...prev,
      [type]: [...prev[type], emptyTestCase(isSample)],
    }));
  }

  function removeTestCase(type, index) {
    setForm((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  }

  function toggleLanguage(langId) {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(langId)
        ? prev.languages.filter((l) => l !== langId)
        : [...prev.languages, langId],
    }));
  }

  function updateEditorialField(key, value) {
    setEditorial((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        sample_test_cases: form.sample_test_cases.filter((tc) => tc.input || tc.output),
        hidden_test_cases: form.hidden_test_cases.filter((tc) => tc.input || tc.output),
      };

      let savedProblem;
      if (isEdit) {
        const response = await apiFetch(`/programming/admin/problems/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        savedProblem = response.problem;
      } else {
        const response = await apiFetch('/programming/admin/problems', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        savedProblem = response.problem;
      }

      if (savedProblem?.id && editorial.overview.trim() && editorial.optimal_approach.trim()) {
        await apiFetch(`/programming/admin/problems/${savedProblem.id}/editorial`, {
          method: 'PUT',
          body: JSON.stringify({
            overview: editorial.overview,
            brute_force: editorial.brute_force,
            optimal_approach: editorial.optimal_approach,
            complexity: editorial.complexity,
            pitfalls: editorial.pitfalls.split('\n').map((item) => item.trim()).filter(Boolean),
          }),
        });
      }
      navigate('/admin/programming');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSkeleton label="Loading problem" />;

  return (
    <section className="page-stack max-w-4xl">
      <button
        onClick={() => navigate('/admin/programming')}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Problems
      </button>

      <div className="page-hero">
        <h2 className="text-3xl font-black text-slate-900">
          {isEdit ? 'Edit Problem' : 'Create Problem'}
        </h2>
      </div>

      <div className="surface p-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">Title</label>
            <input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="input"
              placeholder="Two Sum"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="input min-h-[120px]"
              placeholder="Given an array of integers nums and an integer target..."
            />
          </div>
          <div>
            <label className="label">Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => updateField('difficulty', e.target.value)}
              className="input"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Concept</label>
            <select
              value={form.concept}
              onChange={(e) => updateField('concept', e.target.value)}
              className="input"
            >
              {CONCEPTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Topic Tags</label>
            <input
              value={form.tags}
              onChange={(e) => updateField('tags', e.target.value)}
              className="input"
              placeholder="arrays, prefix sum, hashing"
            />
          </div>
          <div>
            <label className="label">Company Tags</label>
            <input
              value={form.company_tags}
              onChange={(e) => updateField('company_tags', e.target.value)}
              className="input"
              placeholder="TCS, Infosys, Amazon"
            />
          </div>
          <label className="md:col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={form.is_private_bank}
              onChange={(e) => updateField('is_private_bank', e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Keep this problem in my institution question bank
          </label>
          <div>
            <label className="label">Time Limit (seconds)</label>
            <input
              type="number"
              value={form.time_limit}
              onChange={(e) => updateField('time_limit', Number(e.target.value))}
              className="input"
              min={1}
              max={15}
            />
          </div>
          <div>
            <label className="label">Memory Limit (MB)</label>
            <input
              type="number"
              value={form.memory_limit}
              onChange={(e) => updateField('memory_limit', Number(e.target.value))}
              className="input"
              min={16}
              max={1024}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Constraints</label>
            <textarea
              value={form.constraints}
              onChange={(e) => updateField('constraints', e.target.value)}
              className="input min-h-[60px]"
              placeholder="2 <= nums.length <= 10^5&#10;-10^9 <= nums[i] <= 10^9"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Input Format</label>
            <textarea
              value={form.input_format}
              onChange={(e) => updateField('input_format', e.target.value)}
              className="input min-h-[60px]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Output Format</label>
            <textarea
              value={form.output_format}
              onChange={(e) => updateField('output_format', e.target.value)}
              className="input min-h-[60px]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Hints</label>
            <textarea
              value={form.hints}
              onChange={(e) => updateField('hints', e.target.value)}
              className="input min-h-[70px]"
              placeholder="One hint per line"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Follow-up</label>
            <textarea
              value={form.follow_up}
              onChange={(e) => updateField('follow_up', e.target.value)}
              className="input min-h-[60px]"
              placeholder="Can you solve it with a better time or space complexity?"
            />
          </div>
        </div>

        <div>
          <label className="label">Supported Languages</label>
          <div className="mt-1 flex flex-wrap gap-3">
            {LANGUAGES.map((lang) => (
              <label key={lang.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.languages.includes(lang.id)}
                  onChange={() => toggleLanguage(lang.id)}
                  className="rounded border-slate-300"
                />
                {lang.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0">Sample Test Cases</label>
            <button
              type="button"
              onClick={() => addTestCase('sample_test_cases', true)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-600"
            >
              <Plus className="mr-1 inline h-3 w-3" />
              Add Sample
            </button>
          </div>
          <div className="mt-2 space-y-3">
            {form.sample_test_cases.map((tc, i) => (
              <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Sample {i + 1}</span>
                  <button onClick={() => removeTestCase('sample_test_cases', i)} className="text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Input</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => updateTestCase('sample_test_cases', i, 'input', e.target.value)}
                      className="input mt-0.5 font-mono text-xs min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Output</label>
                    <textarea
                      value={tc.output}
                      onChange={(e) => updateTestCase('sample_test_cases', i, 'output', e.target.value)}
                      className="input mt-0.5 font-mono text-xs min-h-[40px]"
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-xs font-semibold text-slate-600">Explanation</label>
                  <textarea
                    value={tc.explanation}
                    onChange={(e) => updateTestCase('sample_test_cases', i, 'explanation', e.target.value)}
                    className="input mt-0.5 text-xs min-h-[40px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0">Hidden Test Cases</label>
            <button
              type="button"
              onClick={() => addTestCase('hidden_test_cases', false)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-600"
            >
              <Plus className="mr-1 inline h-3 w-3" />
              Add Test Case
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-2">At least one hidden test case is required.</p>
          <div className="space-y-3">
            {form.hidden_test_cases.map((tc, i) => (
              <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Hidden Case {i + 1}</span>
                  <button onClick={() => removeTestCase('hidden_test_cases', i)} className="text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Input</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => updateTestCase('hidden_test_cases', i, 'input', e.target.value)}
                      className="input mt-0.5 font-mono text-xs min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Output</label>
                    <textarea
                      value={tc.output}
                      onChange={(e) => updateTestCase('hidden_test_cases', i, 'output', e.target.value)}
                      className="input mt-0.5 font-mono text-xs min-h-[40px]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Starter Code</label>
          <p className="text-xs text-slate-500 mb-2">
            Optional boilerplate code shown to students for each language.
          </p>
          <div className="space-y-3">
            {LANGUAGES.map((lang) => (
              <div key={lang.id}>
                <label className="text-xs font-bold text-slate-600">{lang.label}</label>
                <textarea
                  value={form.starter_code[lang.id] || ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      starter_code: { ...prev.starter_code, [lang.id]: e.target.value },
                    }))
                  }
                  className="input mt-0.5 min-h-[80px] font-mono text-xs"
                  placeholder={`// Starter code for ${lang.label}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-emerald-950">Official Editorial</h3>
              <p className="mt-1 text-xs font-semibold text-emerald-800">
                Students see this as the official explanation. Overview and optimal approach are required to publish an editorial.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Overview</label>
              <textarea
                value={editorial.overview}
                onChange={(e) => updateEditorialField('overview', e.target.value)}
                className="input min-h-[80px]"
                placeholder="Explain the core idea of the problem."
              />
            </div>
            <div>
              <label className="label">Brute Force</label>
              <textarea
                value={editorial.brute_force}
                onChange={(e) => updateEditorialField('brute_force', e.target.value)}
                className="input min-h-[100px]"
                placeholder="Describe the straightforward approach and why it may be slow."
              />
            </div>
            <div>
              <label className="label">Optimal Approach</label>
              <textarea
                value={editorial.optimal_approach}
                onChange={(e) => updateEditorialField('optimal_approach', e.target.value)}
                className="input min-h-[100px]"
                placeholder="Describe the intended solution."
              />
            </div>
            <div>
              <label className="label">Complexity</label>
              <textarea
                value={editorial.complexity}
                onChange={(e) => updateEditorialField('complexity', e.target.value)}
                className="input min-h-[70px]"
                placeholder="Time: O(n), Space: O(1)"
              />
            </div>
            <div>
              <label className="label">Pitfalls</label>
              <textarea
                value={editorial.pitfalls}
                onChange={(e) => updateEditorialField('pitfalls', e.target.value)}
                className="input min-h-[70px]"
                placeholder="One common mistake per line"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
          <button onClick={() => updateField('status', 'draft')} className="btn-secondary">
            Save as Draft
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : isEdit ? 'Update Problem' : 'Create Problem'}
          </button>
        </div>
      </div>
    </section>
  );
}
