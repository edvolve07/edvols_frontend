import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb,
  BarChart3, Target, BookOpen, TrendingUp, MessageSquareText,
  ChevronDown, ChevronRight, Sparkles,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { COMMUNICATION_METRICS } from '@/src/constants';
import LoadingSkeleton from '@/src/portal/components/LoadingSkeleton';

function MetricBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm font-semibold text-slate-600">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 text-right text-sm font-bold text-slate-800">{value}/10</span>
    </div>
  );
}

function CompetencyBadge({ label, type }) {
  const colors = type === 'demonstrated'
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : 'bg-amber-100 text-amber-800 border-amber-200';
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${colors}`}>
      {label}
    </span>
  );
}

export default function CommunicationReport() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [report, setReport] = useState(null);
  const [expandedExchange, setExpandedExchange] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    apiFetch(`/api/communication/student/reports/${sessionId}`).then(setReport);
  }, [sessionId]);

  if (!report) return <LoadingSkeleton label="Loading report" />;

  const {
    overall, exchange_breakdown, conversation_log,
    strengths, areas_to_improve, tips,
    category_insights, real_world_preparation, competency_analysis,
    category, generated_date,
  } = report;
  const metrics = overall?.metrics || {};

  return (
    <section className="page-stack mx-auto max-w-5xl">
      <Link
        to="/communication"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Interview Practice
      </Link>

      {/* Grade card */}
      <div className={`rounded-2xl border p-6 text-center ${
        overall?.grade === 'A' ? 'border-emerald-200 bg-emerald-50' :
        overall?.grade === 'B' ? 'border-blue-200 bg-blue-50' :
        overall?.grade === 'C' ? 'border-amber-200 bg-amber-50' :
        'border-red-200 bg-red-50'
      }`}>
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black text-white ${
          overall?.grade === 'A' ? 'bg-emerald-500' :
          overall?.grade === 'B' ? 'bg-blue-500' :
          overall?.grade === 'C' ? 'bg-amber-500' :
          'bg-red-500'
        }`}>
          {overall?.grade}
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-900">
          {overall?.grade_label}
        </h2>
        <p className="mt-1 text-lg font-semibold text-slate-500">
          {overall?.percentage}% · {overall?.total_score}/{overall?.max_score}
        </p>
        <p className="mt-1 text-sm text-slate-400">{category} · {generated_date}</p>
      </div>

      {/* Metric scores */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">
          Interview Communication Scores
        </h3>
        <div className="space-y-3">
          {Object.entries(COMMUNICATION_METRICS).map(([key, { label, color }]) => (
            <MetricBar key={key} label={label} value={metrics[key] || 0} color={color} />
          ))}
        </div>
      </div>

      {/* Category Insights */}
      {category_insights && (category_insights.category_mastery || category_insights.key_takeaway) && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-600" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-violet-800">Category Insights</h3>
          </div>
          <div className="space-y-3">
            {category_insights.category_mastery && (
              <div>
                <p className="text-xs font-semibold text-violet-600">Mastery Assessment</p>
                <p className="text-sm text-violet-900">{category_insights.category_mastery}</p>
              </div>
            )}
            {category_insights.key_takeaway && (
              <div>
                <p className="text-xs font-semibold text-violet-600">Key Takeaway</p>
                <p className="text-sm font-medium text-violet-900">{category_insights.key_takeaway}</p>
              </div>
            )}
            {category_insights.recommended_focus && (
              <div>
                <p className="text-xs font-semibold text-violet-600">Recommended Focus</p>
                <p className="text-sm text-violet-900">{category_insights.recommended_focus}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Competency Analysis */}
      {competency_analysis && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Competency Analysis</h3>
          </div>
          {competency_analysis.communication_style && (
            <div className="mb-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Communication Style</p>
              <p className="mt-1 text-sm text-slate-700">{competency_analysis.communication_style}</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {competency_analysis.demonstrated_competencies?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-emerald-600">Demonstrated Competencies</p>
                <div className="flex flex-wrap gap-1.5">
                  {competency_analysis.demonstrated_competencies.map((c, i) => (
                    <CompetencyBadge key={i} label={c} type="demonstrated" />
                  ))}
                </div>
              </div>
            )}
            {competency_analysis.competencies_to_develop?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-amber-600">Competencies to Develop</p>
                <div className="flex flex-wrap gap-1.5">
                  {competency_analysis.competencies_to_develop.map((c, i) => (
                    <CompetencyBadge key={i} label={c} type="develop" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-800">Interview Strengths</h3>
          </div>
          <ul className="space-y-2">
            {(strengths || []).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
            {(!strengths || strengths.length === 0) && (
              <li className="text-sm text-emerald-600">No strengths recorded.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {(areas_to_improve || []).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {item}
              </li>
            ))}
            {(!areas_to_improve || areas_to_improve.length === 0) && (
              <li className="text-sm text-amber-600">Keep up the good work!</li>
            )}
          </ul>
        </div>
      </div>

      {/* Interview Tips */}
      {tips && tips.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Interview Tips</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {tips.map((tip, i) => (
              <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <span className="font-bold text-amber-600">{i + 1}.</span> {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-World Preparation */}
      {real_world_preparation && real_world_preparation.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-sky-600" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-sky-800">Real-World Interview Preparation</h3>
          </div>
          <p className="mb-3 text-xs text-sky-600">
            Specific tips to help you succeed in actual job interviews:
          </p>
          <ul className="space-y-2">
            {real_world_preparation.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-sky-900">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conversation Log */}
      {conversation_log && conversation_log.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-violet-500" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Full Conversation Transcript
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Review the complete interview with per-exchange scoring and real-world tips
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {conversation_log.map((ex, i) => (
              <div key={i}>
                <button
                  onClick={() => setExpandedExchange(expandedExchange === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    {expandedExchange === i ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-sm font-bold text-slate-700">Exchange {ex.exchange}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.entries(COMMUNICATION_METRICS).map(([key, { color }]) => (
                      <span
                        key={key}
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {ex.scores?.[key] || '?'}
                      </span>
                    ))}
                  </div>
                </button>
                {expandedExchange === i && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-semibold text-slate-400">Interviewer:</p>
                      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{ex.interviewer}</p>
                    </div>
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-semibold text-slate-400">Your answer:</p>
                      <p className="rounded-lg bg-emerald-50 p-3 text-sm text-slate-700">{ex.student}</p>
                    </div>
                    {ex.scores && (
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-semibold text-slate-400">Scores:</p>
                        <div className="grid grid-cols-5 gap-2">
                          {Object.entries(COMMUNICATION_METRICS).map(([key, { label, color }]) => (
                            <div key={key} className="rounded bg-slate-50 p-2 text-center">
                              <p className="text-xs text-slate-400">{label}</p>
                              <p className="text-sm font-bold" style={{ color }}>{ex.scores[key] || 0}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {ex.feedback && (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-semibold text-slate-400">Coaching Feedback:</p>
                        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{ex.feedback}</p>
                      </div>
                    )}
                    {ex.real_world_tip && (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-sky-600">Real-World Tip:</p>
                        <p className="rounded-lg bg-sky-50 p-3 text-sm text-sky-800">{ex.real_world_tip}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy exchange_breakdown (fallback if conversation_log not available) */}
      {!conversation_log && exchange_breakdown && exchange_breakdown.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Question Breakdown
              </h3>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {exchange_breakdown.map((ex, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <span>Q{ex.number}</span>
                  <span className="text-xs text-slate-400">
                    {ex.evaluation?.clarity || '?'}/{ex.evaluation?.structure || '?'}/{ex.evaluation?.conciseness || '?'}/{ex.evaluation?.relevance || '?'}/{ex.evaluation?.confidence_tone || '?'}
                  </span>
                </summary>
                <div className="border-t border-slate-100 px-5 py-3">
                  <p className="mb-1 text-xs font-semibold text-slate-400">Interviewer:</p>
                  <p className="mb-3 text-sm text-slate-700">{ex.prompt}</p>
                  <p className="mb-1 text-xs font-semibold text-slate-400">Your answer:</p>
                  <p className="text-sm text-slate-700">{ex.answer}</p>
                  {ex.evaluation && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {Object.entries(COMMUNICATION_METRICS).map(([key, { label, color }]) => (
                        <div key={key} className="rounded bg-slate-50 p-2 text-center">
                          <p className="text-xs text-slate-400">{label}</p>
                          <p className="text-sm font-bold" style={{ color }}>{ex.evaluation[key] || 0}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {ex.feedback && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-semibold text-slate-400">Feedback:</p>
                      <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">{ex.feedback}</p>
                    </div>
                  )}
                  {ex.real_world_tip && (
                    <div className="mt-2">
                      <p className="mb-1 text-xs font-semibold text-sky-600">Real-World Tip:</p>
                      <p className="rounded bg-sky-50 p-2 text-sm text-sky-800">{ex.real_world_tip}</p>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Link to="/communication" className="btn-primary gap-2">
          <ArrowLeft className="h-4 w-4" />
          Practice More Questions
        </Link>
      </div>
    </section>
  );
}