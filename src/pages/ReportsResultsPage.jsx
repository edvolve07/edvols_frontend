import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, BarChart3, FileText, Loader2, Mic2, X } from "lucide-react";
import { getInterviewReports, getStudentResults } from "@/lib/api";
import { Link, useNavigate, useSearchParams } from "@/src/navigation";
import ReportPage from "./ReportPage";

function formatDateTime(value) {
  if (!value) return "Open";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AssessmentResultsList() {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  useEffect(() => {
    let active = true;

    getStudentResults()
      .then((data) => {
        if (active) setResults(data.results || []);
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Unable to load assessment results.");
          setResults([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <BarChart3 size={16} />
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
              Assessment Results
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review submitted aptitude attempts, scores, pass status, and detailed answer breakdowns.
          </p>
        </div>
        <Link
          href="/aptitude"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Take assessment <ArrowRight size={15} />
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </div>
      ) : null}

      {!results ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-10 text-sm font-medium text-slate-500">
          <Loader2 size={18} className="mr-2 animate-spin text-emerald-500" />
          Loading assessment results
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
          No submitted assessment results yet.
        </div>
      ) : !showAllAttempts ? (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Latest result</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">{results[0].assessment_title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {results[0].concept} · {results[0].difficulty} · {formatDateTime(results[0].submitted_at)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-950">{results[0].percentage}%</p>
              <p className={results[0].passed ? "text-sm font-bold text-emerald-700" : "text-sm font-bold text-red-600"}>
                {results[0].passed ? "Passed" : "Failed"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Attempts</p>
              <p className="mt-1 text-lg font-black text-slate-950">{results.length}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Latest score</p>
              <p className="mt-1 text-lg font-black text-slate-950">{results[0].score}/{results[0].total_marks}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Average</p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {Math.round(results.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / results.length)}%
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(`/reports/results/${results[0].id}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600"
            >
              View latest result <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => setShowAllAttempts(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              More details
            </button>
          </div>
        </article>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">All assessment attempts</h3>
              <p className="mt-1 text-sm text-slate-500">Review every submitted assessment result.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllAttempts(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={15} />
              Back to results page
            </button>
          </div>

          <div className="grid gap-4">
            {results.map((result) => (
              <article
                key={result.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{result.assessment_title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {result.concept} · {result.difficulty} · {formatDateTime(result.submitted_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-950">{result.percentage}%</p>
                    <p className={result.passed ? "text-sm font-bold text-emerald-700" : "text-sm font-bold text-red-600"}>
                      {result.passed ? "Passed" : "Failed"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Score {result.score}/{result.total_marks}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/reports/results/${result.id}`)}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600"
                  >
                    View result
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function InterviewReportsList({ onMoreDetails }) {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getInterviewReports()
      .then((data) => {
        if (active) setReports(data.reports || []);
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Unable to load interview reports.");
          setReports([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
        {error}
      </div>
    );
  }

  if (!reports) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-10 text-sm font-medium text-slate-500">
        <Loader2 size={18} className="mr-2 animate-spin text-emerald-500" />
        Loading interview reports
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
        <div className="flex gap-3">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-900">No interview reports saved yet.</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Complete a mock interview and generate the report to save it under your account.
            </p>
            <Link
              href="/interview"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600"
            >
              Start interview <FileText size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {reports.map((report) => (
        <article
          key={report.session_id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">{report.role || "Interview report"}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {report.domain || "Interview"} · {formatDateTime(report.created_at)} · {report.report_id}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
              <p className="text-2xl font-black text-slate-950">{report.grade || "--"}</p>
              <p className="text-sm font-bold text-emerald-700">{Math.round(report.percentage || 0)}%</p>
              </div>
              <button
                type="button"
                onClick={() => onMoreDetails(report.session_id)}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600"
              >
                More details
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ReportsResultsPage() {
  const params = useSearchParams();
  const sessionId = params.get("session");
  const [selectedInterviewSessionId, setSelectedInterviewSessionId] = useState(sessionId || "");

  useEffect(() => {
    if (sessionId) setSelectedInterviewSessionId(sessionId);
  }, [sessionId]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
        <p className="text-sm font-medium text-emerald-600">Performance archive</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950">
          Reports and Results
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          View interview reports and aptitude assessment results without leaving the Edvols workspace.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Mic2 size={16} />
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
            Interview Reports
          </h2>
        </div>

        <InterviewReportsList onMoreDetails={setSelectedInterviewSessionId} />
      </section>

      <AssessmentResultsList />

      {selectedInterviewSessionId ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto flex max-h-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Interview report</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">More details</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInterviewSessionId("")}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close interview report details"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto bg-slate-50">
              <ReportPage sessionId={selectedInterviewSessionId} showQuestionBreakdownInline />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
