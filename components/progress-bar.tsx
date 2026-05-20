import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  className?: string;
  showValue?: boolean;
};

export function ProgressBar({ value, className, showValue = true }: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 w-full overflow-hidden rounded-sm bg-muted">
        <div className="h-full rounded-sm bg-emerald-600" style={{ width: `${normalized}%` }} />
      </div>
      {showValue ? <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">{normalized}%</span> : null}
    </div>
  );
}
