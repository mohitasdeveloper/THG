import { formatTime, ordinalRank } from "@/lib/utils";
import Button from "@/components/ui/Button";

export default function SuccessScreen({
  totalTimeSeconds,
  hintsUsed,
  rank,
}: {
  totalTimeSeconds: number;
  hintsUsed: number;
  rank: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 animate-pop">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold mb-6">YOU DID IT!</h1>
      <div className="bg-white rounded-card shadow-card p-6 w-full max-w-sm space-y-3">
        <Row label="Final Time" value={formatTime(totalTimeSeconds)} />
        <Row label="Hints Used" value={String(hintsUsed)} />
        <Row label="Your Rank" value={rank ? ordinalRank(rank) : "—"} />
      </div>
      <a href="/leaderboard" className="mt-6 w-full max-w-sm">
        <Button full>🏆 View Leaderboard</Button>
      </a>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
