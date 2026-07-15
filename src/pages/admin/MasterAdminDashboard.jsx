import { useEffect, useState, useCallback } from "react";
import {
  ArrowRight,
  Building2,
  Cpu,
  Loader2,
  Users,
} from "lucide-react";
import { Link } from "@/src/navigation";
import { apiFetch } from "@/lib/api";

function formatRelativeTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function StatCard({ label, value, icon: Icon, tone = "brand" }) {
  const tones = {
    brand: "bg-emerald-50 text-emerald-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-5">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={19} />
      </div>
      <p className="font-display text-2xl font-semibold text-slate-950 sm:text-3xl">{value ?? 0}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function MasterAdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const dash = await apiFetch("/api/master/dashboard");
      setData(dash);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => refresh({ quiet: true }), 30 * 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-700">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" />
        Loading your dashboard
      </div>
    );
  }

  const totals = data.totals || {};

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:p-6">
        <div>
          <p className="text-sm font-medium text-emerald-600">Organization control</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Master Admin Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Platform overview with key metrics.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <StatCard label="Total users" value={totals.users} icon={Users} />
        <StatCard label="Total institutions" value={totals.institutions} icon={Building2} tone="green" />
      </section>

      {/* Quick Links */}
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <Link
          href="/master-admin/institutions"
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Building2 size={19} />
          </div>
          <h2 className="font-display text-lg font-semibold text-slate-950 sm:text-xl">Institutions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Manage institutions, their module access, admins, and students.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
            Open institutions <ArrowRight size={15} />
          </span>
        </Link>
        <Link
          href="/master-admin/ai-usage"
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Cpu size={19} />
          </div>
          <h2 className="font-display text-lg font-semibold text-slate-950 sm:text-xl">AI API Usage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Review AI calls by feature and provider, then update API keys from one protected page.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
            Open AI usage <ArrowRight size={15} />
          </span>
        </Link>
      </section>

    </div>
  );
}
