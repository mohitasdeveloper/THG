"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameStateResponse } from "@/lib/types";

export function useGameSession() {
  const [state, setState] = useState<GameStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      if (res.status === 401) {
        setError("not-logged-in");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setState(data);
      setError(null);
    } catch {
      setError("network");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refresh]);

  const scan = useCallback(
    async (qrValue: string) => {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrValue }),
      });
      const data = await res.json();
      if (data.state) setState(data.state);
      return data as { valid: boolean; error?: string; isLastClue?: boolean };
    },
    []
  );

  const useHint = useCallback(async () => {
    const res = await fetch("/api/hint", { method: "POST" });
    const data = await res.json();
    if (data.state) setState(data.state);
    return data as { error?: string };
  }, []);

  return { state, loading, error, refresh, scan, useHint };
}
