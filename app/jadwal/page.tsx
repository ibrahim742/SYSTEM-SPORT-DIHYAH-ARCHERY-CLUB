"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, ChevronLeft, ChevronRight, Pencil, Save, Search, Trash2, X } from "lucide-react";

import { BadgeStatus } from "@/components/badge-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type StudentApiRow = {
  id: string;
  name: string;
  level: "PENGENALAN" | "DASAR" | "LANJUTAN" | "PRESTASI";
  status: "AKTIF" | "PEMULIHAN" | "NONAKTIF";
  club: { name: string };
  coach?: { name: string | null; username: string } | null;
};

type ScheduleApiRow = {
  id: string;
  studentId: string;
  date: string | null;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  note: string | null;
  student: StudentApiRow;
  coach: { name: string | null; username: string } | null;
};

type DayForm = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  note: string;
};

const WEEK_DAYS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jum'at" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" }
];
const PAGE_SIZE = 10;

const defaultDayForm = Object.fromEntries(
  WEEK_DAYS.map((day) => [day.value, { enabled: false, startTime: "10:00", endTime: "13:00", note: "" }])
) as Record<number, DayForm>;

function cloneDefaultDayForm() {
  return Object.fromEntries(
    WEEK_DAYS.map((day) => [day.value, { enabled: false, startTime: "10:00", endTime: "13:00", note: "" }])
  ) as Record<number, DayForm>;
}

function dayLabel(dayOfWeek: number | null) {
  return WEEK_DAYS.find((day) => day.value === dayOfWeek)?.label ?? "-";
}

function studentCoachName(student: StudentApiRow, schedule?: ScheduleApiRow) {
  return schedule?.coach?.name ?? schedule?.coach?.username ?? student.coach?.name ?? student.coach?.username ?? "-";
}

export default function SchedulePage() {
  const [students, setStudents] = useState<StudentApiRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleApiRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [days, setDays] = useState<Record<number, DayForm>>(defaultDayForm);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const weeklySchedules = useMemo(() => schedules.filter((schedule) => !schedule.date && schedule.dayOfWeek), [schedules]);
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;

  const schedulesByStudent = useMemo(() => {
    const grouped = new Map<string, ScheduleApiRow[]>();
    for (const schedule of weeklySchedules) {
      grouped.set(schedule.studentId, [...(grouped.get(schedule.studentId) ?? []), schedule]);
    }

    return grouped;
  }, [weeklySchedules]);

  const visibleStudents = useMemo(() => {
    const lowerQuery = query.toLowerCase();

    return students
      .filter((student) => student.status !== "NONAKTIF")
      .filter((student) => `${student.name} ${student.club.name} ${studentCoachName(student)}`.toLowerCase().includes(lowerQuery))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, students]);
  const totalPages = Math.max(1, Math.ceil(visibleStudents.length / PAGE_SIZE));
  const visiblePageStudents = useMemo(() => visibleStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [page, visibleStudents]);
  const firstVisibleStudent = visibleStudents.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleStudent = Math.min(page * PAGE_SIZE, visibleStudents.length);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setMessage("");

      const [studentsResponse, schedulesResponse] = await Promise.all([fetch("/api/students"), fetch("/api/schedules")]);
      if (!studentsResponse.ok || !schedulesResponse.ok) {
        setMessage("Gagal memuat data jadwal.");
        setLoading(false);
        return;
      }

      const [studentsPayload, schedulesPayload] = (await Promise.all([studentsResponse.json(), schedulesResponse.json()])) as [
        { data?: StudentApiRow[] },
        { data?: ScheduleApiRow[] }
      ];
      const nextStudents = studentsPayload.data ?? [];

      setStudents(nextStudents);
      setSchedules(schedulesPayload.data ?? []);
      setSelectedStudentId(nextStudents.find((student) => student.status !== "NONAKTIF")?.id ?? "");
      setLoading(false);
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setDays(cloneDefaultDayForm());
      return;
    }

    const nextDays = cloneDefaultDayForm();
    for (const schedule of weeklySchedules.filter((item) => item.studentId === selectedStudentId)) {
      if (!schedule.dayOfWeek) continue;
      nextDays[schedule.dayOfWeek] = {
        enabled: true,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        note: schedule.note ?? ""
      };
    }
    setDays(nextDays);
  }, [selectedStudentId, weeklySchedules]);

  function updateDay(dayOfWeek: number, patch: Partial<DayForm>) {
    setDays((current) => ({
      ...current,
      [dayOfWeek]: {
        ...current[dayOfWeek],
        ...patch
      }
    }));
  }

  function editStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteSchedule(scheduleId: string) {
    const response = await fetch(`/api/schedules/${scheduleId}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menghapus jadwal" }));
      throw new Error(error.error ?? "Gagal menghapus jadwal");
    }
  }

  async function saveSchedules() {
    if (!selectedStudentId) {
      setMessage("Pilih murid terlebih dahulu.");
      return;
    }

    const enabledDays = WEEK_DAYS.filter((day) => days[day.value].enabled);
    if (!enabledDays.length) {
      setMessage("Pilih minimal satu hari latihan untuk murid.");
      return;
    }

    const invalidDay = enabledDays.find((day) => days[day.value].endTime <= days[day.value].startTime);
    if (invalidDay) {
      setMessage(`Jam pulang ${invalidDay.label} harus setelah jam masuk.`);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const existingSchedules = weeklySchedules.filter((schedule) => schedule.studentId === selectedStudentId);
      const existingByDay = new Map(existingSchedules.map((schedule) => [schedule.dayOfWeek, schedule]));
      const savedSchedules: ScheduleApiRow[] = [];

      for (const day of WEEK_DAYS) {
        const form = days[day.value];
        const existing = existingByDay.get(day.value);

        if (!form.enabled && existing) {
          await deleteSchedule(existing.id);
          continue;
        }

        if (!form.enabled) continue;

        const response = await fetch(existing ? `/api/schedules/${existing.id}` : "/api/schedules", {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: selectedStudentId,
            date: null,
            dayOfWeek: day.value,
            startTime: form.startTime,
            endTime: form.endTime,
            note: form.note
          })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Gagal menyimpan jadwal" }));
          throw new Error(error.error ?? "Gagal menyimpan jadwal");
        }

        const payload = (await response.json()) as { data: ScheduleApiRow };
        savedSchedules.push(payload.data);
      }

      setSchedules((current) => {
        const changedIds = new Set([...existingSchedules.map((schedule) => schedule.id), ...savedSchedules.map((schedule) => schedule.id)]);
        return [...current.filter((schedule) => !changedIds.has(schedule.id)), ...savedSchedules].sort((a, b) => `${a.student.name} ${a.dayOfWeek ?? 0}`.localeCompare(`${b.student.name} ${b.dayOfWeek ?? 0}`));
      });
      setMessage("Jadwal latihan mingguan tersimpan dan tersinkron ke absensi, coach, dan portal murid.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan jadwal");
    } finally {
      setSaving(false);
    }
  }

  async function clearStudentSchedules(studentId: string) {
    const studentSchedules = weeklySchedules.filter((schedule) => schedule.studentId === studentId);
    if (!studentSchedules.length) return;

    setSaving(true);
    setMessage("");
    try {
      for (const schedule of studentSchedules) {
        await deleteSchedule(schedule.id);
      }
      setSchedules((current) => current.filter((schedule) => !studentSchedules.some((item) => item.id === schedule.id)));
      setMessage("Jadwal mingguan murid dihapus.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus jadwal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <section className="rounded-md border bg-background">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b px-3 py-3">
          <div>
            <h2 className="text-sm font-semibold">Jadwal Latihan Mingguan</h2>
            <p className="text-xs text-muted-foreground">Atur hari dan jam latihan murid. Absensi otomatis membaca jadwal sesuai tanggal yang dipilih.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-7" placeholder="Cari murid, club, coach" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>

        {message ? <div className={cn("border-b px-3 py-2 text-xs", message.includes("tersimpan") || message.includes("dihapus") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{message}</div> : null}

        <div className="grid gap-3 border-b bg-slate-50/60 p-3 xl:grid-cols-[320px_1fr]">
          <div className="space-y-2">
            <label className="text-xs font-medium">Murid</label>
            <select className="h-9 w-full rounded-md border bg-white px-2 text-xs shadow-sm" value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
              <option value="">Pilih murid</option>
              {visibleStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.club.name}
                </option>
              ))}
            </select>
            {selectedStudent ? (
              <div className="rounded-md border bg-white px-3 py-2 text-xs">
                <p className="font-semibold">{selectedStudent.name}</p>
                <p className="mt-1 text-muted-foreground">{selectedStudent.club.name}</p>
                <p className="mt-1 text-muted-foreground">Coach: {studentCoachName(selectedStudent)}</p>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-md border bg-white">
            <div className="grid grid-cols-[92px_70px_1fr_1fr] gap-2 border-b bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase text-muted-foreground md:grid-cols-[110px_80px_150px_150px_1fr]">
              <span>Hari</span>
              <span>Aktif</span>
              <span>Jam Masuk</span>
              <span>Jam Pulang</span>
              <span className="hidden md:block">Catatan</span>
            </div>
            <div className="divide-y">
              {WEEK_DAYS.map((day) => {
                const form = days[day.value];

                return (
                  <div key={day.value} className="grid grid-cols-[92px_70px_1fr_1fr] gap-2 px-3 py-2 md:grid-cols-[110px_80px_150px_150px_1fr]">
                    <div className="flex items-center text-xs font-semibold">{day.label}</div>
                    <button
                      className={cn(
                        "flex h-8 w-14 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
                        form.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white text-slate-500"
                      )}
                      onClick={() => updateDay(day.value, { enabled: !form.enabled })}
                      type="button"
                    >
                      {form.enabled ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    </button>
                    <Input disabled={!form.enabled} type="time" value={form.startTime} onChange={(event) => updateDay(day.value, { startTime: event.target.value })} />
                    <Input disabled={!form.enabled} type="time" value={form.endTime} onChange={(event) => updateDay(day.value, { endTime: event.target.value })} />
                    <Input className="hidden md:block" disabled={!form.enabled} placeholder="Catatan" value={form.note} onChange={(event) => updateDay(day.value, { note: event.target.value })} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end border-t bg-slate-50 px-3 py-2">
              <Button onClick={saveSchedules} disabled={loading || saving || !selectedStudentId}>
                <Save className="h-3.5 w-3.5" />
                {saving ? "Menyimpan..." : "Simpan Jadwal"}
              </Button>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>Murid</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Jadwal Mingguan</TableHead>
              <TableHead className="w-40">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiblePageStudents.map((student) => {
              const studentSchedules = (schedulesByStudent.get(student.id) ?? []).sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0));

              return (
                <TableRow key={student.id}>
                  <TableCell className="h-12 font-medium">{student.name}</TableCell>
                  <TableCell className="h-12">
                    <BadgeStatus status={student.level} />
                  </TableCell>
                  <TableCell className="h-12">{studentCoachName(student, studentSchedules[0])}</TableCell>
                  <TableCell className="h-12">
                    {studentSchedules.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {studentSchedules.map((schedule) => (
                          <span key={schedule.id} className="inline-flex items-center gap-1 rounded-md border bg-slate-50 px-2 py-1 text-[11px]">
                            <CalendarClock className="h-3 w-3 text-muted-foreground" />
                            <span className="font-semibold">{dayLabel(schedule.dayOfWeek)}</span>
                            <span className="text-muted-foreground">
                              {schedule.startTime}-{schedule.endTime}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Belum ada jadwal</span>
                    )}
                  </TableCell>
                  <TableCell className="h-12">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => editStudent(student.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => clearStudentSchedules(student.id)} disabled={!studentSchedules.length || saving}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && !visibleStudents.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground">
                  Tidak ada murid sesuai pencarian.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Menampilkan {firstVisibleStudent}-{lastVisibleStudent} dari {visibleStudents.length} data
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
      </section>
    </div>
  );
}
