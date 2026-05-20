"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon, RotateCcw, Save, Upload } from "lucide-react";

import { useActionDialog } from "@/components/action-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_LABEL, uploadHelpText } from "@/lib/upload-limits";

type BrandingSettings = {
  systemName: string;
  systemSubtitle: string;
  loginSubtitle: string;
  contactWhatsapp: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
};

type UploadKind = "logo" | "favicon";

export function BrandingSettingsManager({ settings }: { settings: BrandingSettings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    systemName: settings.systemName,
    systemSubtitle: settings.systemSubtitle,
    loginSubtitle: settings.loginSubtitle,
    contactWhatsapp: settings.contactWhatsapp ?? "",
    logoUrl: settings.logoUrl ?? "",
    faviconUrl: settings.faviconUrl ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadKind | null>(null);
  const [message, setMessage] = useState("");
  const { Dialog, confirm } = useActionDialog();

  function update(patch: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function upload(kind: UploadKind, file: File | null) {
    if (!file) return;
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setMessage(`Ukuran file maksimal ${MAX_IMAGE_UPLOAD_LABEL}.`);
      return;
    }

    setUploading(kind);
    setMessage("");

    const body = new FormData();
    body.append("kind", kind);
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
    update(kind === "logo" ? { logoUrl: result.data.url } : { faviconUrl: result.data.url });
  }

  async function save() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemName: form.systemName,
        systemSubtitle: form.systemSubtitle,
        loginSubtitle: form.loginSubtitle,
        contactWhatsapp: form.contactWhatsapp || null,
        logoUrl: form.logoUrl || null,
        faviconUrl: form.faviconUrl || null
      })
    });

    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan branding" }));
      setMessage(error.error ?? "Gagal menyimpan branding");
      return;
    }

    setMessage("Branding sistem tersimpan.");
    router.refresh();
  }

  async function reset() {
    const approved = await confirm("Reset branding?", "Nama sistem, teks login, logo, favicon, dan WhatsApp kontak akan dikembalikan ke default.");
    if (!approved) return;
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/settings", { method: "DELETE" });

    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal reset branding" }));
      setMessage(error.error ?? "Gagal reset branding");
      return;
    }

    setForm({
      systemName: "DIHYAH ARCHERY CLUB",
      systemSubtitle: "Coach Panel",
      loginSubtitle: "Masuk untuk monitoring latihan panahan.",
      contactWhatsapp: "",
      logoUrl: "",
      faviconUrl: ""
    });
    setMessage("Branding sistem sudah direset.");
    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">Branding Sistem</h2>
          <p className="text-xs text-muted-foreground">CRUD nama sistem, subtitle panel, teks login, WhatsApp, logo, dan favicon.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={reset} disabled={saving}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="h-3.5 w-3.5" />
            {saving ? "Menyimpan..." : "Simpan Branding"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 p-3 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs font-medium">
            Nama System
            <Input value={form.systemName} onChange={(event) => update({ systemName: event.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-medium">
            Subtitle / Nama Panel
            <Input value={form.systemSubtitle} onChange={(event) => update({ systemSubtitle: event.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-medium md:col-span-2">
            Teks Login
            <Input value={form.loginSubtitle} onChange={(event) => update({ loginSubtitle: event.target.value })} placeholder="Masuk untuk monitoring latihan panahan." />
          </label>
          <label className="space-y-1 text-xs font-medium md:col-span-2">
            WhatsApp Kontak
            <Input value={form.contactWhatsapp} onChange={(event) => update({ contactWhatsapp: event.target.value })} placeholder="Contoh: 081234567890" />
          </label>
          <label className="space-y-1 text-xs font-medium">
            URL Logo
            <Input value={form.logoUrl} onChange={(event) => update({ logoUrl: event.target.value })} placeholder="/uploads/logo.png" />
          </label>
          <label className="space-y-1 text-xs font-medium">
            URL Favicon
            <Input value={form.faviconUrl} onChange={(event) => update({ faviconUrl: event.target.value })} placeholder="/uploads/favicon.ico" />
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <div className="space-y-1">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-white px-2.5 text-xs font-medium hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" />
                {uploading === "logo" ? "Upload logo..." : "Upload Logo"}
                <input className="sr-only" type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(event) => upload("logo", event.target.files?.[0] ?? null)} />
              </label>
              <p className="text-[11px] text-muted-foreground">{uploadHelpText("logo", "PNG, JPG, JPEG, atau WEBP")}</p>
            </div>
            <div className="space-y-1">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border bg-white px-2.5 text-xs font-medium hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" />
                {uploading === "favicon" ? "Upload favicon..." : "Upload Favicon"}
                <input className="sr-only" type="file" accept=".ico,.png" onChange={(event) => upload("favicon", event.target.files?.[0] ?? null)} />
              </label>
              <p className="text-[11px] text-muted-foreground">{uploadHelpText("favicon", "ICO atau PNG")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-slate-950 p-3 text-white">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Preview Sidebar</p>
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 p-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-emerald-500 text-white">
              {form.logoUrl ? <Image src={form.logoUrl} alt="Logo preview" width={32} height={32} unoptimized className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{form.systemName || "Nama System"}</p>
              <p className="truncate text-[11px] text-slate-400">{form.systemSubtitle || "Nama Panel"}</p>
            </div>
          </div>
          <div className="mt-3 rounded-md border border-slate-800 bg-slate-900 p-2">
            <p className="mb-1 text-xs font-medium text-slate-300">Preview Login</p>
            <div className="rounded-md border border-slate-800 bg-white p-3 text-slate-950">
              <div className="mb-2 flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-emerald-600 text-white">
                {form.logoUrl ? <Image src={form.logoUrl} alt="Logo login preview" width={32} height={32} unoptimized className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4" />}
              </div>
              <p className="truncate text-sm font-semibold">{form.systemName || "Nama System"}</p>
              <p className="truncate text-[11px] text-slate-500">{form.loginSubtitle || "Teks login"}</p>
            </div>
          </div>
          <div className="mt-3 rounded-md border border-slate-800 bg-slate-900 p-2">
            <p className="mb-1 text-xs font-medium text-slate-300">Favicon</p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-white text-slate-900">
                {form.faviconUrl ? <Image src={form.faviconUrl} alt="Favicon preview" width={32} height={32} unoptimized className="h-full w-full object-contain" /> : <ImageIcon className="h-4 w-4" />}
              </div>
              <span className="min-w-0 truncate">{form.faviconUrl || "Belum ada favicon custom"}</span>
            </div>
          </div>
        </div>
      </div>

      {message ? <div className="border-t bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">{message}</div> : null}
      <Dialog />
    </section>
  );
}
