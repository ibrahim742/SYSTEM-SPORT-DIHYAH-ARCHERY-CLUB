import type React from "react";

import { cn } from "@/lib/utils";

type ChartBoxProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function ChartBox({ title, description, children, className }: ChartBoxProps) {
  return (
    <section className={cn("overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/50", className)}>
      <div className="flex h-10 items-center justify-between border-b bg-gradient-to-r from-slate-50 via-white to-sky-50/50 px-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          {description ? <p className="truncate text-xs text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="h-[230px] p-3">{children}</div>
    </section>
  );
}
