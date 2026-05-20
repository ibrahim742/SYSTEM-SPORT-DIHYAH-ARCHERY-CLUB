"use client";

import type React from "react";

import { cn } from "@/lib/utils";

export function ContentModal({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="fixed inset-y-0 left-0 right-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 md:left-64">
      <div className={cn("max-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-md border bg-white shadow-xl", className)}>
        {children}
      </div>
    </div>
  );
}
