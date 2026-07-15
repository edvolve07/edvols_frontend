import { ShieldOff } from "lucide-react";

export default function AccessRevoked() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <ShieldOff size={32} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-slate-950">
          Access on hold
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Please contact the administrator to restore your access.
        </p>
      </div>
    </div>
  );
}
