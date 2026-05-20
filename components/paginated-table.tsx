"use client";

import { Children, type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

type PaginatedTableProps = {
  children: ReactNode;
  className?: string;
  emptyColSpan: number;
  header: ReactNode;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 5;

export function PaginatedTable({ children, className, emptyColSpan, header, pageSize = DEFAULT_PAGE_SIZE }: PaginatedTableProps) {
  const rows = useMemo(() => Children.toArray(children), [children]);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const firstVisibleRow = rows.length ? (page - 1) * pageSize + 1 : 0;
  const lastVisibleRow = Math.min(page * pageSize, rows.length);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <>
      <Table className={className}>
        {header}
        <TableBody>
          {visibleRows}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={emptyColSpan} className="h-20 text-center text-xs text-muted-foreground">
                Tidak ada data.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      {rows.length > pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Menampilkan {firstVisibleRow}-{lastVisibleRow} dari {rows.length} data
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
              Sebelumnya
            </Button>
            <span className="min-w-16 text-center font-medium text-slate-700">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
              Berikutnya
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
