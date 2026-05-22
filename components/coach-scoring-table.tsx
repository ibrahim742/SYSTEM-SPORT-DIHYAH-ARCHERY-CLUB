"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Save, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { levelAccent, levelTone, softPill } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

type ScoreRow = {
  studentId: string;
  name: string;
  clubName: string;
  branch: string;
  levelLabel: string;
  material: string;
  materialOptions: {
    id: string;
    label: string;
    meta: string;
  }[];
  programName: string | null;
  technique: number;
  focus: number;
  stamina: number;
  grade: string;
  note: string;
  scoredAt: string | null;
};
const PAGE_SIZE = 5;

function formatScoreHistory(value: string | null) {
  if (!value) return { day: "-", date: "-", time: "-" };
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date),
    date: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date),
    time: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date)
  };
}

function materialSelectValue(row: ScoreRow) {
  return row.materialOptions.find((option) => option.label === row.material)?.id ?? "";
}

export function CoachScoringTable({ rows: initialRows, selectedDate }: { rows: ScoreRow[]; selectedDate: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [date, setDate] = useState(selectedDate);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [page, rows]);
  const firstVisibleRow = rows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleRow = Math.min(page * PAGE_SIZE, rows.length);

  useEffect(() => {
    setRows(initialRows);
    setDate(selectedDate);
    setPage(1);
    setMessage("");
  }, [initialRows, selectedDate]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function update(index: number, patch: Partial<ScoreRow>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function applyDateFilter() {
    router.push(`/penilaian?date=${date}`);
  }

  async function saveScores() {
    const rowsWithoutMaterials = rows.filter((row) => row.materialOptions.length === 0);
    if (rowsWithoutMaterials.length > 0) {
      setMessage(`${rowsWithoutMaterials.length} murid belum punya materi dari Program Latihan aktif.`);
      return;
    }

    setSaving(true);
    setMessage("");
    const responses = await Promise.all(
      rows.map((row) =>
        fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: row.studentId,
            material: row.material,
            scoredDate: date,
            technique: row.technique,
            focus: row.focus,
            stamina: row.stamina,
            grade: row.grade,
            note: row.note
          })
        })
      )
    );
    setSaving(false);

    const failed = responses.find((response) => !response.ok);
    if (failed) {
      const error = await failed.json().catch(() => ({ error: "Gagal menyimpan nilai" }));
      setMessage(error.error ?? "Gagal menyimpan nilai");
      return;
    }

    setMessage("Nilai berhasil disimpan.");
    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r from-slate-50 via-white to-amber-50/50 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">Penilaian Coach</h2>
          <p className="text-xs text-muted-foreground">Berikan nilai untuk murid yang hadir latihan hari ini.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="w-full sm:w-36" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Button variant="outline" size="sm" onClick={applyDateFilter}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button size="sm" onClick={saveScores} disabled={saving || rows.length === 0}>
            <Save className="h-3.5 w-3.5" />
            {saving ? "Menyimpan..." : "Simpan Nilai"}
          </Button>
        </div>
      </div>
      {message ? <div className={cn("border-b px-3 py-2 text-xs", message.includes("berhasil") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{message}</div> : null}

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Murid</TableHead>
            <TableHead>Club</TableHead>
            <TableHead>Materi</TableHead>
            <TableHead className="w-24">Teknik</TableHead>
            <TableHead className="w-24">Fokus</TableHead>
            <TableHead className="w-24">Stamina</TableHead>
            <TableHead className="w-24">Nilai</TableHead>
            <TableHead className="min-w-[130px]">Riwayat</TableHead>
            <TableHead className="min-w-[220px]">Catatan Coach</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.map((row, index) => {
            const rowIndex = (page - 1) * PAGE_SIZE + index;
            const history = formatScoreHistory(row.scoredAt);
            return (
            <TableRow key={row.studentId} className={cn("border-l-2", levelAccent(row.levelLabel))}>
              <TableCell className="h-16">
                <div className="min-w-0">
                  <p className="font-medium">{row.name}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={softPill(levelTone(row.levelLabel))}>{row.levelLabel}</span>
                    <span className="text-[11px] text-muted-foreground">{row.branch}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="h-16">{row.clubName}</TableCell>
              <TableCell className="h-16">
                <div className="min-w-[220px] space-y-1">
                  <Select
                    value={materialSelectValue(row)}
                    onValueChange={(value) => {
                      const selectedMaterial = row.materialOptions.find((option) => option.id === value);
                      if (selectedMaterial) update(rowIndex, { material: selectedMaterial.label });
                    }}
                    disabled={row.materialOptions.length === 0}
                  >
                    <SelectTrigger className="bg-slate-50/70 focus:bg-white">
                      <SelectValue placeholder="Pilih materi program" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {row.materialOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          <span className="flex flex-col gap-0.5">
                            <span>{option.label}</span>
                            {option.meta ? <span className="text-[11px] text-muted-foreground">{option.meta}</span> : null}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="truncate text-[11px] text-muted-foreground">Program: {row.programName ?? "-"}</p>
                </div>
              </TableCell>
              <TableCell className="h-16">
                <Input className="bg-slate-50/70 text-center tabular-nums focus-visible:bg-white" value={row.technique} inputMode="numeric" onChange={(event) => update(rowIndex, { technique: Number(event.target.value) })} />
              </TableCell>
              <TableCell className="h-16">
                <Input className="bg-slate-50/70 text-center tabular-nums focus-visible:bg-white" value={row.focus} inputMode="numeric" onChange={(event) => update(rowIndex, { focus: Number(event.target.value) })} />
              </TableCell>
              <TableCell className="h-16">
                <Input className="bg-slate-50/70 text-center tabular-nums focus-visible:bg-white" value={row.stamina} inputMode="numeric" onChange={(event) => update(rowIndex, { stamina: Number(event.target.value) })} />
              </TableCell>
              <TableCell className="h-16">
                <Input className="bg-emerald-50/80 text-center font-semibold text-emerald-800 focus-visible:bg-white" value={row.grade} onChange={(event) => update(rowIndex, { grade: event.target.value })} />
              </TableCell>
              <TableCell className="h-16 text-xs">
                <div className="space-y-0.5">
                  <p className="font-medium">{history.day}</p>
                  <p className="text-muted-foreground">{history.date}</p>
                  <p className="tabular-nums text-muted-foreground">{history.time}</p>
                </div>
              </TableCell>
              <TableCell className="h-16">
                <Textarea className="min-h-[52px] bg-slate-50/70 focus-visible:bg-white" value={row.note} placeholder="Catatan singkat" onChange={(event) => update(rowIndex, { note: event.target.value })} />
              </TableCell>
            </TableRow>
            );
          })}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-20 text-center text-xs text-muted-foreground">
                Tidak ada murid hadir pada tanggal ini.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      {rows.length > PAGE_SIZE ? (
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
    </section>
  );
}
