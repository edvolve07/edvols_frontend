import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Users,
  TrendingUp,
  BarChart3,
  Gift,
  Percent,
  CreditCard,
  Calendar,
  Hash,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getReferralStats,
  getReferralCampaigns,
  getReferralCampaign,
  createReferralCampaign,
  updateReferralCampaign,
  deleteReferralCampaign,
  exportReferralReport,
} from "@/lib/api";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

const REWARD_TYPES = [
  { value: "discount_percent", label: "Discount %", icon: Percent },
  { value: "flat_discount", label: "Flat Discount", icon: CreditCard },
  { value: "free_interviews", label: "Free Interviews", icon: Gift },
  { value: "validity_extension", label: "Validity Extension", icon: Calendar },
  { value: "level_unlock", label: "Level Unlock", icon: TrendingUp },
  { value: "premium_feature", label: "Premium Feature", icon: Gift },
  { value: "subscription_upgrade", label: "Subscription Upgrade", icon: TrendingUp },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  code: "",
  code_type: "campaign",
  reward_type: "discount_percent",
  reward_value: 0,
  reward_for_referrer: { type: "free_interviews", value: 1 },
  reward_for_referred: { type: "discount_percent", value: 10 },
  plan_discounts: null,
  start_date: "",
  expiry_date: "",
  maximum_usage: 0,
  status: "active",
};

export default function ReferralManagement() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignTotal, setCampaignTotal] = useState(0);
  const [campaignPage, setCampaignPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState(null);
  const [detailHistory, setDetailHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await getReferralStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const params = { page: campaignPage, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await getReferralCampaigns(params);
      setCampaigns(data.campaigns || []);
      setCampaignTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    }
  }, [campaignPage, search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadCampaigns()]).finally(() => setLoading(false));
  }, [loadStats, loadCampaigns]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(campaign) {
    setForm({
      name: campaign.name || "",
      description: campaign.description || "",
      code: campaign.code || "",
      code_type: campaign.code_type || "campaign",
      reward_type: campaign.reward_type || "discount_percent",
      reward_value: campaign.reward_value || 0,
      reward_for_referrer: campaign.reward_for_referrer || { type: "free_interviews", value: 1 },
      reward_for_referred: campaign.reward_for_referred || { type: "discount_percent", value: 10 },
      plan_discounts: campaign.plan_discounts || null,
      start_date: campaign.start_date ? campaign.start_date.slice(0, 10) : "",
      expiry_date: campaign.expiry_date ? campaign.expiry_date.slice(0, 10) : "",
      maximum_usage: campaign.maximum_usage || 0,
      status: campaign.status || "active",
    });
    setEditId(campaign._id);
    setShowForm(true);
  }

  async function saveForm() {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (payload.reward_for_referrer && typeof payload.reward_for_referrer === "string") {
        try { payload.reward_for_referrer = JSON.parse(payload.reward_for_referrer); } catch {}
      }
      if (payload.reward_for_referred && typeof payload.reward_for_referred === "string") {
        try { payload.reward_for_referred = JSON.parse(payload.reward_for_referred); } catch {}
      }
      if (!payload.start_date) payload.start_date = new Date().toISOString();
      if (payload.expiry_date) payload.expiry_date = new Date(payload.expiry_date).toISOString();

      if (editId) {
        await updateReferralCampaign(editId, payload);
      } else {
        await createReferralCampaign(payload);
      }
      setShowForm(false);
      setEditId(null);
      await Promise.all([loadStats(), loadCampaigns()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this campaign?")) return;
    try {
      await deleteReferralCampaign(id);
      await Promise.all([loadStats(), loadCampaigns()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewDetail(id) {
    setDetailLoading(true);
    try {
      const data = await getReferralCampaign(id);
      setDetailCampaign(data.campaign);
      setDetailHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleExport() {
    try {
      const data = await exportReferralReport();
      const rows = data.rows || [];
      if (rows.length === 0) {
        setError("No data to export");
        return;
      }
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(","),
        ...rows.map(row => headers.map(h => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "referral-report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" /> Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Referral Management</h1>
          <p className="mt-1.5 text-base text-slate-500">Create campaigns, manage codes, and track referrals.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> New Campaign
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      )}

      {stats && (
        <section className="mb-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-slate-400"><BarChart3 className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Campaigns</span></div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total_campaigns}</p>
            <p className="text-xs text-slate-500">{stats.active_codes} active · {stats.expired_codes} expired</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-emerald-500"><CheckCircle2 className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Successful Referrals</span></div>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.successful_referrals}</p>
            <p className="text-xs text-slate-500">Conversion: {stats.conversion_rate}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-amber-500"><Clock className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Pending Rewards</span></div>
            <p className="mt-2 text-3xl font-bold text-amber-600">{stats.pending_rewards}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-violet-500"><Users className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Top Referrer</span></div>
            <p className="mt-2 text-lg font-bold text-slate-900">{stats.top_referrers?.[0]?.name || "—"}</p>
            <p className="text-xs text-slate-500">{stats.top_referrers?.[0]?.referral_count || 0} referrals</p>
          </div>
        </section>
      )}

      <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCampaignPage(1); }}
            placeholder="Search campaigns..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCampaignPage(1); }}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        {campaigns.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No campaigns found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Campaign</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Code</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Reward</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Usage</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Expiry</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{c.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{c.code}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.code_type}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.reward_type} ({c.reward_value})</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.used_count}{c.maximum_usage > 0 ? ` / ${c.maximum_usage}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDate(c.expiry_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => viewDetail(c._id)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(c)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Edit">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {c.code_type !== "user" && (
                          <button onClick={() => handleDelete(c._id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {campaignTotal > 15 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <span className="text-xs text-slate-500">Page {campaignPage} of {Math.ceil(campaignTotal / 15)}</span>
            <div className="flex gap-2">
              <button onClick={() => setCampaignPage(p => Math.max(1, p - 1))} disabled={campaignPage === 1} className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCampaignPage(p => p + 1)} disabled={campaignPage >= Math.ceil(campaignTotal / 15)} className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{editId ? "Edit Campaign" : "New Campaign"}</h3>
              <button onClick={() => setShowForm(false)} className="text-sm font-medium text-slate-500 hover:text-slate-700">Cancel</button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Campaign Name</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none" placeholder="e.g. WELCOME2026" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Code</span>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold uppercase focus:border-emerald-400 focus:outline-none" placeholder="e.g. WELCOME" />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Description</span>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none" />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Code Type</span>
                  <select value={form.code_type} onChange={(e) => setForm({ ...form, code_type: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none">
                    <option value="campaign">Campaign</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Status</span>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none">
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Max Usage (0 = unlimited)</span>
                  <input type="number" value={form.maximum_usage} onChange={(e) => setForm({ ...form, maximum_usage: parseInt(e.target.value) || 0 })} className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Start Date</span>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Expiry Date (optional)</span>
                  <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none" />
                </label>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-700 mb-3">Referred User Reward</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">Reward Type</span>
                    <select value={form.reward_for_referred?.type || ""} onChange={(e) => setForm({ ...form, reward_for_referred: { ...form.reward_for_referred, type: e.target.value } })} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none">
                      <option value="">None</option>
                      {REWARD_TYPES.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">Value</span>
                    <input type="number" value={form.reward_for_referred?.value || 0} onChange={(e) => setForm({ ...form, reward_for_referred: { ...form.reward_for_referred, value: parseFloat(e.target.value) || 0 } })} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-400">Default discount applied to all plans (if plan-specific discounts below are not set)</p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-700">Plan-Specific Discounts</p>
                  <button type="button" onClick={() => {
                    const current = form.plan_discounts || {};
                    const hasPlans = Object.keys(current).length > 0;
                    setForm({ ...form, plan_discounts: hasPlans ? null : {
                      basic: { type: "discount_percent", value: 5 },
                      advanced: { type: "discount_percent", value: 10 },
                      professional: { type: "discount_percent", value: 15 },
                    }});
                  }} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                    {form.plan_discounts ? "Remove plan discounts" : "Add plan discounts"}
                  </button>
                </div>
                {form.plan_discounts && (
                  <div className="space-y-3">
                    {["basic", "advanced", "professional"].map((planKey) => (
                      <div key={planKey} className="flex items-center gap-3">
                        <span className="w-24 text-xs font-semibold text-slate-600 capitalize">{planKey}</span>
                        <select
                          value={form.plan_discounts[planKey]?.type || "discount_percent"}
                          onChange={(e) => setForm({ ...form, plan_discounts: { ...form.plan_discounts, [planKey]: { ...form.plan_discounts[planKey], type: e.target.value } } })}
                          className="block w-36 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-emerald-400 focus:outline-none"
                        >
                          <option value="discount_percent">Discount %</option>
                          <option value="flat_discount">Flat Discount</option>
                        </select>
                        <input
                          type="number"
                          value={form.plan_discounts[planKey]?.value || 0}
                          onChange={(e) => setForm({ ...form, plan_discounts: { ...form.plan_discounts, [planKey]: { ...form.plan_discounts[planKey], value: parseFloat(e.target.value) || 0 } } })}
                          className="block w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-emerald-400 focus:outline-none"
                        />
                        <span className="text-xs text-slate-400">{form.plan_discounts[planKey]?.type === "flat_discount" ? "₹" : "%"}</span>
                      </div>
                    ))}
                  </div>
                )}
                {form.plan_discounts && (
                  <p className="mt-2 text-xs text-emerald-600 font-medium">Plan-specific discounts override the default reward above</p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-700 mb-3">Referrer Reward</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">Reward Type</span>
                    <select value={form.reward_for_referrer?.type || ""} onChange={(e) => setForm({ ...form, reward_for_referrer: { ...form.reward_for_referrer, type: e.target.value } })} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none">
                      <option value="">None</option>
                      {REWARD_TYPES.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">Value</span>
                    <input type="number" value={form.reward_for_referrer?.value || 0} onChange={(e) => setForm({ ...form, reward_for_referrer: { ...form.reward_for_referrer, value: parseFloat(e.target.value) || 0 } })} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
                  </label>
                </div>
              </div>

              <button onClick={saveForm} disabled={saving || !form.name || !form.code} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editId ? "Update Campaign" : "Create Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailCampaign && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setDetailCampaign(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{detailCampaign.name}</h3>
              <button onClick={() => setDetailCampaign(null)} className="text-sm font-medium text-slate-500 hover:text-slate-700">Close</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
              <div className="rounded-lg bg-slate-50 p-3"><span className="text-xs text-slate-500">Code</span><p className="font-bold text-slate-900">{detailCampaign.code}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="text-xs text-slate-500">Type</span><p className="font-bold text-slate-900">{detailCampaign.code_type}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="text-xs text-slate-500">Usage</span><p className="font-bold text-slate-900">{detailCampaign.used_count}{detailCampaign.maximum_usage > 0 ? ` / ${detailCampaign.maximum_usage}` : ""}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><span className="text-xs text-slate-500">Status</span><p className={`font-bold ${detailCampaign.status === "active" ? "text-emerald-600" : "text-slate-600"}`}>{detailCampaign.status}</p></div>
            </div>

            {detailLoading ? (
              <div className="mt-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /></div>
            ) : detailHistory.length === 0 ? (
              <p className="mt-6 text-center text-sm text-slate-500">No referral history for this campaign.</p>
            ) : (
              <div className="mt-6">
                <p className="text-sm font-bold text-slate-700 mb-3">Referral History ({detailHistory.length})</p>
                <div className="max-h-[300px] overflow-y-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 font-semibold text-slate-600">Referrer</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Referred</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Status</th>
                        <th className="px-3 py-2 font-semibold text-slate-600">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailHistory.map((h) => (
                        <tr key={h._id}>
                          <td className="px-3 py-2">{h.referrer_name || h.referrer_email}</td>
                          <td className="px-3 py-2">{h.referred_name || h.referred_email}</td>
                          <td className="px-3 py-2"><span className={`font-semibold ${h.reward_status === "completed" ? "text-emerald-600" : "text-amber-600"}`}>{h.reward_status}</span></td>
                          <td className="px-3 py-2">{formatDate(h.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
