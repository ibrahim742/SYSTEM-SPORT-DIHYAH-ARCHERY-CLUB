"use client";

import { Children, type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginatedListProps = {
  children: ReactNode;
  className?: string;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 5;

export function PaginatedList({ children, className, pageSize = DEFAULT_PAGE_SIZE }: PaginatedListProps) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const visibleItems = items.slice((page - 1) * pageSize, page * pageSize);
  const firstVisibleRow = items.length ? (page - 1) * pageSize + 1 : 0;
  const lastVisibleRow = Math.min(page * pageSize, items.length);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <>
      <div className={className}>{visibleItems}</div>
      {items.length > pageSize ? (
        <div className="grid gap-2 border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground sm:grid-cols-[1fr_auto] sm:items-center">
          <span className="text-center sm:text-left">
            Menampilkan {firstVisibleRow}-{lastVisibleRow} dari {items.length} data
          </span>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <Button className="min-w-0" variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden min-[380px]:inline">Sebelumnya</span>
            </Button>
            <span className="min-w-12 text-center font-medium text-slate-700">
              {page} / {totalPages}
            </span>
            <Button className="min-w-0" variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
              <span className="hidden min-[380px]:inline">Berikutnya</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
