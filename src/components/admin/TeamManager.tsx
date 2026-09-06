"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Snackbar from "@/components/ui/Snackbar";
import { buildQrPdf, downloadPdf } from "@/lib/pdf";
import type { GameSession, Team } from "@/lib/types";

type TeamWithSession = Team & { session: GameSession | null };

export default function TeamManager() {
  const [teams, setTeams] = useState<TeamWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.teams ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addTeam = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setNewName("");
      load();
    } else {
      const d = await res.json();
      setMsg(d.error ?? "Could not add team");
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm("Delete this team? This also deletes their orders, clues, and progress.")) return;
    await fetch(`/api/admin/teams/${id}`, { method: "DELETE" });
    load();
  };

  const downloadLoginQr = async (team: Team) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const doc = await buildQrPdf(
      [
        {
          title: team.name,
          subtitle: "Login QR",
          qrValue: `${appUrl}/login?team=${team.login_token}`,
          footer: "Scan to log in your team",
        },
      ],
      "Team Login QR"
    );
    downloadPdf(doc, `${team.name.replace(/\s+/g, "-").toLowerCase()}-login-qr.pdf`);
  };

  const downloadAllLoginQrs = async () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const doc = await buildQrPdf(
      teams.map((t) => ({
        title: t.name,
        subtitle: "Login QR",
        qrValue: `${appUrl}/login?team=${t.login_token}`,
        footer: "Scan to log in your team",
      })),
      "All Team Login QRs"
    );
    downloadPdf(doc, "team-login-qrs.pdf");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">👥 Teams ({teams.length})</h1>
        {teams.length > 0 && (
          <Button variant="tonal" onClick={downloadAllLoginQrs}>
            ⬇️ Download all login QRs
          </Button>
        )}
      </div>

      <Card>
        <div className="flex gap-2">
          <Input
            placeholder="New team name (e.g. Team Falcon)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTeam()}
            className="flex-1"
          />
          <Button onClick={addTeam}>➕ Add</Button>
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading...</p>
      ) : (
        <div className="bg-white rounded-card shadow-card divide-y divide-divider">
          {teams.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3 gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{t.name}</div>
                <div className="text-xs text-text-secondary truncate">{t.login_token}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.session?.is_completed ? (
                  <Chip color="success">Done</Chip>
                ) : t.session?.started_at ? (
                  <Chip color="primary">
                    {t.session.current_sequence_order}/5
                  </Chip>
                ) : (
                  <Chip>Waiting</Chip>
                )}
                <Button variant="text" onClick={() => downloadLoginQr(t)}>
                  QR
                </Button>
                <Button variant="text" className="text-danger" onClick={() => deleteTeam(t.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <p className="p-4 text-sm text-text-secondary text-center">
              No teams yet — add one above, or seed 20 demo teams from Database Tools.
            </p>
          )}
        </div>
      )}

      <Snackbar message={msg} tone="error" onClose={() => setMsg(null)} />
    </div>
  );
}
