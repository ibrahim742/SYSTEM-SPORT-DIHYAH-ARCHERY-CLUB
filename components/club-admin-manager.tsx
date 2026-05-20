"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Edit2, Plus, Power, Save } from "lucide-react";

import { useActionDialog } from "@/components/action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentModal } from "@/components/content-modal";
import { Input } from "@/components/ui/input";

type Status = "ACTIVE" | "INACTIVE";

type ClubRow = {
  id: string;
  name: string;
  city: string | null;
  status: Status;
  coachCount: number;
  studentCount: number;
};

type FormState = {
  id?: string;
  name: string;
  city: string;
  status: Status;
};

const PAGE_SIZE = 5;
const emptyForm: FormState = { name: "", city: "", status: "ACTIVE" };

export function ClubAdminManager({ clubs }: { clubs: ClubRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { Dialog, confirm, notify } = useActionDialog();

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return clubs.filter((club) => `${club.name} ${club.city ?? ""} ${club.status}`.toLowerCase().includes(normalized));
  }, [clubs, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstVisibleRow = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleRow = Math.min(page * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  function openCreate() {
    setForm(emptyForm);
    setMessage("");
  }

  function openEdit(club: ClubRow) {
    setForm({
      id: club.id,
      name: club.name,
      city: club.city ?? "",
      status: club.status
    });
    setMessage("");
  }

  async function submit() {
    if (!form) return;
    setSaving(true);
    setMessage("");

    const response = await fetch(form.id ? `/api/clubs/${form.id}` : "/api/clubs", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        city: form.city || null,
        status: form.status
      })
    });

    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan club" }));
      setMessage(error.error ?? "Gagal menyimpan club");
      return;
    }

    setForm(null);
    router.refresh();
  }

  async function deactivate(club: ClubRow) {
    const approved = await confirm("Nonaktifkan club?", `Club ${club.name} akan dinonaktifkan dari pilihan data baru.`);
    if (!approved) return;

    const response = await fetch(`/api/clubs/${club.id}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menonaktifkan club" }));
      notify("Gagal menonaktifkan club", error.error ?? "Coba ulangi beberapa saat lagi.", "danger");
      return;
    }

    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">Club Coach</h2>
          <p className="text-xs text-muted-foreground">Kelola master club yang muncul di pilihan Club Coach.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="h-8 w-56" placeholder="Cari club" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Tambah Club
          </Button>
        </div>
      </div>

      <div className="w-full overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
              <th className="h-8 px-2">Nama Club</th>
              <th className="h-8 px-2">Kota</th>
              <th className="h-8 px-2">Coach</th>
              <th className="h-8 px-2">Murid</th>
              <th className="h-8 px-2">Status</th>
              <th className="h-8 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((club) => (
              <tr key={club.id} className="border-b hover:bg-slate-50/90">
                <td className="h-11 px-2 font-semibold">{club.name}</td>
                <td className="h-11 px-2">{club.city ?? "-"}</td>
                <td className="h-11 px-2">{club.coachCount}</td>
                <td className="h-11 px-2">{club.studentCount}</td>
                <td className="h-11 px-2">
                  <Badge variant={club.status === "ACTIVE" ? "green" : "red"}>{club.status === "ACTIVE" ? "Aktif" : "Nonaktif"}</Badge>
                </td>
                <td className="h-11 px-2">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(club)}>
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deactivate(club)}>
                      <Power className="h-3.5 w-3.5" />
                      Nonaktif
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!visibleRows.length ? (
              <tr>
                <td className="h-16 px-2 text-center text-xs text-muted-foreground" colSpan={6}>
                  Belum ada data club.
                </td>
              </tr>
            ) : null}
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
        <ContentModal className="max-w-xl">
          <div className="border-b px-3 py-2">
            <h3 className="text-sm font-semibold">{form.id ? "Edit Club" : "Tambah Club"}</h3>
            <p className="text-xs text-muted-foreground">Data ini dipakai sebagai pilihan Club Coach.</p>
          </div>
          <div className="grid gap-3 p-3 md:grid-cols-2">
            <label className="space-y-1 text-xs font-medium">
              Nama Club
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs font-medium">
              Kota
              <Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs font-medium md:col-span-2">
              Status
              <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </label>
            {message ? <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 md:col-span-2">{message}</p> : null}
          </div>
          <div className="flex justify-end gap-2 border-t px-3 py-2">
            <Button variant="outline" onClick={() => setForm(null)}>
              Batal
            </Button>
            <Button onClick={submit} disabled={saving || !form.name}>
              <Save className="h-3.5 w-3.5" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </ContentModal>
      ) : null}
      <Dialog />
    </section>
  );
}
