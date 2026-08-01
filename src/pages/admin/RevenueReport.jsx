import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  IndianRupee,
  Download,
  Loader2,
  Layers,
  FileBarChart,
  UserRound,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

function inr(n) {
  const v = Number(n || 0);
  return "₹" + v.toLocaleString("en-IN");
}

function num(n) {
  return Number(n || 0).toLocaleString("en-IN");
}

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_2px_10px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon size={15} />
        </span>
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_2px_10px_rgba(15,23,42,0.04)]">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-slate-900">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
          <Icon size={15} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function PrintHeader({ title }) {
  return (
    <div style={{ background: "linear-gradient(120deg, #064e3b 0%, #065f46 55%, #064e3b 100%)", padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px", borderRadius: "10px" }}>
      <img src="/edvols%20logo.png" alt="Edvols" style={{ height: "44px", width: "auto", background: "#fff", borderRadius: "8px", padding: "4px" }} />
      <div style={{ color: "#fff" }}>
        <p style={{ fontSize: "22px", fontWeight: 900, margin: 0 }}>Edvols</p>
        <p style={{ fontSize: "12px", color: "#a7f3d0", margin: 0 }}>Build your placement-ready profile</p>
      </div>
      <div style={{ marginLeft: "auto", textAlign: "right", color: "#fff" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>{title}</p>
        <p style={{ fontSize: "11px", color: "#a7f3d0", margin: "2px 0 0" }}>Generated {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}

function PrintTable({ title, head, rows }) {
  if (!rows.length) return null;
  return (
    <div style={{ marginTop: "18px" }}>
      <p style={{ fontSize: "14px", fontWeight: 800, color: "#064e3b", margin: "0 0 6px" }}>{title}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} style={{ border: "1px solid #e2e8f0", padding: "6px 8px", textAlign: "left", background: "#f1f5f9", color: "#475569" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={{ border: "1px solid #e2e8f0", padding: "6px 8px", color: "#334155" }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RevenueReport() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("institution");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/institutions/analytics/revenue")
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load revenue"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const isInst = tab === "institution";
  const rows = (isInst ? data?.institutions : data?.individuals) || [];
  const totals = (isInst ? data?.totals?.institutions : data?.totals?.individuals) || {};
  const planRows = (isInst ? data?.plan_breakdown?.institutions : data?.plan_breakdown?.individuals) || [];
  const grandTotal = (data?.totals?.institutions?.revenue || 0) + (data?.totals?.individuals?.revenue || 0);

  return (
    <div id="revenue-print" className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <div className="print:hidden">
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Revenue Report</h1>
            <p className="mt-1.5 text-base text-slate-500">
              Total revenue from institution and individual plans — exportable as an Edvols report.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Download size={16} />
            Download Report
          </button>
        </section>

        <div className="mb-6 flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-fit">
          {[
            ["institution", "Institution Revenue", Building2],
            ["individual", "Individual Revenue", UserRound],
          ].map(([val, label, Icon]) => (
            <button
              key={val}
              type="button"
              onClick={() => setTab(val)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                tab === val ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label={isInst ? "Institutions" : "College groups"} value={num(totals.groups)} icon={Layers} />
              <StatCard label="Total students" value={num(totals.students)} icon={Users} />
              <StatCard label="Paid students" value={num(totals.paid_students)} icon={Users} />
              <StatCard label="Total revenue" value={inr(totals.revenue)} icon={IndianRupee} />
            </div>

            <Section title="Revenue by plan" icon={FileBarChart}>
              {planRows.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No revenue recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-600">Plan</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Paid students</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {planRows.map((p) => (
                        <tr key={p.plan_name} className="transition hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{p.plan_name}</td>
                          <td className="px-4 py-3">{num(p.paid_students)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{inr(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title={isInst ? `Institutions (${rows.length})` : `College groups (${rows.length})`} icon={Building2}>
              {rows.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No {isInst ? "institutions" : "individual students"} found yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-600">{isInst ? "Institution" : "College"}</th>
                        {isInst && <th className="px-4 py-3 font-semibold text-slate-600">Code</th>}
                        <th className="px-4 py-3 font-semibold text-slate-600">Students</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Paid</th>
                        <th className="px-4 py-3 font-semibold text-slate-600">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r) => (
                        <tr key={r.id || r.name} className="transition hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                          {isInst && <td className="px-4 py-3 text-slate-500">{r.code || "—"}</td>}
                          <td className="px-4 py-3">{num(r.students)}</td>
                          <td className="px-4 py-3">{num(r.paid_students)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{inr(r.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </>
        )}
      </div>

      <div className="hidden print:block">
        <PrintHeader title="Revenue Report" />
        <p style={{ fontSize: "13px", color: "#475569", marginTop: "10px" }}>
          Total platform revenue: <strong>{inr(grandTotal)}</strong> · Generated for internal reporting.
        </p>

        <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <PrintTotalBox label="Institution revenue" value={inr(data?.totals?.institutions?.revenue)} note={`${num(data?.totals?.institutions?.groups)} institutions · ${num(data?.totals?.institutions?.paid_students)} paid students`} />
          <PrintTotalBox label="Individual revenue" value={inr(data?.totals?.individuals?.revenue)} note={`${num(data?.totals?.individuals?.groups)} college groups · ${num(data?.totals?.individuals?.paid_students)} paid students`} />
        </div>

        <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#064e3b", margin: "22px 0 0" }}>Institution Revenue</h2>
        <PrintTable
          title="Revenue by plan"
          head={["Plan", "Paid students", "Revenue"]}
          rows={(data?.plan_breakdown?.institutions || []).map((p) => [p.plan_name, num(p.paid_students), inr(p.revenue)])}
        />
        <PrintTable
          title={`All institutions (${(data?.institutions || []).length})`}
          head={["Institution", "Code", "Students", "Paid", "Revenue"]}
          rows={(data?.institutions || []).map((i) => [i.name, i.code || "—", num(i.students), num(i.paid_students), inr(i.revenue)])}
        />

        <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#064e3b", margin: "26px 0 0" }}>Individual Revenue</h2>
        <PrintTable
          title="Revenue by plan"
          head={["Plan", "Paid students", "Revenue"]}
          rows={(data?.plan_breakdown?.individuals || []).map((p) => [p.plan_name, num(p.paid_students), inr(p.revenue)])}
        />
        <PrintTable
          title={`All college groups (${(data?.individuals || []).length})`}
          head={["College", "Students", "Paid", "Revenue"]}
          rows={(data?.individuals || []).map((i) => [i.name, num(i.students), num(i.paid_students), inr(i.revenue)])}
        />
      </div>
    </div>
  );
}

function PrintTotalBox({ label, value, note }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748b", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "20px", fontWeight: 900, color: "#064e3b", margin: "2px 0" }}>{value}</p>
      <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{note}</p>
    </div>
  );
}
