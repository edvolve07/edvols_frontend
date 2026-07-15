import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Layers, AlertTriangle, CalendarDays, Trophy, Flame, BarChart3 } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiFetch } from '../../utils/api';

function formatRelativeTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default function PracticeTopics() {
  const [topics, setTopics] = useState([]);
  const [counts, setCounts] = useState({});
  const [solvedCounts, setSolvedCounts] = useState({});
  const [progress, setProgress] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [challenges, setChallenges] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    if (!quiet) setError('');
    try {
      const [res, analyticsRes, challengeRes, leaderboardRes] = await Promise.all([
        apiFetch('/programming/student/concepts'),
        apiFetch('/programming/student/analytics'),
        apiFetch('/programming/student/challenges/current'),
        apiFetch('/programming/student/leaderboard'),
      ]);
      const conceptList = res.concepts || [];
      setTopics(conceptList);
      setCounts(res.counts || {});
      setSolvedCounts(res.solved_counts || {});
      setProgress(res.progress || {});
      setAnalytics(analyticsRes);
      setChallenges(challengeRes);
      setLeaderboard((leaderboardRes.leaderboard || []).slice(0, 5));
    } catch (err) {
      if (!quiet) setError(err.message || 'Failed to load topics');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => refresh({ quiet: true }), 30 * 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const totalProblems = topics.reduce((sum, topic) => sum + (counts[topic] || 0), 0);
  const totalSolved = topics.reduce((sum, topic) => sum + (solvedCounts[topic] || 0), 0);
  const overallProgress = totalProblems ? Math.round((totalSolved / totalProblems) * 100) : 0;
  const heatmapDays = analytics?.heatmap || [];
  const heatmapLookup = new Map(heatmapDays.map((day) => [day.date, day]));
  const last28Days = Array.from({ length: 28 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - index));
    const key = date.toISOString().slice(0, 10);
    return heatmapLookup.get(key) || { date: key, count: 0, accepted: 0 };
  });

  if (loading) return <LoadingSkeleton label="Loading topics" />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm font-bold text-red-700">Failed to load topics</p>
        <p className="mt-1 text-xs text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <section className="page-stack max-w-5xl mx-auto pb-16">
      <div className="page-hero flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Programming Practice</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Choose a Topic</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Select a topic below to practice coding problems and sharpen your skills
          </p>
        </div>
        <div className="min-w-[220px] rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Overall progress</p>
            <p className="text-sm font-black text-emerald-800">{overallProgress}%</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {totalSolved} of {totalProblems} problems solved
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Daily Challenge', icon: CalendarDays, item: challenges?.daily },
            { label: 'Weekly Challenge', icon: Trophy, item: challenges?.weekly },
          ].map(({ label, icon: Icon, item }) => (
            <Link
              key={label}
              to={item?.problem?.id ? `/programming/practice/problems/${item.problem.id}` : '/programming/practice'}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                {item?.problem?.solved ? (
                  <span className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-black text-white">Solved</span>
                ) : null}
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-black text-slate-900">{item?.problem?.title || 'No challenge set'}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {item?.problem ? `${item.problem.concept} / ${item.problem.difficulty}` : 'Practice any published problem today'}
              </p>
            </Link>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-emerald-700" />
              <p className="text-sm font-black text-slate-900">Coding Heatmap</p>
            </div>
            <p className="text-xs font-bold text-slate-400">Last 28 days</p>
          </div>
          <div className="mt-4 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
            {last28Days.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} submissions`}
                className={`h-4 rounded-sm ${
                  day.count >= 5
                    ? 'bg-emerald-700'
                    : day.count >= 3
                      ? 'bg-emerald-500'
                      : day.count >= 1
                        ? 'bg-emerald-200'
                        : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{analytics?.totals?.submissions || 0} recent submissions</span>
            <span>{analytics?.totals?.completion_rate || overallProgress}% complete</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-700" />
            <p className="text-sm font-black text-slate-900">Solved by Topic</p>
          </div>
          <div className="mt-4 space-y-3">
            {(analytics?.solved_by_topic || []).slice(0, 6).map((item) => (
              <div key={item.concept}>
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                  <span>{item.concept}</span>
                  <span>{item.solved}/{item.total}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-700" />
            <p className="text-sm font-black text-slate-900">Institution Leaderboard</p>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {leaderboard.length ? leaderboard.map((row) => (
              <div key={row.student_id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-700">
                    {row.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{row.student_name}</p>
                    <p className="text-xs font-semibold text-slate-400">{row.solved} solved</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-700">{row.points}</span>
              </div>
            )) : (
              <p className="py-6 text-center text-sm font-semibold text-slate-500">No ranking data yet.</p>
            )}
          </div>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-500">No topics available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => {
            const total = counts[topic] || 0;
            const solved = solvedCounts[topic] || 0;
            const percent = progress[topic] || 0;
            const complete = total > 0 && solved >= total;

            return (
              <Link
                key={topic}
                to={`/programming/practice/topics/${encodeURIComponent(topic)}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-card-hover hover:border-slate-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
                    {percent}%
                  </span>
                </div>
                <div className="mt-3">
                  <p className="font-bold text-slate-900 text-lg group-hover:text-emerald-800 transition-colors">
                    {topic}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {solved} solved of {total} problems
                  </p>
                </div>
                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-500' : 'bg-emerald-600'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-emerald-600">
                    {complete ? 'Topic completed' : solved > 0 ? 'Keep going' : 'Start practicing'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-800 group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
