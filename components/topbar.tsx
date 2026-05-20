"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Inbox, Menu, Search, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard Coach",
  "/murid": "Data Murid",
  "/program": "Program Latihan",
  "/assign": "Assign Program",
  "/absensi": "Absensi",
  "/penilaian": "Penilaian Coach",
  "/monitoring": "Monitoring Progress",
  "/laporan": "Laporan",
  "/akun": "Manajemen Akun",
  "/admin/pengaturan": "Pengaturan Admin",
  "/admin/cabang-olahraga": "Cabang Olahraga",
  "/admin/company-profile": "CMS Landing Page",
  "/profil": "Profil Saya",
  "/portal": "Portal Murid",
  "/portal/program": "Program Saya",
  "/portal/progress": "Progress Saya",
  "/portal/absensi": "Absensi Saya",
  "/portal/nilai": "Nilai Coach",
  "/portal/log": "Log Latihan"
};

function resolveTitle(pathname: string) {
  if (pathname.startsWith("/murid/")) return "Halaman Murid";
  if (pathname.startsWith("/program/")) return "Detail Program";
  return pageTitles[pathname] ?? "AltLit";
}

type TopbarProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string;
    role?: "ADMIN" | "COACH" | "MURID";
  } | null;
  branding: {
    systemName: string;
  };
  onMenuClick?: () => void;
};

export function Topbar({ user, branding, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const initials = (user?.name ?? user?.username ?? "CH")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-white/95 px-3 shadow-sm shadow-slate-200/60 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <Button className="md:hidden" variant="ghost" size="icon" aria-label="Buka menu" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="truncate text-sm font-semibold">{resolveTitle(pathname) === "AltLit" ? branding.systemName : resolveTitle(pathname)}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden w-52 sm:block">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-8 pl-7" placeholder="Cari murid, program..." />
        </div>
        <div ref={notificationRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifikasi"
            aria-expanded={notificationsOpen}
            className={cn("relative", notificationsOpen ? "bg-emerald-50 text-emerald-700" : "")}
            onClick={() => setNotificationsOpen((current) => !current)}
          >
            <Bell className="h-4 w-4" />
          </Button>

          {notificationsOpen ? (
            <div className="absolute right-0 top-10 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-md border bg-white shadow-2xl shadow-slate-950/15">
              <div className="border-b bg-gradient-to-r from-emerald-50 via-white to-sky-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Notifikasi</p>
                    <p className="mt-0.5 text-xs text-slate-500">Pembaruan sistem dan aktivitas terbaru.</p>
                  </div>
                  <span className="inline-flex h-6 items-center rounded-full border border-emerald-200 bg-white px-2 text-[11px] font-semibold text-emerald-700">
                    0 baru
                  </span>
                </div>
              </div>

              <div className="px-4 py-5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <Inbox className="h-5 w-5" />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-semibold text-slate-950">Belum ada notifikasi baru</p>
                  <p className="mx-auto mt-1 max-w-[17rem] text-xs leading-5 text-slate-500">
                    Aktivitas penting seperti absensi, penilaian, dan pembaruan akun akan muncul di sini.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Sistem aktif
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Semua terbaca
                </span>
              </div>
            </div>
          ) : null}
        </div>
        <Link className="hidden text-right leading-tight transition-colors hover:text-emerald-700 md:block" href="/profil">
          <p className="text-xs font-semibold">{user?.name ?? user?.username ?? "Coach"}</p>
          <p className="text-[11px] text-muted-foreground">{user?.role ?? "COACH"}</p>
        </Link>
        <Link aria-label="Buka profil saya" href="/profil">
          <Avatar>
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? user?.username ?? "Profil"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
