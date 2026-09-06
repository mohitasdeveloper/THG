"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "filled" | "tonal" | "outlined" | "text" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

const variantClasses: Record<Variant, string> = {
  filled: "bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow",
  tonal: "bg-surface-container-highest text-text-primary hover:bg-gray-300",
  outlined: "bg-surface text-primary border border-border hover:bg-surface-container",
  text: "bg-transparent text-primary hover:bg-surface-container",
  danger: "bg-danger text-white hover:bg-red-800 shadow-sm hover:shadow",
};

export default function Button({
  variant = "filled",
  full,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-btn px-6 py-3 font-medium text-sm transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        full && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
