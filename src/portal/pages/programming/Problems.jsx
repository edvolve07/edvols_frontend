import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Code2, Search, ChevronRight, BookOpen, AlertTriangle, ArrowLeft, CheckCircle2, Filter } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiFetch } from '../../utils/api';

const DIFFICULTY_STYLES = {
  Easy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Medium: 'border-amber-200 bg-amber-50 text-amber-700',
  Hard: 'border-red-200 bg-red-50 text-red-700',
};

export default function Problems() {
  const { topicName } = useParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [solved, setSolved] = useState('');
  const [tag, setTag] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setData(null);
    const params = new URLSearchParams();
    params.set('limit', '100');
    if (topicName) {
      params.set('concept', topicName);
    }
    if (difficulty) params.set('difficulty', difficulty);
    if (solved) params.set('solved', solved);
    if (tag) params.set('tag', tag);
    if (company) params.set('company', company);
    const query = params.toString();
    apiFetch(`/programming/student/problems${query ? `?${query}` : ''}`)
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load problems'));
  }, [topicName, difficulty, solved, tag, company]);

  const problems = data?.problems || [];
  const filtered = search
    ? problems.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    : problems;

  if (!data && !error) return <LoadingSkeleton label="Loading problems" />;

  return (
    <section className="page-stack max-w-5xl mx-auto pb-16">
      <Link
        to="/programming/practice"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-emerald-700 transition hover:text-emerald-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to topics
      </Link>

      <div className="page-hero flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Programming Practice</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">{topicName}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Practice {topicName} coding problems
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select
            value={solved}
            onChange={(e) => setSolved(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All status</option>
            <option value="true">Solved</option>
            <option value="false">Unsolved</option>
          </select>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All topics</option>
            {(data?.filters?.tags || []).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All companies</option>
            {(data?.filters?.company_tags || []).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-3 text-sm font-bold text-red-700">Failed to load problems</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {search ? 'No problems match your search.' : 'No coding problems available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((problem) => (
            <Link
              key={problem.id}
              to={`/programming/practice/problems/${problem.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-card-hover hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Code2 className="h-5 w-5" />
                </div>
                <span className={`shrink-0 rounded-md border px-2.5 py-0.5 text-xs font-bold ${DIFFICULTY_STYLES[problem.difficulty] || ''}`}>
                  {problem.difficulty}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-start gap-2">
                  <p className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {problem.problem_number ? `${problem.problem_number}. ` : ''}{problem.title}
                  </p>
                  {problem.solved ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">{problem.concept}</p>
                {(problem.tags?.length || problem.company_tags?.length) ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(problem.tags || []).slice(0, 2).map((item) => (
                      <span key={item} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        {item}
                      </span>
                    ))}
                    {(problem.company_tags || []).slice(0, 1).map((item) => (
                      <span key={item} className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">
                  {problem.solved ? 'Solved' : problem.attempted ? 'Attempted' : `${problem.acceptance_rate || 0}% acceptance`}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-800 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
