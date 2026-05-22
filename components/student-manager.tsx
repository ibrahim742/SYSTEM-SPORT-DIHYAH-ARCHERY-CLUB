"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Edit2, Eye, Plus, Power } from "lucide-react";

import { useActionDialog } from "@/components/action-dialog";
import { BadgeStatus } from "@/components/badge-status";
import { ContentModal } from "@/components/content-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { levelTone, softPill } from "@/lib/ui-styles";

type ClubOption = { id: string; name: string };
type SportOption = { id: string; name: string };
type CoachOption = { id: string; name: string; username: string; sportId: string; clubIds: string[] };
type StudentRow = {
  id: string;
  name: string;
  username: string;
  age: number;
  birthPlace: string | null;
  birthDate: string;
  clubId: string;
  clubName: string;
  sportId: string;
  sportName: string;
  coachId: string | null;
  coachName: string | null;
  branch: string;
  level: "PENGENALAN" | "DASAR" | "LANJUTAN" | "PRESTASI";
  levelLabel: string;
  phone: string;
  address: string | null;
  status: "AKTIF" | "PEMULIHAN" | "NONAKTIF";
  statusLabel: string;
};

type FormState = {
  id?: string;
  name: string;
  username: string;
  password: string;
  age: string;
  birthPlace: string;
  birthDate: string;
  clubId: string;
  sportId: string;
  coachId: string;
  branch: string;
  level: StudentRow["level"];
  phone: string;
  address: string;
  status: StudentRow["status"];
};

function usernameFromName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "");
}

function coachLabel(coach: CoachOption) {
  return coach.name?.trim() || coach.username;
}

function calculateAgeFromBirthDate(birthDate: string) {
  if (!birthDate) return "";

  const date = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 0 ? String(age) : "";
}

function ageForPayload(form: FormState) {
  return Number(calculateAgeFromBirthDate(form.birthDate) || form.age);
}

const PAGE_SIZE = 5;

export function StudentManager({ students, clubs, sports, coaches, canCreate }: { students: StudentRow[]; clubs: ClubOption[]; sports: SportOption[]; coaches: CoachOption[]; canCreate: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { Dialog, confirm, notify } = useActionDialog();

  const filtered = useMemo(
    () => students.filter((student) => `${student.name} ${student.clubName} ${student.sportName} ${student.coachName ?? ""} ${student.branch}`.toLowerCase().includes(query.toLowerCase())),
    [query, students]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleStudents = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const firstVisibleRow = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleRow = Math.min(page * PAGE_SIZE, filtered.length);
  const formClubId = form?.clubId ?? "";
  const formSportId = form?.sportId ?? "";
  const formCoachId = form?.coachId ?? "";
  const selectableCoaches = useMemo(
    () => (form ? coaches.filter((coach) => coach.sportId === formSportId && coach.clubIds.includes(formClubId)) : []),
    [coaches, form, formClubId, formSportId]
  );
  const currentCoach = useMemo(() => (formCoachId ? coaches.find((coach) => coach.id === formCoachId) : undefined), [coaches, formCoachId]);
  const currentCoachIsSelectable = Boolean(currentCoach && selectableCoaches.some((coach) => coach.id === currentCoach.id));
  const coachOptions = currentCoach && !currentCoachIsSelectable ? [currentCoach, ...selectableCoaches] : selectableCoaches;

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function openCreate() {
    setForm({
      name: "",
      username: "",
      password: "",
      age: "12",
      birthPlace: "",
      birthDate: "",
      clubId: clubs[0]?.id ?? "",
      sportId: sports[0]?.id ?? "",
      coachId: "",
      branch: "Recurve",
      level: "DASAR",
      phone: "",
      address: "",
      status: "AKTIF"
    });
    setMessage("");
  }

  async function submit() {
    if (!form) return;
    setSaving(true);
    setMessage("");
    const isEdit = Boolean(form.id);
    const payload = {
      name: form.name,
      username: form.username || usernameFromName(form.name),
      password: form.password,
      age: ageForPayload(form),
      birthPlace: form.birthPlace || null,
      birthDate: form.birthDate || null,
      clubId: form.clubId,
      sportId: form.sportId,
      coachId: form.coachId || null,
      branch: form.branch,
      level: form.level,
      phone: form.phone,
      address: form.address || null,
      status: form.status
    };

    const response = await fetch(isEdit ? `/api/students/${form.id}` : "/api/students", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { ...payload, password: form.password || undefined } : payload)
    });
    setSaving(false);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan murid" }));
      setMessage(error.error ?? "Gagal menyimpan murid");
      return;
    }

    setForm(null);
    router.refresh();
  }

  async function deactivate(student: StudentRow) {
    const approved = await confirm("Nonaktifkan murid?", `${student.name} akan masuk status nonaktif.`);
    if (!approved) return;
    const response = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menonaktifkan murid" }));
      notify("Gagal menonaktifkan murid", error.error ?? "Coba ulangi beberapa saat lagi.", "danger");
      return;
    }
    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">Data Murid</h2>
          <p className="text-xs text-muted-foreground">Kelola profil atlet dan status latihan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="h-8 w-56" placeholder="Cari murid" value={query} onChange={(event) => setQuery(event.target.value)} />
          {canCreate ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              Tambah Murid
            </Button>
          ) : null}
        </div>
      </div>

      <div className="w-full overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
              <th className="h-8 px-2">Nama</th>
              <th className="h-8 px-2">Umur</th>
              <th className="h-8 px-2">Club</th>
              <th className="h-8 px-2">Olahraga</th>
              <th className="h-8 px-2">Coach</th>
              <th className="h-8 px-2">Disiplin</th>
              <th className="h-8 px-2">Level</th>
              <th className="h-8 px-2">No WA</th>
              <th className="h-8 px-2">Status</th>
              <th className="h-8 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map((student) => (
              <tr key={student.id} className="border-b hover:bg-slate-50/90">
                <td className="h-10 px-2 font-medium">{student.name}</td>
                <td className="h-10 px-2">{student.age} th</td>
                <td className="h-10 px-2">{student.clubName}</td>
                <td className="h-10 px-2">{student.sportName}</td>
                <td className="h-10 px-2">{student.coachName ?? "-"}</td>
                <td className="h-10 px-2">{student.branch}</td>
                <td className="h-10 px-2">
                  <span className={softPill(levelTone(student.levelLabel))}>{student.levelLabel}</span>
                </td>
                <td className="h-10 px-2">{student.phone}</td>
                <td className="h-10 px-2">
                  <BadgeStatus status={student.statusLabel} />
                </td>
                <td className="h-10 px-2">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/murid/${student.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                        Detail
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setForm({
                          id: student.id,
                          name: student.name,
                          username: student.username,
                          password: "",
                          age: String(student.age),
                          birthPlace: student.birthPlace ?? "",
                          birthDate: student.birthDate,
                          clubId: student.clubId,
                          sportId: student.sportId,
                          coachId: student.coachId ?? "",
                          branch: student.branch,
                          level: student.level,
                          phone: student.phone,
                          address: student.address ?? "",
                          status: student.status
                        });
                        setMessage("");
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {canCreate ? (
                      <Button variant="outline" size="sm" onClick={() => deactivate(student)}>
                        <Power className="h-3.5 w-3.5" />
                        Nonaktif
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Menampilkan {firstVisibleRow}-{lastVisibleRow} dari {filtered.length} data
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
      ) : null}

      {form ? (
        <ContentModal className="max-w-2xl">
            <div className="border-b px-3 py-2">
              <h3 className="text-sm font-semibold">{form.id ? "Edit Murid" : "Tambah Murid"}</h3>
              <p className="text-xs text-muted-foreground">Tambah murid otomatis membuat akun login murid.</p>
            </div>
            <div className="grid gap-3 p-3 md:grid-cols-3">
              <label className="space-y-1 text-xs font-medium">
                Nama
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, username: form.id ? form.username : usernameFromName(event.target.value) })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Username
                <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                {form.id ? "Password Baru" : "Password"}
                <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={form.id ? "Kosongkan jika tidak diubah" : undefined} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Umur
                <Input value={calculateAgeFromBirthDate(form.birthDate) || form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} readOnly={Boolean(form.birthDate)} />
                {form.birthDate ? <p className="text-[11px] leading-4 text-muted-foreground">Umur otomatis dari tanggal lahir.</p> : null}
              </label>
              <label className="space-y-1 text-xs font-medium">
                Tempat Lahir
                <Input value={form.birthPlace} onChange={(event) => setForm({ ...form, birthPlace: event.target.value })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Tanggal Lahir
                <Input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value, age: calculateAgeFromBirthDate(event.target.value) || form.age })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Club
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.clubId} onChange={(event) => setForm({ ...form, clubId: event.target.value, coachId: "" })}>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                Cabang Olahraga
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.sportId} onChange={(event) => setForm({ ...form, sportId: event.target.value, coachId: "" })}>
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                Coach
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.coachId} onChange={(event) => setForm({ ...form, coachId: event.target.value })}>
                  <option value="">Belum dipilih</option>
                  {coachOptions.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coachLabel(coach)}
                      {currentCoach && coach.id === currentCoach.id && !currentCoachIsSelectable ? " (coach saat ini)" : ""}
                    </option>
                  ))}
                </select>
                {form.coachId && currentCoach && !currentCoachIsSelectable ? (
                  <p className="text-[11px] leading-4 text-amber-700">Coach saat ini tidak cocok dengan club atau cabang olahraga yang dipilih.</p>
                ) : null}
              </label>
              <label className="space-y-1 text-xs font-medium">
                Disiplin
                <Input value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Level
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value as StudentRow["level"] })}>
                  <option value="PENGENALAN">Pengenalan</option>
                  <option value="DASAR">Dasar</option>
                  <option value="LANJUTAN">Lanjutan</option>
                  <option value="PRESTASI">Prestasi</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                No WA
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Status
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StudentRow["status"] })}>
                  <option value="AKTIF">Aktif</option>
                  <option value="PEMULIHAN">Pemulihan</option>
                  <option value="NONAKTIF">Nonaktif</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium md:col-span-3">
                Alamat
                <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              </label>
              {message ? <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 md:col-span-3">{message}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t px-3 py-2">
              <Button variant="outline" onClick={() => setForm(null)}>
                Batal
              </Button>
              <Button onClick={submit} disabled={saving || !form.name || !form.username || !form.clubId || !form.sportId || !form.phone || (!form.id && !form.password)}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
        </ContentModal>
      ) : null}
      <Dialog />
    </section>
  );
}
