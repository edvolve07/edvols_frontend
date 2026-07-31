import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2,
  Search,
  Download,
  Building2,
  Users,
  IndianRupee,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Layers,
  BarChart3,
  PieChart,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6", "#f43f5e", "#14b8a6", "#64748b", "#a3e635"];

function inr(n) {
  const v = Number(n || 0);
  return "₹" + v.toLocaleString("en-IN");
}

function num(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

function ScoreBadge({ value }) {
  if (value == null) return <span className="text-slate-300">—</span>;
  const v = Number(value);
  const tone = v >= 70 ? "bg-emerald-50 text-emerald-700" : v >= 40 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600";
  return <span className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-semibold ${tone}`}>{Math.round(v)}</span>;
}

function StatCard({ label, value, sub, icon: Icon, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_2px_10px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon size={15} />
        </span>
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, right, children }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_2px_10px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-slate-900">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <Icon size={15} />
          </span>
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

const TABLE_TH = "px-4 py-3 font-semibold text-slate-600 whitespace-nowrap";
const TABLE_TD = "px-4 py-3 whitespace-nowrap";

export default function InstitutionAnalytics() {
  const [colleges, setColleges] = useState([]);
  const [totals, setTotals] = useState(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setError("");
    try {
      const data = await apiFetch("/api/institutions/analytics/overview");
      setColleges(data.colleges || []);
      setTotals(data.totals || null);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const loadDetail = useCallback(async (college) => {
    if (!college) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    setError("");
    try {
      const params = new URLSearchParams({ type: college.type });
      if (college.type === "institution") params.set("id", college.id);
      else params.set("name", college.name);
      const data = await apiFetch(`/api/institutions/analytics/detail?${params}`);
      setDetail(data);
    } catch (err) {
      setError(err.message || "Failed to load college analytics");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleSelect = (e) => {
    const key = e.target.value;
    const college = colleges.find((c) => c.key === key) || null;
    setSelectedKey(key);
    setSelectedCollege(college);
    setStudentSearch("");
    loadDetail(college);
  };

  const stats = detail?.stats || null;
  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Aptitude", score: stats.avg_aptitude },
      { name: "Interview", score: stats.avg_interview },
      { name: "Communication", score: stats.avg_communication },
      { name: "Programming", score: stats.avg_programming },
      { name: "Readiness", score: stats.avg_readiness },
    ].filter((d) => d.score != null);
  }, [stats]);

  const planPieData = useMemo(() => {
    return (detail?.revenue_by_plan || [])
      .filter((p) => Number(p.revenue) > 0)
      .map((p) => ({
        name: p.plan_name,
        value: Number(p.revenue),
        students: Number(p.students),
      }));
  }, [detail]);

  const filteredStudents = useMemo(() => {
    const rows = detail?.students || [];
    const q = studentSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) =>
      [(s.name || ""), (s.email || ""), (s.usn || ""), (s.branch || ""), (s.plan_name || ""), (s.stream || "")]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [detail, studentSearch]);

  const maxStrengthCount = Math.max(1, ...(detail?.strengths || []).map((s) => s.count));
  const maxWeakCount = Math.max(1, ...(detail?.weaknesses || []).map((w) => w.count));

  return (
    <div id="analytics-print" className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold text-slate-900">Institution Analytics Report</h1>
        <p className="mt-1 text-sm text-slate-500">
          {selectedCollege?.name || "All colleges"} · Generated {new Date().toLocaleDateString()}
        </p>
      </div>

      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Institution Analytics</h1>
          <p className="mt-1.5 text-base text-slate-500">
            Performance, revenue and student insights by college — ready to export as PDF.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <div className="relative">
            <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedKey}
              onChange={handleSelect}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All colleges</option>
              {colleges.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name} {c.code ? `(${c.code})` : ""} — {num(c.student_count)} students
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      )}

      {loadingOverview ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {!selectedCollege ? (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Colleges" value={num(totals?.colleges)} icon={Building2} tone="blue" />
                <StatCard label="Total students" value={num(totals?.students)} icon={Users} tone="emerald" />
                <StatCard label="Paid students" value={num(totals?.paid_students)} icon={CheckCircle2} tone="violet" />
                <StatCard label="Total revenue" value={inr(totals?.revenue)} icon={IndianRupee} tone="amber" />
              </div>

              <Section title="All colleges" icon={Layers}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className={TABLE_TH}>College</th>
                        <th className={TABLE_TH}>Students</th>
                        <th className={TABLE_TH}>Branches</th>
                        <th className={TABLE_TH}>Paid</th>
                        <th className={TABLE_TH}>Revenue</th>
                        <th className={TABLE_TH}>Avg Aptitude</th>
                        <th className={TABLE_TH}>Avg Interview</th>
                        <th className={TABLE_TH}>Avg Readiness</th>
                        <th className={TABLE_TH}>Interviews done</th>
                        <th className={TABLE_TH}></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {colleges.length === 0 && (
                        <tr>
                          <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">
                            No colleges found yet. Create an institution or wait for individual students to register.
                          </td>
                        </tr>
                      )}
                      {colleges.map((c) => (
                        <tr key={c.key} className="transition hover:bg-slate-50">
                          <td className={TABLE_TD}>
                            <div className="flex items-center gap-3">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                                <GraduationCap size={17} />
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">{c.name}</p>
                                <p className="text-xs text-slate-500">
                                  {c.type === "institution"
                                    ? `${c.code || "Institution"}${c.admins ? ` · ${c.admins} admins` : ""}`
                                    : "Individual students"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className={TABLE_TD}>{num(c.student_count)}</td>
                          <td className={TABLE_TD}>{c.branch_count != null ? num(c.branch_count) : "—"}</td>
                          <td className={TABLE_TD}>{num(c.paid_students)}</td>
                          <td className={`${TABLE_TD} font-semibold text-slate-900`}>{inr(c.revenue)}</td>
                          <td className={TABLE_TD}><ScoreBadge value={c.avg_aptitude} /></td>
                          <td className={TABLE_TD}><ScoreBadge value={c.avg_interview} /></td>
                          <td className={TABLE_TD}><ScoreBadge value={c.avg_readiness} /></td>
                          <td className={TABLE_TD}>{num(c.completed_interviews)}</td>
                          <td className={TABLE_TD}>
                            <button
                              type="button"
                              onClick={() => handleSelect({ target: { value: c.key } })}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                            >
                              Open <ArrowRight size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            </>
          ) : (
            <>
              {loadingDetail ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-slate-900">{detail?.college?.name}</h2>
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      {selectedCollege?.type === "institution" ? "Institution" : "Individual students"}
                    </span>
                    {detail?.college?.code && (
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {detail.college.code}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard label="Students" value={num(stats?.total_students)} icon={Users} tone="emerald" />
                    <StatCard label="Paid students" value={num(stats?.paid_students)} icon={CheckCircle2} tone="violet" />
                    <StatCard label="Revenue" value={inr(stats?.revenue)} icon={IndianRupee} tone="amber" />
                    <StatCard label="Completed interviews" value={num(stats?.completed_interviews)} icon={TrendingUp} tone="blue" />
                    <StatCard
                      label="Journeys active / done"
                      value={`${num(stats?.active_journeys)} / ${num(stats?.completed_journeys)}`}
                      icon={BarChart3}
                      tone="slate"
                    />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Section title="Average performance by module" icon={BarChart3}>
                      {chartData.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">No performance data for this college yet.</p>
                      ) : (
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                              <Tooltip cursor={{ fill: "rgba(16,185,129,0.06)" }} />
                              <Bar dataKey="score" name="Avg score" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={56} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </Section>

                    <Section title="Revenue by plan" icon={PieChart}>
                      {planPieData.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">No revenue recorded yet.</p>
                      ) : (
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                              <Pie
                                data={planPieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={86}
                                innerRadius={48}
                                paddingAngle={2}
                              >
                                {planPieData.map((_, i) => (
                                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v) => inr(v)} />
                            </RePieChart>
                          </ResponsiveContainer>
                          <div className="mt-1 flex flex-wrap justify-center gap-2">
                            {planPieData.map((p, i) => (
                              <span key={p.name} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                {p.name} ({inr(p.value)})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </Section>
                  </div>

                  {(detail?.branches || []).length > 0 && (
                    <Section title="Revenue & students by branch" icon={Layers}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                              <th className={TABLE_TH}>Branch</th>
                              <th className={TABLE_TH}>Students</th>
                              <th className={TABLE_TH}>Paid students</th>
                              <th className={TABLE_TH}>Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detail.branches.map((b) => (
                              <tr key={b.branch} className="transition hover:bg-slate-50">
                                <td className={`${TABLE_TD} font-medium text-slate-900`}>{b.branch}</td>
                                <td className={TABLE_TD}>{num(b.students)}</td>
                                <td className={TABLE_TD}>{num(b.paid_students)}</td>
                                <td className={`${TABLE_TD} font-semibold text-slate-900`}>{inr(b.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Section>
                  )}

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Section title="Top strengths" icon={Sparkles}>
                      {(detail?.strengths || []).length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-400">No interview strengths recorded yet.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {detail.strengths.map((s) => (
                            <div key={s.label} className="flex items-center gap-3">
                              <span className="w-1/2 shrink-0 truncate text-sm text-slate-700">{s.label}</span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{ width: `${(s.count / maxStrengthCount) * 100}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-xs font-semibold text-slate-500">{s.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>

                    <Section title="Areas to improve" icon={AlertTriangle}>
                      {(detail?.weaknesses || []).length === 0 ? (
                        <p className="py-6 text-center text-sm text-slate-400">No improvement areas recorded yet.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {detail.weaknesses.map((w) => (
                            <div key={w.label} className="flex items-center gap-3">
                              <span className="w-1/2 shrink-0 truncate text-sm text-slate-700">{w.label}</span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-amber-500"
                                  style={{ width: `${(w.count / maxWeakCount) * 100}%` }}
                                />
                              </div>
                              <span className="w-8 text-right text-xs font-semibold text-slate-500">{w.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  </div>

                  <Section
                    title={`Student performance (${filteredStudents.length})`}
                    icon={Users}
                    right={
                      <div className="relative w-full max-w-xs print:hidden">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Search students..."
                          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    }
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                          <tr>
                            <th className={TABLE_TH}>Student</th>
                            <th className={TABLE_TH}>Branch</th>
                            <th className={TABLE_TH}>Plan</th>
                            <th className={TABLE_TH}>Paid</th>
                            <th className={TABLE_TH}>Level</th>
                            <th className={TABLE_TH}>Interviews</th>
                            <th className={TABLE_TH}>Aptitude</th>
                            <th className={TABLE_TH}>Interview</th>
                            <th className={TABLE_TH}>Comm</th>
                            <th className={TABLE_TH}>Prog</th>
                            <th className={TABLE_TH}>Readiness</th>
                            <th className={TABLE_TH}>Strengths</th>
                            <th className={TABLE_TH}>Improve</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStudents.length === 0 && (
                            <tr>
                              <td colSpan={13} className="px-4 py-10 text-center text-sm text-slate-500">
                                No students found.
                              </td>
                            </tr>
                          )}
                          {filteredStudents.map((s) => (
                            <tr key={s.id} className="transition hover:bg-slate-50">
                              <td className={TABLE_TD}>
                                <div className="flex items-center gap-2.5">
                                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                                    {(s.name || "U").slice(0, 1).toUpperCase()}
                                  </span>
                                  <div>
                                    <p className="font-semibold text-slate-900">{s.name}</p>
                                    <p className="text-xs text-slate-500">{s.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className={TABLE_TD}>
                                <span className="text-slate-700">{s.branch || "—"}</span>
                              </td>
                              <td className={TABLE_TD}>
                                {s.plan_name ? (
                                  <div>
                                    <p className="font-medium text-slate-900">{s.plan_name}</p>
                                    <p className="text-xs text-slate-500">Level {s.access_level}</p>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className={`${TABLE_TD} font-medium text-slate-900`}>{s.amount_paid ? inr(s.amount_paid) : "—"}</td>
                              <td className={TABLE_TD}>
                                {s.current_level ? (
                                  <span className="inline-flex items-center gap-1 text-slate-700">
                                    <TrendingUp size={13} className="text-emerald-500" /> Level {s.current_level}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className={TABLE_TD}>{num(s.completed_interviews)}</td>
                              <td className={TABLE_TD}><ScoreBadge value={s.avg_aptitude} /></td>
                              <td className={TABLE_TD}><ScoreBadge value={s.avg_interview} /></td>
                              <td className={TABLE_TD}><ScoreBadge value={s.avg_communication} /></td>
                              <td className={TABLE_TD}><ScoreBadge value={s.avg_programming} /></td>
                              <td className={TABLE_TD}><ScoreBadge value={s.readiness_score} /></td>
                              <td className={TABLE_TD}>
                                {s.strengths?.length ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                                    <CheckCircle2 size={13} /> {s.strengths[0]}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className={TABLE_TD}>
                                {s.weaknesses?.length ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                                    <XCircle size={13} /> {s.weaknesses[0]}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
