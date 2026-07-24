import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, Loader2, Search, Users, Mic2, Clock, TrendingUp, Pencil, X, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function StudentsList() {
  const [searchParams] = useSearchParams();
  const institutionId = searchParams.get("institution_id") || "";
  const [institution, setInstitution] = useState(null);
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ role: "student", limit: "200" });
    if (institutionId) params.set("institution_id", institutionId);
    const adminParams = institutionId ? `?institutionId=${institutionId}` : "";
    Promise.all([
      apiFetch(`/api/master/users?${params.toString()}`),
      apiFetch(`/api/master/admins-list${adminParams}`),
    ])
      .then(([userPayload, adminPayload]) => {
        if (active) {
          setStudents(userPayload.users || []);
          setAdmins(adminPayload.admins || []);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load students.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    if (institutionId) {
      apiFetch(`/api/institutions/${institutionId}`)
        .then((data) => { if (active) setInstitution(data.institution); })
        .catch(() => {});
    } else {
      setInstitution(null);
    }
    return () => { active = false; };
  }, [institutionId]);

  function filteredStudents() {
    let list = students;
    if (selectedAdmin) {
      list = list.filter((s) => {
        const adminId = s.assigned_admin?.id || s.assigned_admin?._id || s.assigned_admin;
        return String(adminId) === selectedAdmin;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
      );
    }
    return list;
  }

  const visible = filteredStudents();

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:mb-6 sm:p-6">
        {institution ? (
          <Link to={`/master-admin/institutions/${institutionId}`}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
            <ArrowLeft size={14} /> Back to {institution.name}
          </Link>
        ) : null}
        <p className="text-sm font-medium text-emerald-600">Master admin tools</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {institution ? `${institution.name} — Students` : "Students"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          {institution
            ? `Student accounts under ${institution.name} (${institution.code}).`
            : "View all student accounts. Filter by assigned admin to see students under a specific administrator."}
        </p>
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="field pl-9"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-72">
          <select
            className="field"
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
          >
            <option value="">All admins</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.email})
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
                Student accounts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {visible.length} student{visible.length !== 1 ? "s" : ""}
                {selectedAdmin ? " under selected admin" : ""}.
              </p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center px-5 py-12 text-sm font-medium text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" />
            Loading students
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Interview</th>
                  <th className="px-4 py-3">Aptitude</th>
                  <th className="px-4 py-3">Assigned Admin</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((s) => {
                  const active = s.is_active !== false;
                  const lastActivity = s.last_activity || s.last_login || s.updated_at;
                  const interviewScore = s.avg_interview_score || s.interview_avg_score;
                  const aptitudeScore = s.avg_aptitude_score || s.aptitude_avg_score;
                  const interviewCount = s.interview_count || s.total_interviews || 0;
                  const aptitudeCount = s.aptitude_count || s.total_aptitude_attempts || 0;
                  return (
                    <tr key={s.id} className={`text-slate-600 ${!active ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{s.institution_name || "—"}</td>
                      <td className="px-4 py-3 text-xs font-medium">{s.department_name || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-600">{lastActivity ? formatDateTime(lastActivity) : "No activity"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {interviewCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Mic2 size={12} className="text-brand-500" />
                            <span className="text-xs font-medium text-slate-900">{interviewCount}</span>
                            {interviewScore != null && (
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                interviewScore >= 80 ? "bg-emerald-50 text-emerald-700"
                                  : interviewScore >= 60 ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}>
                                {Math.round(interviewScore)}%
                              </span>
                            )}
                          </div>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {aptitudeCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <TrendingUp size={12} className="text-accent-500" />
                            <span className="text-xs font-medium text-slate-900">{aptitudeCount}</span>
                            {aptitudeScore != null && (
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                aptitudeScore >= 80 ? "bg-emerald-50 text-emerald-700"
                                  : aptitudeScore >= 60 ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}>
                                {Math.round(aptitudeScore)}%
                              </span>
                            )}
                          </div>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs">{s.assigned_admin_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
                          {active ? "Active" : "On hold"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{formatDateTime(s.created_at)}</span>
                          <button onClick={() => setEditingStudent(s)}
                            className="ml-2 rounded p-1 text-slate-400 transition hover:bg-blue-50 hover:text-blue-500"
                            title="Edit student">
                            <Pencil size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!visible.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan="8">
                      No students found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingStudent && (
        <StudentEditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={() => { setEditingStudent(null); /* refresh */ window.location.reload(); }}
        />
      )}
    </div>
  );
}

function StudentEditModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", usn: "", department_id: "", year: "", target_career_goal: "", organization: "" });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        usn: student.usn || "",
        department_id: student.department_id || "",
        year: student.year || "",
        target_career_goal: student.target_career_goal || "",
        organization: student.organization || "",
      });
      setResult(null);
      if (student.institutionId) {
        apiFetch(`/api/institutions/${student.institutionId}/departments`)
          .then((data) => setDepartments(data.departments || []))
          .catch(() => {});
      }
    }
  }, [student]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      await apiFetch(`/api/mentorship/admin/student-users/${student.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setResult({ type: "success", message: "Student updated successfully" });
      setTimeout(() => onSaved(), 1200);
    } catch (err) {
      setResult({ type: "error", message: err.message || "Failed to update student" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-xl mx-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-950">Edit Student</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {result && (
          <div className={`mb-4 flex items-start gap-2 rounded-xl p-3 text-sm font-medium ${
            result.type === "success" ? "border border-emerald-100 bg-emerald-50 text-emerald-700" : "border border-red-100 bg-red-50 text-red-700"
          }`}>
            {result.type === "success" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Full Name *</label>
              <input className="field" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Email *</label>
              <input className="field" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
              <input className="field" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">USN</label>
              <input className="field" value={form.usn} onChange={(e) => setForm((p) => ({ ...p, usn: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Year</label>
              <select className="field" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}>
                <option value="">Select year</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Department</label>
              <select className="field" value={form.department_id} onChange={(e) => setForm((p) => ({ ...p, department_id: e.target.value }))}>
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Career Goal</label>
              <input className="field" value={form.target_career_goal} onChange={(e) => setForm((p) => ({ ...p, target_career_goal: e.target.value }))} placeholder="e.g. Software Engineer" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Organization</label>
              <input className="field" value={form.organization} onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
            <button disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Pencil size={15} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
