import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb,
  Target, BookOpen, TrendingUp, MessageSquareText,
  ChevronDown, ChevronRight, Sparkles, Download,
  FileText, BarChart3, Brain, Eye, Monitor,
  ClipboardList, Dumbbell, Home, GitCompare,
  Medal, Quote, Mic, Award, Clock, Layers,
  Volume2, Repeat, PenTool,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useNavigate, Link } from '@/src/navigation';
import LoadingSkeleton from '@/src/portal/components/LoadingSkeleton';

const LEVEL_COLORS = {
  Excellent: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', grade: 'bg-emerald-500' },
  Advanced: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', grade: 'bg-blue-500' },
  Intermediate: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', grade: 'bg-amber-500' },
  Beginner: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', grade: 'bg-red-500' },
};

function scoreColor(score) {
  if (score >= 8) return 'text-emerald-600';
  if (score >= 6) return 'text-amber-600';
  return 'text-red-500';
}

function barColor(score) {
  if (score >= 8) return 'bg-emerald-400';
  if (score >= 6) return 'bg-amber-400';
  return 'bg-red-400';
}

function MetricBar({ label, value, max = 10 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="w-24 shrink-0 text-xs font-semibold text-slate-600 sm:w-28 sm:text-sm">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor(value)}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-8 text-right text-xs font-bold sm:text-sm ${scoreColor(value)}`}>{value.toFixed(1)}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, color, children, className = '' }) {
  const colorMap = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    violet: 'text-violet-600 bg-violet-50 border-violet-200',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    sky: 'text-sky-600 bg-sky-50 border-sky-200',
    rose: 'text-rose-600 bg-rose-50 border-rose-200',
    slate: 'text-slate-600 bg-slate-50 border-slate-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    teal: 'text-teal-600 bg-teal-50 border-teal-200',
  };
  const c = colorMap[color] || colorMap.slate;
  return (
    <div className={`rounded-xl border ${c} p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ExchangeAccordion({ exchange, isOpen, onToggle }) {
  const { analysis, strengths = [], weaknesses = [], suggested_improvements = [], communication_score, ideal_response, why_better } = exchange;
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50">
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          <span className="text-sm font-bold text-slate-700">Exchange {exchange.exchange_number || '?'}</span>
        </div>
        {communication_score != null && (
          <span className={`text-xs font-bold ${scoreColor(communication_score)}`}>
            {communication_score.toFixed(1)}/10
          </span>
        )}
      </button>
      {isOpen && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-3">
          {analysis && (
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-400">Analysis</p>
              <p className="text-sm text-slate-700">{analysis}</p>
            </div>
          )}
          {strengths.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-emerald-600">Strengths</p>
              <ul className="space-y-1">{strengths.map((s, i) => <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{s}</li>)}</ul>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-amber-600">Weaknesses</p>
              <ul className="space-y-1">{weaknesses.map((w, i) => <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{w}</li>)}</ul>
            </div>
          )}
          {suggested_improvements.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-blue-600">Suggested Improvements</p>
              <ul className="space-y-1">{suggested_improvements.map((imp, i) => <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700"><span className="mt-0.5 text-blue-500">→</span>{imp}</li>)}</ul>
            </div>
          )}
          {ideal_response && (
            <div>
              <p className="mb-1 text-xs font-semibold text-violet-600">Ideal Response</p>
              <div className="rounded-lg bg-violet-50 p-3 text-sm text-violet-900 italic">{ideal_response}</div>
            </div>
          )}
          {why_better && (
            <div>
              <p className="mb-1 text-xs font-semibold text-emerald-600">Why This Is Better</p>
              <p className="text-sm text-slate-700">{why_better}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function exportAsMarkdown(report) {
  const lines = [];
  lines.push('# AI Communication Coaching Report', '');
  const s = report.session_summary || {};
  lines.push('## 1. Session Summary', '');
  lines.push(`- **Communication Mode:** ${s.communication_mode || 'N/A'}`);
  lines.push(`- **Scenario:** ${s.scenario || 'N/A'}`);
  lines.push(`- **Duration:** ${s.duration || 0} seconds`);
  lines.push(`- **Total Turns:** ${s.total_turns || 0}`);
  lines.push(`- **Overall Score:** ${s.overall_communication_score || 0}%`);
  lines.push(`- **Performance Level:** ${s.performance_level || 'N/A'}`);
  lines.push('');
  if (report.overall_feedback) {
    lines.push('## 2. Overall Feedback', '', report.overall_feedback, '');
  }
  const transcript = report.transcript || [];
  if (transcript.length > 0) {
    lines.push('## 3. Full Conversation Transcript', '');
    for (const t of transcript) {
      lines.push(`**Coach:** ${t.coach}`, '');
      lines.push(`**Student:** ${t.student}`, '');
    }
  }
  lines.push('---', '');
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `coaching-report-${report.session_id || 'download'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsJson(report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `coaching-report-${report.session_id || 'download'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CommunicationReport({ sessionId: propSessionId, onClose }) {
  const [searchParams] = useSearchParams();
  const sessionId = propSessionId || searchParams.get('session');
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [expandedExchange, setExpandedExchange] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    apiFetch(`/api/communication/student/reports/${sessionId}`).then(setReport).catch(() => {
      if (onClose) onClose();
      else navigate('/communication');
    });
  }, [sessionId, navigate, onClose]);

  if (!report) return <LoadingSkeleton label="Loading coaching report" />;

  const s = report.session_summary || {};
  const sc = report.overall_scores || {};

  const color = LEVEL_COLORS[s.performance_level] || LEVEL_COLORS.Beginner;

  return (
    <div ref={printRef} className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {onClose ? (
          <button onClick={onClose} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </button>
        ) : (
          <Link href="/communication" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Back to Practice
          </Link>
        )}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportAsMarkdown(report)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Download className="h-3.5 w-3.5" /> MD
          </button>
          <button onClick={() => exportAsJson(report)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* 1. Session Summary */}
      <div className={`mb-6 rounded-2xl border-2 ${color.border} ${color.bg} p-6 text-center`}>
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black text-white ${color.grade}`}>
          {s.performance_level === 'Excellent' ? 'A' : s.performance_level === 'Advanced' ? 'B' : s.performance_level === 'Intermediate' ? 'C' : 'D'}
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-900">{s.performance_level || 'N/A'}</h2>
        <p className="mt-1 text-lg font-semibold text-slate-500">{s.overall_communication_score || 0}% Overall Score</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-white/60 p-3"><p className="text-xs text-slate-500">Mode</p><p className="text-sm font-bold text-slate-800">{s.communication_mode || 'N/A'}</p></div>
          <div className="rounded-lg bg-white/60 p-3"><p className="text-xs text-slate-500">Scenario</p><p className="text-sm font-bold text-slate-800">{s.scenario || 'N/A'}</p></div>
          <div className="rounded-lg bg-white/60 p-3"><p className="text-xs text-slate-500">Duration</p><p className="text-sm font-bold text-slate-800">{s.duration ? `${Math.round(s.duration / 60)}m` : 'N/A'}</p></div>
          <div className="rounded-lg bg-white/60 p-3"><p className="text-xs text-slate-500">Turns</p><p className="text-sm font-bold text-slate-800">{s.total_turns || 0}</p></div>
        </div>
        {report.generated_date && <p className="mt-4 text-xs text-slate-400">{report.category} · {report.generated_date}</p>}
      </div>

      {/* 2. Overall Feedback */}
      {report.overall_feedback && (
        <SectionCard icon={MessageSquareText} title="Overall Feedback" color="emerald" className="mb-6">
          <div className="prose prose-sm max-w-none whitespace-pre-line text-slate-700">{report.overall_feedback}</div>
        </SectionCard>
      )}

      {/* 14. Overall Scores */}
      {Object.keys(sc).length > 0 && (
        <SectionCard icon={BarChart3} title="Overall Scores" subtitle="Performance across all dimensions" color="violet" className="mb-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(sc).map(([key, val]) => {
              if (!val || typeof val !== 'object') return null;
              return (
                <div key={key} className="rounded-lg bg-white/70 p-3 text-center shadow-sm">
                  <p className={`text-2xl font-black ${scoreColor(val.score || 0)}`}>{(val.score || 0).toFixed(1)}</p>
                  <p className="text-xs font-semibold text-slate-400 capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-slate-400">{val.label || ''}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* 4. Response Analysis */}
      {report.response_analysis && report.response_analysis.length > 0 && (
        <SectionCard icon={Brain} title="Response Analysis" subtitle="Detailed per-exchange analysis with ideal responses" color="indigo" className="mb-6">
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
            {report.response_analysis.map((ex, i) => (
              <ExchangeAccordion key={i} exchange={ex} isOpen={expandedExchange === i} onToggle={() => setExpandedExchange(expandedExchange === i ? null : i)} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* 5. Communication Metrics */}
      {report.communication_metrics && Object.keys(report.communication_metrics).length > 0 && (
        <SectionCard icon={Activity} title="Communication Metrics" subtitle="Detailed evaluation across all dimensions" color="blue" className="mb-6">
          <div className="space-y-2.5">
            {Object.entries(report.communication_metrics).map(([key, val]) => {
              if (val == null || val.score == null) return null;
              const label = key.replace(/_/g, ' ');
              return <MetricBar key={key} label={label.charAt(0).toUpperCase() + label.slice(1)} value={val.score} />;
            })}
          </div>
        </SectionCard>
      )}

      {/* 6. Language Analysis */}
      {report.language_analysis && (
        <SectionCard icon={Volume2} title="Language Analysis" subtitle="Filler words, repetition, and speaking patterns" color="rose" className="mb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white/70 p-4 shadow-sm">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Speaking Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Total Words</span><span className="font-bold">{report.language_analysis.word_count || 0}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Sentences</span><span className="font-bold">{report.language_analysis.sentence_count || 0}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Avg Sentence Length</span><span className="font-bold">{report.language_analysis.avg_sentence_length || 0} words</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Filler Words</span><span className="font-bold text-amber-600">{report.language_analysis.total_filler_count || 0}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Filler Density</span><span className="font-bold text-amber-600">{report.language_analysis.filler_density || 0}%</span></div>
              </div>
            </div>
            <div className="rounded-lg bg-white/70 p-4 shadow-sm">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Filler Words Detected</h4>
              {report.language_analysis.filler_words && Object.keys(report.language_analysis.filler_words).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(report.language_analysis.filler_words).map(([word, count]) => (
                    <div key={word} className="flex items-center justify-between rounded bg-amber-50 px-2.5 py-1.5 text-sm">
                      <span className="font-mono text-amber-800">"{word}"</span>
                      <span className="font-bold text-amber-600">{count}x</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">None detected — great job!</p>}
            </div>
          </div>
          {report.language_analysis.repeated_words && report.language_analysis.repeated_words.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-slate-400">Frequently Used Words</p>
              <div className="flex flex-wrap gap-1.5">
                {report.language_analysis.repeated_words.map((rw, i) => (
                  <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{rw.word} <span className="font-bold">({rw.count}x)</span></span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* 7. AI Coach Observations */}
      {report.coach_observations && report.coach_observations.length > 0 && (
        <SectionCard icon={Eye} title="AI Coach Observations" subtitle="Behavioral patterns and progress notes" color="orange" className="mb-6">
          <ul className="space-y-2">
            {report.coach_observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-white/60 p-3 text-sm text-slate-700 shadow-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                {obs}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* 3. Full Transcript */}
      {report.transcript && report.transcript.length > 0 && (
        <SectionCard icon={MessageSquareText} title="Full Conversation Transcript" subtitle="Complete session dialogue" color="slate" className="mb-6">
          <div className="space-y-4">
            {report.transcript.map((t, i) => (
              <div key={i} className="rounded-lg border border-slate-100">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-400">Exchange {t.exchange}</div>
                <div className="space-y-2 p-4">
                  <div>
                    <p className="mb-0.5 text-xs font-semibold text-violet-500">Coach</p>
                    <p className="rounded-lg bg-violet-50 p-2.5 text-sm text-slate-700">{t.coach}</p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-xs font-semibold text-emerald-500">Student</p>
                    <p className="rounded-lg bg-emerald-50 p-2.5 text-sm text-slate-700">{t.student}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 10. Improvement Plan */}
      {report.improvement_plan && (
        <SectionCard icon={Target} title="Personalized Improvement Plan" subtitle="Short, medium, and long-term goals" color="teal" className="mb-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[ 
              { key: 'short_term_goals', label: 'This Week', icon: Clock, color: 'emerald' },
              { key: 'medium_term_goals', label: 'Next Month', icon: TrendingUp, color: 'blue' },
              { key: 'long_term_goals', label: '3-6 Months', icon: Award, color: 'violet' },
            ].map(section => {
              const goals = report.improvement_plan[section.key] || [];
              return (
                <div key={section.key} className="rounded-lg bg-white/70 p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <section.icon className={`h-4 w-4 text-${section.color}-500`} />
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{section.label}</h4>
                  </div>
                  {goals.length > 0 ? (
                    <ul className="space-y-2">
                      {goals.map((goal, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700">
                          <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-${section.color}-400`} />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-slate-400">No goals set.</p>}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* 11. Practice Exercises */}
      {report.practice_exercises && report.practice_exercises.length > 0 && (
        <SectionCard icon={Dumbbell} title="Practice Exercises" subtitle="Targeted exercises to build your skills" color="orange" className="mb-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {report.practice_exercises.map((ex, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-white/70 p-4 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800">{ex.name || `Exercise ${i + 1}`}</h4>
                <p className="mt-1 text-xs text-slate-500">{ex.description || ''}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ex.duration && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{ex.duration}</span>}
                  {ex.focus_area && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">{ex.focus_area}</span>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 12. Homework */}
      {report.homework && report.homework.length > 0 && (
        <SectionCard icon={Home} title="Homework Assignments" subtitle="Practice between sessions" color="indigo" className="mb-6">
          <div className="space-y-3">
            {report.homework.map((hw, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-white/70 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{hw.task || `Assignment ${i + 1}`}</h4>
                    {hw.details && <p className="mt-1 text-xs text-slate-500">{hw.details}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">#{i + 1}</span>
                </div>
                {hw.success_criteria && (
                  <div className="mt-2 rounded bg-emerald-50 px-3 py-1.5">
                    <p className="text-[10px] font-semibold text-emerald-600">Success Criteria</p>
                    <p className="text-xs text-emerald-800">{hw.success_criteria}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 13. Session Comparison */}
      {report.session_comparison && report.session_comparison.length > 0 && (
        <SectionCard icon={GitCompare} title="Session Comparison" subtitle="Progress compared to previous sessions" color="blue" className="mb-6">
          {report.session_comparison.map((cmp, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <p className="mb-3 text-xs font-semibold text-slate-400">vs {cmp.previous_date}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {Object.entries(cmp.changes || {}).map(([key, val]) => {
                  if (!val || typeof val !== 'object') return null;
                  return (
                    <div key={key} className="rounded-lg bg-white/70 p-3 text-center shadow-sm">
                      <p className="text-xs text-slate-400 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className={`text-lg font-black ${val.improved ? 'text-emerald-600' : 'text-red-500'}`}>
                        {val.change > 0 ? '+' : ''}{val.change?.toFixed(1) || 0}
                      </p>
                      <p className="text-[10px] text-slate-400">{val.previous?.toFixed(1) || 0} → {val.current?.toFixed(1) || 0}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* 8. Vision Feedback */}
      {report.vision_feedback && report.vision_feedback.status === 'available' && (
        <SectionCard icon={Eye} title="Vision Feedback" subtitle="Eye contact, posture, and facial expressions" color="sky" className="mb-6">
          <p className="text-sm text-slate-600">Video analysis data available from this session.</p>
        </SectionCard>
      )}

      {/* 9. Screen Sharing Feedback */}
      {report.screen_share_feedback && report.screen_share_feedback.status === 'available' && (
        <SectionCard icon={Monitor} title="Screen Sharing Feedback" subtitle="Presentation and visual aid analysis" color="teal" className="mb-6">
          <p className="text-sm text-slate-600">Screen sharing data available from this session.</p>
        </SectionCard>
      )}

      {/* 15. AI Coach Final Remarks */}
      {report.final_remarks && (
        <SectionCard icon={Quote} title="AI Coach Final Remarks" color="emerald" className="mb-6">
          <div className="relative rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-6">
            <Quote className="absolute right-4 top-4 h-8 w-8 text-emerald-200" />
            <div className="prose prose-sm max-w-none whitespace-pre-line text-slate-700">{report.final_remarks}</div>
          </div>
        </SectionCard>
      )}

      {/* Strengths & Improvements Summary */}
      {(report.strengths?.length > 0 || report.areas_to_improve?.length > 0) && (
        <div className="mb-6 grid gap-5 sm:grid-cols-2">
          {report.strengths?.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-wide text-emerald-800">Key Strengths</h3></div>
              <ul className="space-y-2">{report.strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-emerald-900"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{s}</li>)}</ul>
            </div>
          )}
          {report.areas_to_improve?.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><h3 className="text-sm font-bold uppercase tracking-wide text-amber-800">Areas to Improve</h3></div>
              <ul className="space-y-2">{report.areas_to_improve.map((a, i) => <li key={i} className="flex items-start gap-2 text-sm text-amber-900"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{a}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {report.tips?.length > 0 && (
        <SectionCard icon={Lightbulb} title="Communication Tips" color="amber" className="mb-6">
          <div className="grid gap-3 sm:grid-cols-2">{report.tips.map((t, i) => <div key={i} className="rounded-lg bg-white/70 p-3 text-sm text-slate-700 shadow-sm"><span className="font-bold text-amber-600">{i + 1}.</span> {t}</div>)}</div>
        </SectionCard>
      )}

      {/* Real-World Preparation */}
      {report.real_world_preparation?.length > 0 && (
        <SectionCard icon={BookOpen} title="Real-World Preparation" color="sky" className="mb-6">
          <ul className="space-y-2">{report.real_world_preparation.map((t, i) => <li key={i} className="flex items-start gap-2 text-sm text-sky-900"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />{t}</li>)}</ul>
        </SectionCard>
      )}

      {/* Conversation Log (legacy fallback) */}
      {report.conversation_log && report.conversation_log.length > 0 && !report.response_analysis?.length && (
        <SectionCard icon={MessageSquareText} title="Conversation Log" color="slate" className="mb-6">
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
            {report.conversation_log.map((ex, i) => (
              <div key={i}>
                <button onClick={() => setExpandedSection(expandedSection === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50">
                  <span className="text-sm font-bold text-slate-700">Exchange {ex.exchange}</span>
                  {expandedSection === i ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
                {expandedSection === i && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                    {ex.interviewer && <div><p className="text-xs font-semibold text-slate-400">Interviewer:</p><p className="text-sm text-slate-700">{ex.interviewer}</p></div>}
                    {ex.student && <div><p className="text-xs font-semibold text-slate-400">Student:</p><p className="text-sm text-slate-700">{ex.student}</p></div>}
                    {ex.feedback && <div className="rounded bg-amber-50 p-2"><p className="text-xs font-semibold text-amber-600">Feedback:</p><p className="text-sm text-amber-800">{ex.feedback}</p></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Category Insights */}
      {report.category_insights && (report.category_insights.category_mastery || report.category_insights.key_takeaway) && (
        <SectionCard icon={Target} title="Category Insights" color="violet" className="mb-6">
          <div className="space-y-3">
            {report.category_insights.category_mastery && <div><p className="text-xs font-semibold text-violet-600">Mastery Assessment</p><p className="text-sm text-violet-900">{report.category_insights.category_mastery}</p></div>}
            {report.category_insights.key_takeaway && <div><p className="text-xs font-semibold text-violet-600">Key Takeaway</p><p className="text-sm font-medium text-violet-900">{report.category_insights.key_takeaway}</p></div>}
            {report.category_insights.recommended_focus && <div><p className="text-xs font-semibold text-violet-600">Recommended Focus</p><p className="text-sm text-violet-900">{report.category_insights.recommended_focus}</p></div>}
          </div>
        </SectionCard>
      )}

      {/* Competency Analysis */}
      {report.competency_analysis && (
        <SectionCard icon={TrendingUp} title="Competency Analysis" color="indigo" className="mb-6">
          {report.competency_analysis.communication_style && <div className="mb-4 rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Communication Style</p><p className="mt-1 text-sm text-slate-700">{report.competency_analysis.communication_style}</p></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            {report.competency_analysis.demonstrated_competencies?.length > 0 && <div><p className="mb-2 text-xs font-semibold text-emerald-600">Demonstrated Competencies</p><div className="flex flex-wrap gap-1.5">{report.competency_analysis.demonstrated_competencies.map((c, i) => <span key={i} className="inline-block rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{c}</span>)}</div></div>}
            {report.competency_analysis.competencies_to_develop?.length > 0 && <div><p className="mb-2 text-xs font-semibold text-amber-600">Competencies to Develop</p><div className="flex flex-wrap gap-1.5">{report.competency_analysis.competencies_to_develop.map((c, i) => <span key={i} className="inline-block rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{c}</span>)}</div></div>}
          </div>
        </SectionCard>
      )}

      {/* Bottom navigation */}
      <div className="flex justify-center pt-4">
        <Link href="/communication" className="btn-primary inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200/60 hover:bg-emerald-700">
          <ArrowLeft className="h-4 w-4" />
          {onClose ? 'Practice More' : 'Practice More'}
        </Link>
      </div>
    </div>
  );
}

function Activity({ className }) {
  return <BarChart3 className={className} />;
}
