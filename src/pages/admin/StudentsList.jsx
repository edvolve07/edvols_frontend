import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, Loader2, Search, Users } from "lucide-react";
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
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Modules</th>
                  <th className="px-4 py-3">Assigned Admin</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((s) => {
                  const active = s.is_active !== false;
                  return (
                    <tr key={s.id} className={`text-slate-600 ${!active ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-950">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{s.institution_name || "—"}</td>
                      <td className="px-4 py-3 text-xs">{s.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs">{s.organization || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex gap-1">
                          {(s.modules_access || []).map((m) => (
                            <span key={m} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {m === "ai_interview" ? "Interview" : m === "aptitude" ? "Aptitude" : m === "programming" ? "Programming" : "All"}
                            </span>
                          ))}
                        </span>
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
                      <td className="px-4 py-3 text-xs">{formatDateTime(s.created_at)}</td>
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
    </div>
  );
}
