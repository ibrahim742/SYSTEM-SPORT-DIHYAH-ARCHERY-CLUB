import { CalendarClock } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { SectionBox } from "@/components/section-box";
import { StudentProfileHeader } from "@/components/student-profile-header";
import { getCurrentStudent } from "@/lib/student-portal";

export const dynamic = "force-dynamic";

const WEEK_DAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jum'at" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" }
];

function dayLabel(dayOfWeek: number | null) {
  return WEEK_DAYS.find((day) => day.value === dayOfWeek)?.label ?? "-";
}

export default async function StudentSchedulePage() {
  const student = await getCurrentStudent();
  if (!student) return <EmptyState title="Profil murid belum tersedia" description="Hubungi Admin untuk menghubungkan akun dengan data murid." />;

  const weeklySchedules = student.trainingSchedules.filter((schedule) => !schedule.date && schedule.dayOfWeek);

  return (
    <div className="space-y-3">
      <StudentProfileHeader student={student} />
      <SectionBox title="Jadwal Latihan Saya" description="Hari dan jam latihan mingguan dari admin atau coach">
        {weeklySchedules.length ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {weeklySchedules.map((schedule) => (
              <div key={schedule.id} className="rounded-md border bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold">{dayLabel(schedule.dayOfWeek)}</p>
                  </div>
                  <span className="rounded-md border bg-white px-2 py-1 text-xs font-semibold">
                    {schedule.startTime} - {schedule.endTime}
                  </span>
                </div>
                {schedule.note ? <p className="mt-2 text-xs text-muted-foreground">{schedule.note}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Jadwal belum tersedia" description="Jadwal latihan akan muncul setelah admin atau coach membuat jadwal mingguan." />
        )}
      </SectionBox>
    </div>
  );
}
