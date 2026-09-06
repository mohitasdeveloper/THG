"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Snackbar from "@/components/ui/Snackbar";
import { buildQrPdf, downloadPdf } from "@/lib/pdf";
import type { Team } from "@/lib/types";

interface ClueRow {
  teamLocationOrderId: string;
  sequenceOrder: number;
  locationName: string;
  clueText: string;
  hintText: string;
  qrCodeValue: string | null;
}

export default function ClueManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [rows, setRows] = useState<ClueRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { clueText: string; hintText: string }>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/admin/teams")
      .then((r) => r.json())
      .then((d) => {
        setTeams(d.teams ?? []);
        if (d.teams?.length) setSelectedTeamId(d.teams[0].id);
      });
  }, []);

  const loadClues = () => {
    if (!selectedTeamId) return;
    setLoading(true);
    fetch(`/api/admin/clues?teamId=${selectedTeamId}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows ?? []);
        const initDrafts: Record<string, { clueText: string; hintText: string }> = {};
        (d.rows ?? []).forEach((r: ClueRow) => {
          initDrafts[r.teamLocationOrderId] = { clueText: r.clueText, hintText: r.hintText };
        });
        setDrafts(initDrafts);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadClues, [selectedTeamId]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  const saveClue = async (row: ClueRow) => {
    const draft = drafts[row.teamLocationOrderId];
    if (!draft?.clueText.trim() || !draft?.hintText.trim()) {
      setMsg({ text: "Clue text and hint are both required.", tone: "error" });
      return;
    }
    const res = await fetch("/api/admin/clues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        teamLocationOrderId: row.teamLocationOrderId,
        clueText: draft.clueText,
        hintText: draft.hintText,
        locationName: row.locationName,
        teamName: selectedTeam?.name,
      }),
    });
    if (res.ok) {
      setMsg({ text: `Step ${row.sequenceOrder} saved.`, tone: "success" });
      loadClues();
    } else {
      const d = await res.json();
      setMsg({ text: d.error ?? "Could not save", tone: "error" });
    }
  };

  const generatePlaceholders = async () => {
    const res = await fetch("/api/admin/clues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generatePlaceholders" }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg({ text: `Created ${d.created} placeholder clue(s) across all teams.`, tone: "success" });
      loadClues();
    }
  };

  const downloadTeamPack = async () => {
    if (!selectedTeam) return;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const pages = [
      {
        title: selectedTeam.name,
        subtitle: "Login QR",
        qrValue: `${appUrl}/login?team=${selectedTeam.login_token}`,
        footer: "Scan to log in",
      },
      ...rows
        .filter((r) => r.qrCodeValue)
        .map((r) => ({
          title: selectedTeam.name,
          subtitle: `Step ${r.sequenceOrder} — ${r.locationName}`,
          qrValue: r.qrCodeValue as string,
          footer: "Place at this location",
        })),
    ];
    const doc = await buildQrPdf(pages, `${selectedTeam.name} QR Pack`);
    downloadPdf(doc, `${selectedTeam.name.replace(/\s+/g, "-").toLowerCase()}-qr-pack.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-semibold">📜 Clues</h1>
        <Button variant="tonal" onClick={generatePlaceholders}>
          Auto-fill missing clues
        </Button>
      </div>

      <Card>
        <label className="text-sm font-medium">Team</label>
        <select
          className="w-full border border-border rounded-btn px-3 py-2 text-sm mt-1"
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Card>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-4">
          This team has no location order yet — set one up in the Orders tab first.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const draft = drafts[row.teamLocationOrderId] ?? { clueText: "", hintText: "" };
            return (
              <Card key={row.teamLocationOrderId} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span className="font-semibold">Step {row.sequenceOrder}</span>
                  <span>Location: {row.locationName}</span>
                </div>
                <textarea
                  className="w-full border border-border rounded-btn p-2 text-sm h-20"
                  placeholder="Clue text shown to the team..."
                  value={draft.clueText}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [row.teamLocationOrderId]: { ...draft, clueText: e.target.value },
                    }))
                  }
                />
                <textarea
                  className="w-full border border-border rounded-btn p-2 text-sm h-14"
                  placeholder="Hint text (revealed after 6 minutes)..."
                  value={draft.hintText}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [row.teamLocationOrderId]: { ...draft, hintText: e.target.value },
                    }))
                  }
                />
                <div className="flex justify-end">
                  <Button variant="tonal" onClick={() => saveClue(row)}>
                    Save step {row.sequenceOrder}
                  </Button>
                </div>
              </Card>
            );
          })}

          <Button full onClick={downloadTeamPack}>
            ⬇️ Download {selectedTeam?.name}'s QR Pack
          </Button>
        </div>
      )}

      <Snackbar message={msg?.text ?? null} tone={msg?.tone} onClose={() => setMsg(null)} />
    </div>
  );
}
