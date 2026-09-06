"use client";

import { useEffect, useRef, useState } from "react";

interface QRScannerProps {
  onScan: (value: string) => void;
  paused?: boolean;
}

export default function QRScanner({ onScan, paused }: QRScannerProps) {
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(containerId.current);
      scannerRef.current = scanner;

      Html5Qrcode.getCameras()
        .then((cameras) => {
          if (cancelled || !cameras.length) {
            if (!cameras.length) setError("No camera found on this device.");
            return;
          }
          // Prefer a back/environment camera when labeled.
          const back = cameras.find((c) => /back|rear|environment/i.test(c.label));
          const cameraId = back?.id ?? cameras[0].id;

          scanner
            .start(
              cameraId,
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText: string) => {
                const now = Date.now();
                // Debounce identical rapid-fire reads.
                if (
                  lastScanRef.current &&
                  lastScanRef.current.value === decodedText &&
                  now - lastScanRef.current.at < 2500
                ) {
                  return;
                }
                lastScanRef.current = { value: decodedText, at: now };
                onScan(decodedText);
              },
              () => {
                // per-frame decode failure — expected constantly, ignore
              }
            )
            .catch((err: any) => {
              setError("Couldn't access the camera. Check permissions and try again.");
            });
        })
        .catch(() => setError("Couldn't access the camera. Check permissions and try again."));
    });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = scannerRef.current;
    if (!s) return;
    if (paused) {
      s.pause?.(true);
    } else {
      s.resume?.();
    }
  }, [paused]);

  return (
    <>
      <div
        id={containerId.current}
        className="fixed inset-0 w-full h-full bg-black z-0 [&>video]:object-cover"
      />
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black px-6">
          <p className="text-danger text-center font-medium">{error}</p>
        </div>
      )}
    </>
  );
}
