"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MAX_IMAGE_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_LABEL, uploadHelpText } from "@/lib/upload-limits";
import { cn } from "@/lib/utils";

type Role = "ADMIN" | "COACH" | "MURID";
type Gender = "LAKI_LAKI" | "PEREMPUAN";

type ProfileData = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string;
  role: Role;
  coachProfile: {
    phone: string;
    gender: Gender;
    birthDate: string;
    address: string;
    photoUrl: string;
    experienceYears: number;
    certification: string;
    bio: string;
    sportName: string;
    categoryName: string;
  } | null;
  studentProfile: {
    phone: string;
    birthDate: string;
    address: string;
    photoUrl: string;
    clubName: string;
    sportName: string;
    branch: string;
    level: string;
  } | null;
};

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: profile.name ?? "",
    email: profile.email ?? "",
    image: profile.image ?? profile.coachProfile?.photoUrl ?? profile.studentProfile?.photoUrl ?? "",
    password: "",
    coachProfile: {
      phone: profile.coachProfile?.phone ?? "",
      gender: profile.coachProfile?.gender ?? "LAKI_LAKI",
      birthDate: profile.coachProfile?.birthDate ?? "",
      address: profile.coachProfile?.address ?? "",
      experienceYears: String(profile.coachProfile?.experienceYears ?? 0),
      certification: profile.coachProfile?.certification ?? "",
      bio: profile.coachProfile?.bio ?? ""
    },
    studentProfile: {
      phone: profile.studentProfile?.phone ?? "",
      birthDate: profile.studentProfile?.birthDate ?? "",
      address: profile.studentProfile?.address ?? ""
    }
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function upload(file: File | null) {
    if (!file) return;
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setMessage({ type: "error", text: `Ukuran file maksimal ${MAX_IMAGE_UPLOAD_LABEL}.` });
      return;
    }

    setUploading(true);
    setMessage(null);

    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/uploads/profile", { method: "POST", body });

    setUploading(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload foto gagal" }));
      setMessage({ type: "error", text: error.error ?? "Upload foto gagal" });
      return;
    }

    const result = (await response.json()) as { data: { url: string } };
    setForm((current) => ({ ...current, image: result.data.url }));
  }

  async function submit() {
    setSaving(true);
    setMessage(null);

    const payload = {
      name: form.name,
      email: form.email || null,
      image: form.image || null,
      password: form.password || undefined,
      coachProfile:
        profile.role === "COACH"
          ? {
              phone: form.coachProfile.phone,
              gender: form.coachProfile.gender,
              birthDate: form.coachProfile.birthDate || null,
              address: form.coachProfile.address || null,
              photoUrl: form.image || null,
              experienceYears: Number(form.coachProfile.experienceYears),
              certification: form.coachProfile.certification || null,
              bio: form.coachProfile.bio || null
            }
          : undefined,
      studentProfile:
        profile.role === "MURID"
          ? {
              phone: form.studentProfile.phone,
              birthDate: form.studentProfile.birthDate || null,
              address: form.studentProfile.address || null,
              photoUrl: form.image || null
            }
          : undefined
    };

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan profil" }));
      setMessage({ type: "error", text: error.error ?? "Gagal menyimpan profil" });
      return;
    }

    setForm((current) => ({ ...current, password: "" }));
    setMessage({ type: "success", text: "Profil tersimpan." });
    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
      <div className="border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2">
        <h2 className="text-sm font-semibold">Profil Saya</h2>
        <p className="text-xs text-muted-foreground">Ubah foto profil dan biodata akun Anda.</p>
      </div>

      <div className="grid gap-4 p-3 lg:grid-cols-[260px_1fr]">
        <div className="rounded-md border bg-slate-50 p-3">
          <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border bg-white">
            {form.image ? <Image src={form.image} alt="Foto profil" width={112} height={112} unoptimized className="h-full w-full object-cover" /> : <span className="text-2xl font-semibold text-slate-400">{form.name.slice(0, 2).toUpperCase() || "US"}</span>}
          </div>
          <label className="mt-3 inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border bg-white px-2.5 text-xs font-medium hover:bg-slate-50">
            <Camera className="h-3.5 w-3.5" />
            {uploading ? "Upload..." : "Ganti Foto"}
            <input className="sr-only" type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(event) => upload(event.target.files?.[0] ?? null)} />
          </label>
          <p className="mt-1 text-[11px] text-muted-foreground">{uploadHelpText("profile", "PNG, JPG, JPEG, atau WEBP")}</p>
          <div className="mt-3 text-xs text-muted-foreground">
            <p className="font-medium text-slate-700">{profile.username}</p>
            <p>{profile.role}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs font-medium">
            Nama
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-medium">
            Email
            <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="space-y-1 text-xs font-medium md:col-span-2">
            Password Baru
            <Input type="password" value={form.password} placeholder="Kosongkan jika tidak diubah" onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>

          {profile.role === "COACH" ? (
            <>
              <div className="md:col-span-2">
                <h3 className="text-xs font-semibold uppercase text-slate-500">Biodata Coach</h3>
              </div>
              <label className="space-y-1 text-xs font-medium">
                Nomor WhatsApp
                <Input value={form.coachProfile.phone} onChange={(event) => setForm({ ...form, coachProfile: { ...form.coachProfile, phone: event.target.value } })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Jenis Kelamin
                <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.coachProfile.gender} onChange={(event) => setForm({ ...form, coachProfile: { ...form.coachProfile, gender: event.target.value as Gender } })}>
                  <option value="LAKI_LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium">
                Tanggal Lahir
                <Input type="date" value={form.coachProfile.birthDate} onChange={(event) => setForm({ ...form, coachProfile: { ...form.coachProfile, birthDate: event.target.value } })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Pengalaman
                <Input type="number" min={0} value={form.coachProfile.experienceYears} onChange={(event) => setForm({ ...form, coachProfile: { ...form.coachProfile, experienceYears: event.target.value } })} />
              </label>
              <div className="rounded-md border bg-slate-50 px-2 py-2 text-xs">
                <p className="text-muted-foreground">Cabang Olahraga</p>
                <p className="mt-1 font-medium">{profile.coachProfile?.sportName ?? "-"}</p>
              </div>
              <div className="rounded-md border bg-slate-50 px-2 py-2 text-xs">
                <p className="text-muted-foreground">Kategori Coach</p>
                <p className="mt-1 font-medium">{profile.coachProfile?.categoryName ?? "-"}</p>
              </div>
              <label className="space-y-1 text-xs font-medium md:col-span-2">
                Alamat
                <Input value={form.coachProfile.address} onChange={(event) => setForm({ ...form, coachProfile: { ...form.coachProfile, address: event.target.value } })} />
              </label>
              <label className="space-y-1 text-xs font-medium md:col-span-2">
                Sertifikasi
                <Input value={form.coachProfile.certification} onChange={(event) => setForm({ ...form, coachProfile: { ...form.coachProfile, certification: event.target.value } })} />
              </label>
              <label className="space-y-1 text-xs font-medium md:col-span-2">
                Bio
                <Textarea value={form.coachProfile.bio} onChange={(event) => setForm({ ...form, coachProfile: { ...form.coachProfile, bio: event.target.value } })} />
              </label>
            </>
          ) : null}

          {profile.role === "MURID" ? (
            <>
              <div className="md:col-span-2">
                <h3 className="text-xs font-semibold uppercase text-slate-500">Biodata Murid</h3>
              </div>
              <label className="space-y-1 text-xs font-medium">
                Nomor WhatsApp
                <Input value={form.studentProfile.phone} onChange={(event) => setForm({ ...form, studentProfile: { ...form.studentProfile, phone: event.target.value } })} />
              </label>
              <label className="space-y-1 text-xs font-medium">
                Tanggal Lahir
                <Input type="date" value={form.studentProfile.birthDate} onChange={(event) => setForm({ ...form, studentProfile: { ...form.studentProfile, birthDate: event.target.value } })} />
              </label>
              <div className="rounded-md border bg-slate-50 px-2 py-2 text-xs">
                <p className="text-muted-foreground">Club</p>
                <p className="mt-1 font-medium">{profile.studentProfile?.clubName ?? "-"}</p>
              </div>
              <div className="rounded-md border bg-slate-50 px-2 py-2 text-xs">
                <p className="text-muted-foreground">Olahraga</p>
                <p className="mt-1 font-medium">{profile.studentProfile?.sportName ?? "-"}</p>
              </div>
              <label className="space-y-1 text-xs font-medium md:col-span-2">
                Alamat
                <Input value={form.studentProfile.address} onChange={(event) => setForm({ ...form, studentProfile: { ...form.studentProfile, address: event.target.value } })} />
              </label>
            </>
          ) : null}

          {message ? (
            <p
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-medium md:col-span-2",
                message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
              )}
            >
              {message.text}
            </p>
          ) : null}
          <div className="flex justify-end md:col-span-2">
            <Button onClick={submit} disabled={saving || !form.name}>
              <Save className="h-3.5 w-3.5" />
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
