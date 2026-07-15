import { useEffect, useState, useCallback } from "react";
import {
  ArrowRight, BarChart3, BookOpenCheck, Clock3, Code2, Download, FilePlus2, Loader2, Mic2, Users, X, ChevronRight,
  GraduationCap, Building2, UserCheck, Award, TrendingUp,
} from "lucide-react";
import { Link } from "@/src/navigation";
import { apiFetch, downloadAdminExport, downloadCodingProgressExport } from "@/lib/api";
import { useAuth } from "@/src/portal/context/AuthContext";

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

const YEAR_LABELS = ["1st", "2nd", "3rd", "4th"];

function StatCard({ label, value, icon: Icon, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    green: "bg-accent-50 text-accent-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon size={19} />
      </div>
      <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{value ?? 0}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function StudentCard({ student, onClick }) {
  const modules = student.modules_access || ["both"];
  return (
    <button
      type="button"
      onClick={() => onClick(student)}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate">{student.name}</h3>
            {!student.is_active && (
              <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Inactive</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{student.email}</p>
          {student.usn && <p className="text-xs text-slate-400 font-mono">{student.usn}</p>}
        </div>
        <ChevronRight size={16} className="mt-1 shrink-0 text-slate-300" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
          {student.submitted_attempts} attempts
        </span>
        <span className={`rounded-md px-2 py-1 text-[11px] font-medium ${
          student.average_percentage >= 60 ? "bg-accent-50 text-accent-700" : "bg-amber-50 text-amber-600"
        }`}>
          {student.average_percentage}% avg
        </span>
        <span className="rounded-md bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700">
          {student.passed_attempts} passed
        </span>
        {modules.includes("programming") || modules.includes("both") ? (
          <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-600">Coding</span>
        ) : null}
      </div>
    </button>
  );
}

function StudentDetailPanel({ studentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch(`/api/admin/students/${studentId}/analytics`)
      .then((res) => { if (active) setData(res); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 pt-4 pb-8 sm:pt-8">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white mx-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg bg-white p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : !data ? (
          <div className="p-6 text-center text-sm text-red-500">Failed to load student data.</div>
        ) : (
          <div className="p-6 sm:p-8">
            {/* Profile header */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                  {data.profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{data.profile.name}</h2>
                  <p className="text-sm text-slate-500">{data.profile.email}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                    {data.profile.usn ? <span className="font-mono">{data.profile.usn}</span> : null}
                    {data.profile.year ? <span>{data.profile.year} year</span> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{data.aptitude.total_attempts}</p>
                <p className="text-xs text-slate-500">Aptitude attempts</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-accent-600">{data.aptitude.average_percentage}%</p>
                <p className="text-xs text-slate-500">Avg aptitude score</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-brand-600">{data.aptitude.passed}</p>
                <p className="text-xs text-slate-500">Passed</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{data.programming.total_submissions}</p>
                <p className="text-xs text-slate-500">Coding submissions</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-accent-600">{data.programming.accepted}</p>
                <p className="text-xs text-slate-500">Accepted</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-brand-700">{data.interview.total_reports}</p>
                <p className="text-xs text-slate-500">Interview reports</p>
              </div>
            </div>

            {/* Aptitude attempts */}
            {data.aptitude.attempts?.length > 0 && (
              <section className="mb-6">
                <h3 className="mb-3 font-semibold text-slate-900 flex items-center gap-2">
                  <BookOpenCheck size={16} className="text-brand-600" /> Recent Aptitude Attempts
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.aptitude.attempts.slice(0, 10).map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <div>
                        <span className={`font-medium ${a.percentage >= 60 ? "text-accent-600" : "text-amber-600"}`}>
                          {a.percentage}%
                        </span>
                        <span className="ml-2 text-slate-400 text-xs">
                          {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">Score: {a.score}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Programming submissions */}
            {data.programming.recent_submissions?.length > 0 && (
              <section className="mb-6">
                <h3 className="mb-3 font-semibold text-slate-900 flex items-center gap-2">
                  <Code2 size={16} className="text-amber-600" /> Recent Coding Submissions
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.programming.recent_submissions.slice(0, 10).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-700">{s.title || "Coding problem"}</p>
                        <p className="text-xs text-slate-400">{s.concept}{s.difficulty ? ` · ${s.difficulty}` : ""}</p>
                      </div>
                      <div className="shrink-0 ml-2 text-right">
                        <span className={`text-xs font-semibold ${
                          s.status === "accepted" ? "text-accent-600" : "text-amber-600"
                        }`}>
                          {s.status === "accepted" ? "Accepted" : s.status?.replaceAll("_", " ")}
                        </span>
                        <p className="text-xs text-slate-400">{s.passed_test_cases}/{s.total_test_cases}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Interview reports */}
            {data.interview.reports?.length > 0 && (
              <section className="mb-6">
                <h3 className="mb-3 font-semibold text-slate-900 flex items-center gap-2">
                  <Mic2 size={16} className="text-brand-600" /> Interview Reports
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.interview.reports.slice(0, 10).map((r) => (
                    <div key={r.report_id || r.session_id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">{r.role || "Interview"}</span>
                        <span className="ml-2 text-xs text-slate-400">{r.domain}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-accent-600">{r.percentage}%</span>
                        <p className="text-xs text-slate-400">{r.grade_label || r.grade}{r.ats_score ? ` · ATS ${r.ats_score}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Resume */}
            {data.resume && (
              <section>
                <h3 className="mb-3 font-semibold text-slate-900 flex items-center gap-2">
                  <Award size={16} className="text-amber-500" /> Resume
                </h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">{data.resume.title || "Resume"}{data.resume.target_role ? ` · ${data.resume.target_role}` : ""}</span>
                    <span className="text-xs font-semibold text-accent-600">ATS: {data.resume.ats_score}</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EdvolsAdminDashboard() {
  const { user } = useAuth();
  const userModules = user?.modules_access || ["both"];
  const hasAptitude = userModules.includes("aptitude") || userModules.includes("both");
  const hasInterview = userModules.includes("ai_interview") || userModules.includes("both");
  const hasProgramming = userModules.includes("programming") || userModules.includes("both");

  const isDepartmentAdmin = user?.admin_role === "hod" && user?.department_id;

  const [stats, setStats] = useState(null);
  const [programmingStats, setProgrammingStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState("1st");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const data = await apiFetch("/api/admin/dashboard");
      if (hasProgramming) {
        const progData = await apiFetch("/api/programming/admin/dashboard");
        setProgrammingStats(progData);
      }
      setStats(data);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, [hasProgramming]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => refresh({ quiet: true }), 30 * 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-600" />
        Loading admin dashboard
      </div>
    );
  }

  const yearStudents = stats.year_groups?.[activeYear] || [];
  const yearCounts = YEAR_LABELS.map((y) => ({ label: y, count: (stats.year_groups?.[y] || []).length }));

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      {/* Header */}
      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:mb-6 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {isDepartmentAdmin ? (
              <div className="flex items-center gap-2 text-sm font-medium text-brand-700 mb-1">
                <Building2 size={15} />
                {stats.department_name || "Department"} · HoD
              </div>
            ) : (
              <p className="text-sm font-medium text-brand-700">Lecturer workspace</p>
            )}
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {isDepartmentAdmin
                ? `Students in ${stats.department_name || "your department"} — ${stats.students} total`
                : "Create assessments and review aptitude or interview analytics from dedicated pages."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/assessments/create"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700 sm:w-auto"
            >
              Create assessment <FilePlus2 size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Aggregate stat cards */}
      {hasAptitude ? (
        <section className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <StatCard label="Assessments" value={stats.assessments} icon={BookOpenCheck} />
          <StatCard label="Published" value={stats.published} icon={BarChart3} tone="green" />
          <StatCard label="Students" value={stats.students} icon={Users} tone="amber" />
          <StatCard label="Submissions" value={stats.submitted_attempts} icon={Clock3} tone="slate" />
        </section>
      ) : null}

      {hasAptitude ? (
        <section className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <StatCard label="In progress" value={stats.in_progress_attempts} icon={Clock3} />
          <StatCard label="Aptitude pass rate" value={`${stats.pass_rate ?? 0}%`} icon={BarChart3} tone="green" />
          <StatCard label="Average aptitude score" value={`${stats.average_percentage ?? 0}%`} icon={BookOpenCheck} tone="amber" />
        </section>
      ) : null}

      {hasInterview ? (
        <section className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4">
          <StatCard label="Interview reports" value={stats.interview_analytics?.reports} icon={Mic2} />
          <StatCard label="Average interview score" value={`${stats.interview_analytics?.average_percentage ?? 0}%`} icon={BarChart3} tone="green" />
        </section>
      ) : null}

      {hasProgramming && programmingStats ? (
        <section className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Coding Problems" value={programmingStats.total_problems} icon={Code2} tone="brand" />
          <StatCard label="Published" value={programmingStats.published_problems} icon={BarChart3} tone="green" />
          <StatCard label="Submissions" value={programmingStats.total_submissions} icon={Users} tone="amber" />
          <StatCard label="Acceptance Rate" value={`${programmingStats.acceptance_rate ?? 0}%`} icon={BarChart3} tone="slate" />
        </section>
      ) : null}

      {/* Year tabs */}
      <section className="mb-4 sm:mb-6">
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
          {yearCounts.map(({ label, count }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveYear(label)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                activeYear === label
                  ? "bg-white text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <GraduationCap size={15} />
              {label} Year
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeYear === label ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-500"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Student grid */}
      <section className="mb-6">
        {yearStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <Users size={32} className="text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">No students in {activeYear} year</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {yearStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onClick={(s) => setSelectedStudent(s.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Export reports */}
      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:mb-6 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Detailed Export Reports</h2>
            <p className="mt-1 text-sm text-slate-500">Download Excel or PDF reports for institution review.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["student-performance", "Student performance"],
            ["assessment-results", "Assessment results"],
            ["interview-readiness", "Interview readiness"],
            ["inactive-students", "Inactive students"],
          ].map(([type, label]) => (
            <div key={type} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm font-semibold text-slate-700">{label}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => downloadAdminExport(type, "xlsx")} className="rounded-lg bg-white p-2 text-accent-700 hover:bg-accent-50" title={`${label} Excel`}>
                  <Download className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => downloadAdminExport(type, "pdf")} className="rounded-lg bg-white p-2 text-slate-700 hover:bg-slate-100" title={`${label} PDF`}>
                  PDF
                </button>
              </div>
            </div>
          ))}
          {hasProgramming ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm font-semibold text-slate-700">Coding progress</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => downloadCodingProgressExport("xlsx")} className="rounded-lg bg-white p-2 text-accent-700 hover:bg-accent-50" title="Coding progress Excel">
                  <Download className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => downloadCodingProgressExport("pdf")} className="rounded-lg bg-white p-2 text-slate-700 hover:bg-slate-100" title="Coding progress PDF">
                  PDF
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Analytics links */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {hasAptitude ? (
          <Link href="/admin/analytics/aptitude" className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 sm:p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <BookOpenCheck size={19} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Aptitude Analytics</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              See each student&apos;s latest aptitude result first, then open all attempts for that student.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
              Open aptitude analytics <ArrowRight size={15} />
            </span>
          </Link>
        ) : null}

        {hasInterview ? (
          <Link href="/admin/analytics/interviews" className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 sm:p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Mic2 size={19} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Interview Analytics</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review student interview reports, scores, grades, ATS scores, and full report details.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
              Open interview analytics <ArrowRight size={15} />
            </span>
          </Link>
        ) : null}

        {hasProgramming ? (
          <Link href="/admin/programming" className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 sm:p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Code2 size={19} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Programming Problems</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create and manage coding problems, review student submissions and track progress.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
              Manage problems <ArrowRight size={15} />
            </span>
          </Link>
        ) : null}
      </section>

      {/* Student detail overlay */}
      {selectedStudent && (
        <StudentDetailPanel
          studentId={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}