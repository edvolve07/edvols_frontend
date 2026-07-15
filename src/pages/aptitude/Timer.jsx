import { useEffect, useMemo, useState } from "react";

export default function Timer({ startedAt, durationMinutes, onExpire }) {
  const deadline = useMemo(
    () => new Date(startedAt).getTime() + durationMinutes * 60 * 1000,
    [startedAt, durationMinutes]
  );
  const [remaining, setRemaining] = useState(Math.max(0, deadline - Date.now()));

  useEffect(() => {
    setRemaining(Math.max(0, deadline - Date.now()));
    const id = window.setInterval(() => {
      const next = Math.max(0, deadline - Date.now());
      setRemaining(next);
      if (next === 0) {
        window.clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [deadline, onExpire]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900">
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
