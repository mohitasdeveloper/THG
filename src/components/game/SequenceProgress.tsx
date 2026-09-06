export default function SequenceProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs text-text-secondary font-medium">
        Progress: step {Math.min(current, total)} of {total}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < current - 1
                ? "bg-primary"
                : i === current - 1
                ? "bg-primary/60"
                : "bg-divider"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
