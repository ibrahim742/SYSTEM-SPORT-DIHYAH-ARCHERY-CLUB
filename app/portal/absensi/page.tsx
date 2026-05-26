import { BadgeStatus } from "@/components/badge-status";
import { EmptyState } from "@/components/empty-state";
import { PaginatedList } from "@/components/paginated-list";
import { SectionBox } from "@/components/section-box";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { attendanceStatusLabel } from "@/lib/labels";
import { getCurrentStudent } from "@/lib/student-portal";
import { formatClock } from "@/lib/time-format";

export const dynamic = "force-dynamic";

export default async function StudentAttendancePage() {
  const student = await getCurrentStudent();
  if (!student) return <EmptyState title="Profil murid belum tersedia" description="Hubungi Admin untuk menghubungkan akun dengan data murid." />;

  return (
    <div className="space-y-3">
      <StudentProfileHeader student={student} />
      <SectionBox title="Absensi Saya" description="Riwayat status kehadiran latihan">
        <div className="grid gap-3 border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-[140px_1fr_100px_100px_120px]">
          <span>Tanggal</span>
          <span>Judul Sesi</span>
          <span>Jam Masuk</span>
          <span>Jam Pulang</span>
          <span>Status</span>
        </div>
        <PaginatedList className="divide-y">
          {student.attendanceRecords.map((record) => (
            <div key={record.id} className="grid gap-3 py-3 text-xs md:grid-cols-[140px_1fr_100px_100px_120px] md:items-center">
              <span className="font-medium">{record.session.date.toISOString().slice(0, 10)}</span>
              <span className="text-muted-foreground">{record.session.title}</span>
              <span>{formatClock(record.checkIn)}</span>
              <span>{formatClock(record.checkOut)}</span>
              <BadgeStatus status={attendanceStatusLabel(record.status)} />
            </div>
          ))}
        </PaginatedList>
      </SectionBox>
    </div>
  );
}
