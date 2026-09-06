"use client";

import AdminShell from "@/components/admin/AdminGuard";
import OrderManager from "@/components/admin/OrderManager";

export default function AdminOrdersPage() {
  return (
    <AdminShell>
      <OrderManager />
    </AdminShell>
  );
}
