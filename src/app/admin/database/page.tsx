"use client";

import AdminShell from "@/components/admin/AdminGuard";
import DatabaseTools from "@/components/admin/DatabaseTools";

export default function AdminDatabasePage() {
  return (
    <AdminShell>
      <DatabaseTools />
    </AdminShell>
  );
}
