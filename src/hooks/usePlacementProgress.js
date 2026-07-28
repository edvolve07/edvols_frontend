import { useState, useCallback, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export function usePlacementProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await apiFetch("/api/mentorship/placement-progress");
      setData(result);
    } catch (err) {
      setError(err.message || "Unable to load placement progress.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetch();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
