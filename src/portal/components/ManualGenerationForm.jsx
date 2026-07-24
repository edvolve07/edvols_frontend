import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, Minus, Plus, Search, Sparkles, User, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';

const concepts = [
  'All Concepts',
  'Percentages',
  'Profit and Loss',
  'Ratio and Proportion',
  'Time and Work',
  'Time, Speed and Distance',
  'Number System',
  'Simplification',
  'Averages',
  'Mixtures and Allegations',
  'Permutation and Combination',
  'Probability',
  'Simple Interest',
  'Compound Interest',
  'Data Interpretation',
  'Logical Reasoning',
  'Verbal Ability',
  'Coding-Decoding',
  'Blood Relations',
  'Seating Arrangement',
  'Puzzles',
];

const singleConceptCount = concepts.length - 1;

export default function ManualGenerationForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [individualStudents, setIndividualStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [targetAudience, setTargetAudience] = useState('all');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [form, setForm] = useState({
    title: '',
    concept: 'All Concepts',
    difficulty: 'Mixed',
    perConcept: 5,
    totalQuestions: 30,
    duration_minutes: 60,
    marks_per_question: 1,
    negative_marks: 0.25,
    passing_marks: 20,
    start_time: '',
    end_time: '',
    status: 'draft',
    generation_mode: 'fast',
    file: null,
  });

  useEffect(() => {
    apiFetch('/admin/departments')
      .then((data) => setDepartments(data.departments || []))
      .catch(() => {});
    apiFetch('/auth/me')
      .then((data) => {
        const role = data.user?.role || data.role;
        setUserRole(role);
        if (role === 'master_admin') setTargetAudience('individual');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (targetAudience === 'individual') {
      const params = studentSearch ? `?search=${encodeURIComponent(studentSearch)}` : '';
      apiFetch(`/admin/individual-students${params}`)
        .then((data) => setIndividualStudents(data.students || []))
        .catch(() => {});
    }
  }, [targetAudience, studentSearch]);

  const questionCount = useMemo(
    () => (form.concept === 'All Concepts' ? form.perConcept * singleConceptCount : form.totalQuestions),
    [form.concept, form.perConcept, form.totalQuestions],
  );

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function step(key, delta, min = 1) {
    setField(key, Math.max(min, Number(form[key]) + delta));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('title', form.title.trim());
      payload.append('concept', form.concept);
      payload.append('difficulty', form.difficulty);
      payload.append('question_count', String(questionCount));
      payload.append('questionCount', String(questionCount));

      if (form.concept === 'All Concepts') {
        payload.append('questions_per_concept', String(form.perConcept));
        payload.append('questionsPerConcept', String(form.perConcept));
      } else {
        payload.append('total_questions', String(form.totalQuestions));
        payload.append('totalQuestions', String(form.totalQuestions));
      }

      payload.append('duration_minutes', String(form.duration_minutes));
      payload.append('durationMinutes', String(form.duration_minutes));
      payload.append('marks_per_question', String(form.marks_per_question));
      payload.append('marksPerQuestion', String(form.marks_per_question));
      payload.append('negative_marks', String(form.negative_marks));
      payload.append('negativeMarks', String(form.negative_marks));
      payload.append('passing_marks', String(form.passing_marks));
      payload.append('passingMarks', String(form.passing_marks));
      payload.append('status', form.status);
      payload.append('generation_mode', form.generation_mode);
      payload.append('target_audience', targetAudience);
      if (targetAudience === 'department' && selectedDepartments.length) {
        payload.append('department_ids', JSON.stringify(selectedDepartments));
      }
      if (targetAudience === 'individual' && selectedStudentIds.length) {
        payload.append('assigned_student_ids', JSON.stringify(selectedStudentIds));
      }

      if (form.start_time) {
        const [datePart, timePart] = form.start_time.split('T');
        const [y, m, d] = datePart.split('-').map(Number);
        const [hh, mm] = timePart.split(':').map(Number);
        const startISO = new Date(y, m - 1, d, hh, mm).toISOString();
        payload.append('start_time', startISO);
        payload.append('startTime', startISO);
      }

      if (form.end_time) {
        const [datePart, timePart] = form.end_time.split('T');
        const [y, m, d] = datePart.split('-').map(Number);
        const [hh, mm] = timePart.split(':').map(Number);
        const endISO = new Date(y, m - 1, d, hh, mm).toISOString();
        payload.append('end_time', endISO);
        payload.append('endTime', endISO);
      }

      if (form.file) payload.append('file', form.file);

      const data = await apiFetch('/admin/assessments/generate', {
        method: 'POST',
        body: payload,
      });

      toast.success('Questions generated and saved as an assessment');
      navigate(`/admin/assessments/${data.assessment.id}/questions`);
    } catch (error) {
      toast.error(error.details?.join(', ') || error.message || 'Failed to generate assessment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-[85%] space-y-6 pb-8">
      <div className="page-hero">
        <p className="eyebrow">Assessment Builder</p>
        <h2 className="mt-2 text-3xl font-black text-slate-900">Create Aptitude Assessment</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure the assessment shape — the AI will generate editable MCQs for each topic.
        </p>
      </div>

      <div className="surface p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">Basic Details</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Assessment Title
            <input
              required
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              className="field mt-1"
              placeholder="e.g., Quantitative Aptitude - Batch 1"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Concept
            <select
              value={form.concept}
              onChange={(event) => setField('concept', event.target.value)}
              className="field mt-1"
            >
              {concepts.map((concept) => (
                <option key={concept}>{concept}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Difficulty
            <select
              value={form.difficulty}
              onChange={(event) => setField('difficulty', event.target.value)}
              className="field mt-1"
            >
              {['Easy', 'Medium', 'Hard', 'Mixed'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Status
            <select
              value={form.status}
              onChange={(event) => setField('status', event.target.value)}
              className="field mt-1"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Generation Mode
            <select
              value={form.generation_mode}
              onChange={(event) => setField('generation_mode', event.target.value)}
              className="field mt-1"
            >
              <option value="fast">Fast</option>
              <option value="ai">AI Enhanced</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-slate-900">
              {form.concept === 'All Concepts' ? 'Questions Per Concept' : 'Total Questions'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Total will be generated: {questionCount} questions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => step(form.concept === 'All Concepts' ? 'perConcept' : 'totalQuestions', -1)}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-14 text-center text-xl font-black text-slate-900">
              {form.concept === 'All Concepts' ? form.perConcept : form.totalQuestions}
            </span>
            <button
              type="button"
              onClick={() => step(form.concept === 'All Concepts' ? 'perConcept' : 'totalQuestions', 1)}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="surface p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">Scoring & Duration</h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['duration_minutes', 'Duration (minutes)', 1],
            ['marks_per_question', 'Marks / question', 0.25],
            ['negative_marks', 'Negative marks', 0.25],
            ['passing_marks', 'Passing marks', 0.25],
          ].map(([key, label, stepValue]) => (
            <label key={key} className="text-sm font-semibold text-slate-700">
              {label}
              <input
                type="number"
                min="0"
                step={stepValue}
                value={form[key]}
                onChange={(event) => setField(key, event.target.value)}
                className="field mt-1"
              />
            </label>
          ))}
          <label className="text-sm font-semibold text-slate-700">
            Start time
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(event) => setField('start_time', event.target.value)}
              className="field mt-1"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            End time
            <input
              type="datetime-local"
              value={form.end_time}
              onChange={(event) => setField('end_time', event.target.value)}
              className="field mt-1"
            />
          </label>
        </div>
      </div>

      <div className="surface p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">Target Audience</h3>
        <div className="flex flex-wrap gap-3">
          {userRole !== 'master_admin' && (
            <>
              <button
                type="button"
                onClick={() => { setTargetAudience('all'); setSelectedDepartments([]); setSelectedStudentIds([]); }}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  targetAudience === 'all'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="h-4 w-4" />
                All Students
              </button>
              <button
                type="button"
                onClick={() => { setTargetAudience('department'); setSelectedStudentIds([]); }}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  targetAudience === 'department'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Department-wise
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => { setTargetAudience('individual'); setSelectedDepartments([]); setStudentSearch(''); }}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
              targetAudience === 'individual'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="h-4 w-4" />
            Individual Students
          </button>
        </div>

        {targetAudience === 'department' && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Select Departments</p>
            {departments.length === 0 ? (
              <p className="text-sm text-slate-400">No departments found for your institution.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {departments.map((dept) => {
                  const checked = selectedDepartments.includes(dept.id);
                  return (
                    <label
                      key={dept.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                        checked
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedDepartments((prev) =>
                            checked ? prev.filter((id) => id !== dept.id) : [...prev, dept.id],
                          );
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {dept.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {targetAudience === 'individual' && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Select Individual Students</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            {individualStudents.length > 0 && (
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-emerald-700">{selectedStudentIds.length} / {individualStudents.length} student(s) selected</p>
                <button
                  type="button"
                  onClick={() => {
                    const allIds = individualStudents.map((s) => s._id);
                    const allSelected = allIds.length === selectedStudentIds.length && allIds.every((id) => selectedStudentIds.includes(id));
                    setSelectedStudentIds(allSelected ? [] : allIds);
                  }}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline"
                >
                  {individualStudents.length === selectedStudentIds.length ? 'Deselect All' : 'Select Everyone'}
                </button>
              </div>
            )}
            {individualStudents.length === 0 ? (
              <p className="text-sm text-slate-400">No individual students found.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200">
                {individualStudents.map((s) => {
                  const checked = selectedStudentIds.includes(s._id);
                  return (
                    <label
                      key={s._id}
                      className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-sm transition last:border-b-0 ${
                        checked
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedStudentIds((prev) =>
                            checked ? prev.filter((id) => id !== s._id) : [...prev, s._id],
                          );
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-2 text-xs text-slate-400">{s.email}</span>
                      </div>
                      {!s.is_active && <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">Inactive</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="surface p-6">
        <label className="block text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-800" />
            Optional source file (.pdf, .docx, .txt)
          </span>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(event) => setField('file', event.target.files?.[0] || null)}
            className="mt-2 w-full rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500 focus-ring cursor-pointer"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          disabled={loading}
          className="btn-primary gap-2 px-8 py-3 text-base"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? 'Generating questions...' : 'Generate Questions'}
        </button>
      </div>
    </form>
  );
}