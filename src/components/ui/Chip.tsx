import { cn } from "@/lib/utils";

export default function Chip({
  children,
  color = "default",
}: {
  children: React.ReactNode;
  color?: "default" | "success" | "warning" | "danger" | "primary";
}) {
  const colors: Record<string, string> = {
    default: "bg-divider text-text-secondary",
    success: "bg-green-50 text-success",
    warning: "bg-amber-50 text-warning",
    danger: "bg-red-50 text-danger",
    primary: "bg-blue-50 text-primary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium border border-border-light",
        colors[color]
      )}
    >
      {children}
    </span>
  );
}
