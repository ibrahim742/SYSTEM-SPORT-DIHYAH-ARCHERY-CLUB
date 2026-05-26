import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BadgeStatus } from "@/components/badge-status";
import { ChartBox } from "@/components/chart-box";
import { ProgressDonutChart, ProgressPerformanceChart } from "@/components/charts";
import { PaginatedList } from "@/components/paginated-list";
import { ProgressBar } from "@/components/progress-bar";
import { SectionBox } from "@/components/section-box";
import { TrainingLogForm } from "@/components/training-log-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { levelLabel, studentStatusLabel, trainingStatusLabel } from "@/lib/labels";
import { buildCompletedMaterialKeys, isMaterialCompleted } from "@/lib/material-progress";
import { prisma } from "@/lib/prisma";
import {
  buildTrainingTrendData,
  collapseTrainingLogDuplicates,
  formatTrainingLogTimestamp,
  getTrainingLogDisplayDate
} from "@/lib/progress-analytics";
import { scopedStudentWhere } from "@/lib/rbac";
import { calculateStudentMetrics } from "@/lib/student-metrics";

export const dynamic = "force-dynamic";

async function getStudent(id: string) {
  const session = await auth();
  if (!session?.user) return null;

  return prisma.student.findFirst({
    where: {
      id,
      AND: scopedStudentWhere({
        user: {
          id: session.user.id,
          username: session.user.username,
          role: session.user.role,
          clubIds: session.user.clubIds
        }
      })
    },
    include: {
      club: true,
      sport: true,
      coach: { select: { id: true, name: true, username: true, image: true, coachProfile: { include: { sport: true, category: true } } } },
      assignments: { where: { deletedAt: null }, include: { program: { include: { details: { orderBy: { order: "asc" } } } } }, orderBy: { assignedAt: "desc" } },
      attendanceRecords: { include: { session: true }, orderBy: { createdAt: "desc" } },
      scores: { where: { deletedAt: null }, orderBy: { scoredAt: "desc" } },
      trainingLogs: { where: { deletedAt: null }, orderBy: { date: "desc" } }
    }
  });
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const student = await getStudent(id);

  if (!student) {
    return (
      <section className="rounded-md border bg-background p-4 text-sm">
        <h2 className="font-semibold">Murid tidak ditemukan</h2>
        <p className="mt-1 text-xs text-muted-foreground">Data tidak ada atau di luar scope akses akun ini.</p>
      </section>
    );
  }

  const todayTraining = student.assignments[0]?.program.details ?? [];
  const trainingLogs = collapseTrainingLogDuplicates(student.trainingLogs);
  const completedMaterialKeys = buildCompletedMaterialKeys(student.scores, trainingLogs);
  const metrics = calculateStudentMetrics({ ...student, trainingLogs });
  const trendData = buildTrainingTrendData(trainingLogs);
  const averageRpe =
    trainingLogs.length > 0
      ? Math.round((trainingLogs.reduce((total, log) => total + log.rpe, 0) / trainingLogs.length) * 10) / 10
      : 0;

  return (
    <div className="space-y-3">
      <section className="rounded-md border bg-background px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link href="/murid" aria-label="Kembali ke data murid">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{student.name}</h2>
              <p className="text-xs text-muted-foreground">
                {student.club.name} · {student.sport.name} · {student.branch} · {student.age} tahun
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{levelLabel(student.level)}</Badge>
            <Badge variant="green">{studentStatusLabel(student.status)}</Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionBox title="Coach Pembimbing" description="Coach yang ditugaskan Admin untuk murid ini.">
          {student.coach ? (
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Nama</p>
                <p className="mt-1 font-semibold">{student.coach.name ?? student.coach.username}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Kategori</p>
                <p className="mt-1 font-semibold">{student.coach.coachProfile?.category.name ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Olahraga</p>
                <p className="mt-1 font-semibold">{student.coach.coachProfile?.sport.name ?? "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pengalaman</p>
                <p className="mt-1 font-semibold">{student.coach.coachProfile?.experienceYears ?? 0} tahun</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Bio</p>
                <p className="mt-1">{student.coach.coachProfile?.bio ?? "-"}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada coach yang dipilih.</p>
          )}
        </SectionBox>

        <SectionBox title="Latihan Hari Ini" description="Status done bertambah dari seluruh materi yang sudah pernah dinilai coach/admin.">
          <div className="divide-y">
            {todayTraining.map((detail, index) => {
              const completed = isMaterialCompleted(detail.material, completedMaterialKeys);

              return (
                <div key={detail.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-muted text-[11px] font-semibold">
                      {index + 1}
                    </span>
                    <span className="truncate">{detail.material}</span>
                  </div>
                  <Badge variant={completed ? "green" : "outline"}>{completed ? "done" : "next"}</Badge>
                </div>
              );
            })}
          </div>
        </SectionBox>

        <SectionBox title="Ringkasan Murid" description="Progress dan kehadiran sesi berjalan." className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{metrics.progress}%</span>
              </div>
              <ProgressBar value={metrics.progress} showValue={false} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Kehadiran</span>
                <span className="font-medium">{metrics.attendance}%</span>
              </div>
              <ProgressBar value={metrics.attendance} showValue={false} />
            </div>
            <div className="grid grid-cols-2 divide-x border-y text-xs">
              <div className="px-2 py-2">
                <p className="text-muted-foreground">Sesi</p>
                <p className="mt-1 text-lg font-semibold leading-none">{trainingLogs.length}</p>
              </div>
              <div className="px-2 py-2">
                <p className="text-muted-foreground">Rata-rata RPE</p>
                <p className="mt-1 text-lg font-semibold leading-none">{averageRpe}</p>
              </div>
            </div>
          </div>
        </SectionBox>
      </div>

      {session?.user.role !== "MURID" ? (
        <SectionBox title="Form Latihan" description="Input hasil latihan oleh coach/admin.">
          <TrainingLogForm studentId={student.id} />
        </SectionBox>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
        <ChartBox title="Grafik Progress" description="Pilih mingguan, bulanan, atau tahunan untuk membaca tren latihan." className="[&>div:last-child]:h-[360px]">
          <ProgressPerformanceChart data={trendData} />
        </ChartBox>
        <ChartBox title="Ringkasan Visual" description="Dua indikator utama: progress program dan kehadiran latihan." className="[&>div:last-child]:h-[320px]">
          <ProgressDonutChart progress={metrics.progress} attendance={metrics.attendance} />
        </ChartBox>
      </div>

      <SectionBox title="Riwayat Progress" description="Riwayat hasil, durasi, RPE, catatan, dan status latihan.">
        <div className="hidden border-b pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[170px_1fr_100px_70px_1fr_90px] md:gap-2">
          <span>Waktu</span>
          <span>Hasil Latihan</span>
          <span>Durasi</span>
          <span>RPE</span>
          <span>Catatan</span>
          <span>Status</span>
        </div>
        <PaginatedList className="divide-y">
          {trainingLogs.map((log) => (
            <div key={log.id} className="grid gap-2 py-2 text-xs md:grid-cols-[170px_1fr_100px_70px_1fr_90px] md:items-center">
              <span className="font-medium">{formatTrainingLogTimestamp(getTrainingLogDisplayDate(log))}</span>
              <span>{log.result}</span>
              <span className="text-muted-foreground">{log.duration}</span>
              <span>RPE {log.rpe}</span>
              <span className="text-muted-foreground">{log.note || "-"}</span>
              <BadgeStatus status={trainingStatusLabel(log.status)} />
            </div>
          ))}
        </PaginatedList>
      </SectionBox>
    </div>
  );
}
