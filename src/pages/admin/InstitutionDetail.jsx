import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, BookOpenCheck, BrainCircuit, Building2, Loader2,
  Mail, Phone, Plus, ShieldCheck, Trash2, TrendingUp, Upload, UserCog, Users, X, KeyRound, GraduationCap, Building,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const MODULE_LABELS = {
  aptitude: "Aptitude",
  coding: "Coding",
  interviews: "AI Interviews",
  resumeBuilder: "Resume Builder",
  certificates: "Certificates",
};

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

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.bg}`}>
          <Icon size={20} className={color.text} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ModuleBadge({ enabled, label }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
      enabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
    }`}>
      {label}
    </span>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BulkImportResult({ result }) {
  if (!result) return null;
  const isSuccess = result.type === "success";
  const hasCounts = result.total !== undefined;
  return (
    <div className={`rounded-xl p-3 text-sm ${isSuccess ? "border border-emerald-100 bg-emerald-50" : "border border-red-100 bg-red-50"}`}>
      <p className={`font-semibold ${isSuccess ? "text-emerald-800" : "text-red-700"}`}>
        {result.message}
      </p>
      {result.type === "success" ? (
        <div className="mt-2 space-y-1">
          {hasCounts ? (
            <p className="text-xs text-emerald-700">{result.created} created, {result.skipped} skipped out of {result.total} row(s)</p>
          ) : null}
          {result.tempPassword ? (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-emerald-700">Email: {result.email}</p>
              {result.department_name ? <p className="text-xs text-emerald-700">Department: {result.department_name}</p> : null}
              <p className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-semibold text-emerald-900">
                <KeyRound size={12} /> {result.tempPassword}
              </p>
              <p className={`mt-2 text-xs ${result.email_sent ? "text-emerald-600" : "text-amber-600"}`}>
                {result.email_sent ? "Email sent with login details." : "Email could not be sent (SMTP not configured)."}
              </p>
            </div>
          ) : null}
          {result.passwordSample?.length ? (
            <div className="mt-2 grid gap-1">
              <p className="text-xs font-semibold text-emerald-700">Sample temp passwords:</p>
              {result.passwordSample.slice(0, 5).map((s, i) => (
                <p key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 font-mono text-xs text-emerald-900">
                  <KeyRound size={10} /> {s.email}: {s.password}
                </p>
              ))}
            </div>
          ) : null}
          {result.errors?.length ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-red-600">{result.errors.length} error(s)</summary>
              <ul className="mt-1 max-h-32 space-y-0.5 overflow-y-auto text-xs text-red-600">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AdminFormModal({ open, onClose, institutionId, departments, onCreated }) {
  const [mode, setMode] = useState("single");
  const [form, setForm] = useState({ name: "", email: "", phone: "", department_id: "", admin_role: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 5000);
    return () => clearTimeout(t);
  }, [result]);

  useEffect(() => {
    if (!open) {
      setForm({ name: "", email: "", phone: "", department_id: "", admin_role: "" });
      setFile(null);
      setResult(null);
      setMode("single");
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const data = await apiFetch("/api/master/admins", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          department_id: form.department_id || null,
          admin_role: form.admin_role,
          institutionId,
        }),
      });
      setResult({ type: "success", message: "Admin created", tempPassword: data.temp_password, email: form.email, email_sent: data.email_sent, department_name: data.user?.department_name });
      setForm({ name: "", email: "", phone: "", department_id: "", admin_role: "" });
      onCreated();
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("institutionId", institutionId);
      const data = await apiFetch("/api/master/admins/import", { method: "POST", body });
      const passwordSample = (data.users || []).slice(0, 5).map((u) => ({ email: u.email, password: u.temp_password }));
      setResult({ type: "success", message: `${data.created} admin(s) created from ${data.total_rows} row(s)${data.skipped ? `, ${data.skipped} skipped` : ""}`, created: data.created, skipped: data.skipped, total: data.total_rows, errors: data.errors, passwordSample });
      setFile(null);
      e.target.reset();
      onCreated();
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Admin">
      <div className="mb-4 flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        <button type="button" onClick={() => { setMode("single"); setResult(null); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === "single" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Single</button>
        <button type="button" onClick={() => { setMode("bulk"); setResult(null); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === "bulk" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Bulk Upload</button>
      </div>
      {mode === "single" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <BulkImportResult result={result} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field sm:col-span-2" placeholder="Full name *" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="field pl-8" type="email" placeholder="Email *" value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="field pl-8" placeholder="Phone" value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="relative">
              <ShieldCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="field pl-8" value={form.admin_role}
                onChange={(e) => setForm((p) => ({ ...p, admin_role: e.target.value }))}>
                <option value="">Select role</option>
                <option value="hod">HOD</option>
                <option value="placement_officer">Placement Officer</option>
              </select>
            </div>
            <div className="relative">
              <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="field pl-8" value={form.department_id}
                onChange={(e) => setForm((p) => ({ ...p, department_id: e.target.value }))}>
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
            <button disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {saving ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <BulkImportResult result={result} />
          <input className="field" type="file" accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
            Columns: <span className="font-semibold text-slate-700">name</span>,{" "}
            <span className="font-semibold text-slate-700">email</span>,{" "}
            <span className="font-semibold text-slate-700">phone</span>,{" "}
            <span className="font-semibold text-slate-700">department</span>,{" "}
            <span className="font-semibold text-slate-700">admin_role</span>
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
            <button disabled={saving || !file}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {saving ? "Importing..." : "Upload & create"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function StudentFormModal({ open, onClose, institutionId, departments, onCreated }) {
  const [mode, setMode] = useState("single");
  const [form, setForm] = useState({ name: "", email: "", phone: "", usn: "", department_id: "", year: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 5000);
    return () => clearTimeout(t);
  }, [result]);

  useEffect(() => {
    if (!open) {
      setForm({ name: "", email: "", phone: "", usn: "", department_id: "", year: "" });
      setFile(null);
      setResult(null);
      setMode("single");
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const data = await apiFetch("/api/master/users/create-with-details", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          usn: form.usn,
          department_id: form.department_id || null,
          year: form.year,
          institutionId,
        }),
      });
      setResult({ type: "success", message: "Student created", tempPassword: data.temp_password, email: form.email, email_sent: data.email_sent, department_name: data.user?.department_name });
      setForm({ name: "", email: "", phone: "", usn: "", department_id: "", year: "" });
      onCreated();
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("institutionId", institutionId);
      const data = await apiFetch("/api/master/users/import-with-details", { method: "POST", body });
      const passwordSample = (data.users || []).slice(0, 5).map((u) => ({ email: u.email, password: u.temp_password }));
      setResult({ type: "success", message: `${data.created} student(s) created from ${data.total_rows} row(s)${data.skipped ? `, ${data.skipped} skipped` : ""}`, created: data.created, skipped: data.skipped, total: data.total_rows, errors: data.errors, passwordSample });
      setFile(null);
      e.target.reset();
      onCreated();
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Student">
      <div className="mb-4 flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        <button type="button" onClick={() => { setMode("single"); setResult(null); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === "single" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Single</button>
        <button type="button" onClick={() => { setMode("bulk"); setResult(null); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${mode === "bulk" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Bulk Upload</button>
      </div>
      {mode === "single" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <BulkImportResult result={result} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field sm:col-span-2" placeholder="Full name *" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <div className="relative">
              <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="field pl-8" placeholder="USN" value={form.usn}
                onChange={(e) => setForm((p) => ({ ...p, usn: e.target.value }))} />
            </div>
            <div className="relative">
              <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="field pl-8" value={form.department_id}
                onChange={(e) => setForm((p) => ({ ...p, department_id: e.target.value }))}>
                <option value="">Select branch</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="field pl-8" value={form.year}
                onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}>
                <option value="">Select year</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
            </div>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="field pl-8" type="email" placeholder="Email *" value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="field pl-8" placeholder="Phone" value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
            <button disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {saving ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <BulkImportResult result={result} />
          <input className="field" type="file" accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
            Columns: <span className="font-semibold text-slate-700">name</span>,{" "}
            <span className="font-semibold text-slate-700">email</span>,{" "}
            <span className="font-semibold text-slate-700">usn</span>,{" "}
            <span className="font-semibold text-slate-700">department</span>,{" "}
            <span className="font-semibold text-slate-700">year</span>,{" "}
            <span className="font-semibold text-slate-700">phone</span>
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
            <button disabled={saving || !file}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {saving ? "Importing..." : "Upload & create"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function DepartmentModal({ open, onClose, institutionId, onCreated }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) { setName(""); setError(""); }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/institutions/${institutionId}/departments`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setName("");
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Department">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
        ) : null}
        <input className="field" placeholder="Department name *" value={name}
          onChange={(e) => setName(e.target.value)} required autoFocus />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
          <button disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? "Adding..." : "Add Department"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function InstitutionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [institution, setInstitution] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingDept, setDeletingDept] = useState(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/master/users/${deleteTarget.id}`, { method: "DELETE" });
      setAdmins((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      refreshAdmins();
    } catch (err) {
      alert(err.message || "Unable to delete user.");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleDeleteDept(deptId) {
    try {
      await apiFetch(`/api/institutions/${id}/departments/${deptId}`, { method: "DELETE" });
      setDepartments((prev) => prev.filter((d) => d.id !== deptId));
      setDeletingDept(null);
    } catch (err) {
      alert(err.message || "Unable to delete department.");
    }
  }

  function loadDepartments() {
    apiFetch(`/api/institutions/${id}/departments`)
      .then((data) => setDepartments(data.departments || []))
      .catch(() => {});
  }

  function loadInstitution() {
    setLoading(true);
    setError("");
    Promise.all([
      apiFetch(`/api/institutions/${id}`),
      apiFetch(`/api/institutions/${id}/analytics`),
      apiFetch(`/api/institutions/${id}/admins`),
    ])
      .then(([instData, analyticsData, adminsData]) => {
        setInstitution(instData.institution);
        setAnalytics(analyticsData.analytics);
        setAdmins(adminsData.admins || []);
        setDepartments(instData.institution.departments || []);
      })
      .catch((err) => setError(err.message || "Unable to load institution details."))
      .finally(() => setLoading(false));
  }

  function refreshAdmins() {
    Promise.all([
      apiFetch(`/api/institutions/${id}/analytics`),
      apiFetch(`/api/institutions/${id}/admins`),
    ])
      .then(([analyticsData, adminsData]) => {
        setAnalytics(analyticsData.analytics);
        setAdmins(adminsData.admins || []);
      })
      .catch(() => {});
  }

  function loadStudents() {
    setStudentsLoading(true);
    apiFetch(`/api/master/users?institution_id=${id}&role=student&limit=200`)
      .then((data) => setStudents(data.users || []))
      .catch(() => {})
      .finally(() => setStudentsLoading(false));
  }

  useEffect(() => { loadInstitution(); }, [id]);
  useEffect(() => { if (institution) loadStudents(); }, [institution?.id]);

  const refreshAnalytics = useCallback(() => {
    apiFetch(`/api/institutions/${id}/analytics`)
      .then((data) => setAnalytics(data.analytics))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!institution) return;
    const id_interval = window.setInterval(refreshAnalytics, 30 * 1000);
    return () => window.clearInterval(id_interval);
  }, [institution, refreshAnalytics]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-12 sm:px-6 sm:py-16">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
          Loading institution
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6">
        <button onClick={() => navigate("/master-admin/institutions")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
          <ArrowLeft size={16} /> Back to Institutions
        </button>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      </div>
    );
  }

  if (!institution) return null;

  const a = analytics || {};

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <button onClick={() => navigate("/master-admin/institutions")}
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
        <ArrowLeft size={14} /> Back to Institutions
      </button>

      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:mb-6 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                {institution.name}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {institution.code} &middot; {institution.email}
                {institution.phone ? ` &middot; ${institution.phone}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              institution.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${institution.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
              {institution.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        {institution.address ? (
          <p className="mt-2 text-sm text-slate-500">{institution.address}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(MODULE_LABELS).map(([key, label]) => (
            <ModuleBadge key={key} enabled={institution.modules?.[key]} label={label} />
          ))}
        </div>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={ShieldCheck} label="Admins" value={a.total_admins ?? 0}
          color={{ bg: "bg-blue-50", text: "text-blue-600" }} />
        <StatCard icon={Users} label="Students" value={a.total_students ?? 0}
          color={{ bg: "bg-violet-50", text: "text-violet-600" }} />
        <StatCard icon={BrainCircuit} label="Assessments" value={a.total_assessments ?? 0}
          color={{ bg: "bg-amber-50", text: "text-amber-600" }} />
        <StatCard icon={BookOpenCheck} label="Attempts" value={a.total_attempts ?? 0}
          color={{ bg: "bg-cyan-50", text: "text-cyan-600" }} />
        <StatCard icon={TrendingUp} label="Avg Score" value={a.average_score ? `${a.average_score}%` : "—"}
          color={{ bg: "bg-emerald-50", text: "text-emerald-600" }} />
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-100 bg-white shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Admins</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{admins.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/master-admin/admins?institution_id=${id}`}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                View all
              </Link>
              <button onClick={() => setShowCreateAdmin(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600">
                <Plus size={13} /> Add
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {admins.length ? admins.slice(0, 10).map((admin) => (
              <div key={admin.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{admin.name}</p>
                  <p className="text-xs text-slate-500">{admin.email}{admin.phone ? ` · ${admin.phone}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    admin.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}>
                    {admin.is_active !== false ? "Active" : "Inactive"}
                  </span>
                  <button onClick={() => setDeleteTarget({ id: admin.id, name: admin.name, type: "admin" })}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Delete admin">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )) : (
              <p className="px-5 py-6 text-center text-sm text-slate-500">No admins found for this institution.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-amber-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Departments</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{departments.length}</span>
            </div>
            <button onClick={() => setShowAddDepartment(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600">
              <Plus size={13} /> Add
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {departments.length ? departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{dept.name}</p>
                  <p className="text-xs text-slate-500">{dept.user_count} user(s)</p>
                </div>
                <button onClick={() => setDeletingDept(dept.id === deletingDept?.id && deletingDept?.confirm ? null : { id: dept.id, confirm: true })}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  title="Delete department">
                  {deletingDept?.id === dept.id && deletingDept?.confirm ? (
                    <span className="flex items-center gap-1 px-1 text-xs font-semibold text-red-500"
                      onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id); }}>
                      Confirm
                    </span>
                  ) : <Trash2 size={14} />}
                </button>
              </div>
            )) : (
              <p className="px-5 py-6 text-center text-sm text-slate-500">No departments yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="mb-6">
        <section className="rounded-2xl border border-slate-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Students</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{students.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/master-admin/students?institution_id=${id}`}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                View all
              </Link>
              <button onClick={() => setShowCreateStudent(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600">
                <Plus size={13} /> Add
              </button>
            </div>
          </div>
          {studentsLoading ? (
            <div className="flex items-center justify-center px-5 py-8 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading students
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {students.length ? students.slice(0, 20).map((student) => (
                <div key={student.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">
                      {student.email}
                      {student.usn ? ` · ${student.usn}` : ""}
                      {student.phone ? ` · ${student.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.assigned_admin_name ? (
                      <span className="text-xs text-slate-400">via {student.assigned_admin_name}</span>
                    ) : null}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      student.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                      {student.is_active !== false ? "Active" : "Inactive"}
                    </span>
                    <button onClick={() => setDeleteTarget({ id: student.id, name: student.name, type: "student" })}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      title="Delete student">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )) : (
                <p className="px-5 py-6 text-center text-sm text-slate-500">No students found for this institution.</p>
              )}
            </div>
          )}
        </section>
      </div>

      <AdminFormModal open={showCreateAdmin} onClose={() => setShowCreateAdmin(false)}
        institutionId={id} departments={departments} onCreated={refreshAdmins} />

      <StudentFormModal open={showCreateStudent} onClose={() => setShowCreateStudent(false)}
        institutionId={id} departments={departments} onCreated={loadStudents} />

      <DepartmentModal open={showAddDepartment} onClose={() => setShowAddDepartment(false)}
        institutionId={id} onCreated={loadDepartments} />

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">Delete {deleteTarget.type}</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {a.recent_admins?.length ? (
        <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-800">Recent Admins Created</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {a.recent_admins.map((admin) => (
              <div key={admin.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{admin.name}</p>
                <p className="text-xs text-slate-500">{admin.email}</p>
                <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(admin.created_at)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
