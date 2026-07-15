import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, Check, Edit3, ExternalLink, Eye, Loader2, Plus, Save, Search, Trash2, X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const MODULE_LABELS = {
  aptitude: "Aptitude",
  coding: "Coding",
  interviews: "AI Interviews",
  resumeBuilder: "Resume Builder",
  certificates: "Certificates",
};

function InstitutionFormModal({ institution, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: institution?.name || "",
    code: institution?.code || "",
    email: institution?.email || "",
    phone: institution?.phone || "",
    address: institution?.address || "",
    status: institution?.status || "active",
    modules: institution?.modules || {
      aptitude: true, coding: true, interviews: true, resumeBuilder: false, certificates: true,
    },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleModule(key) {
    setForm((prev) => ({
      ...prev,
      modules: { ...prev.modules, [key]: !prev.modules[key] },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const method = institution ? "PATCH" : "POST";
      const url = institution ? `/api/institutions/${institution.id}` : "/api/institutions";
      await apiFetch(url, {
        method,
        body: JSON.stringify(form),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Unable to save institution.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 py-12 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-slate-950">{institution ? "Edit Institution" : "Create Institution"}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {institution ? "Update institution details and module access." : "Register a new institution on the platform."}
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Institution Name *</label>
            <input className="field" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Institution Code *</label>
            <input className="field uppercase" placeholder="e.g. MIT" value={form.code} onChange={(e) => update("code", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Email *</label>
            <input className="field" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Phone Number</label>
            <input className="field" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Status</label>
            <select className="field" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Address</label>
            <textarea className="field min-h-[60px]" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">Modules</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MODULE_LABELS).map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => toggleModule(key)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    form.modules[key]
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {form.modules[key] ? <Check size={14} /> : <X size={14} />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            Cancel
          </button>
          <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70">
            {saving ? <>Saving... <Loader2 size={15} className="animate-spin" /></> : <><Save size={15} /> {institution ? "Update" : "Create"}</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteConfirmModal({ institution, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await apiFetch(`/api/institutions/${institution.id}`, { method: "DELETE" });
      onDeleted();
      onClose();
    } catch (err) {
      setError(err.message || "Unable to delete institution.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-950">Delete Institution</h2>
        <p className="mt-2 text-sm text-slate-600">
          Are you sure you want to delete <strong>{institution.name}</strong> ({institution.code})?
          This action cannot be undone.
        </p>
        {error ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button>
          <button disabled={deleting} onClick={handleDelete} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-70">
            {deleting ? "Deleting..." : "Delete"}
            {deleting && <Loader2 size={15} className="animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewInstitutionModal({ institution, onClose }) {
  if (!institution) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 py-12 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-slate-950">{institution.name}</h2>
        <p className="mt-1 text-sm text-slate-500">Code: {institution.code}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-1 text-sm text-slate-800">{institution.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
            <p className="mt-1 text-sm text-slate-800">{institution.phone || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</p>
            <p className="mt-1 text-sm text-slate-800">{institution.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Admins</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{institution.total_admins ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Students</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{institution.total_students ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              institution.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${institution.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
              {institution.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
            <p className="mt-1 text-sm text-slate-800">{formatDateTime(institution.created_at)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Enabled Modules</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(MODULE_LABELS).map(([key, label]) => (
                <span key={key} className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${
                  institution.modules?.[key]
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Institutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function loadInstitutions() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    apiFetch(`/api/institutions?${params.toString()}`)
      .then((data) => setInstitutions(data.institutions || []))
      .catch((err) => setError(err.message || "Unable to load institutions."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadInstitutions(); }, [search, statusFilter]);

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:mb-6 sm:p-6">
        <p className="text-sm font-medium text-emerald-600">Master admin tools</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Institutions
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          Manage institutions, their module access, and view associated admins and students.
        </p>
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      ) : null}

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="field pl-9" placeholder="Search by name, code, or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="field sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600">
          <Plus size={16} />
          <span className="hidden sm:inline">Create Institution</span>
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Institution accounts</h2>
              <p className="mt-1 text-sm text-slate-500">{institutions.length} institution{institutions.length !== 1 ? "s" : ""}.</p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center px-5 py-12 text-sm font-medium text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" />
            Loading institutions
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Admins</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Modules</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {institutions.map((inst) => (
                  <tr key={inst.id} className="text-slate-600">
                    <td className="px-4 py-3">
                      <Link to={`/master-admin/institutions/${inst.id}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-slate-950 hover:text-emerald-600">
                        {inst.name}
                        <ExternalLink size={13} className="text-slate-400" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">{inst.code}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{inst.email}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{inst.total_admins ?? 0}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{inst.total_students ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(MODULE_LABELS).map(([key, label]) => (
                          <span key={key} className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            inst.modules?.[key] ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                          }`}>{label}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        inst.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${inst.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                        {inst.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewing(inst)} title="View details"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => { setEditing(inst); setShowForm(true); }} title="Edit"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-emerald-600">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(inst)} title="Delete"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!institutions.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan="8">No institutions found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm ? (
        <InstitutionFormModal institution={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={loadInstitutions} />
      ) : null}
      {viewing ? (
        <ViewInstitutionModal institution={viewing} onClose={() => setViewing(null)} />
      ) : null}
      {deleteTarget ? (
        <DeleteConfirmModal institution={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={loadInstitutions} />
      ) : null}
    </div>
  );
}


