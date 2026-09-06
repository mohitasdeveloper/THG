"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { buildQrPdf, downloadPdf } from "@/lib/pdf";

interface ClueRow {
  qrCodeValue: string;
  sequenceOrder: number;
  teamName: string;
  locationName: string;
}

export default function QRGenerator() {
  const [busy, setBusy] = useState(false);

  const downloadAllByLocation = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/clues?all=true");
      const data = await res.json();
      const rows: ClueRow[] = data.rows ?? [];
      const locations: { id: string; name: string }[] = data.locations ?? [];

      if (!rows.length) {
        alert("No clues exist yet — create clues first.");
        return;
      }

      for (const loc of locations) {
        const rowsForLoc = rows
          .filter((r) => r.locationName === loc.name)
          .sort((a, b) => a.teamName.localeCompare(b.teamName));
        if (!rowsForLoc.length) continue;

        const doc = await buildQrPdf(
          rowsForLoc.map((r) => ({
            title: r.teamName,
            subtitle: `Step ${r.sequenceOrder}`,
            qrValue: r.qrCodeValue,
            footer: loc.name,
          })),
          `${loc.name} — Location QRs`
        );
        downloadPdf(doc, `${loc.name.replace(/\s+/g, "-").toLowerCase()}-qrs.pdf`);
        // small delay so browsers don't block multiple simultaneous downloads
        await new Promise((r) => setTimeout(r, 400));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-2">
      <h2 className="font-medium">📦 Bulk QR export</h2>
      <p className="text-sm text-text-secondary">
        Downloads one PDF per location, each containing every team's QR for
        that location — ready to print and place on-site.
      </p>
      <Button full variant="tonal" onClick={downloadAllByLocation} disabled={busy}>
        {busy ? "Generating PDFs..." : "⬇️ Download all location QR packs"}
      </Button>
    </Card>
  );
}
