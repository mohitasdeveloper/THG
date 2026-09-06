"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import ProgressRing from "@/components/ui/ProgressRing";

export default function HintButton({
  unlocked,
  progress,
  hintsRemaining,
  hintText,
  onUseHint,
}: {
  unlocked: boolean;
  progress: number; // 0..1 toward unlock
  hintsRemaining: number;
  hintText: string | null;
  onUseHint: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  if (hintText) {
    return (
      <div className="bg-amber-50 border border-warning/30 rounded-card p-3 text-sm">
        💡 <span className="font-medium">Hint:</span> {hintText}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-card border border-border p-3">
      <div className="flex items-center gap-2">
        <ProgressRing progress={progress} size={28} stroke={3} />
        <div className="text-sm text-text-secondary">
          {unlocked
            ? `Hints remaining: ${hintsRemaining}`
            : "Hint unlocking..."}
        </div>
      </div>
      <Button
        variant="tonal"
        disabled={!unlocked || hintsRemaining <= 0 || loading}
        onClick={async () => {
          setLoading(true);
          await onUseHint();
          setLoading(false);
        }}
      >
        💡 Use hint
      </Button>
    </div>
  );
}
