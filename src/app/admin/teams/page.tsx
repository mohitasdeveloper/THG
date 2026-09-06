"use client";

import AdminShell from "@/components/admin/AdminGuard";
import TeamManager from "@/components/admin/TeamManager";

export default function AdminTeamsPage() {
  return (
    <AdminShell>
      <TeamManager />
    </AdminShell>
  );
}
