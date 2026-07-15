import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, BookOpenCheck, Eye, EyeOff, GraduationCap, Mic2, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';

function homeForRole(role) {
  if (role === 'master_admin') return '/master-admin/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/dashboard';
}

export default function Signup() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const platformCards = [
    {
      title: 'Interview arena',
      description: 'Practice with AI questions, answer naturally, and get a scorecard.',
      icon: Mic2,
    },
    {
      title: 'Aptitude edge',
      description: 'Take published tests, track attempts, and spot weak topics fast.',
      icon: BookOpenCheck,
    },
    {
      title: 'Live progress',
      description: 'See fresh analytics for students, lecturers, and master admins.',
      icon: BarChart3,
    },
  ];

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      loginWithToken(data.token, data.user);
      toast.success('Account created');
      navigate(homeForRole(data.user.role));
    } catch (error) {
      const detail = Array.isArray(error.details) ? error.details.join(', ') : error.details;
      toast.error(detail || error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f4f7f6 50%, #ecfdf5 100%)' }}>
      <section className="w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl">
        <div className="bg-gradient-to-b-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 px-8 py-6 text-white sm:px-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/edvols%20logo.png" alt="Edvols" className="h-10 w-auto" />
              <div>
                <p className="text-xl font-black">Edvols</p>
                <p className="text-xs font-semibold text-emerald-200/70">Build your placement-ready profile</p>
              </div>
            </div>
            <ShieldCheck className="hidden h-6 w-6 text-emerald-300 sm:block" />
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

        <form onSubmit={submit} className="bg-white p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Start your Edvols journey</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            One account for interviews, aptitude practice, coding, reports, and analytics.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-slate-700">Full Name</span>
              <input
                required
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Enter your full name"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Password</span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  minLength="8"
                  required
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Minimum 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Confirm Password</span>
              <div className="relative mt-1.5">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  minLength="8"
                  required
                  value={form.confirmPassword}
                  onChange={(event) => update('confirmPassword', event.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Repeat your password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          <button disabled={loading} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all duration-200 hover:from-emerald-600 hover:to-emerald-500 hover:shadow-emerald-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
            <UserPlus className="h-4 w-4" />
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link className="font-bold text-emerald-700 transition hover:text-emerald-800" to="/login">
              Sign in <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
