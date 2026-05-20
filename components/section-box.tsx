import type React from "react";

import { cn } from "@/lib/utils";

type SectionBoxProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SectionBox({ title, description, actions, children, className }: SectionBoxProps) {
  return (
    <section className={cn("overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/50", className)}>
      {(title || description || actions) && (
        <div className="flex min-h-10 items-center justify-between gap-3 border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 px-3 py-2">
          <div className="min-w-0">
            {title ? <h2 className="truncate text-sm font-semibold">{title}</h2> : null}
            {description ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      )}
      <div className="p-3">{children}</div>
    </section>
  );
}
