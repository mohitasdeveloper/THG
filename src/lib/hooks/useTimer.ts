"use client";

import { useEffect, useState } from "react";

/**
 * Ticks once a second, returning elapsed seconds since `startedAt`
 * (an ISO timestamp). Returns null while there's no start time yet
 * (i.e. the team hasn't scanned their first clue).
 */
export function useElapsedSeconds(startedAt: string | null): number | null {
  const [elapsed, setElapsed] = useState<number | null>(
    startedAt ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000) : null
  );

  useEffect(() => {
    if (!startedAt) {
      setElapsed(null);
      return;
    }
    const startMs = new Date(startedAt).getTime();
    setElapsed(Math.floor((Date.now() - startMs) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}
