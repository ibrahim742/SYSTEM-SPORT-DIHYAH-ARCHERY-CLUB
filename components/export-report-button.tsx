"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type ReportRow = {
  period: string;
  activeStudents: number;
  avgProgress: number;
  attendance: number;
  finishedPrograms: number;
};

export function ExportReportButton({ rows }: { rows: ReportRow[] }) {
  function exportCsv() {
    const header = ["Periode", "Murid Aktif", "Avg Progress", "Kehadiran", "Program Selesai"];
    const lines = rows.map((row) => [row.period, row.activeStudents, row.avgProgress, row.attendance, row.finishedPrograms].join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "laporan-altlit.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={exportCsv}>
      <Download className="h-3.5 w-3.5" />
      Export
    </Button>
  );
}
