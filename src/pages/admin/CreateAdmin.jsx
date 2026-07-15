import { useEffect, useMemo, useState } from "react";
import {
  Building2, FileSpreadsheet, KeyRound, Loader2, Phone, Plus, Save, ShieldCheck, Upload, Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

function generateTempPassword(name) {
  const base = String(name || "user").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 10) || "user";
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}@${random}`;
}

export default function CreateAdmin() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", organization: "", modules_access: "both", institutionId: "" });
  const [importForm, setImportForm] = useState({ file: null, modules_access: "both", institutionId: "" });
  const [institutions, setInstitutions] = useState([]);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [emailHelp, setEmailHelp] = useState("");

  const tempPassword = useMemo(() => generateTempPassword(form.name), [form.name]);

  useEffect(() => {
    apiFetch("/api/master/institutions-list")
      .then((data) => setInstitutions(data.institutions || []))
      .catch(() => {});
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function createAdmin(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setResult(null);
    try {
      const res = await apiFetch("/api/master/admins", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setResult(res);
      setEmailHelp(res.email_sent ? "Credentials sent to admin's email." : "Email service not configured. Share the temp password manually.");
      setForm({ name: "", email: "", phone: "", organization: "", modules_access: "both", institutionId: "" });
    } catch (err) {
      setError(err.message || "Unable to create admin.");
    } finally {
      setCreating(false);
    }
  }

  async function importAdmins(event) {
    event.preventDefault();
    if (!importForm.file) { setError("Choose a CSV or Excel file."); return; }
    setImporting(true);
    setImportResult(null);
    setError("");
    try {
      const body = new FormData();
      body.append("file", importForm.file);
      body.append("modules_access", importForm.modules_access);
      const res = await apiFetch("/api/master/admins/import", { method: "POST", body });
      setImportResult(res);
      setImportForm({ file: null, modules_access: "both" });
      event.target.reset();
    } catch (err) {
      setError(err.message || "Unable to import admins.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:mb-6 sm:p-6">
        <p className="text-sm font-medium text-emerald-600">Master admin tools</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Create Admin
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          Create admin accounts with module access. Temp password auto-generated and shown below.
          An email with login credentials will be sent if email service is configured.
        </p>
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 grid gap-4 sm:mb-6 lg:grid-cols-2 lg:gap-6">
        <form onSubmit={createAdmin} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Single Admin</h2>
              <p className="mt-1 text-sm text-slate-500">Create one admin at a time.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <input className="field" placeholder="Full name *" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
            <input className="field" type="email" placeholder="Email *" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="field pl-8" placeholder="Phone number" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            </div>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="field pl-8" placeholder="Organization name" value={form.organization} onChange={(e) => updateField("organization", e.target.value)} />
            </div>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="field pl-8" value={form.institutionId} onChange={(e) => updateField("institutionId", e.target.value)}>
                <option value="">Select institution</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.code})</option>
                ))}
              </select>
            </div>
            <select className="field" value={form.modules_access} onChange={(e) => updateField("modules_access", e.target.value)}>
              <option value="both">All modules</option>
              <option value="ai_interview">AI Interview only</option>
              <option value="aptitude">Aptitude only</option>
              <option value="programming">Programming only</option>
            </select>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="field pl-8 font-mono text-xs" value={tempPassword} readOnly tabIndex={-1} />
            </div>
            <button disabled={creating} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600 disabled:opacity-70">
              <Save size={15} />
              {creating ? "Creating..." : "Create Admin"}
            </button>
          </div>
          {result ? (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="font-semibold">Admin created: {result.user.name}</p>
              <p className="mt-1 text-xs">Email: {result.user.email}</p>
              <p className="mt-1 font-mono text-xs">Temp password: {result.temp_password}</p>
              <p className="mt-1 text-xs">{emailHelp}</p>
            </div>
          ) : null}
        </form>

        <form onSubmit={importAdmins} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Bulk Upload Admins</h2>
              <p className="mt-1 text-sm text-slate-500">Upload CSV or Excel to create multiple admins at once.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <input className="field" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setImportForm({ ...importForm, file: e.target.files?.[0] || null })} required />
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select className="field pl-8" value={importForm.institutionId} onChange={(e) => setImportForm({ ...importForm, institutionId: e.target.value })}>
                <option value="">Select institution</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.code})</option>
                ))}
              </select>
            </div>
            <select className="field" value={importForm.modules_access} onChange={(e) => setImportForm({ ...importForm, modules_access: e.target.value })}>
              <option value="both">All modules (default)</option>
              <option value="ai_interview">AI Interview only</option>
              <option value="aptitude">Aptitude only</option>
              <option value="programming">Programming only</option>
            </select>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
              Temp passwords auto-generated as <strong className="font-mono">name@XXXX</strong> for each row.
              File columns: <span className="font-semibold text-slate-700">name</span>, <span className="font-semibold text-slate-700">email</span>,{" "}
              <span className="font-semibold text-slate-700">phone</span>, <span className="font-semibold text-slate-700">organization</span>
            </p>
            <button disabled={importing} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70">
              <Upload size={15} />
              {importing ? "Importing..." : "Upload & create admins"}
            </button>
          </div>
          {importResult ? (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="font-semibold">{importResult.created} admins created from {importResult.total_rows} rows</p>
              {importResult.errors?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {importResult.errors.slice(0, 4).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              ) : null}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
