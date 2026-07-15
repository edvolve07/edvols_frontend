import { useEffect, useState } from "react";
import { Crown, Loader2, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MasterAdminsList() {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch("/api/master/users?role=master_admin&limit=200")
      .then((payload) => {
        if (active) setMasters(payload.users || []);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load master admins.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function filtered() {
    if (!search.trim()) return masters;
    const q = search.toLowerCase();
    return masters.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }

  const visible = filtered();

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:mb-6 sm:p-6">
        <p className="text-sm font-medium text-emerald-600">Master admin tools</p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Master Admins
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          View all master administrator accounts.
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

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
                Master admin accounts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {visible.length} master admin{visible.length !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center px-5 py-12 text-sm font-medium text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" />
            Loading master admins
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Master Admin</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((m) => {
                  const active = m.is_active !== false;
                  return (
                    <tr key={m.id} className={`text-slate-600 ${!active ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">{m.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs">{m.organization || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
                          {active ? "Active" : "On hold"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{formatDateTime(m.created_at)}</td>
                    </tr>
                  );
                })}
                {!visible.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan="5">
                      No master admins found.
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
