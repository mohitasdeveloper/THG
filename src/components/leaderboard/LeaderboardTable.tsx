import { formatTime, ordinalRank } from "@/lib/utils";
import Chip from "@/components/ui/Chip";
import type { LeaderboardRow } from "@/lib/types";

function StatusChip({ status }: { status: LeaderboardRow["status"] }) {
  if (status === "completed") return <Chip color="success">✅ Done</Chip>;
  if (status === "playing") return <Chip color="primary">Playing ▶</Chip>;
  return <Chip>⏳ Waiting</Chip>;
}

export function TeamRow({ row, totalSteps }: { row: LeaderboardRow; totalSteps: number }) {
  return (
    <tr className="border-b border-divider last:border-0">
      <td className="py-3 px-3 font-semibold text-sm w-14">
        {row.status === "completed" ? ordinalRank(row.rank) : `#${row.rank}`}
      </td>
      <td className="py-3 px-3 font-medium text-sm">{row.team_name}</td>
      <td className="py-3 px-3 text-sm">
        <StatusChip status={row.status} />
      </td>
      <td className="py-3 px-3 text-sm text-text-secondary">
        {row.status === "completed"
          ? `${totalSteps}/${totalSteps}`
          : row.status === "playing"
          ? `Step ${row.current_sequence_order}/${totalSteps}`
          : "—"}
      </td>
      <td className="py-3 px-3 text-sm font-medium tabular-nums text-right">
        {formatTime(row.total_time_seconds)}
      </td>
    </tr>
  );
}

export default function LeaderboardTable({
  rows,
  totalSteps = 5,
}: {
  rows: LeaderboardRow[];
  totalSteps?: number;
}) {
  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-bg text-left text-xs text-text-secondary uppercase tracking-wide">
            <th className="py-2 px-3">#</th>
            <th className="py-2 px-3">Team</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Progress</th>
            <th className="py-2 px-3 text-right">Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TeamRow key={row.team_id} row={row} totalSteps={totalSteps} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
