import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Loader2, Search, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const MODULE_OPTIONS = [
  { value: "ai_interview", label: "Interview" },
  { value: "aptitude", label: "Aptitude" },
  { value: "programming", label: "Programming" },
  { value: "both", label: "All" },
];

function moduleLabel(modules) {
  const m = modules || ["both"];
  if (m.includes("both")) return "All";
  return m.map((v) => MODULE_OPTIONS.find((o) => o.value === v)?.label || v).join(", ");
}

export default function AdminsList() {
  const [searchParams] = useSearchParams();
  const institutionId = searchParams.get("institution_id") || "";
  const [institution, setInstitution] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({ role: "admin", limit: "200" });
    if (institutionId) params.set("institution_id", institutionId);
    apiFetch(`/api/master/users?${params.toString()}`)
      .then((payload) => {
        if (active) setAdmins(payload.users || []);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load admins.");
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

  useEffect(() => {
    if (openDropdown === null) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openDropdown]);

  function toggleDropdown(id, btnEl) {
    if (openDropdown === id) {
      setOpenDropdown(null);
    } else {
      const rect = btnEl.getBoundingClientRect();
      setDropdownPos({ left: rect.left, top: rect.bottom + 4 });
      setOpenDropdown(id);
    }
  }

  async function updateModules(adminId, value) {
    setSaving(adminId);
    setOpenDropdown(null);
    setError("");
    try {
      const modules = value === "both" ? ["both"] : [value];
      await apiFetch(`/api/master/users/${adminId}/modules`, {
        method: "PATCH",
        body: JSON.stringify({ modules_access: modules }),
      });
      setAdmins((prev) =>
        prev.map((a) => (a.id === adminId ? { ...a, modules_access: modules } : a)),
      );
    } catch (err) {
      setError(err.message || "Unable to update modules.");
    } finally {
      setSaving("");
    }
  }

  function filtered() {
    if (!search.trim()) return admins;
    const q = search.toLowerCase();
    return admins.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
  }

  const visible = filtered();

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
          {institution ? `${institution.name} — Admins` : "Admins"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          {institution
            ? `Admin accounts under ${institution.name} (${institution.code}).`
            : "View all admin accounts and their module access."}
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
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
                Admin accounts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {visible.length} admin{visible.length !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center px-5 py-12 text-sm font-medium text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" />
            Loading admins
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Modules</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((a) => {
                  const active = a.is_active !== false;
                  return (
                    <tr key={a.id} className={`text-slate-600 ${!active ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">{a.name}</p>
                        <p className="text-xs text-slate-500">{a.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{a.institution_name || "—"}</td>
                      <td className="px-4 py-3 text-xs">{a.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs">{a.organization || "—"}</td>
                      <td className="px-4 py-3">
                        <div>
                          <button
                            disabled={saving === a.id}
                            onClick={(e) => toggleDropdown(a.id, e.currentTarget)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            {saving === a.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              moduleLabel(a.modules_access)
                            )}
                            <ChevronDown size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
                          {active ? "Active" : "On hold"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{formatDateTime(a.created_at)}</td>
                    </tr>
                  );
                })}
                {!visible.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan="7">
                      No admins found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {openDropdown ? (
        <div
          ref={menuRef}
          style={{ left: dropdownPos.left, top: dropdownPos.top, position: "fixed", zIndex: 9999 }}
          className="w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {MODULE_OPTIONS.map((opt) => {
            const admin = admins.find((a) => a.id === openDropdown);
            const current = admin?.modules_access || ["both"];
            const active = current.includes(opt.value) || current.includes("both");
            return (
              <button
                key={opt.value}
                onClick={() => updateModules(openDropdown, opt.value)}
                className={`block w-full px-3 py-1.5 text-left text-xs font-semibold transition hover:bg-slate-50 ${
                  active ? "text-emerald-700" : "text-slate-600"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
