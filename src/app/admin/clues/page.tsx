"use client";

import AdminShell from "@/components/admin/AdminGuard";
import ClueManager from "@/components/admin/ClueManager";

export default function AdminCluesPage() {
  return (
    <AdminShell>
      <ClueManager />
    </AdminShell>
  );
}
