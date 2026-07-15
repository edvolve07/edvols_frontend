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
import { downloadReportAtsPdf, downloadReportPdf, getReport } from "@/lib/api";

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
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${overall.percentage}%` }} />
          </div>
        </div>
        <div className="grid min-w-[190px] gap-2">
          {Object.entries(overall.metrics).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{METRIC_LABELS[key] ?? key}</span>
              <span className="font-semibold" style={{ color: METRIC_COLORS[key] ?? "#5f6bf3" }}>
                {value}/10
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuestionBreakdownContent({ report }) {
  return (
    <div className="divide-y divide-slate-100">
      {report.question_breakdown.map((item) => (
        <article key={item.number} className="p-5">
          <div className="flex gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
              Q{item.number}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-6 text-slate-800">{item.question}</p>
              {item.answer ? (
                <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs italic leading-5 text-slate-500">
                  &quot;{item.answer}&quot;
                </p>
              ) : null}
              <div className="mt-3 grid gap-2 sm:grid-cols-5">
                {Object.entries(METRIC_LABELS).map(([key, label]) => (
                  <div key={key} className="rounded-lg bg-slate-50 p-2 text-center">
                    <p className="text-[10px] text-slate-400">{label}</p>
                    <p className="text-sm font-semibold" style={{ color: METRIC_COLORS[key] }}>
                      {item.evaluation[key] ?? "--"}/10
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ReportPage({ sessionId: sessionIdOverride, showQuestionBreakdownInline = false }) {
  const params = useSearchParams();
  const sessionId = sessionIdOverride || params.get("session");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState(sessionId ? "" : "Open a completed interview report from the interview flow.");
  const [showQuestionBreakdown, setShowQuestionBreakdown] = useState(false);

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

  const radarData = useMemo(
    () =>
      report
        ? Object.entries(report.overall.metrics).map(([key, value]) => ({
            subject: METRIC_LABELS[key] ?? key,
            value,
            fullMark: 10,
          }))
        : [],
    [report]
  );

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
