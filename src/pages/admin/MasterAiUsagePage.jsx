import { useEffect, useState, useCallback } from "react";
import { BarChart3, Cpu, Loader2, ShieldCheck } from "lucide-react";
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
    purple: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={19} />
      </div>
      <p className="font-display text-3xl font-semibold text-slate-950">{value ?? 0}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function MasterAiUsagePage() {
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async ({ quiet } = {}) => {
    try {
      const payload = await apiFetch("/api/master/dashboard");
      setUsage(payload.ai_usage || {});
      if (!quiet) setError("");
    } catch (err) {
      if (!quiet) setError(err.message || "Unable to load AI API usage.");
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => refresh({ quiet: true }), 30 * 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-500" />
        Loading AI API usage
      </div>
    );
  }

  const totals = usage.totals || {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
        <div>
          <p className="text-sm font-medium text-emerald-600">Master admin</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950">
            AI API Usage
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Usage tracked from interviews, transcription, and AI question generation.
          </p>
        </div>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="AI requests, 30d" value={totals.requests} icon={Cpu} />
        <StatCard label="Successful AI calls" value={totals.successful_requests} icon={BarChart3} tone="green" />
        <StatCard label="Failed AI calls" value={totals.failed_requests} icon={ShieldCheck} tone="amber" />
        <StatCard label="Tracked tokens" value={totals.total_tokens} icon={Cpu} tone="purple" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Usage by Feature</h2>
          <p className="mt-1 text-sm text-slate-500">Feature-level AI request volume and token tracking.</p>
        </div>
        <div className="divide-y divide-slate-100">
              {usage.by_feature?.length ? (
                usage.by_feature.map((item) => (
                  <div key={item.feature} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-950">{item.feature.replaceAll("_", " ")}</p>
                      <p className="text-xs text-slate-500">{item.total_tokens || 0} tracked tokens</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      {item.requests} calls
                    </span>
                  </div>
                ))
              ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No AI API usage recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
