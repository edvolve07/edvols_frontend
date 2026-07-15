export default function StatCard({ label, value, tone = 'blue' }) {
  const tones = {
    blue: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    mint: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    coral: 'border-orange-100 bg-orange-50 text-orange-700',
    gold: 'border-amber-100 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-white text-slate-700',
  };

  return (
    <div className={`relative overflow-hidden rounded-md border p-5 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="absolute right-0 top-0 h-16 w-16 translate-x-5 -translate-y-5 rounded-full bg-white/45" />
      <p className="relative text-sm font-bold opacity-80">{label}</p>
      <p className="relative mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
