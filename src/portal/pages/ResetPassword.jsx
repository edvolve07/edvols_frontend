import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, GraduationCap, KeyRound } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, ...form }),
      });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.details?.join(', ') || error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f4f7f6 50%, #ecfdf5 100%)' }}>
      <section className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <img src="/edvols%20logo.png" alt="Edvols" className="h-10 w-auto" />
            <div>
              <p className="text-lg font-black">Edvols</p>
              <p className="text-xs font-semibold text-emerald-200/70">Create a new password</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-white p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Secure reset</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Set new password</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Reset links expire after 5 minutes. Request a new link if this one no longer works.
          </p>

          {!token ? (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
              This reset link is missing a token.
            </div>
          ) : null}

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">New password</span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  minLength="8"
                  required
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Minimum 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">Confirm password</span>
              <div className="relative mt-1.5">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  minLength="8"
                  required
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Repeat your password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          <button disabled={loading || !token} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all duration-200 hover:from-emerald-600 hover:to-emerald-500 hover:shadow-emerald-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
            <KeyRound className="h-4 w-4" />
            {loading ? 'Resetting...' : 'Reset password'}
          </button>

          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-800" to="/login">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </form>
      </section>
    </main>
  );
}
