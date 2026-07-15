import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
const emptyTestCase = (isSample) => ({
  input: '',
  output: '',
  ...(isSample ? { explanation: '' } : {}),
});

const API_BASE = '/api/programming/master';

export default function MasterAdminProblemForm() {
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
    difficulty: 'Easy',
    concept: 'Arrays',
    time_limit: 2,
    memory_limit: 256,
    status: 'draft',
    languages: DEFAULT_LANGUAGE_IDS,
    sample_test_cases: [emptyTestCase(true)],
    hidden_test_cases: [emptyTestCase(false)],
    starter_code: emptyStarterCode(),
  });

  useEffect(() => {
    if (!isEdit) return;
    apiFetch(`${API_BASE}/problems/${id}`).then((data) => {
      const p = data.problem;
      setForm({
        title: p.title || '',
        description: p.description || '',
        constraints: p.constraints || '',
        input_format: p.input_format || '',
        output_format: p.output_format || '',
        difficulty: p.difficulty || 'Easy',
        concept: p.concept || 'Arrays',
        time_limit: p.time_limit || 2,
        memory_limit: p.memory_limit || 256,
        status: p.status || 'draft',
        languages: p.languages || ['javascript', 'python'],
        sample_test_cases: p.sample_test_cases?.length ? p.sample_test_cases : [emptyTestCase(true)],
        hidden_test_cases: p.hidden_test_cases?.length ? p.hidden_test_cases : [emptyTestCase(false)],
        starter_code: { ...emptyStarterCode(), ...(p.starter_code || {}) },
      });
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

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        sample_test_cases: form.sample_test_cases.filter((tc) => tc.input || tc.output),
        hidden_test_cases: form.hidden_test_cases.filter((tc) => tc.input || tc.output),
      };

      if (isEdit) {
        await apiFetch(`${API_BASE}/problems/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`${API_BASE}/problems`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      navigate('/master-admin/programming');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="page-stack mx-auto max-w-5xl">
        <div className="h-32 animate-pulse rounded-2xl bg-white" />
      </section>
    );
  }

  return (
    <section className="page-stack mx-auto max-w-5xl">
      <button
        onClick={() => navigate('/master-admin/programming')}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Problems
      </button>

      <div className="page-hero">
        <h2 className="text-3xl font-black text-slate-900">{isEdit ? 'Edit Problem' : 'Create Problem'}</h2>
      </div>

      <section className="surface p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Title</label>
            <input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="field"
              placeholder="Two Sum"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="field min-h-[120px]"
              placeholder="Given an array of integers nums and an integer target..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Difficulty</label>
            <select value={form.difficulty} onChange={(e) => updateField('difficulty', e.target.value)} className="field">
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Concept</label>
            <select value={form.concept} onChange={(e) => updateField('concept', e.target.value)} className="field">
              {CONCEPTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Time Limit (seconds)</label>
            <input type="number" value={form.time_limit} onChange={(e) => updateField('time_limit', Number(e.target.value))} className="field" min={1} max={15} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Memory Limit (MB)</label>
            <input type="number" value={form.memory_limit} onChange={(e) => updateField('memory_limit', Number(e.target.value))} className="field" min={16} max={1024} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Constraints</label>
            <textarea value={form.constraints} onChange={(e) => updateField('constraints', e.target.value)} className="field min-h-[60px]" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Input Format</label>
            <textarea value={form.input_format} onChange={(e) => updateField('input_format', e.target.value)} className="field min-h-[60px]" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Output Format</label>
            <textarea value={form.output_format} onChange={(e) => updateField('output_format', e.target.value)} className="field min-h-[60px]" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Supported Languages</label>
          <div className="flex flex-wrap gap-3">
            {LANGUAGES.map((lang) => (
              <label key={lang.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.languages.includes(lang.id)} onChange={() => toggleLanguage(lang.id)} className="rounded border-slate-300" />
                {lang.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Sample Test Cases</label>
            <button type="button" onClick={() => addTestCase('sample_test_cases', true)} className="text-xs font-bold text-emerald-800 hover:text-emerald-600">
              <Plus className="mr-1 inline h-3 w-3" /> Add Sample
            </button>
          </div>
          <div className="mt-2 space-y-3">
            {form.sample_test_cases.map((tc, i) => (
              <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Sample {i + 1}</span>
                  <button onClick={() => removeTestCase('sample_test_cases', i)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Input</label>
                    <textarea value={tc.input} onChange={(e) => updateTestCase('sample_test_cases', i, 'input', e.target.value)} className="field mt-0.5 font-mono text-xs min-h-[40px]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Output</label>
                    <textarea value={tc.output} onChange={(e) => updateTestCase('sample_test_cases', i, 'output', e.target.value)} className="field mt-0.5 font-mono text-xs min-h-[40px]" />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-xs font-semibold text-slate-600">Explanation</label>
                  <textarea value={tc.explanation} onChange={(e) => updateTestCase('sample_test_cases', i, 'explanation', e.target.value)} className="field mt-0.5 text-xs min-h-[40px]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Hidden Test Cases</label>
            <button type="button" onClick={() => addTestCase('hidden_test_cases', false)} className="text-xs font-bold text-emerald-800 hover:text-emerald-600">
              <Plus className="mr-1 inline h-3 w-3" /> Add Test Case
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-2">At least one hidden test case is required.</p>
          <div className="space-y-3">
            {form.hidden_test_cases.map((tc, i) => (
              <div key={i} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Hidden Case {i + 1}</span>
                  <button onClick={() => removeTestCase('hidden_test_cases', i)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Input</label>
                    <textarea value={tc.input} onChange={(e) => updateTestCase('hidden_test_cases', i, 'input', e.target.value)} className="field mt-0.5 font-mono text-xs min-h-[40px]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Output</label>
                    <textarea value={tc.output} onChange={(e) => updateTestCase('hidden_test_cases', i, 'output', e.target.value)} className="field mt-0.5 font-mono text-xs min-h-[40px]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Starter Code</label>
          <p className="text-xs text-slate-500 mb-2">Optional boilerplate code shown to students for each language.</p>
          <div className="space-y-3">
            {LANGUAGES.map((lang) => (
              <div key={lang.id}>
                <label className="text-xs font-bold text-slate-600">{lang.label}</label>
                <textarea
                  value={form.starter_code[lang.id] || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, starter_code: { ...prev.starter_code, [lang.id]: e.target.value } }))}
                  className="field mt-0.5 min-h-[80px] font-mono text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : isEdit ? 'Update Problem' : 'Create Problem'}
          </button>
        </div>
      </section>
    </section>
  );
}
