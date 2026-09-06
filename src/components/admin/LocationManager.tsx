"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import type { Location } from "@/lib/types";

export default function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Record<string, { name: string; description: string }>>({});

  const load = () => {
    setLoading(true);
    fetch("/api/admin/locations")
      .then((r) => r.json())
      .then((d) => setLocations(d.locations ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const add = async () => {
    if (!name.trim()) return;
    await fetch("/api/admin/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    setName("");
    setDescription("");
    load();
  };

  const save = async (id: string) => {
    const edit = editing[id];
    if (!edit) return;
    await fetch(`/api/admin/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this location? Team orders/clues that use it will also be removed.")) return;
    await fetch(`/api/admin/locations/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">📍 Locations ({locations.length})</h1>

      <Card className="space-y-2">
        <Input placeholder="Location name (e.g. Library)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder="Description / helper text for organizers"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button full onClick={add}>➕ Add location</Button>
      </Card>

      {loading ? (
        <p className="text-sm text-text-secondary">Loading...</p>
      ) : (
        <div className="space-y-2">
          {locations.map((loc) => {
            const edit = editing[loc.id] ?? { name: loc.name, description: loc.description ?? "" };
            return (
              <Card key={loc.id} className="space-y-2">
                <Input
                  value={edit.name}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [loc.id]: { ...edit, name: e.target.value } }))
                  }
                />
                <Input
                  value={edit.description}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [loc.id]: { ...edit, description: e.target.value } }))
                  }
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="text" className="text-danger" onClick={() => remove(loc.id)}>
                    Delete
                  </Button>
                  <Button variant="tonal" onClick={() => save(loc.id)}>
                    Save
                  </Button>
                </div>
              </Card>
            );
          })}
          {locations.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-4">No locations yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
