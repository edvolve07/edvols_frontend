import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, Zap, Crown, Star, Shield, Loader2, Gift, Building2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/src/portal/context/AuthContext';
import { openRazorpayCheckout } from '@/lib/razorpay';

const FALLBACK_PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    tagline: 'Foundation & Baseline',
    purpose: 'Understand baseline strengths and establish core placement readiness fundamentals.',
    price: 299,
    access_level: 1,
    interviews_total: 10,
    icon: Zap,
    color: 'from-blue-600 to-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    popular: false,
    features: [
      'Level 1: Foundation (1–10 Sessions)',
      'Foundation Mock Evaluation (#10)',
      'Resume Claim & ATS Verification',
      'Basic Placement Readiness Score',
      'Reports & Competency Gap Analysis',
    ],
  },
  {
    key: 'career',
    name: 'Career',
    tagline: 'Skill Development & Specialization',
    purpose: 'Hands-on technical depth, behavioral mastery, and domain specialization.',
    price: 599,
    access_level: 2,
    interviews_total: 20,
    icon: Star,
    color: 'from-emerald-600 to-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    popular: true,
    features: [
      'Levels 1 & 2 (1–20 Sessions)',
      'Intermediate Mock Evaluation (#20)',
      'STAR Method Behavioral Analysis',
      'Domain Architecture & Coding Questions',
      'Full Competency Gap Breakdown',
      'Personalized Career Action Plan',
    ],
  },
  {
    key: 'placement_pro',
    name: 'Placement Pro',
    tagline: 'Complete Placement Ready',
    purpose: 'Full recruitment simulation, executive defense, and certified placement ready.',
    price: 899,
    access_level: 3,
    interviews_total: 30,
    icon: Crown,
    color: 'from-purple-600 to-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    popular: false,
    features: [
      'All 3 Levels (1–30 Full Progression)',
      'Final Placement Simulation (#30)',
      'Executive Leadership & Crisis Scenarios',
      'Verified Placement Readiness Certificate',
      'Official Weighted Readiness Score',
      'Priority Support & Mock Retakes',
    ],
  },
];

const PLAN_META = {
  starter: {
    icon: Zap,
    color: 'from-blue-600 to-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  career: {
    icon: Star,
    color: 'from-emerald-600 to-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
  },
  placement_pro: {
    icon: Crown,
    color: 'from-purple-600 to-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
  },
};

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const isIndividual = user?.role === 'individual_student';
  const isInstitutional = user?.role === 'student';

  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [purchasing, setPurchasing] = useState('');
  const [payError, setPayError] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [referralApplied, setReferralApplied] = useState(false);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await apiFetch('/api/subscription/plans');
        if (res?.plans && Array.isArray(res.plans) && res.plans.length > 0) {
          const merged = res.plans.map((p) => {
            const meta = PLAN_META[p.key] || PLAN_META.starter;
            return {
              key: p.key,
              name: p.name,
              tagline: p.tagline || (p.key === 'starter' ? 'Foundation & Baseline' : p.key === 'career' ? 'Skill Development' : 'Placement Ready'),
              purpose: p.purpose || '',
              price: Number(p.amount || p.total_amount || p.price),
              access_level: p.access_level || 1,
              interviews_total: p.interviews_total || (p.key === 'starter' ? 10 : p.key === 'career' ? 20 : 30),
              popular: Boolean(p.popular || p.key === 'career'),
              features: p.features?.length > 0 ? p.features : (FALLBACK_PLANS.find(fp => fp.key === p.key)?.features || []),
              ...meta,
            };
          });
          setPlans(merged);
        }
      } catch (_e) {
        // Keep fallback plans
      } finally {
        setLoadingPlans(false);
      }
    }
    fetchPlans();
  }, []);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      setReferralApplied(true);
    }
  }, [searchParams]);

  async function handleSubscribe(planKey) {
    setPurchasing(planKey);
    setPayError('');
    try {
      const orderRes = await apiFetch('/api/subscription/create-order', {
        method: 'POST',
        body: JSON.stringify({
          plan_key: planKey,
          referral_code: referralCode || undefined,
        }),
      });

      if (orderRes.mock) {
        await apiFetch('/api/subscription/verify', {
          method: 'POST',
          body: JSON.stringify({
            plan_key: planKey,
            razorpay_order_id: orderRes.order_id,
            razorpay_payment_id: orderRes.order_id,
            razorpay_signature: 'mock_sig',
            referral_code: referralCode || undefined,
          }),
        });
        navigate('/subscription');
        return;
      }

      const paymentRes = await openRazorpayCheckout({
        key: orderRes.key_id,
        amount: orderRes.amount * 100,
        currency: orderRes.currency,
        order_id: orderRes.order_id,
        name: 'Edvols',
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan Subscription`,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#059669' },
      });

      if (paymentRes.cancelled) {
        setPayError('Payment cancelled');
        return;
      }

      await apiFetch('/api/subscription/verify', {
        method: 'POST',
        body: JSON.stringify({
          plan_key: planKey,
          razorpay_order_id: paymentRes.razorpay_order_id,
          razorpay_payment_id: paymentRes.razorpay_payment_id,
          razorpay_signature: paymentRes.razorpay_signature,
          referral_code: referralCode || undefined,
        }),
      });

      navigate('/subscription');
    } catch (err) {
      setPayError(err.message || 'Payment failed');
    } finally {
      setPurchasing('');
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

          {isInstitutional ? (
            <div className="mb-8 mx-auto max-w-2xl rounded-2xl border border-blue-200 bg-blue-50/80 p-6 text-center shadow-sm">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white mb-3">
                <Building2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-blue-900">Institutional Access Active</h2>
              <p className="mt-2 text-sm text-blue-700">
                Your account is managed by your university or college. All 30 placement readiness interviews, assessments, and certifications are fully included under your institution cohort license. Individual subscriptions are not required.
              </p>
              <button
                onClick={() => navigate('/journey')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md"
              >
                Go to Placement Journey
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {referralApplied && isIndividual && (
                <div className="mb-6 mx-auto max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 flex items-center justify-center gap-2">
                  <Gift className="h-4 w-4" />
                  Referral code <span className="font-bold">{referralCode}</span> applied! You'll receive discount & cash reward.
                </div>
              )}
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                <Shield size={16} />
                Placement Readiness Platform
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Choose Your Placement Path
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                30 structured interviews across 3 progressive levels.
                Assess &rarr; Identify Gaps &rarr; Improve &rarr; Practice &rarr; Placement Ready.
              </p>
              {!referralApplied && isIndividual && (
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
            </>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon || Zap;
            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border-2 bg-white p-8 shadow-lg transition-all hover:shadow-xl flex flex-col justify-between ${
                  plan.popular ? 'border-emerald-400 scale-105' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white shadow-sm">
                    RECOMMENDED
                  </div>
                )}

                <div>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${plan.bg}`}>
                    <Icon size={24} className={plan.text} />
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-sm font-medium text-slate-500">{plan.tagline}</p>
                  {plan.purpose && (
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{plan.purpose}</p>
                  )}

                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900">₹{plan.price}</span>
                      <span className="text-xs text-slate-400">/ one-time</span>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Journey Access</span>
                      <span className="font-semibold text-slate-900">Level {plan.access_level}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600">Interviews Total</span>
                      <span className="font-semibold text-emerald-700">{plan.interviews_total} Sessions</span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                        <span className="text-slate-700 font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {!isInstitutional && (
                  <button
                    onClick={() => {
                      if (isIndividual) handleSubscribe(plan.key);
                      else if (isLoggedIn) navigate('/dashboard');
                      else navigate(`/signup?plan=${plan.key}`);
                    }}
                    disabled={purchasing === plan.key || loadingPlans}
                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${plan.color} px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50`}
                  >
                    {purchasing === plan.key ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        {isIndividual ? 'Subscribe & Pay' : isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-6 py-2 text-sm text-slate-600">
            <Shield size={16} className="text-emerald-500" />
            Secure payment integration via Razorpay
          </div>
          <p className="mt-4 text-sm text-slate-400">
            College & University Licensing · Cohort Admin Portals · Dynamic Reporting Available
          </p>
        </div>
      </div>
    </div>
  );
}
