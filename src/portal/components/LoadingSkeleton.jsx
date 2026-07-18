export default function LoadingSkeleton({ label = 'Loading' }) {
  return (
    <div className="space-y-4 p-6">
      <p className="text-sm font-semibold text-slate-500">{label}...</p>
      <div className="shimmer h-28 rounded-md" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="shimmer h-32 rounded-md" />
        <div className="shimmer h-32 rounded-md" />
        <div className="shimmer h-32 rounded-md" />
      </div>
    </div>
  );
}
