import Link from "next/link";
import Button from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-white to-bg">
      <div className="text-6xl mb-4">🏴</div>
      <h1 className="text-2xl font-bold mb-2">TREASURE HUNT 2024</h1>
      <p className="text-text-secondary max-w-xs mb-8">
        Embark on an adventure with your team. Scan your team QR to begin the
        hunt.
      </p>

      <Link href="/login/scan" className="w-full max-w-xs">
        <Button full className="text-base py-4">
          📷 Scan Team QR
        </Button>
      </Link>

      <div className="flex gap-6 mt-6 text-sm">
        <Link href="/leaderboard" className="text-primary font-medium">
          Leaderboard
        </Link>
        <Link href="/admin" className="text-text-secondary font-medium">
          Admin
        </Link>
      </div>
    </main>
  );
}
