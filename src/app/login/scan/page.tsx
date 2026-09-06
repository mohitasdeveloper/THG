"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";

const QRScanner = dynamic(() => import("@/components/scanner/QRScanner"), {
  ssr: false,
});

function extractToken(raw: string): string {
  try {
    const url = new URL(raw);
    const t = url.searchParams.get("team");
    if (t) return t;
  } catch {
    // not a URL, fall through — assume it's the raw token
  }
  return raw.trim();
}

export default function LoginScanPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (raw: string) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const token = extractToken(raw);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "That QR isn't recognized.");
        setBusy(false);
        return;
      }
      router.push("/game");
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-white text-sm font-medium">
          ✕ Cancel
        </Link>
        <span className="text-white text-sm">Team Login</span>
        <span className="w-12" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-white text-center mb-4">
          Point your camera at your team's login QR
        </p>
        <div className="w-full max-w-sm">
          <QRScanner onScan={handleScan} paused={busy} />
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-4 text-center max-w-sm">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
