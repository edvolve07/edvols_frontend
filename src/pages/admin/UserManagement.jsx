import { useEffect, useMemo, useState } from "react";
import {
  Eye, EyeOff, FileSpreadsheet, Loader2, Plus, Save, ShieldOff, Upload, UserCheck, Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

function generateTempPassword(name) {
  const base = String(name || "user").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 10) || "user";
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}@${random}`;
}

function formatDateTime(value) {
  if (!value) return "Open";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [roleSaving, setRoleSaving] = useState("");
  const [actionBusy, setActionBusy] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });

  const tempPassword = useMemo(() => generateTempPassword(form.name), [form.name]);
  const [importForm, setImportForm] = useState({ file: null, role: "admin", password: "" });

  function refresh() {
    return apiFetch("/api/master/users?limit=100").then((payload) => {
      setUsers(payload.users || []);
      return payload;
    });
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh()
      .catch((err) => {
        if (active) setError(err.message || "Unable to load users.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function createUser(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      await apiFetch("/api/master/users", {
        method: "POST",
        body: JSON.stringify({ ...form, password: form.password || tempPassword }),
      });
      setForm({ name: "", email: "", password: "", role: "student" });
      await refresh();
    } catch (err) {
      setError(err.message || "Unable to create user.");
    } finally {
      setCreating(false);
    }
  }

  async function importUsers(event) {
    event.preventDefault();
    if (!importForm.file) {
      setError("Choose a CSV or Excel file to import.");
      return;
    }

    setImporting(true);
    setImportResult(null);
    setError("");
    try {
      const body = new FormData();
      body.append("file", importForm.file);
      body.append("role", importForm.role);
      body.append("role_mode", "fixed");
      body.append("password", importForm.password);

      const result = await apiFetch("/api/master/users/import", {
        method: "POST",
        body,
      });
      setImportResult(result);
      setImportForm({ file: null, role: "admin", password: "" });
      event.target.reset();
      await refresh();
    } catch (err) {
      setError(err.message || "Unable to import users.");
    } finally {
      setImporting(false);
    }
  }

  async function assignRole(userId, role) {
    setRoleSaving(userId);
    setError("");
    try {
      await apiFetch(`/api/master/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await refresh();
    } catch (err) {
      setError(err.message || "Unable to update role.");
    } finally {
      setRoleSaving("");
    }
  }

  async function revokeUser(userId) {
    setActionBusy(userId);
    setError("");
    setConfirm(null);
    try {
      await apiFetch(`/api/master/users/${userId}/revoke`, { method: "PATCH" });
      await refresh();
    } catch (err) {
      setError(err.message || "Unable to revoke access.");
    } finally {
      setActionBusy("");
    }
  }

  async function restoreUser(userId) {
    setActionBusy(userId);
    setError("");
    setConfirm(null);
    try {
      await apiFetch(`/api/master/users/${userId}/restore`, { method: "PATCH" });
      await refresh();
    } catch (err) {
      setError(err.message || "Unable to restore access.");
    } finally {
      setActionBusy("");
    }
  }

  async function deleteUser(userId) {
    setActionBusy(userId);
    setError("");
    setConfirm(null);
    try {
      await apiFetch(`/api/master/users/${userId}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err.message || "Unable to delete user.");
    } finally {
      setActionBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:mb-6 sm:p-6">
        <p className="text-sm font-medium text-emerald-600">Master admin tools</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          User Creation and Role Assignment
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          Create single users, import users from CSV or Excel, and manage roles from one place.
        </p>
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mb-4 grid gap-4 sm:mb-6 lg:grid-cols-2 lg:gap-6">
        <form onSubmit={createUser} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-5 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Create User</h2>
              <p className="mt-1 text-sm text-slate-500">Add a student, admin, or master admin account.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <input
              className="field"
              placeholder="Full name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
            <input
              className="field"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
            <div className="relative">
              <input
                className="field pr-10 font-mono text-xs"
                type="text"
                placeholder="Temporary password"
                value={form.password || tempPassword}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
              {form.password && form.password !== tempPassword ? (
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              ) : null}
            </div>
            <select
              className="field"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
              <option value="master_admin">Master Admin</option>
            </select>
            <button disabled={creating} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600">
              <Save size={16} />
              {creating ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>

        <form onSubmit={importUsers} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-5 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Bulk Upload Users</h2>
              <p className="mt-1 text-sm text-slate-500">Upload CSV or Excel and apply one role to every row.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <input
              className="field"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => setImportForm({ ...importForm, file: event.target.files?.[0] || null })}
              required
            />
            <select
              className="field"
              value={importForm.role}
              onChange={(event) => setImportForm({ ...importForm, role: event.target.value })}
            >
              <option value="student">Set all as Student</option>
              <option value="admin">Set all as Admin</option>
              <option value="master_admin">Set all as Master Admin</option>
            </select>
            <div className="relative">
              <input
                className="field pr-10"
                type={showImportPassword ? 'text' : 'password'}
                placeholder="Temporary password for new users"
                minLength="8"
                value={importForm.password}
                onChange={(event) => setImportForm({ ...importForm, password: event.target.value })}
                required
              />
              <button type="button" onClick={() => setShowImportPassword(!showImportPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showImportPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
              File columns accepted: <span className="font-semibold text-slate-700">username</span> or{" "}
              <span className="font-semibold text-slate-700">name</span>, and{" "}
              <span className="font-semibold text-slate-700">email</span> or{" "}
              <span className="font-semibold text-slate-700">email id</span>.
            </p>
            <button disabled={importing} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              <Upload size={16} />
              {importing ? "Importing..." : "Upload and create users"}
            </button>
          </div>
          {importResult ? (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="font-semibold">
                Imported {importResult.total_rows} rows: {importResult.created} created, {importResult.updated} updated,{" "}
                {importResult.skipped} skipped.
              </p>
              {importResult.errors?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {importResult.errors.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Users and Role Assignment</h2>
              <p className="mt-1 text-sm text-slate-500">Manage current accounts and their assigned roles.</p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center px-5 py-12 text-sm font-medium text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" />
            Loading users
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Modules</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Assigned Admin</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const active = user.is_active !== false;
                  const busy = actionBusy === user.id || roleSaving === user.id;
                  const confirming = confirm === user.id;
                  return (
                    <tr key={user.id} className={`text-slate-600 ${!active ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
                          {active ? "Active" : "On hold"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{user.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs">{user.organization || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex gap-1">
                          {(user.modules_access || []).map((m) => (
                            <span key={m} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {m === "ai_interview" ? "Interview" : m === "aptitude" ? "Aptitude" : m === "programming" ? "Programming" : "All"}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {user.role_label}
                        </span>
                        <select
                          className="mt-2 block rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 sm:ml-2 sm:mt-0 sm:inline-block"
                          value={user.role}
                          disabled={busy}
                          onChange={(event) => assignRole(user.id, event.target.value)}
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                          <option value="master_admin">Master Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs">{user.assigned_admin_name || "—"}</td>
                      <td className="px-4 py-3">{formatDateTime(user.created_at)}</td>
                      <td className="px-4 py-3">
                        {confirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => active ? revokeUser(user.id) : restoreUser(user.id)}
                              disabled={busy}
                              className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-600"
                            >
                              {busy ? "..." : active ? "Revoke" : "Restore"}
                            </button>
                            <button
                              onClick={() => active && deleteUser(user.id)}
                              disabled={busy}
                              className="rounded-lg bg-red-700 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-800"
                            >
                              {busy ? "..." : "Delete"}
                            </button>
                            <button
                              onClick={() => setConfirm(null)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {active ? (
                              <>
                                <button
                                  onClick={() => setConfirm(user.id)}
                                  disabled={busy}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                  title="Revoke & delete"
                                >
                                  <ShieldOff size={13} />
                                  Revoke
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => restoreUser(user.id)}
                                disabled={busy}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                              >
                                <UserCheck size={13} />
                                Restore
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!users.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan="9">
                      No users found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
