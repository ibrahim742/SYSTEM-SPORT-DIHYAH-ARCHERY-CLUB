import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { levelLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProgramDetail = Awaited<ReturnType<typeof getProgram>>["details"][number];

async function getProgram(id: string) {
  const program = await prisma.program.findFirst({
    where: { OR: [{ id }, { slug: id }], deletedAt: null, status: "ACTIVE" },
    include: { sport: true, details: { orderBy: { order: "asc" } } }
  });

  if (!program) {
    throw new Error("Program tidak ditemukan");
  }

  return program;
}

const columns: Column<ProgramDetail>[] = [
  { key: "day", header: "Hari", cell: (row) => <span className="font-medium">{row.day}</span> },
  { key: "material", header: "Materi", cell: (row) => row.material },
  { key: "set", header: "Set", cell: (row) => row.set },
  { key: "reps", header: "Repetisi", cell: (row) => row.reps },
  { key: "duration", header: "Durasi", cell: (row) => row.duration },
  { key: "note", header: "Catatan", cell: (row) => row.note }
];

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await getProgram(id);

  return (
    <section className="rounded-md border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link href="/program" aria-label="Kembali ke program">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h2 className="truncate text-sm font-semibold">{program.name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{levelLabel(program.level)}</Badge>
            <Badge variant={program.type === "PERSIAPAN_TURNAMEN" ? "amber" : "outline"}>{program.type === "PERSIAPAN_TURNAMEN" ? "Persiapan Turnamen" : "Latihan"}</Badge>
            <span>{program.sport.name}</span>
            <span>{program.duration}</span>
            <span>{program.materials} materi</span>
            <span>Intensitas {program.intensity}</span>
          </div>
        </div>
      </div>
      <DataTable columns={columns} data={program.details} getRowKey={(row) => row.id} />
    </section>
  );
}
