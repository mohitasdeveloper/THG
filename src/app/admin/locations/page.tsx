"use client";

import AdminShell from "@/components/admin/AdminGuard";
import LocationManager from "@/components/admin/LocationManager";

export default function AdminLocationsPage() {
  return (
    <AdminShell>
      <LocationManager />
    </AdminShell>
  );
}
