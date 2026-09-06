"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useGameSession } from "@/lib/hooks/useGameSession";

const QRScanner = dynamic(() => import("@/components/scanner/QRScanner"), {
  ssr: false,
});

export default function ScanPage() {
  const router = useRouter();
  const { state, scan } = useGameSession();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleScan = async (value: string) => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    const result = await scan(value);
    if (result.valid) {
      setFeedback({
        ok: true,
        text: result.isLastClue ? "🎉 That's the last one!" : "✅ Correct! Step complete.",
      });
      setTimeout(() => router.push("/game"), 900);
    } else {
      setFeedback({ ok: false, text: `❌ ${result.error ?? "Invalid QR code"}` });
      setTimeout(() => setBusy(false), 1500);
    }
  };

  return (
    <main className="min-h-screen bg-black relative">
      <QRScanner onScan={handleScan} paused={busy} />

      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        <div className="flex items-center justify-between px-4 py-4 pointer-events-auto mt-safe">
          <Link href="/game" className="text-white bg-black/40 p-3 rounded-full backdrop-blur-md">
            ✕
          </Link>
          <span className="text-white font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">Scan QR Code</span>
          <span className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-end pb-12 px-6">
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl w-full max-w-sm flex flex-col items-center shadow-lg">
            <p className="text-white text-center font-medium">
              Point camera at <span className="text-primary font-bold">YOUR team's</span> QR
            </p>
            {state?.team && (
              <p className="text-white/80 text-center text-sm mt-1">
                Hint: look for "{state.team.name}"
              </p>
            )}
            {feedback && (
              <p
                className={`text-sm mt-4 text-center px-4 py-2 rounded-full w-full font-medium ${feedback.ok ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}
              >
                {feedback.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
