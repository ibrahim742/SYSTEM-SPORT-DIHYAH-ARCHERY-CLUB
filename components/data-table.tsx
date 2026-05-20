import type React from "react";

import { PaginatedTable } from "@/components/paginated-table";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string;
  className?: string;
  pageSize?: number;
};

export function DataTable<T>({ columns, data, getRowKey, className, pageSize }: DataTableProps<T>) {
  const header = (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        {columns.map((column) => (
          <TableHead key={column.key} className={column.className}>
            {column.header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  return (
    <PaginatedTable className={className} emptyColSpan={columns.length} header={header} pageSize={pageSize}>
      {data.map((row, index) => (
        <TableRow key={getRowKey(row, index)}>
          {columns.map((column) => (
            <TableCell key={column.key} className={cn("h-10", column.className)}>
              {column.cell(row)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </PaginatedTable>
  );
}
