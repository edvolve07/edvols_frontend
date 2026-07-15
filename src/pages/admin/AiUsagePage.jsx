import { useEffect, useState, useCallback } from "react";
import { BarChart3, Cpu, KeyRound, Loader2, Save, ShieldCheck } from "lucide-react";
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
    brand: "bg-brand-50 text-brand-700",
    green: "bg-accent-50 text-accent-700",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon size={19} />
      </div>
      <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{value ?? 0}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function AiUsagePage() {
  const [usage, setUsage] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [keyForms, setKeyForms] = useState({});
  const [keySaving, setKeySaving] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const [dashboardPayload, keyPayload] = await Promise.all([
        apiFetch("/api/master/dashboard"),
        apiFetch("/api/master/api-keys"),
      ]);
      setUsage(dashboardPayload.ai_usage || {});
      setApiKeys(keyPayload.providers || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load AI usage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => refresh({ quiet: true }), 30 * 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function updateApiKey(providerId) {
    const apiKey = String(keyForms[providerId] || "").trim();
    if (!apiKey) {
      setError("Enter an API key before saving.");
      return;
    }

    setKeySaving(providerId);
    setError("");
    try {
      const result = await apiFetch(`/api/master/api-keys/${providerId}`, {
        method: "PATCH",
        body: JSON.stringify({ api_key: apiKey }),
      });
      setApiKeys((current) =>
        current.map((provider) => (provider.id === providerId ? result.provider : provider)),
      );
      setKeyForms((current) => ({ ...current, [providerId]: "" }));
    } catch (err) {
      setError(err.message || "Unable to update API key.");
    } finally {
      setKeySaving("");
    }
  }

  const totals = usage?.totals || {};

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:mb-6 sm:p-6">
        <div>
          <p className="text-sm font-medium text-brand-700">Master admin tools</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            AI API Usage
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            Track AI usage across interviews, transcription, and assessment generation. Update provider keys from the same page.
          </p>
        </div>
      </section>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[45vh] items-center justify-center text-sm font-medium text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-600" />
          Loading AI usage
        </div>
      ) : (
        <>
          <section className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <StatCard label="AI requests, 30d" value={totals.requests} icon={Cpu} />
            <StatCard label="Successful AI calls" value={totals.successful_requests} icon={BarChart3} tone="green" />
            <StatCard label="Failed AI calls" value={totals.failed_requests} icon={ShieldCheck} tone="amber" />
            <StatCard label="Tracked tokens" value={totals.total_tokens} icon={Cpu} tone="purple" />
          </section>

          <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Usage by Feature</h2>
              <p className="mt-1 text-sm text-slate-500">
                Usage tracked from interviews, transcription, and AI question generation.
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {usage?.by_feature?.length ? (
                usage.by_feature.map((item) => (
                  <div key={item.feature} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{item.feature.replaceAll("_", " ")}</p>
                      <p className="text-xs text-slate-500">{item.total_tokens || 0} tracked tokens</p>
                    </div>
                    <span className="rounded-full bg-accent-50 px-3 py-1 text-sm font-semibold text-accent-700">
                      {item.requests} calls
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-5 py-8 text-center text-sm text-slate-500">No AI API usage recorded yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-5 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-brand-700" />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800">Provider API Keys</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage API keys stored in the database. No server restart needed — updates take effect immediately.
                </p>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {apiKeys.map((provider) => (
                <div key={provider.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{provider.name}</p>
                      <p className="mt-1 text-xs font-mono text-slate-500">{provider.env_key}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        provider.configured ? "bg-accent-50 text-accent-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {provider.configured ? "Configured" : "Missing"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{provider.description}</p>
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                    Current key:{" "}
                    <span className="font-mono font-semibold text-slate-700">
                      {provider.masked_value || "Not set"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
                      type="password"
                      placeholder={`New ${provider.name} API key`}
                      value={keyForms[provider.id] || ""}
                      onChange={(event) =>
                        setKeyForms((current) => ({ ...current, [provider.id]: event.target.value }))
                      }
                    />
                    <button
                      type="button"
                      disabled={keySaving === provider.id}
                      onClick={() => updateApiKey(provider.id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      <Save size={16} />
                      {keySaving === provider.id ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
