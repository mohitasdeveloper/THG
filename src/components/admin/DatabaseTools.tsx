"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Snackbar from "@/components/ui/Snackbar";
import QRGenerator from "@/components/admin/QRGenerator";

interface Stats {
  teams: number;
  locations: number;
  ordersDefined: number;
  ordersExpected: number;
  clues: number;
  cluesExpected: number;
  activeSessions: number;
}

export default function DatabaseTools() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch("/api/admin/database")
      .then((r) => r.json())
      .then(setStats);
  };

  useEffect(load, []);

  const run = async (action: string, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg({ text: "Done!", tone: "success" });
        load();
      } else {
        setMsg({ text: d.error ?? "Failed", tone: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">🗄️ Database Tools</h1>

      <Card>
        <h2 className="font-medium mb-3">Stats</h2>
        {stats ? (
          <ul className="text-sm space-y-1 text-text-secondary">
            <li>Teams: {stats.teams}</li>
            <li>Locations: {stats.locations}</li>
            <li>Orders defined: {stats.ordersDefined}/{stats.ordersExpected}</li>
            <li>Clues: {stats.clues}/{stats.cluesExpected}</li>
            <li>Active sessions: {stats.activeSessions}</li>
          </ul>
        ) : (
          <p className="text-sm text-text-secondary">Loading...</p>
        )}
      </Card>

      <Card className="space-y-3 border border-danger/20">
        <h2 className="font-medium text-danger">⚠️ Danger Zone</h2>

        <div>
          <Button
            full
            variant="tonal"
            disabled={busy}
            onClick={() =>
              run(
                "reset-sessions",
                "Clear all game progress? Teams, locations, orders, and clues are kept."
              )
            }
          >
            🔄 Reset All Sessions
          </Button>
          <p className="text-xs text-text-secondary mt-1">
            Clears game progress, keeps teams/locations/orders/clues
          </p>
        </div>

        <div>
          <Button
            full
            variant="danger"
            disabled={busy}
            onClick={() => run("full-reset", "This deletes EVERYTHING — teams, locations, orders, clues, sessions. This cannot be undone. Continue?")}
          >
            🗑️ Full Reset
          </Button>
          <p className="text-xs text-text-secondary mt-1">Delete everything, start fresh</p>
        </div>

        <div>
          <Button full variant="outlined" disabled={busy} onClick={() => run("seed-demo")}>
            📥 Seed Demo Data
          </Button>
          <p className="text-xs text-text-secondary mt-1">
            20 teams + 5 locations + random orders + placeholder clues
          </p>
        </div>
      </Card>

      <QRGenerator />

      <Card>
        <h2 className="font-medium mb-2">Results</h2>
        <Button
          full
          variant="tonal"
          onClick={() => window.open("/api/admin/export-results", "_blank")}
        >
          ⬇️ Export results CSV
        </Button>
      </Card>

      <Snackbar message={msg?.text ?? null} tone={msg?.tone} onClose={() => setMsg(null)} />
    </div>
  );
}
