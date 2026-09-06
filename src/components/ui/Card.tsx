import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface rounded-card shadow-card p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
