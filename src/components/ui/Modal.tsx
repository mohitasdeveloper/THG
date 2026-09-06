"use client";

import { ReactNode } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container rounded-dialog shadow-dialog max-w-lg w-full p-6 animate-fade-slide-up text-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="text-[24px] leading-[32px] font-normal mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
