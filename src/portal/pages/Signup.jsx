import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Eye, EyeOff, ShieldCheck, UserPlus, CreditCard, Check, Loader2, Gift, Mic2, BookOpenCheck, BarChart3 } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { openRazorpayCheckout } from '../../../lib/razorpay';

const PLANS = {
  basic: { name: 'Basic', price: 199, total: 199, interviews: 4, access_level: 1 },
  advanced: { name: 'Advanced', price: 499, total: 499, interviews: 12, access_level: 3 },
  professional: { name: 'Professional', price: 849, total: 849, interviews: 24, access_level: 6 },
};

const platformCards = [
  { title: 'Interview Arena', description: 'Practice with AI questions, answer naturally, and get a scorecard.', icon: Mic2 },
  { title: 'Aptitude Edge', description: 'Take published tests, track attempts, and spot weak topics fast.', icon: BookOpenCheck },
  { title: 'Live Progress', description: 'See fresh analytics for students, lecturers, and master admins.', icon: BarChart3 },
];

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const initialPlan = searchParams.get('plan') || 'professional';
  const [step, setStep] = useState('account');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [referralDiscount, setReferralDiscount] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referral_code: searchParams.get('ref') || '',
  });

  function update(key, value) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  useEffect(() => {
    if (step !== 'payment' || !form.referral_code) {
      setReferralDiscount(null);
      return;
    }
    let cancelled = false;
    async function validate() {
      try {
        const res = await apiFetch(`/api/referral/validate-public?code=${encodeURIComponent(form.referral_code)}&plan_amount=${PLANS[selectedPlan].price}&plan_key=${selectedPlan}`);
        if (!cancelled && res.discount) setReferralDiscount(res.discount);
      } catch {
        if (!cancelled) setReferralDiscount(null);
      }
    }
    validate();
    return () => { cancelled = true; };
  }, [step, form.referral_code, selectedPlan]);

  async function handleAccountSubmit(e) {
    e.preventDefault();
    setError('');
    setEmailError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!PLANS[selectedPlan]) {
      setError('Please select a plan');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/subscription/check-email', {
        method: 'POST',
        body: JSON.stringify({ email: form.email }),
      });
      if (res.exists) {
        setEmailError('This email is already registered.');
        setLoading(false);
        return;
      }
      setStep('payment');
    } catch (err) {
      setEmailError(err.message || 'Failed to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    setLoading(true);
    setError('');
    try {
      const orderData = await apiFetch('/subscription/guest-create-order', {
        method: 'POST',
        body: JSON.stringify({ plan_key: selectedPlan, referral_code: form.referral_code || undefined }),
      });

      if (orderData.mock) {
        const verifyRes = await apiFetch('/subscription/guest-verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpay_order_id: orderData.order_id,
            razorpay_payment_id: 'mock_pay_' + Date.now(),
            razorpay_signature: 'mock_sig',
            plan_key: selectedPlan,
            name: form.name,
            email: form.email,
            password: form.password,
            referral_code: form.referral_code || undefined,
          }),
        });
        loginWithToken(verifyRes.token, verifyRes.user);
        navigate('/dashboard');
        return;
      }

      const paymentRes = await openRazorpayCheckout({
        key: orderData.key_id,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'Edvols',
        description: `${plan.name} Plan Subscription`,
        prefill: { name: form.name, email: form.email },
        theme: { color: '#059669' },
      });

      if (paymentRes.cancelled) {
        setError('Payment cancelled. Your account has not been created yet. Click Pay again to complete signup.');
        setLoading(false);
        return;
      }

      const verifyRes = await apiFetch('/subscription/guest-verify', {
        method: 'POST',
        body: JSON.stringify({
          plan_key: selectedPlan,
          razorpay_order_id: paymentRes.razorpay_order_id,
          razorpay_payment_id: paymentRes.razorpay_payment_id,
          razorpay_signature: paymentRes.razorpay_signature,
          name: form.name,
          email: form.email,
          password: form.password,
          referral_code: form.referral_code || undefined,
        }),
      });

      loginWithToken(verifyRes.token, verifyRes.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  const plan = PLANS[selectedPlan];

  return (
    <main className="min-h-screen grid place-items-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f4f7f6 50%, #ecfdf5 100%)' }}>
      <section className="w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl">
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 px-8 py-6 text-white sm:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/edvols%20logo.png" alt="Edvols" className="h-10 w-auto" />
              <div>
                <p className="text-xl font-black">Edvols</p>
                <p className="text-xs font-semibold text-emerald-200/70">Build your placement-ready profile</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${step === 'account' ? 'bg-white text-emerald-900 font-bold' : 'bg-emerald-700 text-emerald-200'}`}>1</span>
              <span className="text-emerald-400">&rarr;</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${step === 'payment' ? 'bg-white text-emerald-900 font-bold' : 'bg-emerald-700 text-emerald-200'}`}>2</span>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {platformCards.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <Icon className="h-4 w-4 text-emerald-300" />
                <p className="mt-2 text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-100/70">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {step === 'account' ? (
          <form onSubmit={handleAccountSubmit} className="bg-white p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Step 1 of 2</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">Choose a plan and create your account to get started.</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {Object.entries(PLANS).map(([key, p]) => (
                <button key={key} type="button" onClick={() => setSelectedPlan(key)} className={`relative rounded-xl border-2 p-4 text-left transition ${selectedPlan === key ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-200 hover:border-slate-300'}`}>
                  {key === 'professional' && <span className="absolute -top-2.5 right-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">POPULAR</span>}
                  <p className="text-sm font-bold text-slate-900">{p.name}</p>
                  <p className="mt-1 text-lg font-bold text-emerald-700">₹{p.price}</p>
                  <p className="mt-1 text-xs text-slate-500">{p.interviews} interviews &middot; Level {p.access_level}</p>
                  {selectedPlan === key && <div className="absolute top-2 left-2"><Check size={14} className="text-emerald-600" /></div>}
                </button>
              ))}
            </div>

            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-700">Full Name</span>
                <input required value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter your full name" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-700">Email</span>
                <input type="email" required value={form.email} onChange={(e) => { update('email', e.target.value); setEmailError(''); }} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="you@example.com" />
                {emailError && (
                  <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                    {emailError} <Link to="/login" className="font-bold text-emerald-700 underline hover:text-emerald-800">Sign in</Link>
                  </span>
                )}
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Password</span>
                <div className="relative mt-1.5">
                  <input type={showPassword ? 'text' : 'password'} minLength="8" required value={form.password} onChange={(e) => update('password', e.target.value)} className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Minimum 8 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Confirm Password</span>
                <div className="relative mt-1.5">
                  <input type="password" minLength="8" required value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Repeat your password" />
                </div>
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-700">Referral Code <span className="font-normal text-slate-400">(optional)</span></span>
                <div className="relative mt-1.5">
                  <Gift className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.referral_code}
                    onChange={(e) => update('referral_code', e.target.value.toUpperCase())}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold uppercase text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Enter referral code"
                  />
                </div>
                {form.referral_code && (
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Referral code applied! You'll get rewards after your first purchase.</p>
                )}
              </label>
            </div>

            <button type="submit" disabled={loading} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all duration-200 hover:from-emerald-600 hover:to-emerald-500 hover:shadow-emerald-300 active:scale-[0.98] disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</> : <><UserPlus className="h-4 w-4" /> Continue to Payment</>}
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account? <Link className="font-bold text-emerald-700 transition hover:text-emerald-800" to="/login">Sign in <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" /></Link>
            </p>
          </form>
        ) : (
          <div className="bg-white p-8 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Step 2 of 2</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Complete Payment</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">Review your order and complete payment.</p>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{plan.name} Plan</p>
                  <p className="text-xs text-slate-500">{plan.interviews} AI interviews &middot; Level {plan.access_level}</p>
                </div>
                <div className="text-right">
                  {referralDiscount?.discount > 0 ? (
                    <>
                      <p className="text-sm text-slate-400 line-through">₹{plan.price}</p>
                      <p className="text-2xl font-bold text-emerald-700">₹{plan.price - referralDiscount.discount}</p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">₹{plan.price}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-600">Plan Price</span><span className="font-medium">₹{plan.price}</span></div>
                {referralDiscount?.discount > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-emerald-600 font-semibold">Referral Discount</span><span className="font-semibold text-emerald-600">-₹{referralDiscount.discount}</span></div>
                )}
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2"><span className="font-bold text-slate-900">Total</span><span className="font-bold text-slate-900">₹{referralDiscount?.discount > 0 ? plan.price - referralDiscount.discount : plan.price}</span></div>
              </div>
            </div>

            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep('account')} className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={handlePayment} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-emerald-500 active:scale-[0.98] disabled:opacity-60">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><CreditCard className="h-4 w-4" /> Pay ₹{referralDiscount?.discount > 0 ? plan.price - referralDiscount.discount : plan.price}</>}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">Secured by Razorpay</p>
          </div>
        )}
      </section>
    </main>
  );
}
