import { useEffect, useState } from "react";
import { Eye, EyeOff, FileSpreadsheet, Loader2, Plus, Save, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api";

function formatDateTime(value) {
  if (!value) return "Open";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MasterUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [roleSaving, setRoleSaving] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [importForm, setImportForm] = useState({
    file: null,
    role: "admin",
    password: "",
  });

  function refresh() {
    return apiFetch("/api/master/users?limit=100").then((payload) => {
      setUsers(payload.users || []);
      return payload;
    });
  }

  useEffect(() => {
    let active = true;
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
        body: JSON.stringify(form),
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

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" />
        Loading users
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
        <p className="text-sm font-medium text-emerald-600">Master admin</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950">
          User Creation
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          Create accounts, bulk upload users, and assign access roles.
        </p>
      </section>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mb-6 grid gap-6 xl:grid-cols-2">
        <form onSubmit={createUser} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <div className="mb-5 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Create User</h2>
              <p className="mt-1 text-sm text-slate-500">Add students, admins, or another master admin.</p>
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
                className="field pr-10"
                type={showPassword ? 'text' : 'password'}
                placeholder="Temporary password"
                minLength="8"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
            <button disabled={creating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-emerald-600">
              <Save size={16} />
              {creating ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>

        <form onSubmit={importUsers} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
          <div className="mb-5 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Bulk Upload Users</h2>
              <p className="mt-1 text-sm text-slate-500">Upload CSV or Excel and apply one role to every row.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">User file</span>
              <input
                className="field mt-1"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => setImportForm({ ...importForm, file: event.target.files?.[0] || null })}
                required
              />
            </label>
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
            <button disabled={importing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
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
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Users and Role Assignment</h2>
          <p className="mt-1 text-sm text-slate-500">Newest accounts and their assigned roles.</p>
        </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Modules</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Assigned Admin</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length ? (
                users.map((user) => (
                  <tr key={user.id} className="text-slate-600">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-950">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
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
                        className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                        value={user.role}
                        disabled={roleSaving === user.id}
                        onChange={(event) => assignRole(user.id, event.target.value)}
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                        <option value="master_admin">Master Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs">{user.assigned_admin_name || "—"}</td>
                    <td className="px-4 py-3">{formatDateTime(user.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="7">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
