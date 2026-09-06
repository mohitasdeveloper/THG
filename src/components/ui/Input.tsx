"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "rounded-md border border-border px-4 py-3 text-base outline-none focus:border-2 focus:border-primary focus:ring-0 transition-all bg-surface text-text-primary hover:border-text-primary disabled:opacity-50 disabled:bg-surface-container",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
