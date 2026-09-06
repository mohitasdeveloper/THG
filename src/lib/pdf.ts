"use client";

import QRCode from "qrcode";
import { jsPDF } from "jspdf";

export async function qrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { margin: 1, width: 400 });
}

interface QrPageSpec {
  title: string; // e.g. "Team Alpha"
  subtitle?: string; // e.g. "Step 1" or "Login QR"
  qrValue: string;
  footer?: string;
}

/**
 * Builds a simple, print-friendly multi-page PDF: one QR per page,
 * with a title, optional subtitle/step label, and footer note.
 */
export async function buildQrPdf(
  pages: QrPageSpec[],
  docTitle: string
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (i > 0) doc.addPage();

    doc.setFillColor(26, 115, 232);
    doc.rect(0, 0, pageWidth, 70, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("🏴 TREASURE HUNT", pageWidth / 2, 30, { align: "center" });
    doc.setFontSize(12);
    doc.text(docTitle, pageWidth / 2, 50, { align: "center" });

    doc.setTextColor(32, 33, 36);
    doc.setFontSize(22);
    doc.text(page.title, pageWidth / 2, 130, { align: "center" });

    if (page.subtitle) {
      doc.setFontSize(14);
      doc.setTextColor(95, 99, 104);
      doc.text(page.subtitle, pageWidth / 2, 155, { align: "center" });
    }

    const qr = await qrDataUrl(page.qrValue);
    const qrSize = 260;
    doc.addImage(
      qr,
      "PNG",
      (pageWidth - qrSize) / 2,
      190,
      qrSize,
      qrSize
    );

    doc.setDrawColor(218, 220, 224);
    doc.roundedRect(
      (pageWidth - qrSize) / 2 - 10,
      180,
      qrSize + 20,
      qrSize + 20,
      12,
      12
    );

    doc.setFontSize(10);
    doc.setTextColor(95, 99, 104);
    doc.text(page.qrValue, pageWidth / 2, 470, { align: "center" });

    if (page.footer) {
      doc.setFontSize(11);
      doc.setTextColor(32, 33, 36);
      doc.text(page.footer, pageWidth / 2, pageHeight - 40, {
        align: "center",
      });
    }
  }

  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}
