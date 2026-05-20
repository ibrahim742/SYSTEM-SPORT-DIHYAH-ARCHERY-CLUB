"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Clock3, Gauge, Layers3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { levelLabel } from "@/lib/labels";
import { intensityTone, levelTone, softPill } from "@/lib/ui-styles";

type ProgramRow = {
  id: string;
  slug: string;
  name: string;
  sportName?: string;
  type?: "LATIHAN" | "PERSIAPAN_TURNAMEN";
  level: string;
  duration: string;
  materials: number;
  intensity: string;
};

const PAGE_SIZE = 5;

export function ProgramList({ programs }: { programs: ProgramRow[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(programs.length / PAGE_SIZE));
  const visiblePrograms = useMemo(() => programs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [page, programs]);
  const firstVisibleRow = programs.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleRow = Math.min(page * PAGE_SIZE, programs.length);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <>
      <div className="divide-y">
        {visiblePrograms.map((program) => (
          <Link
            key={program.id}
            href={`/program/${program.slug}`}
            className="group grid gap-2 border-l-2 border-l-transparent px-3 py-3 text-xs transition-colors hover:border-l-emerald-400 hover:bg-slate-50/90 md:grid-cols-[1.7fr_0.8fr_0.75fr_0.75fr_0.75fr_auto] md:items-center"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{program.name}</p>
              <p className="text-xs text-muted-foreground">
                {program.sportName ?? "Program"} · {program.type === "PERSIAPAN_TURNAMEN" ? "Persiapan Turnamen" : "Latihan"}
              </p>
            </div>
            <span className={softPill(levelTone(levelLabel(program.level)))}>{levelLabel(program.level)}</span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <Clock3 className="h-3.5 w-3.5 text-sky-600" />
              {program.duration}
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <Layers3 className="h-3.5 w-3.5 text-emerald-600" />
              {program.materials} materi
            </span>
            <span className={softPill(intensityTone(program.intensity))}>
              <Gauge className="mr-1 h-3 w-3" />
              {program.intensity}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:bg-white group-hover:text-emerald-700 group-hover:shadow-sm">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
      {programs.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Menampilkan {firstVisibleRow}-{lastVisibleRow} dari {programs.length} data
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
