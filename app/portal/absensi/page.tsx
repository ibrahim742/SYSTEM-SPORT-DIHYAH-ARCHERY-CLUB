import { BadgeStatus } from "@/components/badge-status";
import { EmptyState } from "@/components/empty-state";
import { PaginatedList } from "@/components/paginated-list";
import { SectionBox } from "@/components/section-box";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { attendanceStatusLabel } from "@/lib/labels";
import { getCurrentStudent } from "@/lib/student-portal";

export const dynamic = "force-dynamic";

export default async function StudentAttendancePage() {
  const student = await getCurrentStudent();
  if (!student) return <EmptyState title="Profil murid belum tersedia" description="Hubungi Admin untuk menghubungkan akun dengan data murid." />;

  return (
    <div className="space-y-3">
      <StudentProfileHeader student={student} />
      <SectionBox title="Absensi Saya" description="Riwayat status kehadiran latihan">
        <PaginatedList className="divide-y">
          {student.attendanceRecords.map((record) => (
            <div key={record.id} className="grid gap-3 py-3 text-xs md:grid-cols-[140px_1fr_100px_100px_120px] md:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tanggal</p>
                <p className="font-medium">{record.session.date.toISOString().slice(0, 10)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Judul Sesi</p>
                <p className="text-muted-foreground">{record.session.title}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Jam Masuk</p>
                <p>{record.checkIn ?? "-"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Jam Pulang</p>
                <p>{record.checkOut ?? "-"}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
                <BadgeStatus status={attendanceStatusLabel(record.status)} />
              </div>
            </div>
          ))}
        </PaginatedList>
      </SectionBox>
    </div>
  );
}
