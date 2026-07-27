import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, Zap, Crown, Star, Shield, Loader2, Gift } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/src/portal/context/AuthContext';
import { openRazorpayCheckout } from '@/lib/razorpay';

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    tagline: 'Get Started',
    price: 199,
    total: 199,
    access_level: 1,
    interviews: 4,
    icon: Zap,
    color: 'from-blue-600 to-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    features: [
      'Level 1 Journey Access',
      '4 AI Interview Sessions',
      'Resume Builder',
      'Reports & Analytics',
      'Basic Readiness Score',
    ],
    excluded: [
      'Programming Practice',
      'Communication Skills',
      'Certificates',
    ],
  },
  {
    key: 'advanced',
    name: 'Advanced',
    tagline: 'Most Popular',
    price: 499,
    total: 499,
    access_level: 3,
    interviews: 12,
    icon: Star,
    color: 'from-emerald-600 to-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    popular: true,
    features: [
      'Levels 1-3 Journey Access',
      '12 AI Interview Sessions',
      'Resume Builder',
      'Reports & Analytics',
      'Programming Practice',
      'Communication Skills',
      'Advanced Readiness Score',
    ],
    excluded: [
      'Certificates',
    ],
  },
  {
    key: 'professional',
    name: 'Professional',
    tagline: 'Complete Package',
    price: 849,
    total: 849,
    access_level: 6,
    interviews: 24,
    icon: Crown,
    color: 'from-purple-600 to-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    features: [
      'All 6 Levels Journey Access',
      '24 AI Interview Sessions',
      'Resume Builder',
      'Reports & Analytics',
      'Programming Practice',
      'Communication Skills',
      'Certificates',
      'Priority Support',
    ],
    excluded: [],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const isIndividual = user?.role === 'individual_student';
  const [purchasing, setPurchasing] = useState("");
  const [payError, setPayError] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || "");
  const [referralApplied, setReferralApplied] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      setReferralApplied(true);
    }
  }, [searchParams]);

  async function handleSubscribe(planKey) {
    setPurchasing(planKey);
    setPayError("");
    try {
      const orderRes = await apiFetch("/api/subscription/create-order", {
        method: "POST",
        body: JSON.stringify({
          plan_key: planKey,
          referral_code: referralCode || undefined,
        }),
      });

      if (orderRes.mock) {
        await apiFetch("/api/subscription/verify", {
          method: "POST",
          body: JSON.stringify({
            plan_key: planKey,
            razorpay_order_id: orderRes.order_id,
            razorpay_payment_id: orderRes.order_id,
            razorpay_signature: "mock_sig",
            referral_code: referralCode || undefined,
          }),
        });
        navigate("/subscription");
        return;
      }

      const paymentRes = await openRazorpayCheckout({
        key: orderRes.key_id,
        amount: orderRes.amount * 100,
        currency: orderRes.currency,
        order_id: orderRes.order_id,
        name: "Edvols",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan Subscription`,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#059669" },
      });

      if (paymentRes.cancelled) {
        setPayError("Payment cancelled");
        return;
      }

      await apiFetch("/api/subscription/verify", {
        method: "POST",
        body: JSON.stringify({
          plan_key: planKey,
          razorpay_order_id: paymentRes.razorpay_order_id,
          razorpay_payment_id: paymentRes.razorpay_payment_id,
          razorpay_signature: paymentRes.razorpay_signature,
          referral_code: referralCode || undefined,
        }),
      });

      navigate("/subscription");
    } catch (err) {
      setPayError(err.message || "Payment failed");
    } finally {
      setPurchasing("");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {payError && (
            <div className="mb-6 mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {payError}
            </div>
          )}
          {referralApplied && (
            <div className="mb-6 mx-auto max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 flex items-center justify-center gap-2">
              <Gift className="h-4 w-4" />
              Referral code <span className="font-bold">{referralCode}</span> applied! You'll get rewards after purchase.
            </div>
          )}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
            <Shield size={16} />
            Placement Readiness Platform
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Choose Your Journey
          </h1>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            AI-powered interview preparation with 24 structured levels.
            Pick the plan that matches your placement goals.
          </p>
          {!referralApplied && (
            <div className="mt-6 mx-auto max-w-sm">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-emerald-500" />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Have a referral code?"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold uppercase text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border-2 bg-white p-8 shadow-lg transition-all hover:shadow-xl ${
                  plan.popular ? 'border-emerald-400 scale-105' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white">
                    MOST POPULAR
                  </div>
                )}

                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${plan.bg}`}>
                  <Icon size={24} className={plan.text} />
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.tagline}</p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">₹{plan.price}</span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Journey Access</span>
                    <span className="font-semibold text-slate-900">Level {plan.access_level}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">AI Interviews</span>
                    <span className="font-semibold text-slate-900">{plan.interviews}</span>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span className="text-slate-700">{f}</span>
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm opacity-40">
                      <Check size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      <span className="text-slate-500 line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (isIndividual) handleSubscribe(plan.key);
                    else if (isLoggedIn) navigate('/dashboard');
                    else navigate(`/signup?plan=${plan.key}`);
                  }}
                  disabled={purchasing === plan.key}
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${plan.color} px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50`}
                >
                  {purchasing === plan.key ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <>
                    {isIndividual ? 'Subscribe & Pay' : isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
                    <ArrowRight size={16} />
                  </>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-6 py-2 text-sm text-slate-600">
            <Shield size={16} className="text-emerald-500" />
            Secure payments via Razorpay
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Upgrade anytime · Your progress is never lost · Enterprise plans available for institutions
          </p>
        </div>
      </div>
    </div>
  );
}
