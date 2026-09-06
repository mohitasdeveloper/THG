"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminGuard";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Link from "next/link";

interface Stats {
  teams: number;
  locations: number;
  ordersDefined: number;
  ordersExpected: number;
  clues: number;
  cluesExpected: number;
  activeSessions: number;
}

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <DashboardContent />
    </AdminShell>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/database")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      {!stats ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Teams" value={stats.teams} />
          <StatCard label="Locations" value={stats.locations} />
          <StatCard
            label="Orders defined"
            value={`${stats.ordersDefined}/${stats.ordersExpected}`}
          />
          <StatCard label="Clues" value={`${stats.clues}/${stats.cluesExpected}`} />
          <StatCard label="Active sessions" value={stats.activeSessions} />
        </div>
      )}

      <Card>
        <h2 className="font-medium mb-3">Quick setup checklist</h2>
        <ol className="text-sm space-y-2 list-decimal list-inside text-text-secondary">
          <li>
            Add your <Link href="/admin/teams" className="text-primary">Teams</Link> (or seed 20 demo teams from{" "}
            <Link href="/admin/database" className="text-primary">Database Tools</Link>)
          </li>
          <li>
            Add your <Link href="/admin/locations" className="text-primary">Locations</Link>
          </li>
          <li>
            Generate <Link href="/admin/orders" className="text-primary">Location Orders</Link> for every team
          </li>
          <li>
            Write each team's <Link href="/admin/clues" className="text-primary">Clues</Link> and hints
          </li>
          <li>Download &amp; print the QR codes from each of those pages</li>
          <li>Place location QRs at each site, hand out team login QRs, and go!</li>
        </ol>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-text-secondary mt-1">{label}</div>
    </Card>
  );
}
