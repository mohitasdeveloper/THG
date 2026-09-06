import { formatTime } from "@/lib/utils";

export default function GameTimer({ seconds }: { seconds: number | null }) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary tabular-nums">
      <span>⏱️</span>
      <span>{formatTime(seconds)}</span>
    </div>
  );
}
