"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Edit2, Plus, Power } from "lucide-react";

import { useActionDialog } from "@/components/action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentModal } from "@/components/content-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ClubOption = { id: string; name: string };
type SportOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };
type AccountRole = "ADMIN" | "COACH";
type Gender = "LAKI_LAKI" | "PEREMPUAN";
type CoachProfileForm = {
  phone: string;
  gender: Gender;
  birthDate: string;
  address: string;
  photoUrl: string;
  sportId: string;
  categoryId: string;
  experienceYears: string;
  certification: string;
  bio: string;
};
type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string;
  role: AccountRole;
  status: "ACTIVE" | "INACTIVE";
  lastLogin: string | null;
  scope: string;
  clubIds: string[];
  coachProfile: (Omit<CoachProfileForm, "experienceYears"> & { experienceYears: number }) | null;
};

type FormState = {
  id?: string;
  name: string;
  email: string;
  image: string;
  username: string;
  password: string;
  role: AccountRole;
  status: "ACTIVE" | "INACTIVE";
  clubIds: string[];
  coachProfile: CoachProfileForm;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  image: "",
  username: "",
  password: "",
  role: "COACH",
  status: "ACTIVE",
  clubIds: [],
  coachProfile: {
    phone: "",
    gender: "LAKI_LAKI",
    birthDate: "",
    address: "",
    photoUrl: "",
    sportId: "",
    categoryId: "",
    experienceYears: "0",
    certification: "",
    bio: ""
  }
};
const PAGE_SIZE = 5;

export function AccountManager({ users, clubs, sports, categories }: { users: UserRow[]; clubs: ClubOption[]; sports: SportOption[]; categories: CategoryOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { Dialog, confirm, notify } = useActionDialog();

  const filteredUsers = useMemo(
    () => users.filter((user) => `${user.name ?? ""} ${user.username} ${user.role}`.toLowerCase().includes(query.toLowerCase())),
    [query, users]
  );
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const visibleUsers = useMemo(() => filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filteredUsers, page]);
  const firstVisibleRow = filteredUsers.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleRow = Math.min(page * PAGE_SIZE, filteredUsers.length);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  async function submit() {
    if (!form) return;
    setSaving(true);
    setMessage("");
    const isEdit = Boolean(form.id);
    const userPayload = {
      name: form.name,
      email: form.email || null,
      image: form.image || null,
      username: form.username,
      role: form.role,
      status: form.status,
      clubIds: form.role === "COACH" ? form.clubIds : [],
      coachProfile:
        form.role === "COACH"
          ? {
              phone: form.coachProfile.phone,
              gender: form.coachProfile.gender,
              birthDate: form.coachProfile.birthDate || null,
              address: form.coachProfile.address || null,
              photoUrl: form.coachProfile.photoUrl || null,
              sportId: form.coachProfile.sportId,
              categoryId: form.coachProfile.categoryId,
              experienceYears: Number(form.coachProfile.experienceYears),
              certification: form.coachProfile.certification || null,
              bio: form.coachProfile.bio || null
            }
          : undefined,
      ...(form.password ? { password: form.password } : {})
    };

    const response = await fetch(isEdit ? `/api/users/${form.id}` : "/api/users", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPayload)
    });

    setSaving(false);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menyimpan akun" }));
      setMessage(error.error ?? "Gagal menyimpan akun");
      return;
    }

    setForm(null);
    router.refresh();
  }

  async function deactivate(user: UserRow) {
    const approved = await confirm("Nonaktifkan akun?", `Akun ${user.username} akan dinonaktifkan dan tidak bisa login.`);
    if (!approved) return;
    const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Gagal menonaktifkan akun" }));
      notify("Gagal menonaktifkan akun", error.error ?? "Coba ulangi beberapa saat lagi.", "danger");
      return;
    }
    router.refresh();
  }

  function toggleClub(clubId: string) {
    if (!form) return;
    setForm({
      ...form,
      clubIds: form.clubIds.includes(clubId) ? form.clubIds.filter((id) => id !== clubId) : [...form.clubIds, clubId]
    });
  }

  function coachDefaults(profile?: Partial<CoachProfileForm> | UserRow["coachProfile"]): CoachProfileForm {
    return {
      phone: profile?.phone ?? "",
      gender: profile?.gender ?? "LAKI_LAKI",
      birthDate: profile?.birthDate ?? "",
      address: profile?.address ?? "",
      photoUrl: profile?.photoUrl ?? "",
      sportId: profile?.sportId ?? sports[0]?.id ?? "",
      categoryId: profile?.categoryId ?? categories[0]?.id ?? "",
      experienceYears: String(profile?.experienceYears ?? 0),
      certification: profile?.certification ?? "",
      bio: profile?.bio ?? ""
    };
  }

  function updateCoachProfile(patch: Partial<CoachProfileForm>) {
    if (!form) return;
    setForm({ ...form, coachProfile: { ...form.coachProfile, ...patch } });
  }

  return (
    <section className="overflow-hidden rounded-md border bg-background shadow-sm shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">Data Coach & Admin</h2>
          <p className="text-xs text-muted-foreground">Akun coach/admin dipisahkan dari data murid.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="h-8 w-56" placeholder="Cari coach/admin" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button size="sm" onClick={() => setForm({ ...emptyForm, coachProfile: coachDefaults() })}>
            <Plus className="h-3.5 w-3.5" />
            Tambah Coach
          </Button>
        </div>
      </div>

      <div className="w-full overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-slate-50/80 text-left text-[11px] uppercase text-slate-500">
              <th className="h-8 px-2">Nama</th>
              <th className="h-8 px-2">Username</th>
              <th className="h-8 px-2">Role</th>
              <th className="h-8 px-2">Scope</th>
              <th className="h-8 px-2">Status</th>
              <th className="h-8 px-2">Login Terakhir</th>
              <th className="h-8 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-slate-50/90">
                <td className="h-10 px-2 font-medium">{user.name ?? user.username}</td>
                <td className="h-10 px-2">{user.username}</td>
                <td className="h-10 px-2">
                  <Badge variant={user.role === "ADMIN" ? "green" : "amber"}>{user.role}</Badge>
                </td>
                <td className="h-10 px-2">{user.scope}</td>
                <td className="h-10 px-2">
                  <Badge variant={user.status === "ACTIVE" ? "green" : "red"}>{user.status}</Badge>
                </td>
                <td className="h-10 px-2">{user.lastLogin ? new Date(user.lastLogin).toLocaleString("id-ID") : "-"}</td>
                <td className="h-10 px-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          id: user.id,
                          name: user.name ?? "",
                          email: user.email ?? "",
                          image: user.image ?? "",
                          username: user.username,
                          password: "",
                          role: user.role,
                          status: user.status,
                          clubIds: user.clubIds,
                          coachProfile: coachDefaults(user.coachProfile)
                        })
                      }
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deactivate(user)}>
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

      {filteredUsers.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Menampilkan {firstVisibleRow}-{lastVisibleRow} dari {filteredUsers.length} data
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

      <Dialog />
      {form ? (
        <ContentModal className="max-w-4xl">
            <div className="border-b px-3 py-2">
              <h3 className="text-sm font-semibold">{form.id ? "Edit Coach/Admin" : "Tambah Coach/Admin"}</h3>
              <p className="text-xs text-muted-foreground">Data login disimpan di User, data olahraga Coach disimpan di Coach Profile.</p>
            </div>
            <div className="max-h-[calc(100vh-9rem)] overflow-auto">
              <div className="grid gap-3 p-3 md:grid-cols-3">
                <label className="space-y-1 text-xs font-medium">
                  Nama Lengkap
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
                <label className="space-y-1 text-xs font-medium">
                  Username
                  <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
                </label>
                <label className="space-y-1 text-xs font-medium">
                  Email
                  <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </label>
                <label className="space-y-1 text-xs font-medium">
                  Password
                  <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={form.id ? "Kosongkan jika tidak diubah" : ""} />
                </label>
                <label className="space-y-1 text-xs font-medium">
                  Role
                  <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as FormState["role"], coachProfile: coachDefaults(form.coachProfile) })}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="COACH">COACH</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium">
                  Status
                  <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as FormState["status"] })}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium md:col-span-3">
                  Foto Profil URL
                  <Input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value, coachProfile: { ...form.coachProfile, photoUrl: event.target.value } })} />
                </label>

                {form.role === "COACH" ? (
                  <>
                    <div className="md:col-span-3">
                      <h4 className="text-xs font-semibold uppercase text-slate-500">Profil Coach</h4>
                    </div>
                    <label className="space-y-1 text-xs font-medium">
                      Nomor WhatsApp
                      <Input value={form.coachProfile.phone} onChange={(event) => updateCoachProfile({ phone: event.target.value })} />
                    </label>
                    <label className="space-y-1 text-xs font-medium">
                      Jenis Kelamin
                      <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.coachProfile.gender} onChange={(event) => updateCoachProfile({ gender: event.target.value as Gender })}>
                        <option value="LAKI_LAKI">Laki-laki</option>
                        <option value="PEREMPUAN">Perempuan</option>
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-medium">
                      Tanggal Lahir
                      <Input type="date" value={form.coachProfile.birthDate} onChange={(event) => updateCoachProfile({ birthDate: event.target.value })} />
                    </label>
                    <label className="space-y-1 text-xs font-medium">
                      Cabang Olahraga
                      <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.coachProfile.sportId} onChange={(event) => updateCoachProfile({ sportId: event.target.value })}>
                        {sports.map((sport) => (
                          <option key={sport.id} value={sport.id}>
                            {sport.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-medium">
                      Kategori Coach
                      <select className="h-8 w-full rounded-md border bg-white px-2 text-xs" value={form.coachProfile.categoryId} onChange={(event) => updateCoachProfile({ categoryId: event.target.value })}>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-xs font-medium">
                      Pengalaman
                      <Input type="number" min={0} value={form.coachProfile.experienceYears} onChange={(event) => updateCoachProfile({ experienceYears: event.target.value })} />
                    </label>
                    <label className="space-y-1 text-xs font-medium md:col-span-3">
                      Alamat
                      <Input value={form.coachProfile.address} onChange={(event) => updateCoachProfile({ address: event.target.value })} />
                    </label>
                    <label className="space-y-1 text-xs font-medium md:col-span-3">
                      Sertifikasi
                      <Input value={form.coachProfile.certification} onChange={(event) => updateCoachProfile({ certification: event.target.value })} />
                    </label>
                    <label className="space-y-1 text-xs font-medium md:col-span-3">
                      Bio
                      <Textarea value={form.coachProfile.bio} onChange={(event) => updateCoachProfile({ bio: event.target.value })} />
                    </label>
                    <div className="space-y-1 text-xs font-medium md:col-span-3">
                      Club Coach
                      <div className="grid gap-2 rounded-md border bg-slate-50 p-2 md:grid-cols-3">
                        {clubs.map((club) => (
                          <label key={club.id} className="flex items-center gap-2 font-normal">
                            <input checked={form.clubIds.includes(club.id)} type="checkbox" onChange={() => toggleClub(club.id)} />
                            {club.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
                {message ? <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 md:col-span-3">{message}</p> : null}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t px-3 py-2">
              <Button variant="outline" onClick={() => setForm(null)}>
                Batal
              </Button>
              <Button
                onClick={submit}
                disabled={
                  saving ||
                  !form.name ||
                  !form.username ||
                  (!form.id && !form.password) ||
                  (form.role === "COACH" && (!form.coachProfile.phone || !form.coachProfile.sportId || !form.coachProfile.categoryId))
                }
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
        </ContentModal>
      ) : null}
    </section>
  );
}
