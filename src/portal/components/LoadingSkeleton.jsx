export default function LoadingSkeleton({ label = 'Loading' }) {
  return (
    <div className="space-y-4 p-6">
      <p className="text-sm font-semibold text-slate-500">{label}...</p>
      <div className="h-28 animate-pulse rounded-md bg-white" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 animate-pulse rounded-md bg-white" />
        <div className="h-32 animate-pulse rounded-md bg-white" />
        <div className="h-32 animate-pulse rounded-md bg-white" />
      </div>
    </div>
  );
}
