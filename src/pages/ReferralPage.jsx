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
} from "lucide-react";
import { apiFetch, getMyReferral, getReferralHistory } from "@/lib/api";
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

  const loadData = useCallback(async () => {
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
  }, []);

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

  async function shareLink() {
    if (!referralData?.referral_link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Edvols",
          text: `Use my referral code ${referralData.code} to sign up on Edvols and get rewards!`,
          url: referralData.referral_link,
        });
      } catch {}
    } else {
      copyLink();
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
    <div className="mx-auto max-w-[1000px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <section className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Referral Program</h1>
        <p className="mt-1.5 text-base text-slate-500">
          Invite friends and earn rewards when they subscribe.
        </p>
      </section>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {referralData && (
        <>
          <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <Gift className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Referral Code</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="rounded-lg bg-emerald-50 px-4 py-2.5 text-2xl font-black tracking-wider text-emerald-700">
                    {referralData.code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 truncate">
                    {referralData.referral_link}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyLink}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Copy Link
                    </button>
                    <button
                      onClick={shareLink}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Total Referrals</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{referralData.total_referrals}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Successful</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{referralData.successful_referrals}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-amber-500">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Pending</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-amber-600">{referralData.pending_referrals}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-violet-500">
                <Award className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Rewards Earned</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-violet-600">{referralData.rewards_earned?.length || 0}</p>
            </div>
          </section>

          {referralData.rewards_earned?.length > 0 && (
            <section className="mb-8 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
                <Gift className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Your Rewards</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {referralData.rewards_earned.map((reward, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{reward.description || reward.type}</p>
                      <p className="text-xs text-slate-500">Value: {reward.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <TrendingUp className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-900">Referral History</h2>
        </div>
        {history.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No referrals yet. Share your code to get started!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-full ${
                    h.reward_status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {h.is_referrer ? <Users className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {h.is_referrer
                        ? `You referred ${h.referred_name || h.referred_email}`
                        : `Referred by ${h.referrer_name || h.referrer_email}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {h.campaign_name} ({h.campaign_code}) · {formatDate(h.created_at)}
                    </p>
                  </div>
                </div>
                <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  h.reward_status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700'
                    : h.reward_status === 'pending'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {h.reward_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
