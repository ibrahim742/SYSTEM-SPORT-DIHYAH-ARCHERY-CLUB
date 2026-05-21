import { BadgeStatus } from "@/components/badge-status";
import { ChartBox } from "@/components/chart-box";
import { ProgressPerformanceChart } from "@/components/charts";
import { DataTable, type Column } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { ProgressBar } from "@/components/progress-bar";
import { auth } from "@/lib/auth";
import { trainingStatusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { buildTrainingTrendData, collapseTrainingLogDuplicates, formatTrainingLogTimestamp, getTrainingLogDisplayDate } from "@/lib/progress-analytics";
import { scopedStudentWhere } from "@/lib/rbac";
import { calculateStudentMetrics } from "@/lib/student-metrics";

export const dynamic = "force-dynamic";

type ProgressRow = Awaited<ReturnType<typeof getProgressRows>>[number];

async function getProgressRows() {
  const session = await auth();
  if (!session?.user) return [];

  const rows = await prisma.trainingLog.findMany({
    where: {
      deletedAt: null,
      student: scopedStudentWhere({
        user: {
          id: session.user.id,
          username: session.user.username,
          role: session.user.role,
          clubIds: session.user.clubIds
        }
      })
    },
    include: {
      student: {
        include: {
          assignments: { where: { deletedAt: null }, include: { program: true }, orderBy: { assignedAt: "desc" } },
          attendanceRecords: { include: { session: true } },
          scores: { orderBy: { scoredAt: "desc" }, take: 1 },
          trainingLogs: { where: { deletedAt: null }, orderBy: { date: "desc" } }
        }
      }
    },
    orderBy: { date: "desc" }
  });

  return collapseTrainingLogDuplicates(rows).map((row) => {
    const trainingLogs = collapseTrainingLogDuplicates(row.student.trainingLogs);

    return {
      ...row,
      student: {
        ...row.student,
        trainingLogs,
        ...calculateStudentMetrics({ ...row.student, trainingLogs })
      }
    };
  });
}

const columns: Column<ProgressRow>[] = [
  { key: "student", header: "Murid", cell: (row) => <span className="font-medium">{row.student.name}</span> },
  { key: "date", header: "Hari/Tanggal", cell: (row) => formatTrainingLogTimestamp(getTrainingLogDisplayDate(row)) },
  { key: "material", header: "Materi", cell: (row) => row.note ?? "Latihan mandiri" },
  { key: "target", header: "Target", cell: () => "Sesuai program" },
  { key: "actual", header: "Aktual", cell: (row) => row.result },
  { key: "progress", header: "Progress %", cell: (row) => <ProgressBar value={row.student.progress} /> },
  { key: "score", header: "Nilai Coach", cell: (row) => <span className="font-medium">{row.student.scores[0]?.grade ?? "-"}</span> },
  { key: "status", header: "Status", cell: (row) => <BadgeStatus status={trainingStatusLabel(row.status)} /> }
];

export default async function MonitoringPage() {
  const progressRows = await getProgressRows();
  const trendData = buildTrainingTrendData(progressRows, 10);

  return (
    <div className="space-y-3">
      <ChartBox title="Grafik Hasil Latihan" description="Pilih mingguan, bulanan, atau tahunan untuk membaca tren latihan." className="[&>div:last-child]:h-[360px]">
        <ProgressPerformanceChart data={trendData} />
      </ChartBox>
      <section className="rounded-md border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div>
            <h2 className="text-sm font-semibold">Monitoring Progress</h2>
            <p className="text-xs text-muted-foreground">Perbandingan target, aktual, dan penilaian coach.</p>
          </div>
          <FilterBar
            searchPlaceholder="Cari murid/materi"
            filters={[
              {
                placeholder: "Status",
                options: [
                  { label: "Semua", value: "semua" },
                  { label: "Selesai", value: "selesai" },
                  { label: "Proses", value: "proses" },
                  { label: "Belum", value: "belum" }
                ]
              }
            ]}
          />
        </div>
        <DataTable columns={columns} data={progressRows} getRowKey={(row) => row.id} />
      </section>
    </div>
  );
}
