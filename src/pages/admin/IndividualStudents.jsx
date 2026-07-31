import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  CreditCard,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function IndividualStudents() {
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [college, setCollege] = useState("");
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [updatingSub, setUpdatingSub] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (college) params.set("college", college);
      const data = await apiFetch(`/api/subscription/admin/individual-students?${params}`);
      setStudents(data.students || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
      if (data.colleges) setColleges(data.colleges);
    } catch (err) {
      setError(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, search, college]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  useEffect(() => {
    apiFetch("/api/subscription/plans")
      .then((data) => setPlans(data.plans || []))
      .catch(() => setPlans([]));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    await loadStudents();
  }

  async function handleUpdateSubscription(studentId, planKey) {
    setUpdatingSub(true);
    setError("");
    try {
      await apiFetch(`/api/subscription/admin/individual-students/${studentId}/subscription`, {
        method: "PATCH",
        body: JSON.stringify({ action: "assign", plan_key: planKey }),
      });
      setSelectedStudent(null);
      await loadStudents();
    } catch (err) {
      setError(err.message || "Failed to update subscription");
    } finally {
      setUpdatingSub(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/subscription/admin/individual-students/${deleteTarget.id}`, { method: "DELETE" });
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setTotal((prev) => Math.max(0, prev - 1));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Failed to delete student");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <section className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Individual Students</h1>
          <p className="mt-1.5 text-base text-slate-500">Manage individual student subscriptions and journey access.</p>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      )}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, college, course, plan or level..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="relative">
            <select
              value={college}
              onChange={(e) => { setCollege(e.target.value); setPage(1); }}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-4 pr-9 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All colleges</option>
              {colleges.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Search
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">{total} individual student{total !== 1 ? "s" : ""} found</p>
      </section>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-slate-900">No individual students found</p>
          <p className="mt-1 text-sm text-slate-500">Students will appear here after they sign up individually.</p>
        </div>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-600">Name</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">College</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Course</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Plan</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Amount Paid</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Journey Level</th>
                  <th className="px-6 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                          {(s.name || "U").slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{s.college_name || "—"}</p>
                      {s.college_address && (
                        <p className="text-xs text-slate-500">{s.college_address}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{s.course_details || s.stream || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      {s.subscription ? (
                        <div>
                          <p className="font-medium text-slate-900">{s.subscription.plan_name}</p>
                          <p className="text-xs text-slate-500">Level {s.subscription.access_level}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {s.subscription ? (
                        <span className="font-medium text-slate-900">₹{s.subscription.amount_paid}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {s.journey ? (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-emerald-500" />
                          <span className="font-medium text-slate-900">Level {s.journey.current_level}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <CreditCard className="mr-1 inline h-3.5 w-3.5" /> Manage
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          title="Delete student"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
              <p className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Manage Subscription</h3>
              <button onClick={() => setSelectedStudent(null)} className="text-sm font-medium text-slate-500 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {(selectedStudent.name || "U").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedStudent.name}</p>
                  <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                </div>
              </div>
              {selectedStudent.subscription && (
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>Current: <strong>{selectedStudent.subscription.plan_name}</strong> (Level {selectedStudent.subscription.access_level})</span>
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${selectedStudent.subscription.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {selectedStudent.subscription.status}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700">Assign / Upgrade Plan</p>
              <p className="text-xs text-slate-500">This will directly assign journey access without payment.</p>
              <div className="mt-3 space-y-2">
                {plans.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-white p-3 text-center text-xs text-slate-500">No plans available.</p>
                ) : (
                  plans.map((plan) => {
                    const isCurrent = selectedStudent.subscription?.plan_key === plan.key && selectedStudent.subscription?.status === "active";
                    const isHigher = plan.access_level > (selectedStudent.subscription?.access_level || 0);
                    return (
                      <button
                        key={plan.key}
                        onClick={() => handleUpdateSubscription(selectedStudent.id, plan.key)}
                        disabled={isCurrent || updatingSub}
                        className={`w-full rounded-lg border-2 p-3 text-left transition disabled:opacity-40 ${
                          isCurrent ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                            <p className="text-xs text-slate-500">Level {plan.access_level} · {plan.interviews_total} interviews · ₹{plan.total_amount ?? plan.amount}</p>
                          </div>
                          {isCurrent ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">CURRENT</span>
                          ) : (
                            <Check size={16} className="text-emerald-500" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-950">Delete Student</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
              This will permanently remove their account, subscription, and all related data. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60">
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
