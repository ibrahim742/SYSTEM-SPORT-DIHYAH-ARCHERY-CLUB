"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Layers3 } from "lucide-react";

import { ProgressBar } from "@/components/progress-bar";
import { SectionBox } from "@/components/section-box";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { levelAccent, levelTone, softPill } from "@/lib/ui-styles";

type SportOption = { id: string; name: string };
type ProgramOption = { id: string; name: string; sportId: string; sportName: string; type: "LATIHAN" | "PERSIAPAN_TURNAMEN"; levelLabel: string; duration: string; materials: number };
type StudentOption = {
  id: string;
  name: string;
  clubName: string;
  sportId: string;
  sportName: string;
  levelLabel: string;
  progress: number;
  currentProgramId: string | null;
  currentProgramName: string | null;
  currentAssignmentStatus: string | null;
};
type AssignmentResponse = {
  data?: {
    studentId: string;
    programId: string;
    status: string;
    alreadyActive?: boolean;
    program?: {
      name: string;
    };
  };
  error?: string;
};
const PAGE_SIZE = 5;

export function AssignProgramForm({ programs, students, sports }: { programs: ProgramOption[]; students: StudentOption[]; sports: SportOption[] }) {
  const router = useRouter();
  const [studentRows, setStudentRows] = useState(students);
  const [sportId, setSportId] = useState(sports[0]?.id ?? programs[0]?.sportId ?? students[0]?.sportId ?? "");
  const filteredPrograms = useMemo(() => programs.filter((program) => !sportId || program.sportId === sportId), [programs, sportId]);
  const filteredStudents = useMemo(() => studentRows.filter((student) => !sportId || student.sportId === sportId), [studentRows, sportId]);
  const [programId, setProgramId] = useState(filteredPrograms[0]?.id ?? "");
  const [studentIds, setStudentIds] = useState<string[]>(filteredStudents.slice(0, 3).map((student) => student.id));
  const [programPage, setProgramPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const programPages = Math.max(1, Math.ceil(filteredPrograms.length / PAGE_SIZE));
  const studentPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const visiblePrograms = useMemo(() => filteredPrograms.slice((programPage - 1) * PAGE_SIZE, programPage * PAGE_SIZE), [filteredPrograms, programPage]);
  const visibleStudents = useMemo(() => filteredStudents.slice((studentPage - 1) * PAGE_SIZE, studentPage * PAGE_SIZE), [filteredStudents, studentPage]);

  useEffect(() => {
    setStudentRows(students);
  }, [students]);

  useEffect(() => {
    setProgramPage((current) => Math.min(current, programPages));
  }, [programPages]);

  useEffect(() => {
    setStudentPage((current) => Math.min(current, studentPages));
  }, [studentPages]);

  useEffect(() => {
    setProgramId((current) => (filteredPrograms.some((program) => program.id === current) ? current : filteredPrograms[0]?.id ?? ""));
    setStudentIds((current) => current.filter((studentId) => filteredStudents.some((student) => student.id === studentId)));
  }, [filteredPrograms, filteredStudents]);

  function selectSport(nextSportId: string) {
    setSportId(nextSportId);
    setProgramPage(1);
    setStudentPage(1);
    setMessage("");
  }

  function toggleStudent(studentId: string) {
    setStudentIds((current) => (current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]));
  }

  async function submit() {
    const program = programs.find((item) => item.id === programId);
    if (!program) {
      setMessage("Pilih program terlebih dahulu.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const responses = await Promise.all(
        studentIds.map((studentId) =>
          fetch("/api/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ programId, studentId })
          })
        )
      );

      const payloads = await Promise.all(responses.map((response) => response.json().catch(() => ({} as AssignmentResponse))));
      const failedIndex = responses.findIndex((response) => !response.ok);
      if (failedIndex >= 0) {
        setMessage(payloads[failedIndex]?.error ?? "Gagal assign program");
        return;
      }

      const alreadyActiveCount = payloads.filter((payload) => payload.data?.alreadyActive).length;
      const changedStudentIds = new Set(studentIds);
      setStudentRows((current) =>
        current.map((student) => {
          if (!changedStudentIds.has(student.id)) return student;

          return {
            ...student,
            currentProgramId: program.id,
            currentProgramName: program.name,
            currentAssignmentStatus: "AKTIF",
            progress: student.currentProgramId === program.id ? student.progress : 0
          };
        })
      );

      const assignedCount = studentIds.length - alreadyActiveCount;
      if (assignedCount > 0 && alreadyActiveCount > 0) {
        setMessage(`${assignedCount} murid berhasil menerima "${program.name}", ${alreadyActiveCount} murid sudah aktif sebelumnya.`);
      } else if (assignedCount > 0) {
        setMessage(`${assignedCount} murid berhasil menerima program "${program.name}".`);
      } else {
        setMessage(`Program "${program.name}" sudah aktif untuk murid yang dipilih.`);
      }

      router.refresh();
    } catch {
      setMessage("Gagal assign program. Periksa koneksi lalu coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <SectionBox title="Minat Olahraga" description="Pilih minat olahraga agar program dan murid yang tampil sesuai.">
        <div className="flex flex-wrap gap-2">
          {sports.map((sport) => {
            const programCount = programs.filter((program) => program.sportId === sport.id).length;
            const studentCount = studentRows.filter((student) => student.sportId === sport.id).length;
            return (
              <button
                key={sport.id}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors",
                  sportId === sport.id ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white text-slate-600 hover:bg-slate-50"
                )}
                onClick={() => selectSport(sport.id)}
                type="button"
              >
                <span>{sport.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {programCount} program · {studentCount} murid
                </span>
              </button>
            );
          })}
        </div>
      </SectionBox>
      <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <SectionBox title="Pilih Program" description="Program aktif yang bisa diberikan ke murid.">
          <div className="divide-y">
            {visiblePrograms.map((program) => (
              <label
                key={program.id}
                className={`flex cursor-pointer items-center gap-3 border-l-2 px-2 py-2 text-xs transition-colors hover:bg-slate-50/90 ${
                  programId === program.id ? levelAccent(program.levelLabel) : "border-l-transparent"
                }`}
              >
                <input checked={programId === program.id} name="program" type="radio" className="h-3.5 w-3.5 accent-slate-900" onChange={() => setProgramId(program.id)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{program.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-muted-foreground">
                    <span>{program.sportName}</span>
                    <span>{program.type === "PERSIAPAN_TURNAMEN" ? "Persiapan Turnamen" : "Latihan"}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3 text-sky-600" />
                      {program.duration}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Layers3 className="h-3 w-3 text-emerald-600" />
                      {program.materials} materi
                    </span>
                  </div>
                </div>
                <span className={softPill(levelTone(program.levelLabel))}>{program.levelLabel}</span>
              </label>
            ))}
          </div>
          {filteredPrograms.length > PAGE_SIZE ? (
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {Math.min((programPage - 1) * PAGE_SIZE + 1, filteredPrograms.length)}-{Math.min(programPage * PAGE_SIZE, filteredPrograms.length)} dari {filteredPrograms.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setProgramPage((current) => Math.max(1, current - 1))} disabled={programPage <= 1}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="min-w-12 text-center font-medium text-slate-700">
                  {programPage} / {programPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setProgramPage((current) => Math.min(programPages, current + 1))} disabled={programPage >= programPages}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : null}
        </SectionBox>

        <SectionBox title="Pilih Murid" description="Centang murid yang akan menerima program.">
          <div className="divide-y">
            {visibleStudents.map((student) => {
              const programAlreadyActive = student.currentProgramId === programId && student.currentAssignmentStatus === "AKTIF";
              const assignmentTone = programAlreadyActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : student.currentProgramName
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-slate-50 text-slate-600";

              return (
                <label
                  key={student.id}
                  className={`grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto_auto_minmax(86px,120px)] items-center gap-3 border-l-2 px-2 py-2 text-xs transition-colors hover:bg-slate-50/90 ${
                    studentIds.includes(student.id) ? levelAccent(student.levelLabel) : "border-l-transparent"
                  }`}
                >
                  <input checked={studentIds.includes(student.id)} type="checkbox" className="h-4 w-4 accent-emerald-600" onChange={() => toggleStudent(student.id)} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{student.name}</p>
                    <p className="truncate text-muted-foreground">{student.clubName} · {student.sportName}</p>
                    <p className="truncate text-[11px] text-slate-500">Program aktif: {student.currentProgramName ?? "-"}</p>
                  </div>
                  <span className={softPill(levelTone(student.levelLabel))}>{student.levelLabel}</span>
                  <span className={softPill(assignmentTone)}>{programAlreadyActive ? "Sudah aktif" : student.currentProgramName ? "Aktif lain" : "Belum"}</span>
                  <ProgressBar value={student.progress} className="min-w-0" />
                </label>
              );
            })}
          </div>
          {filteredStudents.length > PAGE_SIZE ? (
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {Math.min((studentPage - 1) * PAGE_SIZE + 1, filteredStudents.length)}-{Math.min(studentPage * PAGE_SIZE, filteredStudents.length)} dari {filteredStudents.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setStudentPage((current) => Math.max(1, current - 1))} disabled={studentPage <= 1}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="min-w-12 text-center font-medium text-slate-700">
                  {studentPage} / {studentPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setStudentPage((current) => Math.min(studentPages, current + 1))} disabled={studentPage >= studentPages}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : null}
        </SectionBox>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2 shadow-sm shadow-slate-200/50">
        <p className={message.startsWith("Gagal") || message.startsWith("Pilih") ? "text-xs text-red-700" : "text-xs text-emerald-700"}>{message}</p>
        <Button size="sm" onClick={submit} disabled={saving || !programId || studentIds.length === 0}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          {saving ? "Mengassign..." : "Assign Program"}
        </Button>
      </div>
    </div>
  );
}
