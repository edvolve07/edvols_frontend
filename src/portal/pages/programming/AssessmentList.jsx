import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Play,
  Trophy,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';

function formatDate(value) {
  if (!value) return 'Open';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function getContestState(assessment) {
  if (!assessment.attempt) return { label: 'Ready', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (assessment.attempt.status === 'submitted') {
    return { label: 'Submitted', tone: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
  return { label: 'In progress', tone: 'bg-amber-50 text-amber-700 border-amber-200' };
}

export default function AssessmentList() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    apiFetch('/api/programming-assessment/student/assessments').then(setData);
  }, []);

  async function handleStart(id) {
    setStarting(id);
    try {
      const res = await apiFetch(`/api/programming-assessment/student/assessments/${id}/start`, { method: 'POST' });
      navigate(`/programming/assessments/${id}`, { state: { attempt: res.attempt, problems: res.problems, assessment: res.assessment } });
    } catch {
      setStarting(null);
    }
  }

  const assessments = data?.assessments || [];
  const stats = useMemo(() => {
    const completed = assessments.filter((assessment) => assessment.attempt?.status === 'submitted').length;
    const inProgress = assessments.filter((assessment) => assessment.attempt && assessment.attempt.status !== 'submitted').length;
    const totalProblems = assessments.reduce((sum, assessment) => sum + (assessment.problem_count || 0), 0);
    return { completed, inProgress, totalProblems };
  }, [assessments]);
  const featured = assessments.find((assessment) => assessment.attempt && assessment.attempt.status !== 'submitted')
    || assessments.find((assessment) => !assessment.attempt)
    || assessments[0];

  if (!data) return <LoadingSkeleton label="Loading contests" />;

  return (
    <section className="page-stack mx-auto max-w-7xl pb-16">
      <Link
        to="/programming"
        className="inline-flex w-fit items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Programming
      </Link>

      <div className="page-hero flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Coding Contests</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Contest Lobby</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Pick a timed multi-problem coding test, resume active attempts, and review submitted scores.
          </p>
        </div>
        <div className="grid min-w-[280px] grid-cols-3 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
          <div className="border-r border-emerald-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Available</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{assessments.length}</p>
          </div>
          <div className="border-r border-emerald-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Active</p>
            <p className="mt-1 text-2xl font-black text-amber-600">{stats.inProgress}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Done</p>
            <p className="mt-1 text-2xl font-black text-emerald-700">{stats.completed}</p>
          </div>
        </div>
      </div>

      {assessments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-lg font-semibold text-slate-500">No contests available yet</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-4">
            {featured ? (
              <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <span className={`rounded-md border px-2.5 py-1 text-xs font-black ${getContestState(featured).tone}`}>
                    {getContestState(featured).label}
                  </span>
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">Featured Contest</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">{featured.title}</h2>
                {featured.description ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{featured.description}</p>
                ) : null}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-400">Problems</p>
                    <p className="mt-1 text-lg font-black text-slate-900">{featured.problem_count}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-400">Score</p>
                    <p className="mt-1 text-lg font-black text-slate-900">
                      {featured.attempt?.status === 'submitted'
                        ? `${featured.attempt.obtained_marks}/${featured.attempt.total_marks}`
                        : '--'}
                    </p>
                  </div>
                </div>
                {featured.attempt?.status === 'submitted' ? (
                  <button
                    onClick={() => navigate(`/programming/assessments/results/${featured.attempt.id}`)}
                    className="btn-primary mt-5 w-full justify-center rounded-xl"
                  >
                    <FileText className="h-4 w-4" />
                    View Result
                  </button>
                ) : featured.attempt ? (
                  <button
                    onClick={() => navigate(`/programming/assessments/${featured.id}`, { state: {} })}
                    className="btn-primary mt-5 w-full justify-center rounded-xl"
                  >
                    <Play className="h-4 w-4" />
                    Resume Contest
                  </button>
                ) : (
                  <button
                    onClick={() => handleStart(featured.id)}
                    disabled={starting === featured.id}
                    className="btn-primary mt-5 w-full justify-center rounded-xl"
                  >
                    <Play className="h-4 w-4" />
                    {starting === featured.id ? 'Starting...' : 'Start Contest'}
                  </button>
                )}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-black text-slate-900">Problem Pool</p>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalProblems}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-black text-slate-900">In Progress</p>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.inProgress}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-black text-slate-900">Completed</p>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.completed}</p>
              </div>
            </div>
          </aside>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
              <span>Contest</span>
              <span className="hidden sm:block">Problems</span>
              <span>Action</span>
            </div>
            <div className="divide-y divide-slate-100">
              {assessments.map((assessment) => {
                const state = getContestState(assessment);
                return (
                  <div key={assessment.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-black text-slate-900">{assessment.title}</h3>
                        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-black ${state.tone}`}>
                          {state.label}
                        </span>
                      </div>
                      {assessment.description ? (
                        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{assessment.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        Created {formatDate(assessment.created_at)}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-black text-slate-900">{assessment.problem_count}</p>
                      <p className="text-xs font-semibold text-slate-400">problems</p>
                    </div>
                    <div className="flex justify-end">
                      {assessment.attempt?.status === 'submitted' ? (
                        <button
                          onClick={() => navigate(`/programming/assessments/results/${assessment.attempt.id}`)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                        >
                          View
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : assessment.attempt ? (
                        <button
                          onClick={() => navigate(`/programming/assessments/${assessment.id}`, { state: {} })}
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-black text-white transition hover:bg-emerald-700"
                        >
                          Resume
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStart(assessment.id)}
                          disabled={starting === assessment.id}
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {starting === assessment.id ? 'Starting...' : 'Start'}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
