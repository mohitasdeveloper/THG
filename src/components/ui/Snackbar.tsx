"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Snackbar({
  message,
  tone = "default",
  onClose,
}: {
  message: string | null;
  tone?: "default" | "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  const toneClasses = {
    default: "bg-text-primary",
    success: "bg-success",
    error: "bg-danger",
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-slide-up">
      <div
        className={cn(
          "text-surface text-sm px-4 py-3 rounded-md shadow-fab max-w-sm text-center min-w-[288px]",
          toneClasses[tone]
        )}
      >
        {message}
      </div>
    </div>
  );
}
