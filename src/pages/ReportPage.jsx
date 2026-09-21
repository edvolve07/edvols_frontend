import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Lightbulb,
  ListChecks,
  Loader2,
  Star,
  Target,
  TrendingUp,
  X,
  RefreshCw,
  Award,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { METRIC_COLORS, METRIC_LABELS } from "@/src/constants";
import { useSearchParams } from "@/src/navigation";
import { useLocation, useNavigate } from "react-router-dom";
import { downloadReportAtsPdf, downloadReportPdf, getReport, apiFetch } from "@/lib/api";

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <Icon size={15} />
      </span>
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    </div>
  );
}

function GradeCard({ report }) {
  const { overall } = report;
  const metrics = overall.metrics || {};
  const normalizedMetrics = { ...metrics };
  if (normalizedMetrics.communication == null) {
    const flu = Number(normalizedMetrics.fluency || 7);
    const conf = Number(normalizedMetrics.confidence || 7);
    normalizedMetrics.communication = Number(((flu + conf) / 2).toFixed(1));
  }
  if (Number(normalizedMetrics.body_language || 0) === 0) {
    delete normalizedMetrics.body_language;
  }

  return (
    <section className="mb-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-card">
          <div className="text-center">
            <p className="font-display text-4xl font-bold leading-none">{overall.grade}</p>
            <p className="mt-1 text-xs text-emerald-100">{Math.round(overall.percentage)}%</p>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500">{overall.grade_label}</p>
          <p className="mt-1 font-display text-4xl font-semibold text-slate-950">
            {overall.total_score}
            <span className="font-sans text-xl font-normal text-slate-400"> / {overall.max_score} pts</span>
          </p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, overall.percentage))}%` }}
            />
          </div>
        </div>
        <div className="grid min-w-[260px] gap-2.5">
          {Object.entries(normalizedMetrics).map(([key, value]) => {
            const numVal = Number(value || 0);
            const pct = Math.min(100, Math.max(0, Math.round(numVal * 10)));
            const color = METRIC_COLORS[key] ?? "#0ea5e9";
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{METRIC_LABELS[key] ?? key}</span>
                  <span className="font-bold text-slate-900">
                    <span style={{ color }}>{numVal}</span>/10
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PlacementReadinessSection({ readiness, interviewNumber, blueprintTitle }) {
  if (!readiness) return null;

  const dimensions = [
    { key: "technical_functional", label: "Technical / Functional", icon: Target },
    { key: "communication", label: "Communication Clarity", icon: TrendingUp },
    { key: "problem_solving", label: "Problem Solving & Logic", icon: Lightbulb },
    { key: "resume_fidelity", label: "Resume Claim Fidelity", icon: FileText },
    { key: "behavioral_mastery", label: "Behavioral & STAR", icon: Star },
    { key: "hr_culture", label: "HR & Culture Fit", icon: CheckCircle2 },
    { key: "interview_performance", label: "Interview Composure", icon: BarChart3 },
    { key: "role_readiness", label: "Target Role Readiness", icon: Award },
  ];

  return (
    <section className="mb-6 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/40 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-purple-800">
              <Award className="h-3.5 w-3.5" />
              {interviewNumber === 30 ? "Final Placement Capstone" : "Milestone Evaluation"}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {blueprintTitle || `Interview #${interviewNumber}`}
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Comprehensive Placement Readiness Evaluation
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Holistic assessment across 8 core evaluation dimensions, progression benchmarks, and role readiness.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-purple-200 rounded-xl p-3 shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 text-white font-extrabold text-xl">
            {readiness.placement_readiness_score || 0}%
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-purple-700">Readiness Score</p>
            <p className="text-xs font-semibold text-slate-700">
              {readiness.placement_readiness_score >= 80
                ? "Placement Ready"
                : readiness.placement_readiness_score >= 60
                  ? "Nearly Ready"
                  : "Needs Focused Prep"}
            </p>
          </div>
        </div>
      </div>

      {/* 8 Evaluation Dimensions Grid */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
        8 Core Assessment Dimensions (0–100)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {dimensions.map(({ key, label }) => {
          const score = readiness[key] ?? 75;
          return (
            <div key={key} className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
              <p className="text-[11px] font-semibold text-slate-600 truncate">{label}</p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-900">{score}%</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  score >= 80 ? 'bg-emerald-100 text-emerald-800' : score >= 60 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {score >= 80 ? 'Strong' : score >= 60 ? 'Proficient' : 'Developing'}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Progression & Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        {(readiness.improvement_from_level_1 || readiness.improvement_from_level_2) && (
          <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-2xs">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
              Level Progression Assessment
            </h4>
            {readiness.improvement_from_level_1 && (
              <p className="text-xs text-slate-700 mb-2">
                <strong className="text-indigo-900">Level 1 Baseline Progress: </strong>
                {readiness.improvement_from_level_1}
              </p>
            )}
            {readiness.improvement_from_level_2 && (
              <p className="text-xs text-slate-700">
                <strong className="text-indigo-900">Level 2 Intermediate Progress: </strong>
                {readiness.improvement_from_level_2}
              </p>
            )}
          </div>
        )}

        {readiness.remaining_skill_gaps?.length > 0 && (
          <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-2xs">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-2">
              Remaining Skill Gaps
            </h4>
            <ul className="space-y-1.5">
              {readiness.remaining_skill_gaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {readiness.recommended_next_steps?.length > 0 && (
        <div className="mt-4 rounded-xl border border-purple-100 bg-white p-4 shadow-2xs">
          <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider mb-2">
            Recommended Next Steps for Full Placement Readiness
          </h4>
          <div className="grid sm:grid-cols-2 gap-2">
            {readiness.recommended_next_steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-purple-200 text-[10px] font-bold text-purple-800">
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function QuestionBreakdownContent({ report }) {
  return (
    <div className="divide-y divide-slate-100">
      {report.question_breakdown.map((item) => {
        const itemEvaluation = { ...(item.evaluation || item.scores || {}) };
        if (itemEvaluation.communication == null) {
          const flu = Number(itemEvaluation.fluency || 7);
          const conf = Number(itemEvaluation.confidence || 7);
          itemEvaluation.communication = Number(((flu + conf) / 2).toFixed(1));
        }
        return (
          <article key={item.number || item.question_number} className="p-5">
            <div className="flex gap-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                Q{item.number || item.question_number}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-6 text-slate-800">{item.question}</p>
                {item.answer ? (
                  <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs italic leading-5 text-slate-500">
                    &quot;{item.answer}&quot;
                  </p>
                ) : null}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {Object.entries(METRIC_LABELS)
                    .filter(([k]) => k !== 'body_language' || (itemEvaluation[k] != null && Number(itemEvaluation[k]) > 0))
                    .map(([key, label]) => {
                      const val = itemEvaluation[key] != null ? Number(itemEvaluation[key]) : null;
                      const pct = val != null ? Math.min(100, Math.max(0, Math.round(val * 10))) : 0;
                      const color = METRIC_COLORS[key] || '#0ea5e9';
                      return (
                        <div key={key} className="rounded-lg bg-slate-50 p-2.5 text-center">
                          <p className="text-[10px] font-medium text-slate-400 truncate">{label}</p>
                          <p className="mt-0.5 text-sm font-bold" style={{ color }}>
                            {val != null ? `${val}/10` : '--'}
                          </p>
                          {val != null ? (
                            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${pct}%`, backgroundColor: color }}
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function ReportPage({ sessionId: sessionIdOverride, showQuestionBreakdownInline = false }) {
  const params = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = sessionIdOverride || params.get("session") || location?.state?.sessionId;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [retaking, setRetaking] = useState(false);
  const [error, setError] = useState(sessionId ? "" : "Open a completed interview report from the interview flow.");
  const [showQuestionBreakdown, setShowQuestionBreakdown] = useState(false);

  const handleAttendAgain = async () => {
    try {
      setRetaking(true);
      const interviewNumber = report?.interview_number;
      if (interviewNumber) {
        const res = await apiFetch(`/api/mentorship/interview/start/${interviewNumber}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ use_saved: true }),
        });
        navigate(`/mentorship/interview/${res.session_id}`);
      } else {
        navigate("/interview");
      }
    } catch (_e) {
      navigate("/interview");
    } finally {
      setRetaking(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    setLoading(true);
    setError("");
    getReport(sessionId)
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load report.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sessionId]);

  const radarData = useMemo(() => {
    if (!report?.overall?.metrics) return [];
    const metrics = { ...report.overall.metrics };
    if (metrics.communication == null) {
      const flu = Number(metrics.fluency || 7);
      const conf = Number(metrics.confidence || 7);
      metrics.communication = Number(((flu + conf) / 2).toFixed(1));
    }
    return Object.entries(metrics)
      .filter(([key, val]) => key !== 'body_language' || Number(val) > 0)
      .map(([key, value]) => ({
        subject: METRIC_LABELS[key] ?? key,
        value: Number(value || 0),
        fullMark: 10,
      }));
  }, [report]);

  const questionScores = useMemo(
    () =>
      report
        ? report.question_breakdown.map((item) => ({
            name: `Q${item.number}`,
            score: Object.values(item.evaluation).reduce(
              (sum, value) => sum + (typeof value === "number" ? value : 0),
              0
            ),
          }))
        : [],
    [report]
  );

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 size={36} className="animate-spin text-emerald-500" />
          <p className="text-sm font-medium">Loading interview report</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
          <div className="flex items-center gap-2">
            <AlertCircle size={17} />
            {error || "Report not available."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {report.generated_date} / {report.report_id}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-slate-950">Interview report</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAttendAgain}
            disabled={retaking}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={retaking ? "animate-spin" : ""} />
            {retaking ? "Preparing…" : "Attend Again"}
          </button>
          <button
            type="button"
            onClick={() => downloadReportAtsPdf(report.session_id)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FileText size={16} /> ATS report
          </button>
          <button
            type="button"
            onClick={() => downloadReportPdf(report.session_id)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600"
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      <GradeCard report={report} />

      <PlacementReadinessSection
        readiness={report.overall?.placement_readiness || report.placement_readiness}
        interviewNumber={report.interview_number || report.blueprint_level ? (report.interview_number || 30) : null}
        blueprintTitle={report.blueprint_title}
      />

      <section className="mb-5 grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
          <SectionTitle icon={TrendingUp} title="Performance radar" />
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#eef2f7" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
              <Radar dataKey="value" stroke="#5f6bf3" fill="#5f6bf3" fillOpacity={0.18} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
          <SectionTitle icon={BarChart3} title="Per-question score" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={questionScores} barSize={16}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  border: "none",
                  borderRadius: 12,
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                  fontSize: 12,
                }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {questionScores.map((_, index) => (
                  <Cell key={index} fill={index % 2 === 0 ? "#5f6bf3" : "#8093f9"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mb-5 grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <SectionTitle icon={FileText} title="ATS analysis" />
          <p className="font-display text-4xl font-semibold text-slate-950">{report.ats_analysis.ats_score}</p>
          <p className="mt-1 text-xs text-slate-500">resume score</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {report.ats_analysis.skills_found.map((skill) => (
              <span key={skill} className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <SectionTitle icon={Star} title="Strengths" />
          <ul className="space-y-3">
            {report.strengths.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                <CheckCircle2 size={15} className="mt-1 flex-shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <SectionTitle icon={Target} title="Areas to improve" />
          <ul className="space-y-3">
            {report.areas_to_improve.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                <AlertCircle size={15} className="mt-1 flex-shrink-0 text-amber-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
        <SectionTitle icon={Lightbulb} title="Interview tips" />
        <div className="grid gap-3 md:grid-cols-2">
          {report.interview_tips.map((tip, index) => (
            <div key={tip} className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                {index + 1}
              </span>
              {tip}
            </div>
          ))}
        </div>
      </section>

      {showQuestionBreakdownInline ? (
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="border-b border-slate-100 px-5 py-4">
            <SectionTitle icon={ListChecks} title="Question breakdown" />
          </div>
          <QuestionBreakdownContent report={report} />
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SectionTitle icon={ListChecks} title="Question breakdown" />
              <p className="text-sm leading-6 text-slate-500">
                View each question, your answer, and metric-by-metric scores in a full detail panel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQuestionBreakdown(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600"
            >
              <ListChecks size={16} />
              View full breakdown
            </button>
          </div>
        </section>
      )}

      {showQuestionBreakdown ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto flex max-h-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Detailed review</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">Question breakdown</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowQuestionBreakdown(false)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close question breakdown"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto">
              <QuestionBreakdownContent report={report} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
