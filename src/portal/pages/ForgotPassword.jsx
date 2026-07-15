import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Mail } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
      toast.success('Password reset link sent');
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
              <p className="text-xs font-semibold text-emerald-200/70">Password recovery</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-white p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Reset access</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Forgot password?</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Enter your account email and we will send a reset link that works for 5 minutes.
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              Check your inbox for the reset link. It expires in 5 minutes.
            </div>
          ) : null}

          <div className="mt-8">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="you@example.com"
              />
            </label>
          </div>

          <button disabled={loading} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all duration-200 hover:from-emerald-600 hover:to-emerald-500 hover:shadow-emerald-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
            <Mail className="h-4 w-4" />
            {loading ? 'Sending link...' : 'Send reset link'}
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
