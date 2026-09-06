"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/clues", label: "Clues" },
  { href: "/admin/database", label: "Database" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/database")
      .then((res) => setAuthed(res.status !== 401))
      .catch(() => setAuthed(false));
  }, []);

  const handleLogin = async () => {
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setLoginError(data.error ?? "Login failed");
        setLoggingIn(false);
        return;
      }
      setAuthed(true);
    } catch {
      setLoginError("Network error");
      setLoggingIn(false);
    }
  };

  if (authed === null) {
    return <main className="min-h-screen flex items-center justify-center text-text-secondary">Loading...</main>;
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <h1 className="text-lg font-semibold mb-4 text-center">🔒 Admin Login</h1>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            {loginError && <p className="text-danger text-sm">{loginError}</p>}
            <Button full onClick={handleLogin} disabled={loggingIn || !password}>
              {loggingIn ? "Checking..." : "Log in"}
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="font-semibold">🏴 Admin</span>
          <button
            className="text-sm text-text-secondary"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              setAuthed(false);
            }}
          >
            Log out
          </button>
        </div>
        <div className="flex gap-1 px-2 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap font-medium ${
                pathname === tab.href
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-bg"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="p-4 max-w-4xl mx-auto">{children}</div>
    </main>
  );
}
