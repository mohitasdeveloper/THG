import { ReactNode } from "react";

export default function AppBar({
  title,
  right,
}: {
  title: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="h-[64px] bg-surface text-text-primary flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm border-b border-border-light">
      <div className="text-[22px] font-normal leading-[28px] truncate">{title}</div>
      {right}
    </div>
  );
}
