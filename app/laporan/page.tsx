import { DataTable, type Column } from "@/components/data-table";
import { ExportReportButton } from "@/components/export-report-button";
import { FilterBar } from "@/components/filter-bar";
import { ProgressBar } from "@/components/progress-bar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scopedStudentWhere } from "@/lib/rbac";
import { averageStudentMetrics } from "@/lib/student-metrics";

export const dynamic = "force-dynamic";

type Report = Awaited<ReturnType<typeof getReports>>[number];

async function getReports() {
  const session = await auth();
  if (!session?.user) return [];

  const scope = scopedStudentWhere({
    user: {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      clubIds: session.user.clubIds
    }
  });

  const [students, finishedPrograms] = await Promise.all([
    prisma.student.findMany({
      where: scope,
      include: {
        assignments: { where: { deletedAt: null }, include: { program: true }, orderBy: { assignedAt: "desc" } },
        attendanceRecords: { include: { session: true } },
        trainingLogs: { where: { deletedAt: null }, orderBy: { date: "desc" } }
      }
    }),
    prisma.programAssignment.count({ where: { status: "SELESAI", deletedAt: null, student: scope } })
  ]);
  const metrics = averageStudentMetrics(students);
  const activeStudents = students.filter((student) => student.status === "AKTIF").length;

  return [
    {
      period: "Periode berjalan",
      activeStudents,
      avgProgress: metrics.progress,
      attendance: metrics.attendance,
      finishedPrograms
    }
  ];
}

const columns: Column<Report>[] = [
  { key: "period", header: "Periode", cell: (row) => <span className="font-medium">{row.period}</span> },
  { key: "activeStudents", header: "Murid Aktif", cell: (row) => row.activeStudents },
  { key: "avgProgress", header: "Avg Progress", cell: (row) => <ProgressBar value={row.avgProgress} /> },
  { key: "attendance", header: "Kehadiran", cell: (row) => <ProgressBar value={row.attendance} /> },
  { key: "finishedPrograms", header: "Program Selesai", cell: (row) => row.finishedPrograms }
];

export default async function ReportPage() {
  const reports = await getReports();

  return (
    <section className="rounded-md border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">Laporan</h2>
          <p className="text-xs text-muted-foreground">Ringkasan performa mingguan untuk evaluasi coach.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterBar
            searchPlaceholder="Cari periode"
            filters={[
              {
                placeholder: "Rentang",
                options: [
                  { label: "Mingguan", value: "mingguan" },
                  { label: "Bulanan", value: "bulanan" },
                  { label: "Triwulan", value: "triwulan" }
                ]
              }
            ]}
          />
          <ExportReportButton rows={reports} />
        </div>
      </div>
      <DataTable columns={columns} data={reports} getRowKey={(row) => row.period} />
    </section>
  );
}
