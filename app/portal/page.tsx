import Link from "next/link";
import { CalendarCheck2, ClipboardCheck, FileText, Target, TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ProgressBar } from "@/components/progress-bar";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { Button } from "@/components/ui/button";
import { getCurrentStudent } from "@/lib/student-portal";

export const dynamic = "force-dynamic";

export default async function StudentPortalPage() {
  const student = await getCurrentStudent();

  if (!student) {
    return <EmptyState title="Profil murid belum tersedia" description="Hubungi Admin untuk menghubungkan akun dengan data murid." />;
  }

  const currentProgram = student.assignments[0]?.program;
  const latestScore = student.scores[0];

  return (
    <div className="space-y-3">
      <StudentProfileHeader student={student} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border bg-background px-3 py-2">
          <p className="text-[11px] font-medium uppercase text-muted-foreground">Program Aktif</p>
          <p className="mt-1 truncate text-sm font-semibold">{currentProgram?.name ?? "Belum ada"}</p>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href="/portal/program">
              <Target className="h-3.5 w-3.5" />
              Lihat Program
            </Link>
          </Button>
        </section>
        <section className="rounded-md border bg-background px-3 py-2">
          <p className="text-[11px] font-medium uppercase text-muted-foreground">Progress</p>
          <div className="mt-3">
            <ProgressBar value={student.progress} />
          </div>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href="/portal/progress">
              <TrendingUp className="h-3.5 w-3.5" />
              Detail Progress
            </Link>
          </Button>
        </section>
        <section className="rounded-md border bg-background px-3 py-2">
          <p className="text-[11px] font-medium uppercase text-muted-foreground">Absensi</p>
          <p className="mt-1 text-sm font-semibold">{student.attendance}% kehadiran</p>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href="/portal/absensi">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Riwayat Absensi
            </Link>
          </Button>
        </section>
        <section className="rounded-md border bg-background px-3 py-2">
          <p className="text-[11px] font-medium uppercase text-muted-foreground">Nilai Terbaru</p>
          <p className="mt-1 text-sm font-semibold">{latestScore?.grade ?? "-"}</p>
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href="/portal/nilai">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Lihat Nilai
            </Link>
          </Button>
        </section>
      </div>

      <section className="rounded-md border bg-background px-3 py-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Coach Saya</p>
            <h2 className="mt-1 text-sm font-semibold">{student.coach?.name ?? student.coach?.username ?? "Belum dipilih"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {student.coach?.coachProfile ? `${student.coach.coachProfile.category.name} · ${student.coach.coachProfile.sport.name} · ${student.coach.coachProfile.experienceYears} tahun pengalaman` : "Hubungi Admin untuk memilih coach pembimbing."}
            </p>
          </div>
          {student.coach?.coachProfile?.bio ? <p className="max-w-xl text-xs leading-5 text-slate-600">{student.coach.coachProfile.bio}</p> : null}
        </div>
      </section>

      <section className="rounded-md border bg-background px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Latihan Hari Ini</h2>
            <p className="text-xs text-muted-foreground">Hasil latihan diinput oleh coach. Murid dapat melihat riwayatnya di Log Latihan.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/portal/log">
              <FileText className="h-3.5 w-3.5" />
              Log Latihan
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
