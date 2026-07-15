import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, GraduationCap, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';

function homeForRole(role) {
  if (role === 'master_admin') return '/master-admin/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/dashboard';
}

export default function Login() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const platformHighlights = [
    'Mock interviews with AI-driven feedback and scoring',
    'Aptitude tests with instant scores and smart insights',
    'Reports that turn every attempt into a clear next step',
  ];

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      loginWithToken(data.token, data.user);
      toast.success('Logged in successfully');
      navigate(homeForRole(data.user?.role), { replace: true });
    } catch (error) {
      const message = error.message || 'Unable to sign in. Check your backend connection and credentials.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8 bg-canvas">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-brand-950 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative hidden flex-col justify-between p-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <img src="/edvols%20logo.png" alt="Edvols" className="h-10 w-auto" />
            <div>
              <p className="text-2xl font-bold tracking-tight">Edvols</p>
              <p className="text-sm font-medium text-brand-300">Placement readiness workspace</p>
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">Your placement command center</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.15] tracking-tight text-white">
              Train smarter.<br />Test faster.<br />Walk in prepared.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-200">
              Edvols combines AI mock interviews, aptitude practice, coding challenges, and performance analytics into one focused workspace.
            </p>
          </div>
          <div className="relative z-10 space-y-3">
            {platformHighlights.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-400" />
                <span className="text-sm font-medium text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="bg-white p-8 sm:p-12">
          <div className="lg:hidden">
            <div className="flex items-center gap-3">
              <img src="/edvols%20logo.png" alt="Edvols" className="h-10 w-auto" />
              <p className="text-xl font-bold text-slate-900">Edvols</p>
            </div>
          </div>

          <div className="mt-10 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Sign in to Edvols</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Resume your interviews, check aptitude results, and track your progress.
            </p>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <Link className="text-sm font-semibold text-brand-700 transition hover:text-brand-800" to="/forgot-password">
              Forgot password?
            </Link>
          </div>

          <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-800 px-5 py-3.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
            <LogIn className="h-4 w-4" />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="mt-8 text-center text-sm text-slate-500">
            New here?{' '}
            <Link className="font-semibold text-brand-700 transition hover:text-brand-800" to="/signup">
              Create account <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
