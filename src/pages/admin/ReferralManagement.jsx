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
  Sliders,
  Wallet,
  IndianRupee,
  Copy,
  Check,
  ShieldCheck,
  XCircle,
  Save,
  RefreshCw,
} from "lucide-react";
import {
  getReferralStats,
  getReferralCampaigns,
  getReferralCampaign,
  createReferralCampaign,
  updateReferralCampaign,
  deleteReferralCampaign,
  exportReferralReport,
  getReferralProgramSettings,
  updateReferralProgramSettings,
  getAdminPayoutRequests,
  processAdminPayout,
} from "@/lib/api";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
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
  const [tab, setTab] = useState("campaigns"); // "campaigns" | "payouts" | "settings"
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

  // Settings tab state
  const [settings, setSettings] = useState({
    referrer_commission_percent: 5,
    referred_discount_percent: 5,
    min_referrals_for_withdrawal: 3,
    is_active: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Payouts tab state
  const [payouts, setPayouts] = useState([]);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("");
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(null);

  // Process Payout Modal state
  const [processModal, setProcessModal] = useState({
    open: false,
    payout: null,
    status: "completed",
    utr_number: "",
    admin_notes: "",
  });
  const [processing, setProcessing] = useState(false);

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

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await getReferralProgramSettings();
      if (res?.settings) {
        setSettings({
          referrer_commission_percent: res.settings.referrer_commission_percent ?? 5,
          referred_discount_percent: res.settings.referred_discount_percent ?? 5,
          min_referrals_for_withdrawal: res.settings.min_referrals_for_withdrawal ?? 3,
          is_active: res.settings.is_active ?? true,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const loadPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const params = { page: payoutPage, limit: 15 };
      if (payoutStatusFilter) params.status = payoutStatusFilter;
      const data = await getAdminPayoutRequests(params);
      setPayouts(data.payouts || []);
      setPayoutTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setPayoutsLoading(false);
    }
  }, [payoutPage, payoutStatusFilter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadCampaigns()]).finally(() => setLoading(false));
  }, [loadStats, loadCampaigns]);

  useEffect(() => {
    if (tab === "settings") {
      loadSettings();
    } else if (tab === "payouts") {
      loadPayouts();
    }
  }, [tab, loadSettings, loadPayouts]);

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

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess(false);
    setError("");
    try {
      const res = await updateReferralProgramSettings(settings);
      if (res?.settings) {
        setSettings({
          referrer_commission_percent: res.settings.referrer_commission_percent ?? 5,
          referred_discount_percent: res.settings.referred_discount_percent ?? 5,
          min_referrals_for_withdrawal: res.settings.min_referrals_for_withdrawal ?? 3,
          is_active: res.settings.is_active ?? true,
        });
      }
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSettingsSaving(false);
    }
  }

  function openProcessModal(payout) {
    setProcessModal({
      open: true,
      payout,
      status: "completed",
      utr_number: payout.utr_number || "",
      admin_notes: payout.admin_notes || "",
    });
  }

  async function handleProcessSubmit(e) {
    e.preventDefault();
    if (!processModal.payout) return;
    if (processModal.status === "completed" && !processModal.utr_number.trim()) {
      setError("Please enter the Bank / UPI UTR reference number for completed payments.");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      await processAdminPayout(processModal.payout._id, {
        status: processModal.status,
        utr_number: processModal.utr_number.trim(),
        admin_notes: processModal.admin_notes.trim(),
      });
      setProcessModal({ open: false, payout: null, status: "completed", utr_number: "", admin_notes: "" });
      await Promise.all([loadStats(), loadPayouts()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedUpi(id);
    setTimeout(() => setCopiedUpi(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" /> Loading referral module...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      {/* Top Header */}
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Referral & Cashback Management
          </h1>
          <p className="mt-1.5 text-base text-slate-500">
            Configure individual student 5% cashback reward rates, manage UPI payout withdrawals, and track campaigns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {tab === "campaigns" && (
            <>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" /> New Campaign
              </button>
            </>
          )}
          {tab === "payouts" && (
            <button
              onClick={loadPayouts}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${payoutsLoading ? "animate-spin" : ""}`} /> Refresh Payouts
            </button>
          )}
        </div>
      </section>

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* High-Level Referral Metric Cards */}
      {stats && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cashback Paid</span>
              <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <IndianRupee className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              ₹{(stats.total_commission_earned || 0).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Paid out: ₹{(stats.total_payouts_completed || 0).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending UPI Payouts</span>
              <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Wallet className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-amber-600">
              ₹{(stats.total_payouts_pending || 0).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Awaiting admin approval & transfer
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Successful Referrals</span>
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-blue-600">{stats.successful_referrals || 0}</p>
            <p className="mt-1 text-xs text-slate-500">Conversion Rate: {stats.conversion_rate || 0}%</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Referrer</span>
              <span className="rounded-lg bg-violet-50 p-2 text-violet-600">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 truncate text-lg font-bold text-slate-900">
              {stats.top_referrers?.[0]?.name || "None yet"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.top_referrers?.[0]?.referral_count || 0} successful friends referred
            </p>
          </div>
        </section>
      )}

      {/* Main Tabs Navigation */}
      <div className="mb-6 flex border-b border-slate-200">
        <button
          onClick={() => setTab("campaigns")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            tab === "campaigns"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          <Gift className="h-4 w-4" />
          Promo Campaigns ({campaignTotal})
        </button>

        <button
          onClick={() => setTab("payouts")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            tab === "payouts"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          <Wallet className="h-4 w-4" />
          UPI Payout Requests
          {(stats?.total_payouts_pending > 0) && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              ₹{stats.total_payouts_pending.toLocaleString("en-IN")} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setTab("settings")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            tab === "settings"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
          }`}
        >
          <Sliders className="h-4 w-4" />
          5% Reward Program Settings
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS & PROMO CODES */}
      {tab === "campaigns" && (
        <div>
          <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCampaignPage(1); }}
                placeholder="Search campaigns by code or name..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCampaignPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {campaigns.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">No campaigns found matching criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-slate-600">Campaign / Code</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Reward Offered</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Usage</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Expiry</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                              {c.code}
                            </span>
                            <span className="font-semibold text-slate-900">{c.name}</span>
                          </div>
                          {c.description && (
                            <p className="mt-0.5 text-xs text-slate-500 truncate max-w-[280px]">{c.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 capitalize">{c.code_type}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {c.reward_type === "discount_percent" ? `${c.reward_value}% off` : `${c.reward_type} (${c.reward_value})`}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700">
                          {c.used_count}{c.maximum_usage > 0 ? ` / ${c.maximum_usage}` : ""}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{formatDate(c.expiry_date)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => viewDetail(c._id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="View History"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEdit(c)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="Edit Campaign"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {c.code_type !== "user" && (
                              <button
                                onClick={() => handleDelete(c._id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
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
              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
                <span className="text-xs text-slate-500">
                  Page {campaignPage} of {Math.ceil(campaignTotal / 15)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCampaignPage((p) => Math.max(1, p - 1))}
                    disabled={campaignPage === 1}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCampaignPage((p) => p + 1)}
                    disabled={campaignPage >= Math.ceil(campaignTotal / 15)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: UPI PAYOUT REQUESTS */}
      {tab === "payouts" && (
        <div>
          {/* Status Filter Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {[
                { id: "", label: "All Requests" },
                { id: "pending", label: "Pending Review" },
                { id: "completed", label: "Completed" },
                { id: "rejected", label: "Rejected" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setPayoutStatusFilter(f.id);
                    setPayoutPage(1);
                  }}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    payoutStatusFilter === f.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Total payout requests: <span className="font-bold text-slate-800">{payoutTotal}</span>
            </p>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {payoutsLoading ? (
              <div className="flex h-64 items-center justify-center text-sm font-medium text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" /> Loading payout requests...
              </div>
            ) : payouts.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                No payout withdrawal requests found under this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-slate-600">Student</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Requested Amount</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">UPI ID (VPA)</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Requested At</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Bank UTR / Ref</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{p.user_name || "Individual Student"}</p>
                          <p className="text-xs text-slate-500">{p.user_email || "—"}</p>
                          {p.user_phone && <p className="text-[11px] text-slate-400">{p.user_phone}</p>}
                        </td>
                        <td className="px-4 py-3 font-extrabold text-slate-900">
                          ₹{Number(p.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-800">
                              {p.upi_id}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(p.upi_id, p._id)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              title="Copy UPI ID"
                            >
                              {copiedUpi === p._id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{formatDate(p.created_at)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              p.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : p.status === "rejected"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                            }`}
                          >
                            {p.status === "completed" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : p.status === "rejected" ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            <span className="capitalize">{p.status}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-600">
                          {p.utr_number || (p.admin_notes ? <span className="italic text-slate-400">{p.admin_notes}</span> : "—")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.status === "pending" ? (
                            <button
                              onClick={() => openProcessModal(p)}
                              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                              Process UPI
                            </button>
                          ) : (
                            <button
                              onClick={() => openProcessModal(p)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              View / Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {payoutTotal > 15 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
                <span className="text-xs text-slate-500">
                  Page {payoutPage} of {Math.ceil(payoutTotal / 15)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
                    disabled={payoutPage === 1}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPayoutPage((p) => p + 1)}
                    disabled={payoutPage >= Math.ceil(payoutTotal / 15)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: PROGRAM SETTINGS & CONFIGURATION */}
      {tab === "settings" && (
        <div className="max-w-3xl space-y-6">
          <form onSubmit={handleSaveSettings} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Individual Student Referral Settings</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Customize cashback rates and milestone withdrawal requirements in real time.
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                settings.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
              }`}>
                <span className={`h-2 w-2 rounded-full ${settings.is_active ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`} />
                {settings.is_active ? "Program Live" : "Paused"}
              </span>
            </div>

            {settingsSuccess && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                Referral program settings updated successfully. New purchases will immediately use these rates.
              </div>
            )}

            <div className="mt-6 space-y-6">
              {/* Program Active Switch */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <label className="text-sm font-bold text-slate-800">Referral Program Status</label>
                  <p className="text-xs text-slate-500">
                    Enable or temporarily disable referral discounts and cashback generation across the platform.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.is_active}
                    onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                </label>
              </div>

              {/* Grid of 2 percentages */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Referrer Commission */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-900">Referrer Cashback %</label>
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">Student A</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Percentage of the amount paid by the friend credited into the referrer's wallet.
                  </p>
                  <div className="mt-3 relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.referrer_commission_percent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          referrer_commission_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-base font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">Default: 5% of order value</p>
                </div>

                {/* Referred Discount */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-900">Referred Friend Discount %</label>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">Student B</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Instant discount applied at checkout when a friend enters a referral code.
                  </p>
                  <div className="mt-3 relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.referred_discount_percent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          referred_discount_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-base font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">Default: 5% off plan price</p>
                </div>
              </div>

              {/* Minimum Referrals Milestone */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900">
                    Required Successful Referrals to Unlock Withdrawal
                  </label>
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">Milestone</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Students must have at least this many friends who purchased a plan before they can request a UPI bank cashout.
                  There is no minimum rupee amount restriction once unlocked.
                </p>
                <div className="mt-3 relative max-w-[200px]">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.min_referrals_for_withdrawal}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        min_referrals_for_withdrawal: parseInt(e.target.value) || 1,
                      })
                    }
                    className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-14 text-base font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    friends
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Default: 3 paying referrals</p>
              </div>

              {/* Strict Institutional Isolation Notice */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 leading-relaxed">
                    <p className="font-bold">Strict Institutional Isolation Active</p>
                    <p className="mt-0.5 text-emerald-700">
                      Institution students (<code className="bg-emerald-100/60 px-1 py-0.5 rounded">role: student</code> tied to college batches)
                      are completely restricted from referral generation, cashback wallets, and discount codes. This program operates purely
                      for self-paying individual students (<code className="bg-emerald-100/60 px-1 py-0.5 rounded">role: individual_student</code>).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Program Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* PROCESS PAYOUT MODAL */}
      {processModal.open && processModal.payout && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 backdrop-blur-sm p-4"
          onClick={() => setProcessModal({ open: false, payout: null, status: "completed", utr_number: "", admin_notes: "" })}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Process UPI Payout Withdrawal</h3>
              <button
                onClick={() => setProcessModal({ open: false, payout: null, status: "completed", utr_number: "", admin_notes: "" })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Payout Details Card */}
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Student</span>
                <span className="text-sm font-bold text-slate-900">{processModal.payout.user_name || "Individual Student"}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Email</span>
                <span className="text-xs text-slate-700">{processModal.payout.user_email || "—"}</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                <span className="text-xs font-semibold text-slate-500">Withdrawal Amount</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  ₹{Number(processModal.payout.amount).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                <span className="text-xs font-semibold text-slate-500">UPI ID (VPA)</span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-white px-2 py-0.5 font-mono text-xs font-bold text-slate-900 border border-slate-200">
                    {processModal.payout.upi_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(processModal.payout.upi_id, "modal")}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    {copiedUpi === "modal" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleProcessSubmit} className="mt-5 space-y-4">
              {/* Decision Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Action Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProcessModal({ ...processModal, status: "completed" })}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition ${
                      processModal.status === "completed"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Mark Transferred
                  </button>
                  <button
                    type="button"
                    onClick={() => setProcessModal({ ...processModal, status: "rejected" })}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition ${
                      processModal.status === "rejected"
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-red-600" />
                    Reject Request
                  </button>
                </div>
              </div>

              {processModal.status === "completed" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank UTR / Transaction Reference Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={processModal.utr_number}
                    onChange={(e) => setProcessModal({ ...processModal, utr_number: e.target.value })}
                    placeholder="e.g. 409128392102 or UPI Ref ID"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Provides proof of settlement to the student in their wallet statement.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {processModal.status === "rejected" ? "Rejection Reason (visible to user)" : "Admin Notes (optional)"}
                </label>
                <textarea
                  value={processModal.admin_notes}
                  onChange={(e) => setProcessModal({ ...processModal, admin_notes: e.target.value })}
                  placeholder={
                    processModal.status === "rejected"
                      ? "e.g. Invalid UPI ID provided. Please verify your VPA and re-apply."
                      : "e.g. Processed via HDFC Business UPI"
                  }
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProcessModal({ open: false, payout: null, status: "completed", utr_number: "", admin_notes: "" })}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-50 ${
                    processModal.status === "rejected" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {processModal.status === "rejected" ? "Confirm Rejection" : "Confirm UPI Settlement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CAMPAIGN MODAL */}
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

      {/* CAMPAIGN DETAIL MODAL */}
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
