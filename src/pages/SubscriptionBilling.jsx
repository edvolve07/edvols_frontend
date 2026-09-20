import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  Crown,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Receipt,
  Download,
  CreditCard,
  TrendingUp,
  Briefcase,
  AlertCircle,
  Zap,
  Star,
  Shield,
  Lock,
  Sparkles,
  Gift,
  Check,
  Building2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { openRazorpayCheckout, createUpgradePlanKey } from "@/lib/razorpay";
import { useAuth } from "@/src/portal/context/AuthContext";

const LEVEL_PRICES = { 1: 199, 2: 499, 3: 849 };

const TIERS = [
  {
    key: "starter",
    level: 1,
    name: "Level 1: Foundation",
    tagline: "Foundation & Baseline",
    purpose: "Understand baseline strengths and establish core placement readiness fundamentals.",
    price: 199,
    interviews_total: 10,
    range: "1–10",
    icon: Zap,
    color: "from-blue-600 to-blue-700",
    btnColor: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-200",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "FOUNDATION",
    features: [
      "Level 1: Foundation (1–10 Sessions)",
      "Foundation Mock Evaluation (#10)",
      "Resume Claim & ATS Verification",
      "Basic Placement Readiness Score",
      "Reports & Competency Gap Analysis",
    ],
  },
  {
    key: "career",
    level: 2,
    name: "Level 2: Skill Development",
    tagline: "Skill Development & Specialization",
    purpose: "Hands-on technical depth, behavioral mastery, and domain specialization.",
    price: 499,
    interviews_total: 20,
    range: "1–20",
    icon: Star,
    color: "from-emerald-600 to-emerald-700",
    btnColor: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-emerald-200",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-700",
    popular: true,
    badge: "RECOMMENDED",
    features: [
      "All Level 1 Sessions (1–10) Included",
      "Technical Rounds 1 & 2 + Hands-on Logic",
      "Intermediate Mock Evaluation (#20)",
      "STAR Method Behavioral Communication",
      "Domain Specialization & Architecture",
      "Personalized Career Action Plan",
    ],
  },
  {
    key: "placement_pro",
    level: 3,
    name: "Level 3: Placement Ready",
    tagline: "Complete Placement Ready",
    purpose: "Full recruitment simulation, executive defense, and certified placement ready.",
    price: 849,
    interviews_total: 30,
    range: "1–30",
    icon: Crown,
    color: "from-purple-600 to-purple-700",
    btnColor: "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple-200",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    badge: "CERTIFIED PLACEMENT READY",
    features: [
      "All 3 Levels (1–30 Full Progression)",
      "Final Placement Simulation (#30)",
      "Verified Placement Readiness Certificate",
      "Executive Leadership & Crisis Scenarios",
      "Algorithmic Defense & Tradeoffs",
      "Official Weighted Placement Readiness Score",
      "Priority Support & Mock Retakes",
    ],
  },
];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

function calcUpgradeDifferential(currentLevel, targetLevel) {
  if (targetLevel <= currentLevel) return 0;
  const currentPrice = LEVEL_PRICES[currentLevel] || 0;
  const targetPrice = LEVEL_PRICES[targetLevel] || 849;
  return Math.max(0, targetPrice - currentPrice);
}

export default function SubscriptionBilling() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const cardsRef = useRef(null);

  const [subscription, setSubscription] = useState(null);
  const [journey, setJourney] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState("");
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Referral code state
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [referralValidating, setReferralValidating] = useState(false);
  const [referralStatus, setReferralStatus] = useState(null);

  // Highlighted target from query param
  const targetParam = parseInt(searchParams.get("target") || "", 10);
  const highlightedTarget = targetParam && targetParam >= 2 && targetParam <= 3 ? targetParam : null;

  const isInstitutional = user?.role === "student" || subscription?.type === "institution";
  const currentAccessLevel = isInstitutional ? 3 : Number(subscription?.access_level || 0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [subData, txData] = await Promise.all([
        apiFetch("/api/subscription/current"),
        apiFetch("/api/subscription/history"),
      ]);
      setSubscription(subData.subscription);
      setJourney(subData.journey);
      setTransactions(txData.transactions || []);
    } catch (err) {
      setError(err.message || "Unable to load subscription data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Scroll to targeted tier card if ?target=X is in URL
  useEffect(() => {
    if (highlightedTarget && cardsRef.current) {
      setTimeout(() => {
        cardsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [highlightedTarget]);

  async function handleApplyReferral() {
    if (!referralCode.trim()) return;
    setReferralValidating(true);
    setReferralStatus(null);
    try {
      const res = await apiFetch("/api/referral/validate", {
        method: "POST",
        body: JSON.stringify({ code: referralCode.trim() }),
      });
      if (res?.valid) {
        setReferralStatus({
          valid: true,
          discount_percent: res.discount_percent || 5,
          message: `Referral applied! ${res.discount_percent || 5}% discount will be deducted at checkout.`,
        });
      } else {
        setReferralStatus({
          valid: false,
          message: res?.error || "Invalid or expired referral code.",
        });
      }
    } catch (err) {
      setReferralStatus({
        valid: false,
        message: err.message || "Failed to validate referral code.",
      });
    } finally {
      setReferralValidating(false);
    }
  }

  // Action for new purchase or upgrade
  async function handleTierAction(tier) {
    setError("");
    setProcessingPlan(tier.key);

    const isUpgrade = currentAccessLevel > 0 && tier.level > currentAccessLevel;

    try {
      if (isUpgrade) {
        // Upgrade flow via create-upgrade-order
        const orderRes = await apiFetch("/api/subscription/create-upgrade-order", {
          method: "POST",
          body: JSON.stringify({
            target_level: tier.level,
            referral_code: referralCode.trim() || undefined,
          }),
        });

        if (orderRes.mock) {
          await apiFetch("/api/subscription/verify-upgrade", {
            method: "POST",
            body: JSON.stringify({
              plan_key: createUpgradePlanKey(tier.level),
              razorpay_order_id: orderRes.order_id,
              razorpay_payment_id: orderRes.order_id,
              razorpay_signature: "mock_sig",
              referral_code: referralCode.trim() || undefined,
            }),
          });
          await loadData();
          return;
        }

        const paymentRes = await openRazorpayCheckout({
          key: orderRes.key_id,
          amount: orderRes.amount * 100,
          currency: orderRes.currency,
          order_id: orderRes.order_id,
          name: "Edvols",
          description: `Upgrade to ${tier.name}`,
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
          },
          theme: { color: "#059669" },
        });

        if (paymentRes.cancelled) {
          setError("Payment was cancelled.");
          return;
        }

        await apiFetch("/api/subscription/verify-upgrade", {
          method: "POST",
          body: JSON.stringify({
            plan_key: createUpgradePlanKey(tier.level),
            razorpay_order_id: paymentRes.razorpay_order_id,
            razorpay_payment_id: paymentRes.razorpay_payment_id,
            razorpay_signature: paymentRes.razorpay_signature,
            referral_code: referralCode.trim() || undefined,
          }),
        });

        await loadData();
      } else {
        // New purchase flow via create-order
        const orderRes = await apiFetch("/api/subscription/create-order", {
          method: "POST",
          body: JSON.stringify({
            plan_key: tier.key,
            referral_code: referralCode.trim() || undefined,
          }),
        });

        if (orderRes.mock) {
          await apiFetch("/api/subscription/verify", {
            method: "POST",
            body: JSON.stringify({
              plan_key: tier.key,
              razorpay_order_id: orderRes.order_id,
              razorpay_payment_id: orderRes.order_id,
              razorpay_signature: "mock_sig",
              referral_code: referralCode.trim() || undefined,
            }),
          });
          await loadData();
          return;
        }

        const paymentRes = await openRazorpayCheckout({
          key: orderRes.key_id,
          amount: orderRes.amount * 100,
          currency: orderRes.currency,
          order_id: orderRes.order_id,
          name: "Edvols",
          description: `${tier.name} Subscription`,
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
          },
          theme: { color: "#059669" },
        });

        if (paymentRes.cancelled) {
          setError("Payment was cancelled.");
          return;
        }

        await apiFetch("/api/subscription/verify", {
          method: "POST",
          body: JSON.stringify({
            plan_key: tier.key,
            razorpay_order_id: paymentRes.razorpay_order_id,
            razorpay_payment_id: paymentRes.razorpay_payment_id,
            razorpay_signature: paymentRes.razorpay_signature,
            referral_code: referralCode.trim() || undefined,
          }),
        });

        await loadData();
      }
    } catch (err) {
      setError(err.message || "Payment transaction failed. Please try again.");
    } finally {
      setProcessingPlan("");
    }
  }

  async function viewInvoice(txId) {
    setInvoiceLoading(true);
    try {
      const data = await apiFetch(`/api/subscription/invoice/${txId}`);
      setSelectedInvoice(data.invoice);
    } catch (err) {
      setError(err.message || "Failed to load invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm font-medium text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" /> Loading subscription details...
      </div>
    );
  }

  const completedCount = journey?.completed_interviews || 0;
  const totalQuota = subscription?.interviews_total || (currentAccessLevel * 10) || 10;
  const quotaPercent = Math.min(100, Math.round((completedCount / totalQuota) * 100));

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Subscription & Billing
        </h1>
        <p className="mt-1.5 text-base text-slate-500">
          Manage your placement readiness tier, upgrade interview access, and view your tax invoices.
        </p>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Institutional Student Banner */}
      {isInstitutional ? (
        <section className="mb-10 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/70 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold uppercase text-blue-800">
                  Institutional Cohort License
                </span>
                <h2 className="mt-1 text-xl font-bold text-slate-900">All 30 Placement Interviews Included</h2>
                <p className="mt-1 text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Your account is licensed under your college/university partnership. You have complete, unrestricted access to all 3 Levels (30 mock interviews, STAR behavioral analysis, and verified certification) without individual fees.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/journey")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 shrink-0"
            >
              Go to Placement Journey
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : subscription && currentAccessLevel > 0 ? (
        /* Current Active Subscription Hero */
        <section className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Crown className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                    <CheckCircle2 size={12} /> Active Plan
                  </span>
                  <span className="text-xs font-medium text-slate-400">· Started {formatDate(subscription.start_date)}</span>
                </div>
                <h2 className="mt-1.5 text-2xl font-bold text-slate-900">{subscription.plan_name}</h2>
                <p className="text-sm font-medium text-slate-500">
                  Access Level {currentAccessLevel} of 3 · {totalQuota} Placement Mock Interviews Unlocked
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button
                onClick={() => navigate("/journey")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
              >
                <Briefcase className="h-4 w-4 text-slate-500" />
                Go to Journey
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-4 border-t border-slate-100 pt-6">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500">Total Quota</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totalQuota} Sessions</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Interviews 1–{totalQuota}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500">Completed</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">{completedCount} Completed</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{Math.max(0, totalQuota - completedCount)} remaining</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500">Amount Paid</p>
              <p className="mt-1 text-xl font-bold text-slate-900">₹{subscription.amount_paid}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">One-time payment</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-500">Readiness Score</p>
              <p className="mt-1 text-xl font-bold text-purple-700">{journey?.readiness_score || 0}%</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Weighted placement score</p>
            </div>
          </div>

          {/* Quota Progress Bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
              <span>Interview Quota Progress</span>
              <span className="font-bold text-slate-900">{completedCount} of {totalQuota} Sessions ({quotaPercent}%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        </section>
      ) : (
        /* No Subscription Prompt Banner */
        <section className="mb-10 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Choose Your Placement Preparation Tier</h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Select one of the 3 structured levels below to begin your AI mock interviews. You can start with Level 1 and upgrade anytime by simply paying the difference.
          </p>
        </section>
      )}

      {/* 3-Tier Roadmap Cards Section */}
      {!isInstitutional && (
        <section ref={cardsRef} className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Placement Preparation Tiers</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">3-Tier Placement Architecture</h2>
              <p className="mt-1 text-sm text-slate-500">
                {currentAccessLevel > 0
                  ? "Upgrade your tier anytime by paying only the differential amount. Your existing payment is credited 100%."
                  : "Pick your entry point. Every tier includes real-time AI voice interviews, rubric scoring, and detailed performance reports."}
              </p>
            </div>

            {/* Referral Code Promo Box */}
            <div className="w-full md:w-auto min-w-[300px]">
              <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Gift size={14} className="text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-800">Have a Referral Code? (5% OFF)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="w-full rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold uppercase text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={handleApplyReferral}
                    disabled={referralValidating || !referralCode.trim()}
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50 shrink-0"
                  >
                    {referralValidating ? <Loader2 size={12} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
                {referralStatus && (
                  <p className={`mt-1.5 text-[11px] font-semibold ${referralStatus.valid ? "text-emerald-800" : "text-red-600"}`}>
                    {referralStatus.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* The 3 Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const isCurrent = currentAccessLevel === tier.level;
              const isIncluded = currentAccessLevel > tier.level;
              const isUpgrade = currentAccessLevel > 0 && tier.level > currentAccessLevel;
              const isNewPurchase = currentAccessLevel === 0;
              const isTargeted = highlightedTarget === tier.level;

              const upgradePrice = isUpgrade ? calcUpgradeDifferential(currentAccessLevel, tier.level) : tier.price;
              const isProcessing = processingPlan === tier.key;

              return (
                <div
                  key={tier.key}
                  className={`relative rounded-2xl border-2 bg-white p-7 shadow-sm transition-all flex flex-col justify-between ${
                    isTargeted
                      ? "ring-4 ring-amber-400/80 border-amber-400 shadow-xl"
                      : isCurrent
                      ? "border-emerald-400 ring-2 ring-emerald-200 shadow-md"
                      : tier.popular
                      ? "border-emerald-300 hover:border-emerald-400 shadow-md"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Top Badges */}
                  {isCurrent ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3.5 py-0.5 text-xs font-extrabold text-white shadow-sm tracking-wide">
                      CURRENT ACTIVE TIER
                    </div>
                  ) : isTargeted ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3.5 py-0.5 text-xs font-extrabold text-white shadow-sm tracking-wide animate-pulse">
                      TARGET FOR UNLOCK
                    </div>
                  ) : tier.popular ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-700 px-3.5 py-0.5 text-xs font-extrabold text-white shadow-sm tracking-wide">
                      RECOMMENDED
                    </div>
                  ) : null}

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className={`grid h-12 w-12 place-items-center rounded-xl ${tier.bg}`}>
                        <Icon size={24} className={tier.text} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
                        {tier.range} Sessions
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-bold text-slate-900">{tier.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{tier.tagline}</p>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">{tier.purpose}</p>

                    {/* Pricing Display */}
                    <div className="mt-5 rounded-xl bg-slate-50 p-4 border border-slate-100">
                      {isUpgrade ? (
                        <div>
                          <p className="text-xs font-semibold text-emerald-800 mb-0.5">Differential Upgrade Price</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">₹{upgradePrice}</span>
                            <span className="text-xs text-slate-400 line-through">₹{tier.price}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                            Save ₹{LEVEL_PRICES[currentAccessLevel]} with Level {currentAccessLevel} credit
                          </p>
                        </div>
                      ) : isCurrent ? (
                        <div>
                          <p className="text-xs font-semibold text-emerald-800 mb-0.5">Status</p>
                          <div className="text-xl font-bold text-emerald-700">Currently Active</div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {totalQuota} mock interviews fully unlocked
                          </p>
                        </div>
                      ) : isIncluded ? (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-0.5">Status</p>
                          <div className="text-lg font-bold text-slate-700">Included in Your Tier</div>
                          <p className="mt-1 text-[11px] text-slate-400">Covered under Level {currentAccessLevel}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-0.5">Standard Price</p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-extrabold text-slate-900">₹{tier.price}</span>
                            <span className="text-xs text-slate-400">/ one-time</span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">{tier.interviews_total} Mock Interviews Included</p>
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="mt-6 space-y-2.5">
                      {tier.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-xs leading-normal">
                          <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                          <span className="text-slate-700 font-medium">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action CTA Button */}
                  <div className="mt-8">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-100 py-3 text-xs font-bold text-emerald-800 cursor-default"
                      >
                        <CheckCircle2 size={16} /> Active Current Plan
                      </button>
                    ) : isIncluded ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-500 cursor-default"
                      >
                        <Check size={16} /> Included in Current Plan
                      </button>
                    ) : isUpgrade ? (
                      <button
                        onClick={() => handleTierAction(tier)}
                        disabled={isProcessing}
                        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold shadow-md transition-all active:scale-[0.98] ${tier.btnColor} disabled:opacity-60`}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Processing Upgrade...
                          </>
                        ) : (
                          <>
                            <TrendingUp size={14} /> Upgrade to Level {tier.level} (₹{upgradePrice})
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTierAction(tier)}
                        disabled={isProcessing}
                        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold shadow-md transition-all active:scale-[0.98] ${tier.btnColor} disabled:opacity-60`}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Starting Payment...
                          </>
                        ) : (
                          <>
                            Subscribe to Level {tier.level} (₹{tier.price}) <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Shield size={14} className="text-emerald-500" />
            Secure payment integration via Razorpay · Instant level activation
          </div>
        </section>
      )}

      {/* Payment History & Invoices */}
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <Receipt className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900">Payment History & Tax Invoices</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No payments recorded yet. Invoices will automatically appear here once you purchase a plan or upgrade.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50 gap-3">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tx.plan_name} Plan</p>
                    <p className="text-xs text-slate-500">
                      {tx.invoice_number || `TX-${tx.id.slice(0, 8)}`} · {formatDate(tx.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">₹{tx.total_amount}</p>
                    <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                      Completed
                    </span>
                  </div>
                  <button
                    onClick={() => viewInvoice(tx.id)}
                    disabled={invoiceLoading}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Download className="inline h-3.5 w-3.5 mr-1" /> Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tax Invoice Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 backdrop-blur-sm p-4"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tax Invoice</h3>
                <p className="text-xs text-slate-500">{selectedInvoice.number}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Date</span>
                <span className="font-semibold text-slate-900">{formatDate(selectedInvoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Name</span>
                <span className="font-semibold text-slate-900">{selectedInvoice.student?.name || user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student Email</span>
                <span className="font-semibold text-slate-900">{selectedInvoice.student?.email || user?.email}</span>
              </div>
              <div className="border-t border-slate-200 pt-3">
                {selectedInvoice.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span className="text-slate-700">{item.description}</span>
                    <span className="font-semibold text-slate-900">₹{item.amount}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-3 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{selectedInvoice.subtotal || selectedInvoice.total}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>-₹{selectedInvoice.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
                  <span>Total Paid</span>
                  <span className="text-emerald-700">₹{selectedInvoice.total}</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                Payment processed securely via {selectedInvoice.payment_method || "Razorpay"}. Transaction ID: {selectedInvoice.payment_id || selectedInvoice.number}.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
