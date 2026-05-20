"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Edit2, ImageIcon, Plus, Power, Save, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentModal } from "@/components/content-modal";
import { useActionDialog } from "@/components/action-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_LABEL, uploadHelpText } from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
import type { LandingContent, LandingItemView, LandingSectionKey, LandingSectionView } from "@/lib/landing";

type Status = "ACTIVE" | "INACTIVE";
type UploadTarget = { type: "section" } | { type: "item" };

const tabs: Array<{ key: LandingSectionKey; label: string; items: boolean }> = [
  { key: "hero", label: "Hero", items: true },
  { key: "features", label: "Features", items: true },
  { key: "gallery", label: "Galeri", items: true },
  { key: "coaches", label: "Coach", items: false },
  { key: "sports", label: "Sports", items: true },
  { key: "statistics", label: "Statistics", items: true },
  { key: "cta", label: "CTA", items: false },
  { key: "footer", label: "Footer", items: true }
];

const iconOptions = ["ShieldCheck", "Target", "CalendarCheck", "ClipboardCheck", "TrendingUp", "Trophy", "Users", "ListChecks", "Dumbbell", "Mail", "MapPin", "LogIn", "BarChart3"];

type SectionFieldConfig = {
  ctaHref?: boolean;
  ctaLabel?: boolean;
  eyebrow?: boolean;
  imageUrl?: boolean;
};

type ItemFieldConfig = {
  ctaHref?: boolean;
  ctaLabel?: boolean;
  description?: boolean;
  eyebrow?: boolean;
  href?: boolean;
  icon?: boolean;
  imageUrl?: boolean;
  subtitle?: boolean;
  value?: boolean;
};

const sectionFieldConfig: Record<LandingSectionKey, SectionFieldConfig> = {
  hero: { eyebrow: true, imageUrl: true },
  features: {},
  gallery: {},
  coaches: { ctaLabel: true },
  sports: {},
  statistics: {},
  cta: { ctaHref: true, ctaLabel: true },
  footer: {}
};

const itemFieldConfig: Record<LandingSectionKey, ItemFieldConfig> = {
  hero: { description: true, eyebrow: true, imageUrl: true, subtitle: true },
  features: { description: true, icon: true },
  gallery: { imageUrl: true },
  coaches: {},
  sports: { description: true, icon: true },
  statistics: { description: true, icon: true, value: true },
  cta: {},
  footer: { href: true, icon: true, value: true }
};

type SectionForm = {
  title: string;
  subtitle: string;
  description: string;
  eyebrow: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  sortOrder: number;
  status: Status;
};

type ItemForm = {
  id?: string;
  sectionKey: LandingSectionKey;
  title: string;
  subtitle: string;
  description: string;
  eyebrow: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  icon: string;
  value: string;
  href: string;
  sortOrder: number;
  status: Status;
};

function sectionToForm(section: LandingSectionView): SectionForm {
  return {
    title: section.title,
    subtitle: section.subtitle ?? "",
    description: section.description ?? "",
    eyebrow: section.eyebrow ?? "",
    imageUrl: section.imageUrl ?? "",
    ctaLabel: section.ctaLabel ?? "",
    ctaHref: section.ctaHref ?? "",
    sortOrder: section.sortOrder,
    status: section.status
  };
}

function itemToForm(item: LandingItemView): ItemForm {
  return {
    id: item.id,
    sectionKey: item.sectionKey,
    title: item.title,
    subtitle: item.subtitle ?? "",
    description: item.description ?? "",
    eyebrow: item.eyebrow ?? "",
    imageUrl: item.imageUrl ?? "",
    ctaLabel: item.ctaLabel ?? "",
    ctaHref: item.ctaHref ?? "",
    icon: item.icon ?? "",
    value: item.value ?? "",
    href: item.href ?? "",
    sortOrder: item.sortOrder,
    status: item.status
  };
}

function nextSortOrder(rows: LandingItemView[]) {
  return rows.reduce((highest, row) => Math.max(highest, row.sortOrder), 0) + 1;
}

function emptyItem(sectionKey: LandingSectionKey, sortOrder: number): ItemForm {
  return {
    sectionKey,
    title: "",
    subtitle: "",
    description: "",
    eyebrow: "",
    imageUrl: "",
    ctaLabel: "",
    ctaHref: "",
    icon: "ShieldCheck",
    value: "",
    href: "",
    sortOrder,
    status: "ACTIVE"
  };
}

export function LandingPageAdminManager({ content }: { content: LandingContent }) {
  const router = useRouter();
  const [tab, setTab] = useState<LandingSectionKey>("hero");
  const [sectionForm, setSectionForm] = useState<SectionForm>(() => sectionToForm(content.sections.hero));
  const [itemForm, setItemForm] = useState<ItemForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadTarget | null>(null);
  const [message, setMessage] = useState("");
  const { Dialog, confirm, notify } = useActionDialog();
  const activeTab = useMemo(() => tabs.find((item) => item.key === tab) ?? tabs[0], [tab]);
  const rows = content.items[tab] ?? [];
  const isHeroTab = tab === "hero";
  const isGalleryTab = tab === "gallery";
  const isCoachesTab = tab === "coaches";
  const sectionFields = sectionFieldConfig[tab];
  const itemFields = itemFieldConfig[tab];
  const itemMetaHeader = isHeroTab ? "Gambar" : isGalleryTab ? "Gambar" : tab === "statistics" ? "Value" : tab === "footer" ? "Value/Link" : "Icon";

  useEffect(() => {
    setSectionForm(sectionToForm(content.sections[tab]));
    setItemForm(null);
    setMessage("");
  }, [content.sections, tab]);

  function patchSection(patch: Partial<SectionForm>) {
    setSectionForm((current) => ({ ...current, ...patch }));
  }

  function patchItem(patch: Partial<ItemForm>) {
    setItemForm((current) => (current ? { ...current, ...patch } : current));
  }

  async function upload(file: File | null, target: UploadTarget) {
    if (!file) return;
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setMessage(`Ukuran file maksimal ${MAX_IMAGE_UPLOAD_LABEL}.`);
      return;
    }

    setUploading(target);
    setMessage("");

    const body = new FormData();
    body.append("kind", "landing");
    body.append("file", file);

    const response = await fetch("/api/uploads/branding", {
      method: "POST",
      body
    });

    setUploading(null);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload gagal" }));
      setMessage(error.error ?? "Upload gagal");
      return;
    }

    const result = (await response.json()) as { data: { url: string } };
    if (target.type === "section") {
      patchSection({ imageUrl: result.data.url });
    } else {
      patchItem({ imageUrl: result.data.url });
    }
  }

  async function saveSection() {
    setSaving(true);
    setMessage("");
    const fields = sectionFieldConfig[tab];

    const response = await fetch(`/api/admin/landing/sections/${tab}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: sectionForm.title,
        subtitle: sectionForm.subtitle || null,
        description: sectionForm.description || null,
        eyebrow: fields.eyebrow ? sectionForm.eyebrow || null : null,
        imageUrl: fields.imageUrl ? sectionForm.imageUrl || null : null,
        ctaLabel: fields.ctaLabel ? sectionForm.ctaLabel || null : null,
        ctaHref: fields.ctaHref ? sectionForm.ctaHref || null : null,
        status: sectionForm.status
      })
    });

    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan section" }));
      setMessage(error.error ?? "Gagal menyimpan section");
      return;
    }

    setMessage(isHeroTab ? "Slide utama Hero tersimpan dan sudah disinkronkan ke item pertama." : "Section landing tersimpan.");
    router.refresh();
  }

  async function saveItem() {
    if (!itemForm) return;
    setSaving(true);
    setMessage("");
    const fields = itemFieldConfig[itemForm.sectionKey];

    const response = await fetch(itemForm.id ? `/api/admin/landing/items/${itemForm.id}` : "/api/admin/landing/items", {
      method: itemForm.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionKey: itemForm.sectionKey,
        title: itemForm.title,
        subtitle: fields.subtitle ? itemForm.subtitle || null : null,
        description: fields.description ? itemForm.description || null : null,
        eyebrow: fields.eyebrow ? itemForm.eyebrow || null : null,
        imageUrl: fields.imageUrl ? itemForm.imageUrl || null : null,
        ctaLabel: fields.ctaLabel ? itemForm.ctaLabel || null : null,
        ctaHref: fields.ctaHref ? itemForm.ctaHref || null : null,
        icon: fields.icon ? itemForm.icon || null : null,
        value: fields.value ? itemForm.value || null : null,
        href: fields.href ? itemForm.href || null : null,
        sortOrder: itemForm.sortOrder,
        status: itemForm.status
      })
    });

    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan item" }));
      setMessage(error.error ?? "Gagal menyimpan item");
      return;
    }

    setItemForm(null);
    router.refresh();
  }

  async function toggleItem(row: LandingItemView) {
    if (!row.id) return;
    const response = await fetch(`/api/admin/landing/items/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal mengubah status item" }));
      notify("Gagal mengubah status item", error.error ?? "Coba ulangi beberapa saat lagi.", "danger");
      return;
    }

    router.refresh();
  }

  async function deleteItem(row: LandingItemView) {
    if (!row.id) return;
    const approved = await confirm("Hapus item landing?", `Item ${row.title} akan dihapus dari CMS.`);
    if (!approved) return;
    const response = await fetch(`/api/admin/landing/items/${row.id}`, { method: "DELETE" });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menghapus item" }));
      notify("Gagal menghapus item", error.error ?? "Coba ulangi beberapa saat lagi.", "danger");
      return;
    }

    router.refresh();
  }

  async function moveItem(row: LandingItemView, direction: "up" | "down") {
    if (!row.id) return;
    const currentIndex = rows.findIndex((item) => item.id === row.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const target = rows[targetIndex];

    if (currentIndex < 0 || !target?.id) return;

    const response = await Promise.all([
      fetch(`/api/admin/landing/items/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: target.sortOrder })
      }),
      fetch(`/api/admin/landing/items/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: row.sortOrder })
      })
    ]);

    const failed = response.find((item) => !item.ok);
    if (failed) {
      const error = await failed.json().catch(() => ({ error: "Gagal mengubah urutan item" }));
      notify("Gagal mengubah urutan item", error.error ?? "Coba ulangi beberapa saat lagi.", "danger");
      return;
    }

    router.refresh();
  }

  function itemMeta(row: LandingItemView) {
    if (isHeroTab) return row.imageUrl || "-";
    if (isGalleryTab) return row.imageUrl || "-";
    if (tab === "statistics") return row.value || "-";
    if (tab === "footer") return row.value || row.href || "-";
    return row.icon || "-";
  }

  return (
    <div className="space-y-3">
      <section className="rounded-md border bg-background shadow-sm shadow-slate-200/60">
        <div className="border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2">
          <h2 className="text-sm font-semibold">CMS Landing Page</h2>
          <p className="text-xs text-muted-foreground">Kelola konten company profile publik per section.</p>
        </div>
        <div className="flex flex-wrap gap-2 px-3 py-2 text-xs">
          {tabs.map((item) => (
            <button
              key={item.key}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-medium transition-colors",
                tab === item.key ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white text-slate-600 hover:bg-slate-50"
              )}
              onClick={() => setTab(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div>
            <h3 className="text-sm font-semibold">{isHeroTab ? "Slide Utama Hero" : `Section ${activeTab.label}`}</h3>
            <p className="text-xs text-muted-foreground">
              {isHeroTab
                ? "Konten ini menjadi slide pertama di home dan otomatis disamakan dengan item Hero paling atas."
                : isCoachesTab
                  ? "Teks section coach dari CMS. Data kartu coach dikelola dari menu Akun admin."
                  : "Teks utama, CTA, status tampil, dan gambar section."}
            </p>
          </div>
          <Button size="sm" onClick={saveSection} disabled={saving || !sectionForm.title}>
            <Save className="h-3.5 w-3.5" />
            {saving ? "Menyimpan..." : isHeroTab ? "Simpan Slide Utama" : "Simpan Section"}
          </Button>
        </div>
        <div className="grid gap-3 p-3 lg:grid-cols-[1fr_260px]">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs font-medium">
              Judul
              <Input value={sectionForm.title} onChange={(event) => patchSection({ title: event.target.value })} />
            </label>
            <label className="space-y-1 text-xs font-medium">
              Subtitle
              <Input value={sectionForm.subtitle} onChange={(event) => patchSection({ subtitle: event.target.value })} />
            </label>
            {sectionFields.eyebrow ? (
              <label className="space-y-1 text-xs font-medium">
                Eyebrow
                <Input value={sectionForm.eyebrow} onChange={(event) => patchSection({ eyebrow: event.target.value })} />
              </label>
            ) : null}
            <label className="space-y-1 text-xs font-medium">
              Status
              <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={sectionForm.status} onChange={(event) => patchSection({ status: event.target.value as Status })}>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-medium md:col-span-2">
              Deskripsi
              <Textarea value={sectionForm.description} onChange={(event) => patchSection({ description: event.target.value })} />
            </label>
            {sectionFields.ctaLabel ? (
              <label className="space-y-1 text-xs font-medium">
                CTA Label
                <Input value={sectionForm.ctaLabel} onChange={(event) => patchSection({ ctaLabel: event.target.value })} />
              </label>
            ) : null}
            {sectionFields.ctaHref ? (
              <label className="space-y-1 text-xs font-medium">
                CTA Link
                <Input value={sectionForm.ctaHref} onChange={(event) => patchSection({ ctaHref: event.target.value })} placeholder="/login" />
              </label>
            ) : null}
            {sectionFields.imageUrl ? (
              <>
                <label className="space-y-1 text-xs font-medium">
                  URL Gambar
                  <Input value={sectionForm.imageUrl} onChange={(event) => patchSection({ imageUrl: event.target.value })} placeholder="/uploads/landing.png" />
                </label>
                <div className="md:col-span-2">
                  <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-white px-2.5 text-xs font-medium hover:bg-slate-50">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading?.type === "section" ? "Upload..." : isHeroTab ? "Upload Gambar Slide Utama" : "Upload Gambar Section"}
                    <input className="sr-only" type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(event) => upload(event.target.files?.[0] ?? null, { type: "section" })} />
                  </label>
                  <p className="mt-1 text-[11px] text-muted-foreground">{uploadHelpText(isHeroTab ? "hero" : "section", "PNG, JPG, JPEG, atau WEBP")}</p>
                </div>
              </>
            ) : null}
          </div>
          <div className="rounded-md border bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Preview</p>
            {sectionFields.imageUrl ? (
              <div className="flex h-32 items-center justify-center overflow-hidden rounded-md border bg-white text-slate-400">
                {sectionForm.imageUrl ? <Image src={sectionForm.imageUrl} alt="Preview section" width={260} height={128} unoptimized className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8" />}
              </div>
            ) : null}
            <p className="mt-3 line-clamp-2 text-sm font-semibold">{sectionForm.title}</p>
            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{sectionForm.description || "Belum ada deskripsi."}</p>
          </div>
        </div>
        {message ? <div className="border-t bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">{message}</div> : null}
      </section>

      {activeTab.items ? (
        <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
            <div>
              <h3 className="text-sm font-semibold">{isHeroTab ? "Daftar Slide Banner Hero" : isGalleryTab ? "Daftar Foto Galeri" : `Item ${activeTab.label}`}</h3>
              <p className="text-xs text-muted-foreground">
                {isHeroTab
                  ? "Baris pertama sama dengan Slide Utama Hero. Tambahkan baris lain untuk slide berikutnya."
                  : isGalleryTab
                    ? "Tambah, upload, edit judul/alt foto, atur urutan, aktifkan/nonaktifkan, atau hapus foto galeri."
                    : "Tambah, edit, atur urutan, aktifkan/nonaktifkan, atau hapus item."}
              </p>
            </div>
            <Button size="sm" onClick={() => setItemForm(emptyItem(tab, nextSortOrder(rows)))}>
              <Plus className="h-3.5 w-3.5" />
              {isGalleryTab ? "Tambah Foto" : "Tambah Item"}
            </Button>
          </div>
          <div className="w-full overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
                  <th className="h-8 px-2">Posisi</th>
                  <th className="h-8 px-2">{isHeroTab ? "Judul Slide" : isGalleryTab ? "Judul/Alt Foto" : "Judul"}</th>
                  <th className="h-8 px-2">{itemMetaHeader}</th>
                  <th className="h-8 px-2">Status</th>
                  <th className="h-8 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id ?? row.title} className="border-b hover:bg-slate-50/90">
                    <td className="h-11 px-2">
                      <div className="flex items-center gap-1">
                        <span className="w-5 text-slate-500">{index + 1}</span>
                        <Button variant="outline" size="sm" onClick={() => moveItem(row, "up")} disabled={!row.id || index === 0} title="Naikkan posisi">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => moveItem(row, "down")} disabled={!row.id || index === rows.length - 1} title="Turunkan posisi">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="h-11 px-2">
                      <p className="font-semibold">{row.title}</p>
                      <p className="max-w-md truncate text-[11px] text-muted-foreground">{row.description ?? row.href ?? "-"}</p>
                    </td>
                    <td className="h-11 px-2">{itemMeta(row)}</td>
                    <td className="h-11 px-2">
                      <Badge variant={row.status === "ACTIVE" ? "green" : "red"}>{row.status === "ACTIVE" ? "Aktif" : "Nonaktif"}</Badge>
                    </td>
                    <td className="h-11 px-2">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => setItemForm(itemToForm(row))} disabled={!row.id}>
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleItem(row)} disabled={!row.id}>
                          <Power className="h-3.5 w-3.5" />
                          {row.status === "ACTIVE" ? "Nonaktif" : "Aktif"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteItem(row)} disabled={!row.id}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td className="h-16 px-2 text-center text-muted-foreground" colSpan={5}>Belum ada item.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {itemForm ? (
        <ContentModal className="max-w-2xl">
          <div className="border-b px-3 py-2">
            <h3 className="text-sm font-semibold">{itemForm.id ? (isHeroTab ? "Edit Slide Hero" : isGalleryTab ? "Edit Foto Galeri" : "Edit Item Landing") : isHeroTab ? "Tambah Slide Hero" : isGalleryTab ? "Tambah Foto Galeri" : "Tambah Item Landing"}</h3>
            <p className="text-xs text-muted-foreground">{isHeroTab ? "Konten slide banner yang tampil bergantian di home." : isGalleryTab ? "Foto yang tampil di section Galeri publik." : `Item untuk section ${activeTab.label}.`}</p>
          </div>
          <div className={`grid gap-3 p-3 ${itemFields.imageUrl ? "lg:grid-cols-[1fr_220px]" : ""}`}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs font-medium md:col-span-2">
                {isHeroTab ? "Judul Slide" : isGalleryTab ? "Judul/Alt Foto" : "Judul"}
                <Input value={itemForm.title} onChange={(event) => patchItem({ title: event.target.value })} />
              </label>
              {itemFields.subtitle ? (
                <label className="space-y-1 text-xs font-medium">
                  Subtitle
                  <Input value={itemForm.subtitle} onChange={(event) => patchItem({ subtitle: event.target.value })} />
                </label>
              ) : null}
              {itemFields.eyebrow ? (
                <label className="space-y-1 text-xs font-medium">
                  Eyebrow
                  <Input value={itemForm.eyebrow} onChange={(event) => patchItem({ eyebrow: event.target.value })} placeholder={isHeroTab ? "Contoh: DIHYAH ARCHERY CLUB" : undefined} />
                </label>
              ) : null}
              {itemFields.icon ? (
                <label className="space-y-1 text-xs font-medium">
                  Icon
                  <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={itemForm.icon} onChange={(event) => patchItem({ icon: event.target.value })}>
                    {iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </label>
              ) : null}
              {itemFields.value ? (
                <label className="space-y-1 text-xs font-medium">
                  Value
                  <Input value={itemForm.value} onChange={(event) => patchItem({ value: event.target.value })} placeholder="120+, 92%, email, lokasi" />
                </label>
              ) : null}
              {itemFields.description ? (
                <label className="space-y-1 text-xs font-medium md:col-span-2">
                  Deskripsi
                  <Textarea value={itemForm.description} onChange={(event) => patchItem({ description: event.target.value })} />
                </label>
              ) : null}
              {itemFields.href ? (
                <label className="space-y-1 text-xs font-medium">
                  Link Item
                  <Input value={itemForm.href} onChange={(event) => patchItem({ href: event.target.value })} placeholder="/login atau mailto:" />
                </label>
              ) : null}
              {itemFields.ctaLabel ? (
                <label className="space-y-1 text-xs font-medium">
                  CTA Label
                  <Input value={itemForm.ctaLabel} onChange={(event) => patchItem({ ctaLabel: event.target.value })} />
                </label>
              ) : null}
              {itemFields.ctaHref ? (
                <label className="space-y-1 text-xs font-medium">
                  CTA Link
                  <Input value={itemForm.ctaHref} onChange={(event) => patchItem({ ctaHref: event.target.value })} />
                </label>
              ) : null}
              {itemFields.imageUrl ? (
                <label className="space-y-1 text-xs font-medium md:col-span-2">
                  URL Gambar
                  <Input value={itemForm.imageUrl} onChange={(event) => patchItem({ imageUrl: event.target.value })} placeholder="/uploads/landing-item.png" />
                </label>
              ) : null}
              <label className="space-y-1 text-xs font-medium">
                Status
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={itemForm.status} onChange={(event) => patchItem({ status: event.target.value as Status })}>
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktif</option>
                </select>
              </label>
              {itemFields.imageUrl ? (
                <div className="md:col-span-2">
                  <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-white px-2.5 text-xs font-medium hover:bg-slate-50">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading?.type === "item" ? "Upload..." : isHeroTab ? "Upload Gambar Slide" : isGalleryTab ? "Upload Foto Galeri" : "Upload Gambar Item"}
                    <input className="sr-only" type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(event) => upload(event.target.files?.[0] ?? null, { type: "item" })} />
                  </label>
                  <p className="mt-1 text-[11px] text-muted-foreground">{uploadHelpText(isHeroTab ? "hero" : isGalleryTab ? "gallery" : "section", "PNG, JPG, JPEG, atau WEBP")}</p>
                </div>
              ) : null}
            </div>
            {itemFields.imageUrl ? (
              <div className="rounded-md border bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Preview Gambar</p>
                <div className="flex h-52 items-center justify-center overflow-hidden rounded-md border bg-white text-slate-400">
                  {itemForm.imageUrl ? <Image src={itemForm.imageUrl} alt={itemForm.title || "Preview item"} width={220} height={208} unoptimized className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8" />}
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-600">{itemForm.imageUrl || "Belum ada gambar."}</p>
              </div>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 border-t px-3 py-2">
            <Button variant="outline" onClick={() => setItemForm(null)}>
              Batal
            </Button>
            <Button onClick={saveItem} disabled={saving || !itemForm.title}>
              <Save className="h-3.5 w-3.5" />
              {saving ? "Menyimpan..." : isHeroTab ? "Simpan Slide" : isGalleryTab ? "Simpan Foto" : "Simpan Item"}
            </Button>
          </div>
        </ContentModal>
      ) : null}
      <Dialog />
    </div>
  );
}
