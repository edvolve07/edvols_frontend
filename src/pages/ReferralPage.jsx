import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Copy,
  CheckCircle2,
  Share2,
  Users,
  Gift,
  Clock,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Award,
  Wallet,
  Lock,
  Unlock,
  Check,
  AlertCircle,
  IndianRupee,
  Send,
  X,
} from "lucide-react";
import { apiFetch, getMyReferral, getReferralHistory, requestReferralPayout } from "@/lib/api";
import { useAuth } from "@/src/portal/context/AuthContext";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

export default function ReferralPage() {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Payout Modal state
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  const loadData = useCallback(async () => {
    if (user?.role && user.role !== "individual_student") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [refData, histData] = await Promise.all([
        getMyReferral(),
        getReferralHistory(),
      ]);
      setReferralData(refData);
      setHistory(histData.history || []);
    } catch (err) {
      setError(err.message || "Unable to load referral data.");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function copyCode() {
    if (!referralData?.code) return;
    navigator.clipboard.writeText(referralData.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyLink() {
    if (!referralData?.referral_link) return;
    navigator.clipboard.writeText(referralData.referral_link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareWhatsApp() {
    if (!referralData?.referral_link) return;
    const text = encodeURIComponent(
      `Hey! Practice AI Mock Interviews on Edvols. Use my referral code "${referralData.code}" to get 5% OFF on your placement subscription: ${referralData.referral_link}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }

  async function shareLink() {
    if (!referralData?.referral_link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Edvols & Get 5% OFF",
          text: `Use my referral code "${referralData.code}" to get 5% OFF on placement subscriptions on Edvols!`,
          url: referralData.referral_link,
        });
      } catch {}
    } else {
      copyLink();
    }
  }

  async function handlePayoutSubmit(e) {
    e.preventDefault();
    setPayoutError("");
    const wallet = referralData?.wallet;
    if (!wallet) return;

    if (!upiId.trim() || !upiId.includes("@")) {
      setPayoutError("Please enter a valid UPI ID (e.g. mobile@upi or username@bank).");
      return;
    }

    const amt = payoutAmount ? parseFloat(payoutAmount) : wallet.available_balance;
    if (isNaN(amt) || amt <= 0) {
      setPayoutError("Please enter a valid withdrawal amount.");
      return;
    }

    if (amt > wallet.available_balance) {
      setPayoutError(`Amount cannot exceed your available balance (₹${wallet.available_balance}).`);
      return;
    }

    setPayoutLoading(true);
    try {
      const res = await requestReferralPayout({ upi_id: upiId.trim(), amount: amt });
      setSuccessMsg(res.message || "Withdrawal request submitted successfully!");
      setPayoutModalOpen(false);
      setUpiId("");
      setPayoutAmount("");
      await loadData();
    } catch (err) {
      setPayoutError(err.message || "Failed to submit withdrawal request.");
    } finally {
      setPayoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" /> Loading your referral rewards...
      </div>
    );
  }

  if (user?.role && user.role !== "individual_student") {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Referral Program Not Applicable</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          The Edvols Referral & Cashback program is exclusively available for direct individual students. Campus accounts are managed directly by your institution.
        </p>
      </div>
    );
  }

  const wallet = referralData?.wallet || {
    total_earned: 0,
    available_balance: 0,
    total_withdrawn: 0,
    pending_payout: 0,
    paid_referrals_count: 0,
    min_referrals_required: 3,
    can_withdraw: false,
    referrals_needed: 3,
    payout_history: [],
    commission_percent: 5,
    discount_percent: 5,
  };

  const unlockProgress = Math.min(
    100,
    Math.round((wallet.paid_referrals_count / wallet.min_referrals_required) * 100)
  );

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      {/* Header */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Refer & Earn Cashback
            </h1>
            <p className="mt-1.5 text-base text-slate-500">
              Invite friends to Edvols. They get <span className="font-semibold text-emerald-700">{wallet.discount_percent}% OFF</span>, and you get <span className="font-semibold text-emerald-700">{wallet.commission_percent}% CASH</span> on whatever they pay!
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {referralData && (
        <>
          {/* Referral Code & Share Card */}
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 shrink-0">
                  <Gift className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Your Personal Invite Code
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="rounded-xl bg-emerald-50 px-4 py-2.5 text-2xl font-black tracking-wider text-emerald-700 border border-emerald-200">
                      {referralData.code}
                    </span>
                    <button
                      onClick={copyCode}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy Code"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Share Links */}
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <div className="flex gap-2">
                  <button
                    onClick={shareWhatsApp}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
                  >
                    <Send className="h-4 w-4" /> WhatsApp Share
                  </button>
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm"
                  >
                    <ExternalLink className="h-4 w-4" /> Copy Link
                  </button>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-sm">
                  {referralData.referral_link}
                </p>
              </div>
            </div>
          </section>

          {/* Wallet & 3-Referral Unlock Milestone Card */}
          <section className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-700/60">
              <div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Wallet className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Referral Earnings Wallet</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                    ₹{wallet.available_balance.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-slate-300">available to withdraw</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span>Lifetime Earned: <strong className="text-white">₹{wallet.total_earned.toFixed(2)}</strong></span>
                  <span>•</span>
                  <span>Withdrawn: <strong className="text-white">₹{wallet.total_withdrawn.toFixed(2)}</strong></span>
                  {wallet.pending_payout > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400">Under Review: <strong>₹{wallet.pending_payout.toFixed(2)}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Withdraw Button */}
              <div>
                <button
                  onClick={() => {
                    setPayoutAmount(wallet.available_balance.toString());
                    setPayoutModalOpen(true);
                  }}
                  disabled={!wallet.can_withdraw}
                  className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition ${
                    wallet.can_withdraw
                      ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600"
                  }`}
                >
                  {wallet.can_withdraw ? (
                    <>
                      <Unlock className="h-4 w-4 text-white" />
                      Withdraw via UPI
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-slate-400" />
                      Withdrawal Locked
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3-Referral Unlock Progress */}
            <div className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {wallet.can_withdraw ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                      <Check className="h-3 w-3" /> Withdrawal Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                      <Lock className="h-3 w-3" /> Minimum {wallet.min_referrals_required} Referrals Required
                    </span>
                  )}
                  <span className="text-xs text-slate-300">
                    ({wallet.paid_referrals_count} of {wallet.min_referrals_required} paid friends completed)
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-300">{unlockProgress}% Unlocked</span>
              </div>

              {/* Progress Track */}
              <div className="h-3 w-full bg-slate-700/80 rounded-full overflow-hidden p-0.5 border border-slate-600">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    wallet.can_withdraw ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                  style={{ width: `${unlockProgress}%` }}
                />
              </div>

              {/* Milestone Circles */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((stepNum) => {
                  const isDone = wallet.paid_referrals_count >= stepNum;
                  return (
                    <div
                      key={stepNum}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition ${
                        isDone
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                          : "bg-slate-800/60 border-slate-700 text-slate-400"
                      }`}
                    >
                      <div
                        className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold shrink-0 ${
                          isDone ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5" /> : stepNum}
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-white">Friend {stepNum}</p>
                        <p className="text-[11px] text-slate-400">
                          {isDone ? "Joined & Subscribed" : "Pending Subscription"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!wallet.can_withdraw && (
                <p className="mt-3 text-xs text-amber-200/90 leading-relaxed">
                  💡 <strong>Rule:</strong> Refer {wallet.referrals_needed} more friend(s) who subscribe to any plan to unlock instant UPI cash withdrawals. No minimum rupee withdrawal amount once unlocked!
                </p>
              )}
            </div>
          </section>

          {/* Quick Stats Grid */}
          <section className="mb-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="h-4 w-4" />
                <span className="text-xs font-bold uppercase">Total Clicks</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{referralData.total_referrals}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-bold uppercase">Paid Referrals</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">{wallet.paid_referrals_count}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-blue-600">
                <IndianRupee className="h-4 w-4" />
                <span className="text-xs font-bold uppercase">Total Earned</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-blue-600">₹{wallet.total_earned.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-violet-600">
                <Award className="h-4 w-4" />
                <span className="text-xs font-bold uppercase">Commission Rate</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-violet-600">{wallet.commission_percent}%</p>
            </div>
          </section>
        </>
      )}

      {/* Referral Activity Ledger */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Your Referral Activity</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">5% Cashback on Every Subscription</span>
        </div>
        {history.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            No referrals yet. Share your code with your friends to start earning 5% cash!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((h) => {
              const comm = h.reward_details?.commission_amount || 0;
              const plan = h.reward_details?.plan_key || "Plan";
              const paid = h.reward_details?.paid_amount || 0;
              return (
                <div key={h.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50 gap-3">
                  <div className="flex items-center gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {h.is_referrer
                          ? `Referred ${h.referred_name || "Friend"}`
                          : `Referred by ${h.referrer_name || "Referrer"}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        Subscribed to {plan.toUpperCase()} (₹{paid}) · {formatDate(h.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {comm > 0 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +₹{comm.toFixed(2)} Earned (5%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {h.reward_status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Payout History */}
      {wallet.payout_history && wallet.payout_history.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">UPI Withdrawal Requests</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {wallet.payout_history.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50 gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">₹{p.amount.toFixed(2)} to {p.upi_id}</p>
                  <p className="text-xs text-slate-500">
                    Requested on {formatDate(p.created_at)}
                    {p.utr_number ? ` · Bank UTR: ${p.utr_number}` : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    p.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : p.status === "pending"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Payout Request Modal */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Withdraw to UPI</h3>
              </div>
              <button
                onClick={() => setPayoutModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {payoutError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {payoutError}
              </div>
            )}

            <form onSubmit={handlePayoutSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Enter any active UPI handle (Google Pay, PhonePe, Paytm, BHIM, etc.)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Amount (₹)
                  </label>
                  <span className="text-xs text-emerald-700 font-semibold">
                    Available: ₹{wallet.available_balance.toFixed(2)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={wallet.available_balance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                Payouts are processed directly to your bank account via UPI. You will receive a notification and UTR number once dispatched.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                >
                  {payoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
