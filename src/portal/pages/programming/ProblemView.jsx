import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, BookOpen, Terminal, Beaker, ListChecks, ChevronDown, ChevronRight, FileText, History, GraduationCap, MessageSquare, Send, Lock, Lightbulb, Tag, Building2 } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiFetch } from '../../utils/api';
import CodeEditor from '../../components/CodeEditor';
import { DEFAULT_CODE, PROGRAMMING_LANGUAGES as LANGUAGES, pickDefaultLanguage } from '../../utils/programmingLanguages';

const STATUS_ICONS = {
  accepted: CheckCircle2,
  wrong_answer: XCircle,
  time_limit_exceeded: Clock,
  runtime_error: AlertTriangle,
  compilation_error: AlertTriangle,
};

const STATUS_LABELS = {
  accepted: 'Accepted',
  wrong_answer: 'Wrong Answer',
  time_limit_exceeded: 'Time Limit Exceeded',
  runtime_error: 'Runtime Error',
  compilation_error: 'Compilation Error',
  pending: 'Pending',
  running: 'Running',
};

const DIFFICULTY_STYLES = {
  Easy: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Hard: 'bg-red-50 text-red-700 border-red-200',
};

function cleanDescription(text) {
  const markers = [
    /\n{1,2}\*\*Input\s*Format:?\s*\*\*/,
    /\n{1,2}\*\*Output\s*Format:?\s*\*\*/,
    /\n{1,2}\*\*Constraints:?\s*\*\*/,
  ];
  let earliest = text.length;
  for (const m of markers) {
    const idx = text.search(m);
    if (idx !== -1 && idx < earliest) earliest = idx;
  }
  return text.slice(0, earliest).trim();
}

function SectionCard({ icon: Icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-emerald-50/50"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-emerald-900">{title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-emerald-500" /> : <ChevronRight className="h-4 w-4 text-emerald-500" />}
      </button>
      {open && <div className="border-t border-emerald-50 px-5 py-4">{children}</div>}
    </div>
  );
}

function formatShortDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function StatusPill({ status }) {
  return (
    <span className={`rounded-md px-2 py-1 text-[11px] font-black ${
      status === 'accepted'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-red-50 text-red-700'
    }`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

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

export default function ProblemView() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [runningCustom, setRunningCustom] = useState(false);
  const [result, setResult] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [customInput, setCustomInput] = useState('');
  const [customExpected, setCustomExpected] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [editorial, setEditorial] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [discussionForm, setDiscussionForm] = useState({
    type: 'discussion',
    title: '',
    body: '',
    shareCode: false,
  });
  const [postingDiscussion, setPostingDiscussion] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    setProblem(null);
    Promise.all([
      apiFetch(`/programming/student/problems/${id}`),
      apiFetch(`/programming/student/problems/${id}/submissions`),
      apiFetch(`/programming/student/problems/${id}/editorial`),
      apiFetch(`/programming/student/problems/${id}/discussions`),
    ])
      .then(([problemData, submissionData, editorialData, discussionData]) => {
        if (cancelled) return;
        setProblem(problemData.problem);
        setSubmissions(submissionData.submissions || problemData.problem.latest_submissions || []);
        setEditorial(editorialData.editorial || null);
        setDiscussions(discussionData.discussions || []);
        const lang = pickDefaultLanguage(problemData.problem.languages);
        setLanguage(lang);
        setCode(problemData.problem.starter_code?.[lang] || DEFAULT_CODE[lang] || '');
        const sample = problemData.problem.sample_test_cases?.[0];
        setCustomInput(sample?.input || '');
        setCustomExpected(sample?.output || '');
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load problem');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleLanguageChange(lang) {
    setLanguage(lang);
    setCode(problem?.starter_code?.[lang] || DEFAULT_CODE[lang] || '');
  }

  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);
    setError('');
    try {
      const data = await apiFetch(`/programming/student/problems/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ code, language }),
      });
      setResult(data.submission);
      const submissionData = await apiFetch(`/programming/student/problems/${id}/submissions`);
      setSubmissions(submissionData.submissions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCustomRun() {
    setRunningCustom(true);
    setRunResult(null);
    setError('');
    try {
      const data = await apiFetch(`/programming/student/problems/${id}/run`, {
        method: 'POST',
        body: JSON.stringify({
          code,
          language,
          input: customInput,
          expected_output: customExpected,
        }),
      });
      setRunResult(data.run);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunningCustom(false);
    }
  }

  async function handlePostDiscussion(event) {
    event.preventDefault();
    setPostingDiscussion(true);
    setError('');
    try {
      const data = await apiFetch(`/programming/student/problems/${id}/discussions`, {
        method: 'POST',
        body: JSON.stringify({
          type: discussionForm.type,
          title: discussionForm.title,
          body: discussionForm.body,
          language,
          code: discussionForm.shareCode ? code : '',
        }),
      });
      setDiscussions((items) => [data.discussion, ...items]);
      setDiscussionForm({ type: 'discussion', title: '', body: '', shareCode: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setPostingDiscussion(false);
    }
  }

  if (!problem && error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-3 text-sm font-bold text-red-700">Failed to load problem</p>
        <p className="mt-1 text-xs text-red-500">{error}</p>
      </div>
    );
  }

  if (!problem) return <LoadingSkeleton label="Loading problem" />;

  const visibleSolutions = discussions.filter((item) => item.type === 'solution');
  const visibleQuestions = discussions.filter((item) => item.type !== 'solution');
  const languageLabel = LANGUAGES.find((item) => item.id === language)?.label || language;
  const resultDetails = result?.test_results?.length ? result.test_results : runResult?.test_results || [];
  const resultSummary = result || runResult;
  const problemTitle = `${problem.problem_number ? `${problem.problem_number}. ` : ''}${problem.title}`;
  const problemState = problem.solved ? 'Solved' : problem.attempted ? 'Attempted' : 'Not attempted';
  const constraints = splitConstraints(problem.constraints);

  const tabs = [
    { id: 'description', label: 'Description', icon: BookOpen },
    { id: 'editorial', label: 'Editorial', icon: GraduationCap },
    { id: 'solutions', label: 'Solutions', icon: MessageSquare },
    { id: 'submissions', label: 'Submissions', icon: History },
  ];

  return (
    <section className="flex min-h-[calc(100vh-76px)] flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/programming/practice"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100"
            title="Back to problem list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link
            to="/programming/practice"
            className="hidden text-sm font-black text-slate-800 transition hover:text-emerald-800 sm:inline"
          >
            Problem List
          </Link>
          <span className="hidden h-5 w-px bg-slate-200 sm:block" />
          <p className="min-w-0 truncate text-sm font-bold text-slate-600">{problemTitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="h-9 rounded-lg border border-emerald-100 bg-white px-3 text-sm font-bold text-emerald-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          >
            {problem.languages.map((lang) => {
              const l = LANGUAGES.find((item) => item.id === lang);
              return <option key={lang} value={lang}>{l?.label || lang}</option>;
            })}
          </select>
          <button
            onClick={handleCustomRun}
            disabled={runningCustom || !code.trim()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {runningCustom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !code.trim()}
            className="btn-primary h-9 rounded-lg px-4 text-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Submit
          </button>
        </div>
      </div>

      <div className="grid flex-1 gap-3 lg:min-h-0 lg:grid-cols-[minmax(360px,0.95fr)_minmax(520px,1.05fr)]">
        <div className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-card lg:min-h-0">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-emerald-100 bg-emerald-50/50 px-2 py-2">
            {tabs.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-black transition ${
                  activeTab === tabId
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-500 hover:bg-white/70 hover:text-emerald-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {activeTab === 'description' ? (
              <div className="space-y-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl font-black text-slate-950">{problemTitle}</h1>
                      <span className="text-sm font-bold text-slate-500">{problemState}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${DIFFICULTY_STYLES[problem.difficulty] || ''}`}>
                        {problem.difficulty}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        <Tag className="h-3.5 w-3.5" />
                        Topics
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {problem.companies_locked ? <Lock className="h-3.5 w-3.5 text-amber-600" /> : <Building2 className="h-3.5 w-3.5" />}
                        Companies
                      </span>
                      {problem.hints?.length ? (
                        <details className="group">
                          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Hint
                          </summary>
                          <div className="mt-2 max-w-md rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold leading-6 text-emerald-900 shadow-sm">
                            {problem.hints[0]}
                          </div>
                        </details>
                      ) : null}
                    </div>
                    {(problem.tags?.length || problem.company_tags?.length) ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(problem.tags || []).map((item) => (
                          <span key={item} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{item}</span>
                        ))}
                        {(problem.company_tags || []).map((item) => (
                          <span key={item} className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">{item}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
                    <p className="text-xs font-black text-emerald-800">{problem.acceptance_rate || 0}% Acceptance</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">{problem.time_limit}s / {problem.memory_limit}MB</p>
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-[15px] font-medium leading-7 text-slate-700">
                  {cleanDescription(problem.description)}
                </div>

                {(problem.input_format || problem.output_format) ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {problem.input_format ? (
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/45 p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-700">
                          <Terminal className="h-3.5 w-3.5" />
                          Input Format
                        </div>
                        <p className="text-sm leading-6 text-slate-700">{problem.input_format}</p>
                      </div>
                    ) : null}
                    {problem.output_format ? (
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/45 p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-700">
                          <Terminal className="h-3.5 w-3.5" />
                          Output Format
                        </div>
                        <p className="text-sm leading-6 text-slate-700">{problem.output_format}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-4">
                  {problem.sample_test_cases.map((tc, i) => (
                    <div key={i}>
                      <p className="text-sm font-black text-slate-900">Example {i + 1}:</p>
                      <div className="mt-2 border-l-4 border-emerald-200 pl-4">
                        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-mono text-sm leading-6 text-slate-700">
{`Input: ${formatExampleInput(tc)}
Output: ${formatExampleOutput(tc)}${tc.explanation ? `\nExplanation: ${tc.explanation}` : ''}`}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>

                {constraints.length ? (
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
                      <ListChecks className="h-4 w-4 text-emerald-700" />
                      Constraints
                    </div>
                    <ul className="space-y-2 text-sm font-semibold text-slate-700">
                      {constraints.map((constraint) => (
                        <li key={constraint} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                            {constraint.trim()}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {problem.follow_up ? (
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    <span className="font-black text-slate-900">Follow-up:</span> {problem.follow_up}
                  </p>
                ) : null}
              </div>
            ) : null}

            {activeTab === 'editorial' ? (
              <div className="space-y-5 text-sm leading-6 text-slate-700">
                {editorial?.is_generated_fallback ? (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                    <FileText className="h-3.5 w-3.5" />
                    Draft guide until admin editorial is added
                  </div>
                ) : null}
                {editorial ? (
                  <>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Overview</p>
                      <p className="mt-1 whitespace-pre-wrap">{editorial.overview}</p>
                    </div>
                    {editorial.brute_force ? (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Brute Force</p>
                        <p className="mt-1 whitespace-pre-wrap">{editorial.brute_force}</p>
                      </div>
                    ) : null}
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Optimal Approach</p>
                      <p className="mt-1 whitespace-pre-wrap">{editorial.optimal_approach}</p>
                    </div>
                    {editorial.complexity ? (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Complexity</p>
                        <p className="mt-1 whitespace-pre-wrap">{editorial.complexity}</p>
                      </div>
                    ) : null}
                    {editorial.pitfalls?.length ? (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Common Pitfalls</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {editorial.pitfalls.map((pitfall) => <li key={pitfall}>{pitfall}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center font-semibold text-slate-500">
                    No editorial available yet.
                  </p>
                )}
              </div>
            ) : null}

            {activeTab === 'solutions' ? (
              <div className="space-y-5">
                <form onSubmit={handlePostDiscussion} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={discussionForm.type}
                      onChange={(e) => setDiscussionForm((form) => ({ ...form, type: e.target.value }))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      <option value="discussion">Question</option>
                      <option value="solution">Solution</option>
                    </select>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={discussionForm.shareCode}
                        onChange={(e) => setDiscussionForm((form) => ({ ...form, shareCode: e.target.checked }))}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Share current code
                    </label>
                  </div>
                  <input
                    value={discussionForm.title}
                    onChange={(e) => setDiscussionForm((form) => ({ ...form, title: e.target.value }))}
                    placeholder="Title"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <textarea
                    value={discussionForm.body}
                    onChange={(e) => setDiscussionForm((form) => ({ ...form, body: e.target.value }))}
                    placeholder="Ask a question or explain your approach"
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={postingDiscussion || !discussionForm.title.trim() || !discussionForm.body.trim()}
                    className="btn-primary rounded-lg px-4 py-2 text-sm"
                  >
                    {postingDiscussion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Post
                  </button>
                </form>

                {[...visibleSolutions, ...visibleQuestions].length ? [...visibleSolutions, ...visibleQuestions].map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                          {item.type === 'solution' ? 'Solution' : 'Question'} by {item.author_name} {formatShortDate(item.created_at)}
                        </p>
                      </div>
                      {item.mine ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">Mine</span> : null}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.body}</p>
                    {item.code ? <pre className="mt-3 max-h-52 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{item.code}</pre> : null}
                  </div>
                )) : (
                  <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                    No institution-private solutions yet.
                  </p>
                )}
              </div>
            ) : null}

            {activeTab === 'submissions' ? (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                {submissions.length ? submissions.map((submission) => (
                  <div key={submission.id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={submission.status} />
                      <span className="font-bold text-slate-700">{LANGUAGES.find((item) => item.id === submission.language)?.label || submission.language}</span>
                      <span className="text-xs font-semibold text-slate-400">{formatShortDate(submission.submitted_at)}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-500">
                      {submission.passed_test_cases}/{submission.total_test_cases} passed
                      {submission.execution_time_ms ? ` / ${submission.execution_time_ms}ms` : ''}
                    </div>
                  </div>
                )) : (
                  <p className="px-4 py-10 text-center text-sm font-semibold text-slate-500">No submissions yet.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid min-h-[720px] gap-1 lg:min-h-0 lg:grid-rows-[minmax(420px,1fr)_minmax(230px,0.38fr)]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <Terminal className="h-4 w-4 text-emerald-700" />
                  Code
                </div>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">{languageLabel}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>Saved</span>
                <span>Ln 1, Col 1</span>
              </div>
            </div>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              minHeight={560}
              className="flex-1 rounded-none border-0 shadow-none"
            />
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-black text-emerald-800 shadow-sm">
                  <Beaker className="h-4 w-4" />
                  Testcase
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm font-bold text-slate-500">
                  Test Result
                </span>
              </div>
              {resultSummary ? <StatusPill status={resultSummary.status} /> : null}
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
              <div className="border-b border-slate-100 p-4 lg:border-b-0 lg:border-r">
                <div className="grid gap-3">
                  <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Input
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      rows={4}
                      className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Expected Output
                    <textarea
                      value={customExpected}
                      onChange={(e) => setCustomExpected(e.target.value)}
                      rows={3}
                      className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4">
                {error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="h-4 w-4" />
                      Error
                    </div>
                    <p className="mt-1">{error}</p>
                  </div>
                ) : null}

                {resultSummary ? (
                  <div className="space-y-3">
                    <div className={`rounded-lg border p-3 ${
                      resultSummary.status === 'accepted'
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-red-200 bg-red-50'
                    }`}>
                      <p className={`font-black ${resultSummary.status === 'accepted' ? 'text-emerald-800' : 'text-red-800'}`}>
                        {STATUS_LABELS[resultSummary.status] || resultSummary.status}
                      </p>
                      <p className="text-xs font-semibold text-slate-600">
                        Passed {resultSummary.passed_test_cases}/{resultSummary.total_test_cases}
                        {resultSummary.execution_time_ms ? ` / ${resultSummary.execution_time_ms}ms` : ''}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {resultDetails.slice(0, 4).map((tr, i) => (
                        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                          <div className="flex items-center gap-2 font-bold text-slate-700">
                            {tr.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            Case {i + 1}
                          </div>
                          {tr.error ? <pre className="mt-2 whitespace-pre-wrap rounded-md bg-red-50 p-2 font-mono text-red-700">{tr.error}</pre> : null}
                          {tr.expected_output || tr.actual_output ? (
                            <div className="mt-2 grid gap-2">
                              {tr.expected_output ? <pre className="rounded-md bg-slate-50 p-2 font-mono">Expected: {tr.expected_output}</pre> : null}
                              {tr.actual_output ? <pre className="rounded-md bg-slate-50 p-2 font-mono">Output: {tr.actual_output}</pre> : null}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[160px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
                    <div>
                      <Beaker className="mx-auto h-7 w-7 text-slate-300" />
                      <p className="mt-2 text-sm font-bold text-slate-500">Run code to see test results</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
