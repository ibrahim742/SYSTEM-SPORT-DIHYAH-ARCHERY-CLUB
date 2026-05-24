"use client";

import type { ElementType } from "react";
import { useEffect, useMemo, useState } from "react";
import { Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Clock3, FileClock, HeartPulse, LogOut, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";

import { BadgeStatus } from "@/components/badge-status";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { attendanceStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

type AttendanceStatus = "Belum" | "Hadir" | "Tidak Masuk" | "Izin" | "Sakit" | "Alpa";
type ApiAttendanceStatus = "HADIR" | "TIDAK_MASUK" | "IZIN" | "SAKIT" | "ALPA";

type StudentApiRow = {
  id: string;
  name: string;
  status: "AKTIF" | "PEMULIHAN" | "NONAKTIF";
  club: { name: string };
};

type ScheduleApiRow = {
  id: string;
  studentId: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
  student: {
    id: string;
    name: string;
    status: "AKTIF" | "PEMULIHAN" | "NONAKTIF";
    club: { name: string };
    coach?: { name: string | null; username: string } | null;
  };
  coach: { name: string | null; username: string } | null;
};

type AttendanceRecordApi = {
  studentId: string;
  status: ApiAttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  student: { name: string };
};

type AttendanceSessionApi = {
  id: string;
  date: string;
  title: string;
  records: AttendanceRecordApi[];
};

type AttendanceRow = {
  studentId: string;
  name: string;
  clubName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  scheduleId: string;
  scheduleTime: string;
};

const statusOptions: Array<{ status: AttendanceStatus; icon: ElementType }> = [
  { status: "Hadir", icon: Check },
  { status: "Tidak Masuk", icon: X },
  { status: "Izin", icon: FileClock },
  { status: "Sakit", icon: HeartPulse }
];
const PAGE_SIZE = 5;

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function currentTime() {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .format(new Date())
    .replace(".", ":");
}

function statusButtonClass(active: boolean, status: AttendanceStatus) {
  if (!active) return "text-slate-500 hover:bg-white hover:text-slate-900";
  if (status === "Hadir") return "bg-emerald-600 text-white shadow-sm";
  if (status === "Izin" || status === "Sakit") return "bg-amber-500 text-white shadow-sm";
  return "bg-red-600 text-white shadow-sm";
}

function rowToneClass(status: AttendanceStatus) {
  if (status === "Belum") return "border-l-2 border-l-slate-300 bg-white";
  if (status === "Hadir") return "border-l-2 border-l-emerald-500 bg-emerald-50/25";
  if (status === "Izin" || status === "Sakit") return "border-l-2 border-l-amber-400 bg-amber-50/20";
  return "border-l-2 border-l-red-500 bg-red-50/20";
}

function checkoutButtonClass(canCheckout: boolean, checkedOut: boolean) {
  if (!canCheckout) return "cursor-not-allowed text-slate-300";
  if (checkedOut) return "bg-sky-600 text-white shadow-sm";
  return "text-slate-500 hover:bg-white hover:text-slate-900";
}

function toApiStatus(status: AttendanceStatus): ApiAttendanceStatus {
  if (status === "Hadir") return "HADIR";
  if (status === "Izin") return "IZIN";
  if (status === "Sakit") return "SAKIT";
  if (status === "Alpa") return "ALPA";
  return "TIDAK_MASUK";
}

function buildRows(schedules: ScheduleApiRow[], session: AttendanceSessionApi | undefined, selectedDate: string): AttendanceRow[] {
  const recordsByStudentId = new Map(session?.records.map((record) => [record.studentId, record]));

  return schedules
    .filter((schedule) => dateKey(schedule.date) === selectedDate && schedule.student.status !== "NONAKTIF")
    .map((schedule) => {
      const record = recordsByStudentId.get(schedule.studentId);

      return {
        studentId: schedule.studentId,
        name: schedule.student.name,
        clubName: schedule.student.club.name,
        date: selectedDate,
        checkIn: record?.checkIn ?? "-",
        checkOut: record?.checkOut ?? "-",
        status: record ? (attendanceStatusLabel(record.status) as AttendanceStatus) : "Belum",
        scheduleId: schedule.id,
        scheduleTime: `${schedule.startTime}-${schedule.endTime}`
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function findSessionByDate(sessions: AttendanceSessionApi[], selectedDate: string) {
  return sessions.find((session) => dateKey(session.date) === selectedDate);
}

export default function AttendancePage() {
  const [students, setStudents] = useState<StudentApiRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleApiRow[]>([]);
  const [sessions, setSessions] = useState<AttendanceSessionApi[]>([]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [scheduleForm, setScheduleForm] = useState({ studentId: "", date: "", startTime: "15:30", endTime: "17:30", note: "" });
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "semua">("semua");
  const [page, setPage] = useState(1);
  const [recapPage, setRecapPage] = useState(1);
  const [recapOpen, setRecapOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setMessage("");

      const [attendanceResponse, studentsResponse, schedulesResponse] = await Promise.all([fetch("/api/attendance"), fetch("/api/students"), fetch("/api/schedules")]);
      if (!attendanceResponse.ok || !studentsResponse.ok || !schedulesResponse.ok) {
        setLoading(false);
        setMessage("Gagal memuat sinkronisasi data murid.");
        return;
      }

      const [attendancePayload, studentsPayload, schedulesPayload] = (await Promise.all([attendanceResponse.json(), studentsResponse.json(), schedulesResponse.json()])) as [
        { data?: AttendanceSessionApi[] },
        { data?: StudentApiRow[] },
        { data?: ScheduleApiRow[] }
      ];
      const nextSessions = attendancePayload.data ?? [];
      const nextStudents = studentsPayload.data ?? [];
      const nextSchedules = schedulesPayload.data ?? [];
      const nextDate = isoToday();

      setSessions(nextSessions);
      setStudents(nextStudents);
      setSchedules(nextSchedules);
      setSelectedDate(nextDate);
      setScheduleForm((current) => ({ ...current, studentId: nextStudents[0]?.id ?? "", date: nextDate }));
      setLoading(false);
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const session = findSessionByDate(sessions, selectedDate);
    setSessionId(session?.id ?? null);
    setRows(buildRows(schedules, session, selectedDate));
    setScheduleForm((current) => ({ ...current, date: selectedDate || current.date }));
  }, [selectedDate, schedules, sessions]);

  const summary = useMemo(() => {
    const count = (status: AttendanceStatus) => rows.filter((row) => row.status === status).length;

    return [
      { label: "Total", value: rows.length },
      { label: "Belum Diisi", value: count("Belum") },
      { label: "Hadir", value: count("Hadir") },
      { label: "Tidak Masuk", value: count("Tidak Masuk") + count("Alpa") },
      { label: "Izin", value: count("Izin") },
      { label: "Sakit", value: count("Sakit") }
    ];
  }, [rows]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesQuery = `${row.name} ${row.clubName}`.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === "semua" || row.status === statusFilter || (statusFilter === "Tidak Masuk" && row.status === "Alpa");
        return matchesQuery && matchesStatus;
      }),
    [query, rows, statusFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = useMemo(() => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredRows, page]);
  const firstVisibleRow = filteredRows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleRow = Math.min(page * PAGE_SIZE, filteredRows.length);

  useEffect(() => {
    setPage(1);
  }, [query, selectedDate, statusFilter]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const recapRows = useMemo(() => {
    const historicalRows = sessions.flatMap((session) =>
      dateKey(session.date) === selectedDate
        ? []
        : session.records.map((record) => ({
            studentId: record.studentId,
            status: attendanceStatusLabel(record.status) as AttendanceStatus
          }))
    );
    const liveRows = rows.map((row) => ({ studentId: row.studentId, status: row.status }));
    const allRows = [...historicalRows, ...liveRows];

    return students
      .filter((student) => student.status !== "NONAKTIF")
      .map((student) => {
        const statuses = allRows.filter((row) => row.studentId === student.id).map((row) => row.status);
        const hadir = statuses.filter((status) => status === "Hadir").length;
        const izin = statuses.filter((status) => status === "Izin").length;
        const sakit = statuses.filter((status) => status === "Sakit").length;
        const tidakMasuk = statuses.filter((status) => status === "Tidak Masuk" || status === "Alpa").length;
        const total = statuses.filter((status) => status !== "Belum").length;

        return {
          name: student.name,
          club: student.club.name,
          hadir,
          izin,
          sakit,
          tidakMasuk,
          attendance: total ? Math.round((hadir / total) * 100) : 0
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, selectedDate, sessions, students]);
  const recapPages = Math.max(1, Math.ceil(recapRows.length / PAGE_SIZE));
  const visibleRecapRows = useMemo(() => recapRows.slice((recapPage - 1) * PAGE_SIZE, recapPage * PAGE_SIZE), [recapPage, recapRows]);
  const firstVisibleRecap = recapRows.length ? (recapPage - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleRecap = Math.min(recapPage * PAGE_SIZE, recapRows.length);
  const selectedDateSchedules = useMemo(
    () => schedules.filter((schedule) => dateKey(schedule.date) === selectedDate).sort((a, b) => `${a.startTime} ${a.student.name}`.localeCompare(`${b.startTime} ${b.student.name}`)),
    [schedules, selectedDate]
  );

  useEffect(() => {
    setRecapPage((current) => Math.min(current, recapPages));
  }, [recapPages]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRows((current) =>
      current.map((row) => {
        if (row.studentId !== studentId) return row;
        const isPresent = status === "Hadir";

        return {
          ...row,
          status,
          checkIn: isPresent ? (row.checkIn === "-" ? currentTime() : row.checkIn) : "-",
          checkOut: isPresent ? row.checkOut : "-"
        };
      })
    );
  }

  function setCheckout(studentId: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.studentId !== studentId || row.status !== "Hadir") return row;
        const time = currentTime();

        return {
          ...row,
          checkIn: row.checkIn === "-" ? time : row.checkIn,
          checkOut: time
        };
      })
    );
  }

  function setAllPresent() {
    setRows((current) =>
      current.map((row) => ({
        ...row,
        status: "Hadir" as AttendanceStatus,
        checkIn: row.checkIn === "-" ? currentTime() : row.checkIn
      }))
    );
  }

  function setAllCheckout() {
    setRows((current) => {
      const time = currentTime();

      return current.map((row) =>
        row.status === "Hadir"
          ? {
              ...row,
              checkIn: row.checkIn === "-" ? time : row.checkIn,
              checkOut: time
            }
          : row
      );
    });
  }

  async function saveSchedule() {
    if (!scheduleForm.studentId || !scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime) {
      setMessage("Lengkapi murid, tanggal, jam masuk, dan jam pulang jadwal.");
      return;
    }

    setScheduleSaving(true);
    setMessage("");
    const response = await fetch(editingScheduleId ? `/api/schedules/${editingScheduleId}` : "/api/schedules", {
      method: editingScheduleId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scheduleForm)
    });
    setScheduleSaving(false);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan jadwal" }));
      setMessage(error.error ?? "Gagal menyimpan jadwal");
      return;
    }

    const payload = (await response.json()) as { data: ScheduleApiRow };
    setSchedules((current) => [payload.data, ...current.filter((schedule) => schedule.id !== payload.data.id)].sort((a, b) => `${dateKey(b.date)} ${b.startTime}`.localeCompare(`${dateKey(a.date)} ${a.startTime}`)));
    setSelectedDate(dateKey(payload.data.date));
    setEditingScheduleId(null);
    setMessage("Jadwal latihan tersimpan dan tersinkron ke absensi.");
  }

  function editSchedule(schedule: ScheduleApiRow) {
    setEditingScheduleId(schedule.id);
    setScheduleForm({
      studentId: schedule.studentId,
      date: dateKey(schedule.date),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      note: schedule.note ?? ""
    });
  }

  function cancelEditSchedule() {
    setEditingScheduleId(null);
    setScheduleForm((current) => ({ ...current, studentId: students[0]?.id ?? "", date: selectedDate, startTime: "15:30", endTime: "17:30", note: "" }));
  }

  async function deleteSchedule(scheduleId: string) {
    setMessage("");
    const response = await fetch(`/api/schedules/${scheduleId}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menghapus jadwal" }));
      setMessage(error.error ?? "Gagal menghapus jadwal");
      return;
    }

    setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId));
    setRows((current) => current.filter((row) => row.scheduleId !== scheduleId));
    setMessage("Jadwal latihan dihapus.");
  }

  async function saveAttendance() {
    if (!selectedDate) return;
    const filledRows = rows.filter((row) => row.status !== "Belum");
    if (!filledRows.length) {
      setMessage("Pilih status minimal satu murid yang dijadwalkan sebelum menyimpan.");
      return;
    }

    setSaving(true);
    setMessage("");
    const response = await fetch(sessionId ? `/api/attendance/${sessionId}` : "/api/attendance", {
      method: sessionId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedDate,
        title: "Sesi Sore",
        records: filledRows.map((row) => ({
          studentId: row.studentId,
          status: toApiStatus(row.status),
          checkIn: row.checkIn === "-" ? null : row.checkIn,
          checkOut: row.checkOut === "-" ? null : row.checkOut
        }))
      })
    });
    setSaving(false);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan absensi" }));
      setMessage(error.error ?? "Gagal menyimpan absensi");
      return;
    }

    const payload = (await response.json()) as { data: AttendanceSessionApi };
    const savedSession = payload.data;
    setSessions((current) => [savedSession, ...current.filter((session) => session.id !== savedSession.id)].sort((a, b) => b.date.localeCompare(a.date)));
    setMessage("Absensi tersimpan dan tersinkron dengan data murid.");
  }

  return (
    <div className="space-y-3">
      <section className="rounded-md border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div>
            <h2 className="text-sm font-semibold">Jadwal Latihan</h2>
            <p className="text-xs text-muted-foreground">Buat jadwal murid, lalu absensi hanya menampilkan murid sesuai tanggal jadwal.</p>
          </div>
        </div>
        <div className="grid gap-2 border-b bg-slate-50/60 px-3 py-2 lg:grid-cols-[minmax(180px,1fr)_140px_120px_120px_minmax(180px,1fr)_auto]">
          <select className="h-10 rounded-md border bg-white px-2 text-sm" value={scheduleForm.studentId} onChange={(event) => setScheduleForm({ ...scheduleForm, studentId: event.target.value })}>
            <option value="">Pilih murid</option>
            {students
              .filter((student) => student.status !== "NONAKTIF")
              .map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.club.name}
                </option>
              ))}
          </select>
          <Input type="date" value={scheduleForm.date} onChange={(event) => setScheduleForm({ ...scheduleForm, date: event.target.value })} />
          <Input type="time" value={scheduleForm.startTime} onChange={(event) => setScheduleForm({ ...scheduleForm, startTime: event.target.value })} />
          <Input type="time" value={scheduleForm.endTime} onChange={(event) => setScheduleForm({ ...scheduleForm, endTime: event.target.value })} />
          <Input placeholder="Catatan jadwal" value={scheduleForm.note} onChange={(event) => setScheduleForm({ ...scheduleForm, note: event.target.value })} />
          <Button size="sm" onClick={saveSchedule} disabled={scheduleSaving || loading}>
            <Plus className="h-3.5 w-3.5" />
            {scheduleSaving ? "Menyimpan..." : editingScheduleId ? "Simpan Jadwal" : "Tambah Jadwal"}
          </Button>
          {editingScheduleId ? (
            <Button variant="outline" size="sm" onClick={cancelEditSchedule}>
              Batal
            </Button>
          ) : null}
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>Murid</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jam Masuk</TableHead>
              <TableHead>Jam Pulang</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead className="w-36">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedDateSchedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell className="h-10 font-medium">{schedule.student.name}</TableCell>
                <TableCell className="h-10">{dateKey(schedule.date)}</TableCell>
                <TableCell className="h-10">{schedule.startTime}</TableCell>
                <TableCell className="h-10">{schedule.endTime}</TableCell>
                <TableCell className="h-10">{schedule.coach?.name ?? schedule.coach?.username ?? schedule.student.coach?.name ?? schedule.student.coach?.username ?? "-"}</TableCell>
                <TableCell className="h-10">{schedule.note ?? "-"}</TableCell>
                <TableCell className="h-10">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => editSchedule(schedule)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteSchedule(schedule.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && selectedDateSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-16 text-center text-xs text-muted-foreground">
                  Belum ada jadwal latihan pada tanggal ini.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-md border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div>
            <h2 className="text-sm font-semibold">Absensi</h2>
            <p className="text-xs text-muted-foreground">Pilih status kehadiran per murid untuk sesi latihan harian.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input className="w-full sm:w-36" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-7" placeholder="Cari murid" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <select className="h-10 w-full rounded-md border bg-white px-2 text-sm sm:w-36" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AttendanceStatus | "semua")}>
              <option value="semua">Semua</option>
              <option value="Belum">Belum Diisi</option>
              <option value="Hadir">Hadir</option>
              <option value="Tidak Masuk">Tidak Masuk</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
            </select>
            <Button size="sm" onClick={saveAttendance} disabled={saving || loading || rows.length === 0}>
              <Save className="h-3.5 w-3.5" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>

        {message ? <div className={cn("border-b px-3 py-2 text-xs", message.includes("tersimpan") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{message}</div> : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/35 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {summary.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={setAllCheckout} disabled={loading || rows.every((row) => row.status !== "Hadir")}>
              <LogOut className="h-3.5 w-3.5" />
              Checkout Semua Hadir
            </Button>
            <Button variant="outline" size="sm" onClick={setAllPresent} disabled={loading || rows.length === 0}>
              <CheckCheck className="h-3.5 w-3.5" />
              Tandai Semua Hadir
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>Nama</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jadwal</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-[430px]">Aksi Kehadiran</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={`${row.studentId}-${row.date}`} className={cn("hover:bg-slate-50/80", rowToneClass(row.status))}>
                <TableCell className="h-12 whitespace-nowrap font-medium">{row.name}</TableCell>
                <TableCell className="h-12 whitespace-nowrap text-slate-600">{row.date}</TableCell>
                <TableCell className="h-12 whitespace-nowrap text-slate-600">{row.scheduleTime}</TableCell>
                <TableCell className="h-12 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    {row.checkIn !== "-" ? <Clock3 className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                    {row.checkIn}
                  </span>
                </TableCell>
                <TableCell className="h-12 whitespace-nowrap text-slate-600">{row.checkOut}</TableCell>
                <TableCell className="h-12 whitespace-nowrap">
                  <BadgeStatus status={row.status === "Belum" ? "Belum Diisi" : row.status} />
                </TableCell>
                <TableCell className="h-12">
                  <div className="inline-flex rounded-md border bg-slate-50 p-0.5 shadow-inner shadow-slate-200/70">
                    {statusOptions.map(({ status, icon: Icon }) => (
                      <button
                        key={status}
                        className={cn(
                          "inline-flex h-8 min-w-[58px] items-center justify-center gap-1 rounded px-2 text-[11px] font-semibold transition-colors",
                          status === "Tidak Masuk" && "min-w-[92px]",
                          statusButtonClass(row.status === status || (status === "Tidak Masuk" && row.status === "Alpa"), status)
                        )}
                        onClick={() => setStatus(row.studentId, status)}
                        type="button"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {status}
                      </button>
                    ))}
                    <button
                      className={cn(
                        "inline-flex h-8 min-w-[94px] items-center justify-center gap-1 rounded px-2 text-[11px] font-semibold transition-colors",
                        checkoutButtonClass(row.status === "Hadir", row.checkOut !== "-")
                      )}
                      disabled={row.status !== "Hadir"}
                      onClick={() => setCheckout(row.studentId)}
                      type="button"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {row.checkOut === "-" ? "Checkout" : row.checkOut}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-xs text-muted-foreground">
                  Tidak ada murid sesuai filter atau belum ada jadwal pada tanggal ini.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Menampilkan {firstVisibleRow}-{lastVisibleRow} dari {filteredRows.length} data
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

      <section className="rounded-md border bg-background">
        <button
          aria-expanded={recapOpen}
          className="flex h-10 w-full items-center justify-between gap-3 px-3 text-left transition-colors hover:bg-muted/50"
          onClick={() => setRecapOpen((open) => !open)}
          type="button"
        >
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">Rekap Absensi Murid</h2>
            <p className="truncate text-xs text-muted-foreground">Buka untuk melihat rekap kehadiran per murid</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Periode berjalan</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", recapOpen && "rotate-180")} />
          </div>
        </button>

        {recapOpen ? (
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nama Murid</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Hadir</TableHead>
                  <TableHead>Izin</TableHead>
                  <TableHead>Sakit</TableHead>
                  <TableHead>Tidak Masuk</TableHead>
                  <TableHead>Kehadiran %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRecapRows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="h-10 font-medium">{row.name}</TableCell>
                    <TableCell className="h-10">{row.club}</TableCell>
                    <TableCell className="h-10">{row.hadir}</TableCell>
                    <TableCell className="h-10">{row.izin}</TableCell>
                    <TableCell className="h-10">{row.sakit}</TableCell>
                    <TableCell className="h-10">{row.tidakMasuk}</TableCell>
                    <TableCell className="h-10">
                      <ProgressBar value={row.attendance} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {recapRows.length > PAGE_SIZE ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
                <span>
                  Menampilkan {firstVisibleRecap}-{lastVisibleRecap} dari {recapRows.length} data
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRecapPage((current) => Math.max(1, current - 1))} disabled={recapPage <= 1}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Sebelumnya
                  </Button>
                  <span className="min-w-16 text-center font-medium text-slate-700">
                    {recapPage} / {recapPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setRecapPage((current) => Math.min(recapPages, current + 1))} disabled={recapPage >= recapPages}>
                    Berikutnya
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
