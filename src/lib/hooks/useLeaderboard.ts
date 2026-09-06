"use client";

import { useEffect, useState } from "react";
import type { LeaderboardRow } from "@/lib/types";

export function useLeaderboard(intervalMs = 3000) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchRows = async () => {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok) setRows(data.rows ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRows();
    const id = setInterval(fetchRows, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { rows, loading };
}
