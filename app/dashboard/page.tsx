import Link from "next/link";
import { CalendarCheck2, Eye, TrendingUp, UserX, Users } from "lucide-react";

import { BadgeStatus } from "@/components/badge-status";
import { ChartBox } from "@/components/chart-box";
import { WeeklyProgressChart } from "@/components/charts";
import { DataTable, type Column } from "@/components/data-table";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { monitoringRows, students as dummyStudents } from "@/lib/data";
import { isDatabaseUnavailable } from "@/lib/dev-auth";
import { levelLabel, trainingStatusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { buildStudentProgressLineData, collapseTrainingLogDuplicates } from "@/lib/progress-analytics";
import { scopedStudentWhere } from "@/lib/rbac";
import { averageStudentMetrics, calculateStudentMetrics } from "@/lib/student-metrics";
import { levelTone, softPill } from "@/lib/ui-styles";

export const dynamic = "force-dynamic";

type MonitoringRow = Awaited<ReturnType<typeof getDashboardRows>>["monitoring"][number];

function currentAssignment(assignments: MonitoringRow["assignments"]) {
  return assignments.find((assignment) => assignment.status === "AKTIF") ?? assignments[0] ?? null;
}

function dashboardAssignmentStatus(assignments: MonitoringRow["assignments"]) {
  const assignment = currentAssignment(assignments);
  if (!assignment) return "BELUM";
  if (assignment.status === "SELESAI") return "SELESAI";
  if (assignment.status === "AKTIF") return "PROSES";
  return "BELUM";
}

async function getDashboardRows() {
  const session = await auth();
  if (!session?.user) {
    return { total: 0, hadir: 0, tidakHadir: 0, avgProgress: 0, monitoring: [] };
  }

  const scope = scopedStudentWhere({
    user: {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      clubIds: session.user.clubIds
    }
  });

  try {
    const [total, latestSession, monitoringStudents] = await Promise.all([
      prisma.student.count({ where: scope }),
      prisma.attendanceSession.findFirst({
        where: {
          deletedAt: null,
          records: {
            some: {
              student: scope
            }
          }
        },
        include: {
          records: {
            where: { student: scope }
          }
        },
        orderBy: { date: "desc" }
      }),
      prisma.student.findMany({
        where: scope,
        include: {
          assignments: {
            where: { deletedAt: null },
            include: { program: true },
            orderBy: { assignedAt: "desc" }
          },
          attendanceRecords: {
            include: { session: true }
          },
          trainingLogs: {
            where: { deletedAt: null },
            orderBy: { date: "desc" }
          }
        }
      })
    ]);
    const normalizedStudents = monitoringStudents.map((student) => ({
      ...student,
      trainingLogs: collapseTrainingLogDuplicates(student.trainingLogs)
    }));
    const avg = averageStudentMetrics(normalizedStudents);
    const monitoring = normalizedStudents
      .map((student) => ({
        ...student,
        ...calculateStudentMetrics(student)
      }))
      .sort((a, b) => b.progress - a.progress);
    const hadir = latestSession?.records.filter((record) => record.status === "HADIR").length ?? 0;
    const tidakHadir = latestSession?.records.filter((record) => record.status !== "HADIR").length ?? 0;

    return {
      total,
      hadir,
      tidakHadir,
      avgProgress: avg.progress,
      monitoring
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;

    return {
      total: dummyStudents.length,
      hadir: 3,
      tidakHadir: 2,
      avgProgress: 70,
      monitoring: monitoringRows.map((row, index) => ({
        id: `dev-${index}`,
        name: row.student,
        level: row.level,
        progress: row.progress,
        attendance: row.attendance,
        assignments: [
          {
            status: row.status === "selesai" ? "SELESAI" : row.status === "belum" ? "BELUM" : "AKTIF",
            program: {
              name: row.program
            }
          }
        ]
      }))
    };
  }
}

function makeStats(total: number, hadir: number, tidakHadir: number, avgProgress: number) {
  return [
    {
    label: "Total Murid",
    value: total.toString(),
    note: "aktif terdaftar",
    icon: Users,
    tone: "border-l-sky-400 bg-gradient-to-br from-sky-50/80 via-white to-white text-sky-700"
    },
    {
    label: "Hadir Hari Ini",
    value: hadir.toString(),
    note: "sesi sore",
    icon: CalendarCheck2,
    tone: "border-l-emerald-400 bg-gradient-to-br from-emerald-50/80 via-white to-white text-emerald-700"
    },
    {
    label: "Tidak Hadir",
    value: tidakHadir.toString(),
    note: "izin/alpa",
    icon: UserX,
    tone: "border-l-amber-400 bg-gradient-to-br from-amber-50/80 via-white to-white text-amber-700"
    },
    {
    label: "Rata-rata Progress",
    value: `${avgProgress}%`,
    note: "minggu berjalan",
    icon: TrendingUp,
    tone: "border-l-violet-400 bg-gradient-to-br from-violet-50/80 via-white to-white text-violet-700"
    }
  ];
}

const columns: Column<MonitoringRow>[] = [
  { key: "student", header: "Nama Murid", cell: (row) => <span className="font-medium">{row.name}</span> },
  { key: "level", header: "Level", cell: (row) => <span className={softPill(levelTone(levelLabel(row.level)))}>{levelLabel(row.level)}</span> },
  { key: "program", header: "Program Hari Ini", cell: (row) => currentAssignment(row.assignments)?.program.name ?? "-" },
  { key: "status", header: "Status", cell: (row) => <BadgeStatus status={trainingStatusLabel(dashboardAssignmentStatus(row.assignments))} /> },
  { key: "progress", header: "Progress %", cell: (row) => <ProgressBar value={row.progress} /> },
  { key: "attendance", header: "Kehadiran %", cell: (row) => <ProgressBar value={row.attendance} /> },
  {
    key: "action",
    header: "Action",
    className: "w-20",
    cell: (row) => (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/murid/${row.id}`}>
          <Eye className="h-3.5 w-3.5" />
          Detail
        </Link>
      </Button>
    )
  }
];

export default async function DashboardPage() {
  const dashboard = await getDashboardRows();
  const stats = makeStats(dashboard.total, dashboard.hadir, dashboard.tidakHadir, dashboard.avgProgress);
  const progressChartData = buildStudentProgressLineData(dashboard.monitoring);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className={`rounded-md border border-l-2 px-3 py-2 shadow-sm shadow-slate-200/50 ${stat.tone}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase text-slate-500">{stat.label}</p>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold leading-none text-slate-950">{stat.value}</p>
                <span className="text-[11px] text-slate-500">{stat.note}</span>
              </div>
            </div>
          );
        })}
      </div>

      <ChartBox title="Progress Murid" description="Garis progress dan kehadiran dari data murid terbaru.">
        <WeeklyProgressChart data={progressChartData} />
      </ChartBox>

      <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2">
          <div>
            <h2 className="text-sm font-semibold">Monitoring Hari Ini</h2>
            <p className="text-xs text-muted-foreground">Status program: belum = tidak ada assignment aktif, proses = assignment aktif, selesai = assignment ditandai selesai.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/monitoring">Lihat Semua</Link>
          </Button>
        </div>
        <DataTable columns={columns} data={dashboard.monitoring} getRowKey={(row) => row.id} />
      </section>
    </div>
  );
}
