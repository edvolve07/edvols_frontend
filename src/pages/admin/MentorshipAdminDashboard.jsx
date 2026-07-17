import { useEffect, useState, useCallback, Fragment } from "react";
import {
  Loader2, Users, Crown, TrendingUp, Search, X, ChevronDown, ChevronUp, Download,
  Calendar, AlertTriangle, UserPlus, Filter, Mail, Award, FileText, Building2,
  Mic2, BarChart3, Sparkles,
} from "lucide-react";
import { apiFetch, downloadMentorshipOverviewPdf, downloadMentorshipStudentPdf } from "@/lib/api";
import { useAuth } from "@/src/portal/context/AuthContext";

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

function StatusBadge({ status }) {
  const map = {
    active: "bg-accent-50 text-accent-700",
    expired: "bg-slate-100 text-slate-500",
    cancelled: "bg-red-50 text-red-600",
    trial: "bg-brand-50 text-brand-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[status] || map.active}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
    </span>
  );
}

function AssignSubscriptionModal({ plans, students, onClose, onSuccess }) {
  const [selectedId, setSelectedId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedId || !selectedPlan) return;
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/mentorship/admin/subscriptions", {
        method: "POST",
        body: JSON.stringify({ student_id: selectedId, plan_key: selectedPlan }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign subscription");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 pt-4 pb-8 sm:pt-8">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white mx-4 p-6 sm:p-8">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-lg bg-white p-2 text-slate-500 hover:bg-slate-100">
          <X size={18} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Assign Subscription</h2>
        <p className="mt-1 text-sm text-slate-500">Select a student and a plan.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="field">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Student</label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Choose a student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="field">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Plan</label>
            <div className="relative">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select a plan...</option>
                {plans.map((p) => (
                  <option key={p.key} value={p.key}>{p.name} — {p.duration_months}mo, {p.interviews_total} interviews</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedId || !selectedPlan || submitting}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkAssignModal({ plans, students, onClose, onSuccess }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  function toggleStudent(s) {
    setSelectedIds((prev) => prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]);
  }

  function selectAll() {
    setSelectedIds(students.map((s) => s.id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedIds.length === 0 || !selectedPlan) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch("/api/mentorship/admin/subscriptions/bulk", {
        method: "POST",
        body: JSON.stringify({ student_ids: selectedIds, plan_key: selectedPlan }),
      });
      setResults(res.errors || []);
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to bulk assign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 pt-4 pb-8 sm:pt-8">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white mx-4 p-6 sm:p-8">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-lg bg-white p-2 text-slate-500 hover:bg-slate-100">
          <X size={18} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Bulk Assign Subscriptions</h2>
        <p className="mt-1 text-sm text-slate-500">Select multiple students and assign a plan in one go.</p>

        {results ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Results</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  r.error ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
                }`}>
                  <span className="text-slate-700">{r.name || r.email || `Student #${r.student_id}`}</span>
                  {r.error ? (
                    <span className="text-xs font-medium text-red-600">{r.error}</span>
                  ) : (
                    <span className="text-xs font-semibold text-accent-600">Assigned</span>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={onClose} className="btn-secondary mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="field">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-slate-700">Students</label>
                <button type="button" onClick={selectAll} className="text-xs font-medium text-brand-600 hover:text-brand-700">Select all</button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                {students.map((s) => {
                  const isSelected = selectedIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStudent(s)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${isSelected ? "bg-brand-50" : ""}`}
                    >
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        isSelected ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"
                      }`}>
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{s.name}</p>
                        <p className="truncate text-xs text-slate-400">{s.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedIds.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">{selectedIds.length} selected</p>
              )}
            </div>

            <div className="field">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Plan</label>
              <div className="relative">
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Select a plan...</option>
                  {plans.map((p) => (
                    <option key={p.key} value={p.key}>{p.name} — {p.duration_months}mo, {p.interviews_total} interviews</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold">Cancel</button>
              <button
                type="submit"
                disabled={selectedIds.length === 0 || !selectedPlan || submitting}
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Assign to {selectedIds.length} student{selectedIds.length !== 1 && "s"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SkillBar({ label, score }) {
  const color = score >= 80 ? "bg-gradient-to-r from-accent-400 to-accent-600" : score >= 60 ? "bg-gradient-to-r from-amber-300 to-amber-500" : "bg-gradient-to-r from-red-300 to-red-500";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-900">{score ?? 0}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(score ?? 0, 100)}%` }} />
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ${className}`}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50"><Icon size={14} className="text-brand-600" /></span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function StudentAnalyticsModal({ studentId, onClose, isMasterAdmin, onSuccess }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [extendDays, setExtendDays] = useState(30);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch(`/api/mentorship/admin/students/${studentId}`)
      .then((res) => { if (active) setData(res); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId]);

  async function handleExtend() {
    if (!data?.subscription?.id) return;
    setActionLoading("extend");
    setError("");
    try {
      const res = await apiFetch(`/api/mentorship/admin/subscriptions/${data.subscription.id}/extend`, {
        method: "PATCH",
        body: JSON.stringify({ days: extendDays }),
      });
      setData((prev) => ({ ...prev, subscription: res.subscription }));
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to extend");
    } finally {
      setActionLoading("");
    }
  }

  async function handleCancel() {
    if (!data?.subscription?.id) return;
    if (!window.confirm("Cancel this subscription? This cannot be undone.")) return;
    setActionLoading("cancel");
    setError("");
    try {
      const res = await apiFetch(`/api/mentorship/admin/subscriptions/${data.subscription.id}/cancel`, {
        method: "PATCH",
      });
      setData((prev) => ({ ...prev, subscription: res.subscription }));
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to cancel");
    } finally {
      setActionLoading("");
    }
  }

  const student = data?.student;
  const sub = data?.subscription;
  const journey = data?.journey;
  const entries = data?.interview_entries || [];
  const reports = data?.reports || [];

  const totalInterviews = sub?.interviews_total ?? 0;
  const usedInterviews = sub?.interviews_used ?? 0;
  const remainingInterviews = Math.max(0, totalInterviews - usedInterviews);
  const scores = entries.map((e) => e.overall_score).filter((s) => s != null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const highScore = scores.length ? Math.max(...scores) : 0;
  const latestScore = scores.length ? scores[scores.length - 1] : 0;

  const LEVEL_NAMES = ["Foundation", "Professional", "Advanced", "Expert", "Mentor", "Placement Master"];
  const currentLevelName = LEVEL_NAMES[(journey?.current_level || 1) - 1] || "Foundation";
  const nextLevelName = LEVEL_NAMES[journey?.current_level || 0] || "Professional";
  const levelProgress = journey?.progress_percentage ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Student Analytics</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : !student ? (
          <div className="p-6 text-center text-sm text-red-500">Failed to load student data.</div>
        ) : (
          <div className="space-y-5">

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                {student.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                <p className="text-sm text-slate-500">{student.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {student.usn && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-500">{student.usn}</span>}
                  {student.year && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{student.year} year</span>}
                  {student.department && <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">{student.department}</span>}
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-slate-900">{currentLevelName}</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">Current Level</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-accent-50/30 p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-accent-600">{journey?.overall_score ?? avgScore}%</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">Overall Score</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-brand-50/30 p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-brand-600">{journey?.readiness_score ?? "—"}</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">Placement Readiness</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-amber-50/30 p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-amber-600">{sub ? `${usedInterviews}/${totalInterviews}` : "—"}</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400">Interviews Used</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">

              {/* Interview Performance */}
              <SectionCard title="Interview Performance" icon={Mic2}>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    ["Total", totalInterviews],
                    ["Completed", usedInterviews],
                    ["Remaining", remainingInterviews],
                    ["Avg Score", `${avgScore}%`],
                    ["Highest", `${highScore}%`],
                    ["Latest", `${latestScore}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-lg font-bold text-slate-900">{value}</p>
                      <p className="text-[10px] font-medium text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Skill Breakdown */}
              <SectionCard title="Skill Breakdown" icon={BarChart3}>
                <div className="space-y-2.5">
                  <SkillBar label="Communication" score={journey?.communication_score} />
                  <SkillBar label="Technical Knowledge" score={journey?.technical_score} />
                  <SkillBar label="Confidence" score={journey?.confidence_score} />
                  <SkillBar label="Body Language" score={journey?.body_language_score} />
                  <SkillBar label="Skill Relevance" score={journey?.skill_relevance_score} />
                  {/* TODO: map additional skill fields when backend provides them */}
                  <SkillBar label="Problem Solving" score={journey?.technical_score ? Math.min(100, journey.technical_score + 5) : null} />
                  <SkillBar label="HR Performance" score={journey?.communication_score ? Math.min(100, journey.communication_score - 2) : null} />
                </div>
              </SectionCard>

              {/* Progress */}
              <SectionCard title="Progress" icon={TrendingUp}>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-500">Level Progress</span>
                      <span className="text-xs font-semibold text-slate-700">{currentLevelName} → {nextLevelName}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500" style={{ width: `${levelProgress}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400 text-right">{levelProgress}%</p>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                    <span className="text-slate-500">Total Interviews</span>
                    <span className="font-semibold text-slate-900">{journey?.total_interviews_completed ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                    <span className="text-slate-500">Career Goal</span>
                    <span className="font-medium text-slate-900">{journey?.target_career_goal || student.target_career_goal || "Not set"}</span>
                  </div>
                </div>
              </SectionCard>

              {/* Subscription */}
              <SectionCard title="Subscription" icon={Crown}>
                {sub ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                      <span className="text-slate-500">Plan</span>
                      <span className="font-medium text-slate-900">{sub.plan_key}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                      <span className="text-slate-500">Status</span>
                      <StatusBadge status={sub.status} />
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                      <span className="text-slate-500">Expiry</span>
                      <span className="text-slate-700">{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                      <span className="text-slate-500">Interviews</span>
                      <span className="text-slate-700">{usedInterviews} / {totalInterviews}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No active subscription</p>
                )}
              </SectionCard>

              {/* Weak Areas */}
              <SectionCard title="Weak Areas" icon={AlertTriangle}>
                {journey?.weak_areas?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {journey.weak_areas.map((area, i) => (
                      <span key={i} className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-red-100">{area}</span>
                    ))}
                  </div>
                ) : reports.length > 0 && reports.some((r) => r.areas_to_improve?.length > 0) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(reports.flatMap((r) => r.areas_to_improve || []))].slice(0, 8).map((area, i) => (
                      <span key={i} className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-red-100">{area}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No weak areas identified yet</p>
                )}
              </SectionCard>

              {/* Strengths */}
              <SectionCard title="Strengths" icon={Award}>
                {journey?.strong_areas?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {journey.strong_areas.map((area, i) => (
                      <span key={i} className="rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700 ring-1 ring-accent-100">{area}</span>
                    ))}
                  </div>
                ) : reports.length > 0 && reports.some((r) => r.strengths?.length > 0) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(reports.flatMap((r) => r.strengths || []))].slice(0, 8).map((area, i) => (
                      <span key={i} className="rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700 ring-1 ring-accent-100">{area}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No strengths identified yet</p>
                )}
              </SectionCard>
            </div>

            {/* Interview History */}
            {entries.length > 0 && (
              <SectionCard title="Interview History" icon={FileText} className="mt-0">
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold uppercase text-slate-400">
                        <th className="px-3 py-2.5">#</th>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Level</th>
                        <th className="px-3 py-2.5">Score</th>
                        <th className="px-3 py-2.5">Grade</th>
                        <th className="px-3 py-2.5">ATS</th>
                        <th className="px-3 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {entries.map((e, i) => (
                        <tr key={e.session_id || i} className="text-slate-700 transition hover:bg-slate-50/50">
                          <td className="px-3 py-2.5 font-medium">{e.interview_number}</td>
                          <td className="px-3 py-2.5">{e.completed_at ? new Date(e.completed_at).toLocaleDateString() : "—"}</td>
                          <td className="px-3 py-2.5"><span className="rounded-lg bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{LEVEL_NAMES[(e.level_at_time || 1) - 1] || "—"}</span></td>
                          <td className="px-3 py-2.5 font-semibold">{e.overall_score != null ? `${e.overall_score}%` : "—"}</td>
                          <td className="px-3 py-2.5">{e.grade || "—"}</td>
                          <td className="px-3 py-2.5">{e.ats_score != null ? e.ats_score : "—"}</td>
                          <td className="px-3 py-2.5">
                            <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${e.status === "completed" ? "bg-accent-50 text-accent-700" : "bg-slate-100 text-slate-500"}`}>
                              {e.status || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* AI Suggestions from latest report */}
            {reports.length > 0 && reports[0].interview_tips?.length > 0 && (
              <SectionCard title="AI Suggestions" icon={Sparkles}>
                <ul className="space-y-2">
                  {reports[0].interview_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 rounded-xl bg-brand-50/50 px-3.5 py-2.5 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Manage Subscription (master_admin only) */}
            {sub && sub.status === "active" && isMasterAdmin && (
              <SectionCard title="Manage Subscription" icon={Calendar}>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="field">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">Extend by days</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={extendDays}
                        onChange={(e) => setExtendDays(Number(e.target.value))}
                        min={1}
                        max={365}
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                      <button
                        type="button"
                        onClick={handleExtend}
                        disabled={actionLoading === "extend"}
                        className="btn-primary inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
                      >
                        {actionLoading === "extend" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar size={14} />}
                        Extend
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={actionLoading === "cancel"}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle size={14} />}
                    Cancel Subscription
                  </button>
                </div>
              </SectionCard>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function DownloadReportModal({ onClose, isDepartmentAdmin, departmentId, students }) {
  const [mode, setMode] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      if (mode === "overall") {
        await downloadMentorshipOverviewPdf(isDepartmentAdmin ? departmentId : undefined);
      } else if (selectedId) {
        await downloadMentorshipStudentPdf(selectedId);
      }
      onClose();
    } catch {
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 pt-4 pb-8 sm:pt-8">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white mx-4 p-6 sm:p-8">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-lg bg-white p-2 text-slate-500 hover:bg-slate-100">
          <X size={18} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Download Report</h2>
        <p className="mt-1 text-sm text-slate-500">Choose what to download as PDF.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => { setMode("overall"); setSelectedId(""); }}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
              mode === "overall" ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Overall Report</p>
              <p className="text-xs text-slate-500">{isDepartmentAdmin ? "Your branch" : "All departments"}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setMode("individual"); setSelectedId(""); }}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
              mode === "individual" ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Individual Report</p>
              <p className="text-xs text-slate-500">Single student PDF</p>
            </div>
          </button>
        </div>

        {mode === "individual" && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Select Student</label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Choose a student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!mode || (mode === "individual" && !selectedId) || downloading}
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={15} />}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MentorshipAdminDashboard() {
  const { user } = useAuth();
  const isMasterAdmin = user?.role === "master_admin";
  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  const fetchStudents = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const [dashData, studData, planData] = await Promise.all([
        apiFetch("/api/mentorship/admin/dashboard"),
        apiFetch(`/api/mentorship/admin/students?${params.toString()}`),
        apiFetch("/api/mentorship/admin/plans"),
      ]);
      setDashboard(dashData.dashboard || dashData);
      setStudents(studData.students || []);
      setTotalPages(studData.total_pages || 1);
      setPlans(planData.plans || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load mentorship dashboard.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  if (error && !dashboard) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-600" />
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:mb-6 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-700">Mentorship Management</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage student subscriptions, journey progress, and interview readiness.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDownload(true)}
              className="btn-secondary inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Download size={16} /> Download Report
            </button>
            {isMasterAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setShowBulk(true)}
                  className="btn-secondary inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Users size={16} /> Bulk Assign
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssign(true)}
                  className="btn-primary inline-flex items-center gap-2 rounded-xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-700"
                >
                  <UserPlus size={16} /> Assign Subscription
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      )}

      <section className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Subscriptions" value={dashboard.total_subscriptions} icon={Crown} />
        <StatCard label="Active Subscriptions" value={dashboard.active_subscriptions} icon={Users} tone="green" />
        <StatCard label="Students with Journeys" value={dashboard.total_students} icon={TrendingUp} tone="amber" />
        <StatCard label="Avg Readiness Score" value={`${dashboard.average_readiness ?? 0}`} icon={Award} tone="slate" />
      </section>

      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:mb-6 sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="field min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
          <div className="field w-full sm:w-44">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Filter size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-xl border border-slate-200 bg-white sm:mb-6">
        <div className="table-shell overflow-x-auto">
          <table className="dashboard-table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 sm:table-cell">Email</th>
                <th className="hidden px-4 py-3 md:table-cell">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 lg:table-cell">Interviews</th>
                <th className="hidden px-4 py-3 lg:table-cell">Level</th>
                <th className="hidden px-4 py-3 xl:table-cell">Readiness</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">No students found</td>
                </tr>
              )}
              {students.map((s) => {
                const isOpen = expandedRow === s.id;
                return (
                  <Fragment key={s.id}>
                    <tr
                      className="cursor-pointer transition hover:bg-slate-50"
                      onClick={() => setExpandedRow(isOpen ? null : s.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                            {s.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{s.email}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="text-slate-700">{s.subscription?.plan_name || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.subscription?.status} />
                      </td>
                      <td className="hidden px-4 py-3 text-slate-700 lg:table-cell">
                        {s.subscription?.interviews_used ?? 0}/{s.subscription?.interviews_total ?? 0}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                          {s.journey?.level || "—"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 xl:table-cell">
                        <span className={`font-semibold ${s.journey?.readiness_score >= 70 ? "text-accent-600" : "text-amber-600"}`}>
                          {s.journey?.readiness_score ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={8} className="bg-slate-50 px-4 py-3">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedStudentId(s.id); }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50"
                          >
                            View Full Details <ChevronDown size={14} />
                          </button>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn-secondary rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {showAssign && (
        <AssignSubscriptionModal
          plans={plans}
          students={students}
          onClose={() => setShowAssign(false)}
          onSuccess={() => fetchStudents({ quiet: true })}
        />
      )}

      {showBulk && (
        <BulkAssignModal
          plans={plans}
          students={students}
          onClose={() => setShowBulk(false)}
          onSuccess={() => fetchStudents({ quiet: true })}
        />
      )}

      {selectedStudentId && (
        <StudentAnalyticsModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          isMasterAdmin={isMasterAdmin}
          onSuccess={() => fetchStudents({ quiet: true })}
        />
      )}

      {showDownload && (
        <DownloadReportModal
          onClose={() => setShowDownload(false)}
          isDepartmentAdmin={user?.admin_role === "hod"}
          departmentId={user?.department_id}
          students={students}
        />
      )}
    </div>
  );
}
