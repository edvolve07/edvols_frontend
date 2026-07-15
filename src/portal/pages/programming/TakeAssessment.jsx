import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Loader2, CheckCircle2, Save, AlertTriangle, ClipboardCheck, Clock, FileText, ListChecks, Terminal, Trophy } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import CodeEditor from '../../components/CodeEditor';
import { DEFAULT_CODE, PROGRAMMING_LANGUAGES as LANGUAGES, pickDefaultLanguage } from '../../utils/programmingLanguages';

const DIFFICULTY_STYLES = {
  Easy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Medium: 'border-amber-200 bg-amber-50 text-amber-700',
  Hard: 'border-red-200 bg-red-50 text-red-700',
};

function splitConstraints(value) {
  return String(value || '')
    .split(/\n|,\s*(?=-?\d|[A-Za-z]|Only)/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatExampleInput(testCase) {
  return testCase.display_input || testCase.input || '(empty)';
}

function formatExampleOutput(testCase) {
  return testCase.display_output || testCase.output || '(empty)';
}

export default function TakeAssessment() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [codes, setCodes] = useState({});
  const [languages, setLanguages] = useState({});
  const [saving, setSaving] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [error, setError] = useState('');
  const saveTimerRef = useRef({});

  useEffect(() => {
    async function init() {
      try {
        const res = await apiFetch(`/api/programming-assessment/student/assessments/${assessmentId}/start`, { method: 'POST' });
        setAttempt(res.attempt);
        setAssessment(res.assessment);
        setProblems(res.problems);
        const initialCodes = {};
        const initialLangs = {};
        for (const p of res.problems) {
          const selectedLanguage = p.answer?.language || pickDefaultLanguage(p.languages || []);
          initialCodes[p.id] = p.answer?.code || p.starter_code?.[selectedLanguage] || DEFAULT_CODE[selectedLanguage] || '';
          initialLangs[p.id] = selectedLanguage;
        }
        setCodes(initialCodes);
        setLanguages(initialLangs);
      } catch {
        setError('Failed to load assessment');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [assessmentId]);

  const activeProblem = problems[activeIndex];

  function handleCodeChange(problemId, value) {
    setCodes((prev) => ({ ...prev, [problemId]: value }));
  }

  function handleLanguageChange(problemId, lang) {
    setLanguages((prev) => ({ ...prev, [problemId]: lang }));
    const problem = problems.find((p) => p.id === problemId);
    if (!codes[problemId] || codes[problemId].trim() === (problem?.answer?.code || '').trim()) {
      setCodes((prev) => ({
        ...prev,
        [problemId]: problem?.starter_code?.[lang] || DEFAULT_CODE[lang] || '',
      }));
    }
  }

  const autoSave = useCallback(async (problemId) => {
    if (!attempt) return;
    setSaving((prev) => ({ ...prev, [problemId]: true }));
    try {
      await apiFetch(`/api/programming-assessment/student/attempts/${attempt.id}/answers/${problemId}`, {
        method: 'PUT',
        body: JSON.stringify({ code: codes[problemId] || '', language: languages[problemId] || 'javascript' }),
      });
    } catch {
    } finally {
      setSaving((prev) => ({ ...prev, [problemId]: false }));
    }
  }, [attempt, codes, languages]);

  useEffect(() => {
    if (!attempt || !activeProblem) return;
    const timer = setTimeout(() => autoSave(activeProblem.id), 2000);
    return () => clearTimeout(timer);
  }, [attempt, activeProblem?.id, codes[activeProblem?.id], autoSave]);

  async function handleSaveNow() {
    if (!attempt || !activeProblem) return;
    await autoSave(activeProblem.id);
  }

  async function handleSubmit() {
    if (!window.confirm('Submit all answers? This action cannot be undone.')) return;
    if (!attempt) return;
    setSubmitting(true);
    setError('');
    try {
      for (const p of problems) {
        await apiFetch(`/api/programming-assessment/student/attempts/${attempt.id}/answers/${p.id}`, {
          method: 'PUT',
          body: JSON.stringify({ code: codes[p.id] || '', language: languages[p.id] || 'javascript' }),
        });
      }
      const res = await apiFetch(`/api/programming-assessment/student/attempts/${attempt.id}/submit`, { method: 'POST' });
      setSubmitResult(res);
    } catch (err) {
      setError(err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSkeleton label="Loading assessment" />;

  if (error && !attempt) {
    return (
      <section className="page-stack mx-auto max-w-7xl">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </section>
    );
  }

  if (submitResult) {
    return (
      <section className="page-stack mx-auto max-w-7xl">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-3 text-xl font-bold text-emerald-800">Assessment Submitted!</h2>
          <p className="mt-1 text-emerald-600">
            Score: {submitResult.attempt.obtained_marks}/{submitResult.attempt.total_marks}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate(`/programming/assessments/results/${submitResult.attempt.id}`)}
              className="btn-primary"
            >
              View Results
            </button>
            <button
              onClick={() => navigate('/programming/assessments')}
              className="btn-secondary"
            >
              Back to Assessments
            </button>
          </div>
        </div>
      </section>
    );
  }

  const answeredCount = problems.filter((problem) => codes[problem.id]?.trim()).length;
  const progressPercent = problems.length ? Math.round((answeredCount / problems.length) * 100) : 0;
  const constraints = splitConstraints(activeProblem?.constraints);
  const selectedLanguage = languages[activeProblem?.id] || 'javascript';
  const languageLabel = LANGUAGES.find((language) => language.id === selectedLanguage)?.label || selectedLanguage;

  return (
    <section className="flex min-h-[calc(100vh-76px)] flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/programming/assessments"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100"
            title="Back to contests"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-700" />
              <h1 className="truncate text-sm font-black text-slate-900">{assessment?.title || 'Coding Contest'}</h1>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {answeredCount}/{problems.length} answered / {progressPercent}% complete
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSaveNow}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
          >
            <Save className="h-4 w-4" />
            {saving[activeProblem?.id] ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary h-9 rounded-lg px-4 text-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {submitting ? 'Submitting...' : 'Submit All'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="grid flex-1 gap-3 lg:min-h-0 lg:grid-cols-[280px_minmax(360px,0.85fr)_minmax(520px,1.15fr)]">
        <aside className="flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card lg:min-h-0">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-700" />
                <p className="text-sm font-black text-slate-900">Problems</p>
              </div>
              <span className="text-xs font-black text-slate-400">{problems.length}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {problems.map((problem, index) => {
              const selected = index === activeIndex;
              const answered = Boolean(codes[problem.id]?.trim());
              return (
                <button
                  key={problem.id}
                  onClick={() => setActiveIndex(index)}
                  className={`mb-2 w-full rounded-lg border px-3 py-3 text-left transition ${
                    selected
                      ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                      : answered
                        ? 'border-emerald-100 bg-white hover:bg-emerald-50/50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-black text-slate-900">{index + 1}. {problem.title}</p>
                    {answered ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : null}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-black ${DIFFICULTY_STYLES[problem.difficulty] || ''}`}>
                      {problem.difficulty}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{problem.marks} marks</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-card lg:min-h-0">
          <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-700" />
              <p className="text-sm font-black text-slate-900">Statement</p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {activeIndex + 1} / {problems.length}
            </span>
          </div>

          {activeProblem ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">{activeIndex + 1}. {activeProblem.title}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${DIFFICULTY_STYLES[activeProblem.difficulty] || ''}`}>
                      {activeProblem.difficulty}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{activeProblem.concept}</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{activeProblem.marks} marks</span>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
                  <div className="flex items-center gap-1 text-xs font-black text-emerald-800">
                    <Clock className="h-3.5 w-3.5" />
                    {activeProblem.time_limit}s
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">{activeProblem.memory_limit}MB</p>
                </div>
              </div>

              <div className="mt-6 whitespace-pre-wrap text-[15px] font-medium leading-7 text-slate-700">
                {activeProblem.description}
              </div>

              {constraints.length ? (
                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
                    <ListChecks className="h-4 w-4 text-emerald-700" />
                    Constraints
                  </div>
                  <ul className="space-y-2 text-sm font-semibold text-slate-700">
                    {constraints.map((constraint) => (
                      <li key={constraint} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                          {constraint}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {activeProblem.sample_test_cases?.length ? (
                <div className="mt-6 space-y-4">
                  {activeProblem.sample_test_cases.map((testCase, index) => (
                    <div key={index}>
                      <p className="text-sm font-black text-slate-900">Example {index + 1}:</p>
                      <div className="mt-2 border-l-4 border-emerald-200 pl-4">
                        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-700">
{`Input: ${formatExampleInput(testCase)}
Output: ${formatExampleOutput(testCase)}${testCase.explanation ? `\nExplanation: ${testCase.explanation}` : ''}`}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card lg:min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-700" />
              <p className="text-sm font-black text-slate-900">Code</p>
              <span className="text-xs font-bold text-slate-400">{languageLabel}</span>
            </div>
            {activeProblem ? (
              <select
                value={selectedLanguage}
                onChange={(event) => handleLanguageChange(activeProblem.id, event.target.value)}
                className="h-9 rounded-lg border border-emerald-100 bg-white px-3 text-sm font-bold text-emerald-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              >
                {(activeProblem.languages || ['javascript']).map((lang) => {
                  const language = LANGUAGES.find((item) => item.id === lang);
                  return <option key={lang} value={lang}>{language?.label || lang}</option>;
                })}
              </select>
            ) : null}
          </div>

          {activeProblem ? (
            <div className="min-h-0 flex-1">
              <CodeEditor
                value={codes[activeProblem.id] || ''}
                onChange={(value) => handleCodeChange(activeProblem.id, value)}
                language={selectedLanguage}
                minHeight={650}
                className="h-full rounded-none border-0 shadow-none"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
