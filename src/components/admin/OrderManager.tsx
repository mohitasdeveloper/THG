"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Snackbar from "@/components/ui/Snackbar";
import type { Location, Team } from "@/lib/types";

interface MatrixRow {
  team_id: string;
  team_name: string;
  steps: { sequence_order: number; location_name: string }[];
}

export default function OrderManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [teamOrder, setTeamOrder] = useState<{ sequence_order: number; location_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [csvText, setCsvText] = useState("");
  const [showImport, setShowImport] = useState(false);

  const loadOverview = () => {
    setLoading(true);
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => {
        setTeams(d.teams ?? []);
        setLocations(d.locations ?? []);
        setMatrix(d.matrix ?? []);
        if (!selectedTeamId && d.teams?.length) setSelectedTeamId(d.teams[0].id);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadOverview, []);

  useEffect(() => {
    if (!selectedTeamId) return;
    fetch(`/api/admin/orders?teamId=${selectedTeamId}`)
      .then((r) => r.json())
      .then((d) => {
        const rows = d.rows ?? [];
        if (rows.length === 5) {
          setTeamOrder(rows.map((r: any) => ({ sequence_order: r.sequence_order, location_id: r.location_id })));
        } else {
          // no order defined yet — default to locations in DB order
          setTeamOrder(locations.slice(0, 5).map((l, i) => ({ sequence_order: i + 1, location_id: l.id })));
        }
      });
  }, [selectedTeamId, locations]);

  const setStep = (seq: number, locationId: string) => {
    setTeamOrder((prev) => prev.map((s) => (s.sequence_order === seq ? { ...s, location_id: locationId } : s)));
  };

  const saveOrder = async () => {
    const locIds = teamOrder.map((s) => s.location_id);
    if (new Set(locIds).size !== locIds.length) {
      setMsg({ text: "Each location can only appear once in the order.", tone: "error" });
      return;
    }
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", teamId: selectedTeamId, order: teamOrder }),
    });
    if (res.ok) {
      setMsg({ text: "Order saved!", tone: "success" });
      loadOverview();
    } else {
      const d = await res.json();
      setMsg({ text: d.error ?? "Could not save", tone: "error" });
    }
  };

  const autoGenerate = async () => {
    if (
      !confirm(
        "This regenerates a random order for ALL teams and deletes any clues tied to the old orders. Continue?"
      )
    )
      return;
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
    if (res.ok) {
      setMsg({ text: "Random orders generated for all teams!", tone: "success" });
      loadOverview();
    } else {
      const d = await res.json();
      setMsg({ text: d.error ?? "Failed", tone: "error" });
    }
  };

  const importCsv = async () => {
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import", csv: csvText }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg({ text: `Imported orders for ${d.count / 5} teams.`, tone: "success" });
      setShowImport(false);
      setCsvText("");
      loadOverview();
    } else {
      setMsg({ text: (d.details ?? [d.error]).join("; "), tone: "error" });
    }
  };

  const exportCsv = () => {
    window.open("/api/admin/orders?export=csv", "_blank");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">🔀 Location Orders</h1>
      <p className="text-sm text-text-secondary">
        Define the sequence each team visits the {locations.length || 5} locations.
      </p>

      <Card className="space-y-3">
        <Button full variant="tonal" onClick={autoGenerate}>
          🎲 Auto-Generate Random Orders
        </Button>
        <p className="text-xs text-text-secondary text-center">
          Creates unique random sequences for all teams (overwrites existing orders + their clues)
        </p>
      </Card>

      <Card className="space-y-3">
        <label className="text-sm font-medium">Team</label>
        <select
          className="w-full border border-border rounded-btn px-3 py-2 text-sm"
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <div className="space-y-2">
          {teamOrder.map((step) => (
            <div key={step.sequence_order} className="flex items-center gap-3">
              <span className="w-6 text-sm font-medium text-text-secondary">{step.sequence_order}</span>
              <select
                className="flex-1 border border-border rounded-btn px-3 py-2 text-sm"
                value={step.location_id}
                onChange={(e) => setStep(step.sequence_order, e.target.value)}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <Button full onClick={saveOrder}>
          Save order
        </Button>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">📊 Order Overview</h2>
          <div className="flex gap-2">
            <Button variant="text" onClick={() => setShowImport((s) => !s)}>
              📥 Import CSV
            </Button>
            <Button variant="text" onClick={exportCsv}>
              ⬇️ Export CSV
            </Button>
          </div>
        </div>

        {showImport && (
          <div className="mb-4 space-y-2">
            <textarea
              className="w-full border border-border rounded-btn p-2 text-xs font-mono h-32"
              placeholder={"team_name,step_1,step_2,step_3,step_4,step_5\nTeam Alpha,Library,Main Gate,Clock Tower,Mirror Hall,Fireplace"}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <Button full onClick={importCsv} disabled={!csvText.trim()}>
              Import
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-secondary">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-secondary uppercase">
                  <th className="py-1.5 pr-3">Team</th>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <th key={n} className="py-1.5 pr-3">
                      S{n}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.team_id} className="border-t border-divider">
                    <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{row.team_name}</td>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <td key={n} className="py-1.5 pr-3 text-text-secondary whitespace-nowrap">
                        {row.steps.find((s) => s.sequence_order === n)?.location_name ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Snackbar message={msg?.text ?? null} tone={msg?.tone} onClose={() => setMsg(null)} />
    </div>
  );
}
