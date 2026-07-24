import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { loadRazorpayScript, openRazorpayCheckout, createUpgradePlanKey } from "@/lib/razorpay";

const LEVEL_PRICE = 199;
const BULK_DISCOUNT_THRESHOLD = 2;
const BULK_DISCOUNT_PERCENT = 25;

const LEVEL_NAMES = {
  1: "Foundation",
  2: "Professional Basics",
  3: "Advanced",
  4: "Expert",
  5: "Mentor",
  6: "Placement Master",
};

const LEVEL_INTERVIEWS = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24 };

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

function calcUpgradePreview(currentLevel, targetLevel) {
  if (targetLevel <= currentLevel) return null;
  const levelsCount = targetLevel - currentLevel;
  const basePrice = levelsCount * LEVEL_PRICE;
  const hasDiscount = levelsCount >= BULK_DISCOUNT_THRESHOLD;
  const discountAmount = hasDiscount ? Math.round(basePrice * 0.25) : 0;
  const finalPrice = basePrice - discountAmount;
  const gstAmount = Math.round(finalPrice * 0.18);
  const totalAmount = finalPrice + gstAmount;
  return { levelsCount, basePrice, hasDiscount, discountAmount, finalPrice, gstAmount, totalAmount };
}

export default function SubscriptionBilling() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [journey, setJourney] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [targetLevel, setTargetLevel] = useState(2);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

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

  useEffect(() => {
    if (showUpgrade && subscription) {
      setTargetLevel(Math.min(subscription.access_level + 1, 6));
    }
  }, [showUpgrade, subscription]);

  async function handleLevelUpgrade() {
    setUpgrading(true);
    setError("");
    try {
      const planKey = createUpgradePlanKey(targetLevel);

      const orderRes = await apiFetch("/api/subscription/create-upgrade-order", {
        method: "POST",
        body: JSON.stringify({ target_level: targetLevel }),
      });

      if (orderRes.mock) {
        await apiFetch("/api/subscription/verify-upgrade", {
          method: "POST",
          body: JSON.stringify({
            plan_key: planKey,
            razorpay_order_id: orderRes.order_id,
            razorpay_payment_id: orderRes.order_id,
            razorpay_signature: "mock_sig",
          }),
        });
        setShowUpgrade(false);
        await loadData();
        return;
      }

      const paymentRes = await openRazorpayCheckout({
        key: orderRes.key_id,
        amount: orderRes.amount * 100,
        currency: orderRes.currency,
        order_id: orderRes.order_id,
        name: "Edvols",
        description: `Upgrade to Level ${targetLevel}`,
        prefill: {
          name: "",
          email: "",
        },
        theme: { color: "#059669" },
      });

      if (paymentRes.cancelled) {
        setError("Payment cancelled");
        return;
      }

      await apiFetch("/api/subscription/verify-upgrade", {
        method: "POST",
        body: JSON.stringify({
          plan_key: planKey,
          razorpay_order_id: paymentRes.razorpay_order_id,
          razorpay_payment_id: paymentRes.razorpay_payment_id,
          razorpay_signature: paymentRes.razorpay_signature,
        }),
      });

      setShowUpgrade(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Upgrade failed");
    } finally {
      setUpgrading(false);
    }
  }

  async function viewInvoice(txId) {
    setInvoiceLoading(true);
    try {
      const data = await apiFetch(`/api/subscription/invoice/${txId}`);
      setSelectedInvoice(data.invoice);
    } catch (err) {
      setError(err.message);
    } finally {
      setInvoiceLoading(false);
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
    <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <section className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Subscription & Billing</h1>
          <p className="mt-1.5 text-base text-slate-500">Manage your plan, view invoices, and track your journey progress.</p>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      )}

      {subscription ? (
        <>
          <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Crown className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Plan</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">{subscription.plan_name}</h2>
                  <p className="text-sm text-slate-500">
                    Level {subscription.access_level} access · {subscription.interviews_total} interviews
                  </p>
                </div>
              </div>
              <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase text-emerald-700">
                {subscription.status}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Amount Paid</p>
                <p className="mt-1 text-xl font-bold text-slate-900">₹{subscription.amount_paid}</p>
                <p className="text-xs text-slate-400">+₹{subscription.gst_amount} GST</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Started</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(subscription.start_date)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Current Level</p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">Level {journey?.current_level || 1}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Readiness Score</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{journey?.readiness_score || 0}%</p>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowUpgrade(true)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                <TrendingUp className="h-4 w-4" /> Upgrade Plan
              </button>
              <button onClick={() => navigate("/journey")} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <Briefcase className="h-4 w-4" /> View Journey
              </button>
            </div>
          </section>

          {showUpgrade && (
            <section className="mb-8 rounded-xl border-2 border-emerald-300 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Upgrade Your Level</h2>
                  <p className="text-sm text-slate-500">Current access: Level {subscription.access_level} ({LEVEL_NAMES[subscription.access_level]})</p>
                </div>
                <button onClick={() => setShowUpgrade(false)} className="text-sm font-medium text-slate-500 hover:text-slate-700">Cancel</button>
              </div>

              <div className="mt-6">
                <label className="text-sm font-semibold text-slate-700">Select target level</label>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setTargetLevel(Math.max(subscription.access_level + 1, targetLevel - 1))}
                    disabled={targetLevel <= subscription.access_level + 1}
                    className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronDown size={18} />
                  </button>
                  <div className="flex-1 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-6 py-4 text-center">
                    <p className="text-3xl font-bold text-emerald-700">Level {targetLevel}</p>
                    <p className="text-sm text-emerald-600">{LEVEL_NAMES[targetLevel]}</p>
                    <p className="mt-1 text-xs text-slate-500">{LEVEL_INTERVIEWS[targetLevel]} interviews included</p>
                  </div>
                  <button
                    onClick={() => setTargetLevel(Math.min(6, targetLevel + 1))}
                    disabled={targetLevel >= 6}
                    className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  {Array.from({ length: 6 }, (_, i) => i + 1).map((lvl) => {
                    const unlocked = lvl <= subscription.access_level;
                    const selected = lvl === targetLevel;
                    return (
                      <button
                        key={lvl}
                        onClick={() => { if (lvl > subscription.access_level) setTargetLevel(lvl); }}
                        disabled={unlocked}
                        className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition ${
                          unlocked ? "bg-emerald-100 text-emerald-700 cursor-default" :
                          selected ? "bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md" :
                          "bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                        }`}
                      >
                        {unlocked ? <CheckCircle2 size={14} className="mx-auto" /> : `L${lvl}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {(() => {
                const preview = calcUpgradePreview(subscription.access_level, targetLevel);
                if (!preview) return null;
                return (
                  <div className="mt-6 rounded-xl bg-slate-50 p-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{preview.levelsCount} level{preview.levelsCount > 1 ? "s" : ""} × ₹{LEVEL_PRICE}</span>
                      <span className="font-medium">₹{preview.basePrice}</span>
                    </div>
                    {preview.hasDiscount && (
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <Sparkles size={14} /> {BULK_DISCOUNT_PERCENT}% bulk discount ({preview.levelsCount} levels)
                        </span>
                        <span className="font-semibold text-emerald-600">-₹{preview.discountAmount}</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-500">GST (18%)</span>
                      <span>₹{preview.gstAmount}</span>
                    </div>
                    <div className="mt-3 border-t border-slate-200 pt-3 flex items-center justify-between">
                      <span className="text-base font-bold text-slate-900">Total</span>
                      <span className="text-xl font-bold text-slate-900">₹{preview.totalAmount}</span>
                    </div>
                    {preview.hasDiscount && (
                      <p className="mt-2 text-xs text-emerald-600 font-medium">You save ₹{preview.discountAmount + Math.round(preview.discountAmount * 0.18)} including GST!</p>
                    )}
                  </div>
                );
              })()}

              <button
                onClick={handleLevelUpgrade}
                disabled={upgrading || targetLevel <= subscription.access_level}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:from-emerald-600 hover:to-emerald-500 hover:shadow-emerald-300 active:scale-[0.98] disabled:opacity-60"
              >
                {upgrading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing payment...</> : <><CreditCard className="h-4 w-4" /> Pay & Upgrade to Level {targetLevel}</>}
              </button>
              <p className="mt-3 text-center text-xs text-slate-400">Secure payment via Razorpay</p>
            </section>
          )}
        </>
      ) : (
        <section className="mb-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100">
            <CreditCard className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">No Active Subscription</h2>
          <p className="mt-2 text-sm text-slate-500">Choose a plan to start your placement journey.</p>
          <button onClick={() => navigate("/pricing")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
            View Plans <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}

      <section className="mb-8 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <Receipt className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900">Payment History</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No payments yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tx.plan_name} Plan</p>
                    <p className="text-xs text-slate-500">{tx.invoice_number} · {formatDate(tx.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">₹{tx.total_amount}</p>
                    <p className="text-xs text-slate-500">incl. GST</p>
                  </div>
                  <button onClick={() => viewInvoice(tx.id)} disabled={invoiceLoading} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                    <Download className="inline h-3.5 w-3.5" /> Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Tax Invoice</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-sm font-medium text-slate-500 hover:text-slate-700">Close</button>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Invoice No</span><span className="font-semibold">{selectedInvoice.number}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-semibold">{formatDate(selectedInvoice.date)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="font-semibold">{selectedInvoice.student?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-semibold">{selectedInvoice.student?.email}</span></div>
              <div className="border-t border-slate-200 pt-3">
                {selectedInvoice.items?.map((item, i) => (
                  <div key={i} className="flex justify-between"><span>{item.description}</span><span className="font-semibold">₹{item.amount}</span></div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-3 space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>₹{selectedInvoice.subtotal}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span><span>₹{selectedInvoice.gst}</span></div>
                <div className="flex justify-between text-base font-bold"><span>Total Paid</span><span>₹{selectedInvoice.total}</span></div>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Payment via {selectedInvoice.payment_method}</span>
                  <span>ID: {selectedInvoice.payment_id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
