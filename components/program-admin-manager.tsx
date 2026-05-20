"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Edit2, Layers3, Plus, Power, Save, Search, Trash2 } from "lucide-react";

import { useActionDialog } from "@/components/action-dialog";
import { ContentModal } from "@/components/content-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { levelLabel } from "@/lib/labels";

type Level = "PENGENALAN" | "DASAR" | "LANJUTAN" | "PRESTASI";
type ProgramStatus = "ACTIVE" | "INACTIVE";
type ProgramType = "LATIHAN" | "PERSIAPAN_TURNAMEN";
type SportOption = { id: string; name: string };

type ProgramDetail = {
  id: string;
  day: string;
  material: string;
  set: string;
  reps: string;
  duration: string;
  note: string | null;
  order: number;
};

type ProgramRow = {
  id: string;
  slug: string;
  sportId: string;
  sportName: string;
  type: ProgramType;
  name: string;
  level: Level;
  duration: string;
  materials: number;
  intensity: string;
  description: string | null;
  status: ProgramStatus;
  editable?: boolean;
  details: ProgramDetail[];
};

type DetailForm = Omit<ProgramDetail, "id"> & { id?: string };

type ProgramForm = {
  id?: string;
  slug: string;
  sportId: string;
  type: ProgramType;
  name: string;
  level: Level;
  duration: string;
  intensity: string;
  description: string;
  status: ProgramStatus;
  details: DetailForm[];
};

const PAGE_SIZE = 5;

const emptyDetail: DetailForm = {
  day: "Hari 1",
  material: "",
  set: "3 set",
  reps: "10 reps",
  duration: "30 menit",
  note: "",
  order: 1
};

const emptyForm: ProgramForm = {
  slug: "",
  sportId: "",
  type: "LATIHAN",
  name: "",
  level: "DASAR",
  duration: "3 minggu",
  intensity: "Sedang",
  description: "",
  status: "ACTIVE",
  details: [{ ...emptyDetail }]
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function statusLabel(status: ProgramStatus) {
  return status === "ACTIVE" ? "Aktif" : "Nonaktif";
}

function typeLabel(type: ProgramType) {
  return type === "PERSIAPAN_TURNAMEN" ? "Persiapan Turnamen" : "Latihan";
}

function toForm(program: ProgramRow): ProgramForm {
  return {
    id: program.id,
    slug: program.slug,
    sportId: program.sportId,
    type: program.type,
    name: program.name,
    level: program.level,
    duration: program.duration,
    intensity: program.intensity,
    description: program.description ?? "",
    status: program.status,
    details: program.details.length
      ? program.details.map((detail) => ({
          id: detail.id,
          day: detail.day,
          material: detail.material,
          set: detail.set,
          reps: detail.reps,
          duration: detail.duration,
          note: detail.note ?? "",
          order: detail.order
        }))
      : [{ ...emptyDetail }]
  };
}

export function ProgramAdminManager({ programs, sports, canManage = true }: { programs: ProgramRow[]; sports: SportOption[]; canManage?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("SEMUA");
  const [typeFilter, setTypeFilter] = useState("SEMUA");
  const [levelFilter, setLevelFilter] = useState("SEMUA");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<ProgramForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { Dialog, confirm, notify } = useActionDialog();

  const filteredPrograms = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return programs.filter((program) => {
      const text = `${program.name} ${program.slug} ${program.intensity} ${program.details.map((detail) => detail.material).join(" ")}`.toLowerCase();
      const matchesQuery = text.includes(normalizedQuery);
      const matchesSport = sportFilter === "SEMUA" || program.sportId === sportFilter;
      const matchesType = typeFilter === "SEMUA" || program.type === typeFilter;
      const matchesLevel = levelFilter === "SEMUA" || program.level === levelFilter;
      const matchesStatus = statusFilter === "SEMUA" || program.status === statusFilter;

      return matchesQuery && matchesSport && matchesType && matchesLevel && matchesStatus;
    });
  }, [levelFilter, programs, query, sportFilter, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / PAGE_SIZE));
  const visiblePrograms = useMemo(() => filteredPrograms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredPrograms, page]);
  const firstVisibleRow = filteredPrograms.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleRow = Math.min(page * PAGE_SIZE, filteredPrograms.length);

  useEffect(() => {
    setPage(1);
  }, [levelFilter, query, sportFilter, statusFilter, typeFilter]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function updateForm(patch: Partial<ProgramForm>) {
    if (!form) return;
    setForm({ ...form, ...patch });
  }

  function updateDetail(index: number, patch: Partial<DetailForm>) {
    if (!form) return;
    setForm({
      ...form,
      details: form.details.map((detail, detailIndex) => (detailIndex === index ? { ...detail, ...patch } : detail))
    });
  }

  function addDetail() {
    if (!form) return;
    const nextOrder = form.details.length ? Math.max(...form.details.map((detail) => detail.order)) + 1 : 1;
    setForm({
      ...form,
      details: [...form.details, { ...emptyDetail, day: `Hari ${nextOrder}`, order: nextOrder }]
    });
  }

  function removeDetail(index: number) {
    if (!form || form.details.length <= 1) return;
    setForm({
      ...form,
      details: form.details.filter((_, detailIndex) => detailIndex !== index)
    });
  }

  async function submit() {
    if (!form) return;
    setSaving(true);
    setMessage("");

    const details = form.details
      .map((detail) => ({
        day: detail.day.trim(),
        material: detail.material.trim(),
        set: detail.set.trim(),
        reps: detail.reps.trim(),
        duration: detail.duration.trim(),
        note: detail.note?.trim() || null,
        order: Number(detail.order)
      }))
      .sort((left, right) => left.order - right.order);

    const payload = {
      slug: form.slug.trim() || slugify(form.name),
      sportId: form.sportId || sports[0]?.id,
      type: form.type,
      name: form.name.trim(),
      level: form.level,
      duration: form.duration.trim(),
      intensity: form.intensity.trim(),
      description: form.description.trim() || null,
      status: form.status,
      details
    };

    const response = await fetch(form.id ? `/api/programs/${form.id}` : "/api/programs", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan program" }));
      setMessage(error.error ?? "Gagal menyimpan program");
      return;
    }

    setForm(null);
    router.refresh();
  }

  async function deactivate(program: ProgramRow) {
    const approved = await confirm("Nonaktifkan program?", `Program ${program.name} akan disembunyikan dari data aktif.`);
    if (!approved) return;
    const response = await fetch(`/api/programs/${program.id}`, { method: "DELETE" });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menonaktifkan program" }));
      notify("Gagal menonaktifkan program", error.error ?? "Coba ulangi beberapa saat lagi.", "danger");
      return;
    }

    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r from-emerald-50/70 via-white to-sky-50/60 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">CRUD Program Latihan</h2>
          <p className="text-xs text-muted-foreground">Program disusun per cabang olahraga, termasuk materi persiapan turnamen.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-8 w-56 pl-7" placeholder="Cari program/materi" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <select className="h-8 w-40 rounded-md border bg-white px-2 text-xs" value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}>
            <option value="SEMUA">Semua Olahraga</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
          <select className="h-8 w-44 rounded-md border bg-white px-2 text-xs" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="SEMUA">Semua Program</option>
            <option value="LATIHAN">Latihan</option>
            <option value="PERSIAPAN_TURNAMEN">Persiapan Turnamen</option>
          </select>
          <select className="h-8 w-36 rounded-md border bg-white px-2 text-xs" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
            <option value="SEMUA">Semua Level</option>
            <option value="PENGENALAN">Pengenalan</option>
            <option value="DASAR">Dasar</option>
            <option value="LANJUTAN">Lanjutan</option>
            <option value="PRESTASI">Prestasi</option>
          </select>
          <select className="h-8 w-32 rounded-md border bg-white px-2 text-xs" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="SEMUA">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>
          {canManage ? (
            <Button size="sm" onClick={() => setForm({ ...emptyForm, sportId: sports[0]?.id ?? "" })}>
              <Plus className="h-3.5 w-3.5" />
              Tambah Program
            </Button>
          ) : null}
        </div>
      </div>

      <div className="w-full overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
              <th className="h-8 px-3">Program</th>
              <th className="h-8 px-3">Olahraga</th>
              <th className="h-8 px-3">Tipe</th>
              <th className="h-8 px-3">Level</th>
              <th className="h-8 px-3">Durasi</th>
              <th className="h-8 px-3">Materi</th>
              <th className="h-8 px-3">Intensitas</th>
              <th className="h-8 px-3">Status</th>
              <th className="h-8 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visiblePrograms.map((program) => (
              <tr key={program.id} className="border-b hover:bg-slate-50/90">
                <td className="h-12 px-3">
                  <p className="font-semibold">{program.name}</p>
                  <p className="text-[11px] text-muted-foreground">{program.slug}</p>
                </td>
                <td className="h-12 px-3">{program.sportName}</td>
                <td className="h-12 px-3">
                  <Badge variant={program.type === "PERSIAPAN_TURNAMEN" ? "amber" : "outline"}>{typeLabel(program.type)}</Badge>
                </td>
                <td className="h-12 px-3">
                  <Badge variant="outline">{levelLabel(program.level)}</Badge>
                </td>
                <td className="h-12 px-3">{program.duration}</td>
                <td className="h-12 px-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers3 className="h-3.5 w-3.5 text-emerald-600" />
                    {program.details.length} materi
                  </span>
                </td>
                <td className="h-12 px-3">{program.intensity}</td>
                <td className="h-12 px-3">
                  <Badge variant={program.status === "ACTIVE" ? "green" : "red"}>{statusLabel(program.status)}</Badge>
                </td>
                <td className="h-12 px-3">
                  <div className="flex justify-end gap-1">
                    {canManage && program.editable !== false ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setForm(toForm(program))}>
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setForm(toForm(program))}>
                          <Layers3 className="h-3.5 w-3.5" />
                          Kelola Materi
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deactivate(program)}>
                          <Power className="h-3.5 w-3.5" />
                          Nonaktif
                        </Button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!visiblePrograms.length ? (
              <tr>
                <td className="h-16 px-3 text-center text-xs text-muted-foreground" colSpan={9}>
                  Tidak ada program latihan yang cocok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
        <Layers3 className="h-3.5 w-3.5" />
        Data tampil maksimal 5 per halaman. Field materi disinkronkan dari jumlah timeline.
      </div>
      {filteredPrograms.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Menampilkan {firstVisibleRow}-{lastVisibleRow} dari {filteredPrograms.length} data
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
        <ContentModal className="max-w-5xl">
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
              <div>
                <h3 className="text-sm font-semibold">{form.id ? "Edit Program Latihan" : "Tambah Program Latihan"}</h3>
                <p className="text-xs text-muted-foreground">Isi master program dan minimal satu materi.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setForm(null)}>
                Tutup
              </Button>
            </div>

            <div className="max-h-[calc(100vh-11rem)] overflow-auto">
              <div className="grid gap-3 p-3 md:grid-cols-4">
              <label className="space-y-1 text-xs font-medium md:col-span-2">
                Nama Program
                <Input
                  value={form.name}
                  onChange={(event) =>
                    updateForm({
                      name: event.target.value,
                      slug: form.id || form.slug ? form.slug : slugify(event.target.value)
                    })
                  }
                />
              </label>
              <label className="space-y-1 text-xs font-medium md:col-span-2">
                Slug
                <Input value={form.slug} onChange={(event) => updateForm({ slug: slugify(event.target.value) })} placeholder="otomatis-dari-nama" />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Olahraga
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.sportId} onChange={(event) => updateForm({ sportId: event.target.value })}>
                  {sports.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                Tipe Program
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.type} onChange={(event) => updateForm({ type: event.target.value as ProgramType })}>
                  <option value="LATIHAN">Latihan</option>
                  <option value="PERSIAPAN_TURNAMEN">Persiapan Turnamen</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                Level
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.level} onChange={(event) => updateForm({ level: event.target.value as Level })}>
                  <option value="PENGENALAN">Pengenalan</option>
                  <option value="DASAR">Dasar</option>
                  <option value="LANJUTAN">Lanjutan</option>
                  <option value="PRESTASI">Prestasi</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                Durasi
                <Input value={form.duration} onChange={(event) => updateForm({ duration: event.target.value })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Intensitas
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.intensity} onChange={(event) => updateForm({ intensity: event.target.value })}>
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                Status
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.status} onChange={(event) => updateForm({ status: event.target.value as ProgramStatus })}>
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktif</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium md:col-span-4">
                Deskripsi
                <Textarea value={form.description} onChange={(event) => updateForm({ description: event.target.value })} />
              </label>
              </div>

              <div className="border-t px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-500">Materi / Timeline</h4>
                    <p className="text-xs text-muted-foreground">Jumlah materi otomatis menjadi {form.details.length}.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addDetail}>
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Materi
                  </Button>
                </div>
              </div>

              <div className="overflow-auto border-t">
                <table className="w-full min-w-[900px] text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
                      <th className="h-8 px-2">Urutan</th>
                      <th className="h-8 px-2">Hari</th>
                      <th className="h-8 px-2">Materi</th>
                      <th className="h-8 px-2">Set</th>
                      <th className="h-8 px-2">Reps</th>
                      <th className="h-8 px-2">Durasi</th>
                      <th className="h-8 px-2">Catatan</th>
                      <th className="h-8 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.details.map((detail, index) => (
                      <tr key={detail.id ?? index} className="border-b">
                        <td className="h-12 px-2">
                          <Input className="w-20" type="number" min={1} value={detail.order} onChange={(event) => updateDetail(index, { order: Number(event.target.value) })} />
                        </td>
                        <td className="h-12 px-2">
                          <Input value={detail.day} onChange={(event) => updateDetail(index, { day: event.target.value })} />
                        </td>
                        <td className="h-12 px-2">
                          <Input value={detail.material} onChange={(event) => updateDetail(index, { material: event.target.value })} />
                        </td>
                        <td className="h-12 px-2">
                          <Input value={detail.set} onChange={(event) => updateDetail(index, { set: event.target.value })} />
                        </td>
                        <td className="h-12 px-2">
                          <Input value={detail.reps} onChange={(event) => updateDetail(index, { reps: event.target.value })} />
                        </td>
                        <td className="h-12 px-2">
                          <Input value={detail.duration} onChange={(event) => updateDetail(index, { duration: event.target.value })} />
                        </td>
                        <td className="h-12 px-2">
                          <Input value={detail.note ?? ""} onChange={(event) => updateDetail(index, { note: event.target.value })} />
                        </td>
                        <td className="h-12 px-2 text-right">
                          <Button variant="outline" size="sm" onClick={() => removeDetail(index)} disabled={form.details.length <= 1}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {message ? <div className="border-t px-3 py-2 text-xs font-medium text-red-600">{message}</div> : null}

            <div className="flex justify-end gap-2 border-t bg-slate-50 px-3 py-2">
              <Button variant="outline" size="sm" onClick={() => setForm(null)}>
                Batal
              </Button>
              <Button size="sm" onClick={submit} disabled={saving}>
                <Save className="h-3.5 w-3.5" />
                {saving ? "Menyimpan..." : "Simpan Program"}
              </Button>
            </div>
        </ContentModal>
      ) : null}
      <Dialog />
    </section>
  );
}
