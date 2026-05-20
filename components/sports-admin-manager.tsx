"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Edit2, Plus, Power, Save, Tag, Trophy } from "lucide-react";

import { useActionDialog } from "@/components/action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentModal } from "@/components/content-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Status = "ACTIVE" | "INACTIVE";
type Tab = "sports" | "categories";

type SportRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  status: Status;
  coachCount: number;
  studentCount: number;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: Status;
  coachCount: number;
};

type FormState = {
  id?: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  status: Status;
};

const PAGE_SIZE = 5;
const emptyForm: FormState = { name: "", slug: "", icon: "", description: "", status: "ACTIVE" };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function SportsAdminManager({ sports, categories }: { sports: SportRow[]; categories: CategoryRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("sports");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { Dialog, confirm, notify } = useActionDialog();

  const rows = tab === "sports" ? sports : categories;
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return rows.filter((row) => `${row.name} ${row.slug} ${row.description ?? ""}`.toLowerCase().includes(normalized));
  }, [query, rows]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstVisibleRow = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleRow = Math.min(page * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
    setForm(null);
    setMessage("");
  }, [tab]);

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

  function openEdit(row: SportRow | CategoryRow) {
    setForm({
      id: row.id,
      name: row.name,
      slug: row.slug,
      icon: "icon" in row ? row.icon ?? "" : "",
      description: row.description ?? "",
      status: row.status
    });
    setMessage("");
  }

  async function submit() {
    if (!form) return;
    setSaving(true);
    setMessage("");

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      status: form.status,
      ...(tab === "sports" ? { icon: form.icon || null } : {})
    };
    const baseUrl = tab === "sports" ? "/api/sports" : "/api/coach-categories";
    const response = await fetch(form.id ? `${baseUrl}/${form.id}` : baseUrl, {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan data" }));
      setMessage(error.error ?? "Gagal menyimpan data");
      return;
    }

    setForm(null);
    router.refresh();
  }

  async function deactivate(row: SportRow | CategoryRow) {
    const label = tab === "sports" ? "cabang olahraga" : "kategori coach";
    const approved = await confirm("Nonaktifkan data?", `${label} ${row.name} akan dinonaktifkan.`);
    if (!approved) return;

    const baseUrl = tab === "sports" ? "/api/sports" : "/api/coach-categories";
    const response = await fetch(`${baseUrl}/${row.id}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menonaktifkan data" }));
      notify("Gagal menonaktifkan data", error.error ?? "Coba ulangi beberapa saat lagi.", "danger");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      <section className="rounded-md border bg-background shadow-sm shadow-slate-200/60">
        <div className="border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2">
          <h2 className="text-sm font-semibold">Cabang Olahraga</h2>
          <p className="text-xs text-muted-foreground">Kelola master cabang olahraga dan kategori coach.</p>
        </div>
        <div className="flex flex-wrap gap-2 px-3 py-2 text-xs">
          <button className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-medium ${tab === "sports" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white text-slate-600"}`} onClick={() => setTab("sports")} type="button">
            <Trophy className="h-3.5 w-3.5" />
            Cabang Olahraga
          </button>
          <button className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-medium ${tab === "categories" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white text-slate-600"}`} onClick={() => setTab("categories")} type="button">
            <Tag className="h-3.5 w-3.5" />
            Kategori Coach
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div>
            <h3 className="text-sm font-semibold">{tab === "sports" ? "Data Cabang Olahraga" : "Data Kategori Coach"}</h3>
            <p className="text-xs text-muted-foreground">Data tampil maksimal 5 per halaman.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input className="h-8 w-56" placeholder="Cari data" value={query} onChange={(event) => setQuery(event.target.value)} />
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              {tab === "sports" ? "Tambah Cabang" : "Tambah Kategori"}
            </Button>
          </div>
        </div>

        <div className="w-full overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
                <th className="h-8 px-2">Nama</th>
                <th className="h-8 px-2">Slug</th>
                {tab === "sports" ? <th className="h-8 px-2">Icon</th> : null}
                <th className="h-8 px-2">Coach</th>
                {tab === "sports" ? <th className="h-8 px-2">Murid</th> : null}
                <th className="h-8 px-2">Status</th>
                <th className="h-8 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="border-b hover:bg-slate-50/90">
                  <td className="h-11 px-2">
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-[11px] text-muted-foreground">{row.description ?? "-"}</p>
                  </td>
                  <td className="h-11 px-2">{row.slug}</td>
                  {tab === "sports" ? <td className="h-11 px-2">{(row as SportRow).icon ?? "-"}</td> : null}
                  <td className="h-11 px-2">{row.coachCount}</td>
                  {tab === "sports" ? <td className="h-11 px-2">{(row as SportRow).studentCount}</td> : null}
                  <td className="h-11 px-2">
                    <Badge variant={row.status === "ACTIVE" ? "green" : "red"}>{row.status === "ACTIVE" ? "Aktif" : "Nonaktif"}</Badge>
                  </td>
                  <td className="h-11 px-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deactivate(row)}>
                        <Power className="h-3.5 w-3.5" />
                        Nonaktif
                      </Button>
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
      </section>

      {form ? (
        <ContentModal className="max-w-xl">
            <div className="border-b px-3 py-2">
              <h3 className="text-sm font-semibold">{form.id ? "Edit Data" : "Tambah Data"}</h3>
              <p className="text-xs text-muted-foreground">{tab === "sports" ? "Master cabang olahraga." : "Master kategori coach."}</p>
            </div>
            <div className="grid gap-3 p-3 md:grid-cols-2">
              <label className="space-y-1 text-xs font-medium">
                Nama
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: form.id || form.slug ? form.slug : slugify(event.target.value) })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Slug
                <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} />
              </label>
              {tab === "sports" ? (
                <label className="space-y-1 text-xs font-medium">
                  Icon
                  <Input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} placeholder="target, gloves, ball" />
                </label>
              ) : null}
              <label className="space-y-1 text-xs font-medium">
                Status
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })}>
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktif</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium md:col-span-2">
                Deskripsi
                <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
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
    </div>
  );
}
