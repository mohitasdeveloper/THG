"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import AppBar from "@/components/ui/AppBar";
import GameTimer from "@/components/game/GameTimer";
import SequenceProgress from "@/components/game/SequenceProgress";
import ClueCard from "@/components/game/ClueCard";
import HintButton from "@/components/game/HintButton";
import SuccessScreen from "@/components/game/SuccessScreen";
import WaitingScreen from "@/components/game/WaitingScreen";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useGameSession } from "@/lib/hooks/useGameSession";
import { useElapsedSeconds } from "@/lib/hooks/useTimer";
import { HINT_UNLOCK_MINUTES } from "@/lib/constants";

export default function GamePage() {
  const router = useRouter();
  const { state, loading, error, useHint } = useGameSession();
  const elapsed = useElapsedSeconds(state?.session.started_at ?? null);

  const hintProgress = useMemo(() => {
    if (elapsed === null) return 0;
    return elapsed / (HINT_UNLOCK_MINUTES * 60);
  }, [elapsed]);

  if (error === "not-logged-in") {
    router.push("/");
    return null;
  }

  if (loading || !state) {
    return (
      <main className="min-h-screen">
        <AppBar title="Loading..." />
        <div className="p-4 space-y-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </main>
    );
  }

  if (state.isCompleted && state.finalStats) {
    return (
      <main className="min-h-screen">
        <SuccessScreen
          totalTimeSeconds={state.finalStats.totalTimeSeconds}
          hintsUsed={state.finalStats.hintsUsed}
          rank={state.finalStats.rank}
        />
      </main>
    );
  }

  if (!state.currentClue) {
    return (
      <main className="min-h-screen">
        <AppBar title={state.team.name} />
        <WaitingScreen message="Your clues haven't been set up yet — check back once the organizers finish setup." />
      </main>
    );
  }

  const isWaitingToStart = !state.session.started_at;
  const hintUnlocked = elapsed !== null && elapsed >= HINT_UNLOCK_MINUTES * 60;
  const secondsToUnlock =
    elapsed !== null ? Math.max(0, HINT_UNLOCK_MINUTES * 60 - elapsed) : HINT_UNLOCK_MINUTES * 60;

  return (
    <main className="min-h-screen pb-8">
      <AppBar
        title={state.team.name}
        right={<GameTimer seconds={elapsed} />}
      />

      <div className="p-4 space-y-4 max-w-md mx-auto">
        <SequenceProgress
          current={state.session.current_sequence_order}
          total={state.totalSteps}
        />

        <ClueCard
          sequenceOrder={state.currentClue.sequenceOrder}
          clueText={state.currentClue.clueText}
        />

        {state.hint && (
          <HintButton
            unlocked={hintUnlocked}
            progress={hintProgress}
            hintsRemaining={state.hint.hintsRemaining}
            hintText={state.hint.text}
            onUseHint={async () => {
              await useHint();
            }}
          />
        )}

        {!hintUnlocked && !state.hint?.text && (
          <p className="text-xs text-text-secondary text-center">
            Hint unlocks in {Math.floor(secondsToUnlock / 60)}m{" "}
            {secondsToUnlock % 60}s
          </p>
        )}

        <Button full className="text-base py-4 mt-2" onClick={() => router.push("/scan")}>
          📷 {isWaitingToStart ? "Scan QR to Start" : "Scan QR Code"}
        </Button>
      </div>
    </main>
  );
}
