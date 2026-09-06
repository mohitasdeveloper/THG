"use client";

import Link from "next/link";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import Skeleton from "@/components/ui/Skeleton";
import { useLeaderboard } from "@/lib/hooks/useLeaderboard";

export default function LeaderboardPage() {
  const { rows, loading } = useLeaderboard();

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🏆 Live Leaderboard
        </h1>
        <span className="flex items-center gap-1.5 text-xs text-success font-medium">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          LIVE
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-text-secondary text-sm text-center mt-12">
          No teams yet — check back once the hunt has been set up.
        </p>
      ) : (
        <LeaderboardTable rows={rows} />
      )}

      <div className="text-center mt-6">
        <Link href="/" className="text-primary text-sm font-medium">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
