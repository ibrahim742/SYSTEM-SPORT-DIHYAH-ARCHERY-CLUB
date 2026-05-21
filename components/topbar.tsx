"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Circle, Inbox, Menu, Search, ShieldCheck } from "lucide-react";

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

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  actor: {
    name: string | null;
    username: string;
    role: "ADMIN" | "COACH" | "MURID";
  } | null;
};

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function safeNotificationHref(href: string | null) {
  return href?.startsWith("/") ? href : null;
}

export function Topbar({ user, branding, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const initials = (user?.name ?? user?.username ?? "CH")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError(null);

    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const body = (await response.json()) as {
        data?: { notifications: NotificationItem[]; unreadCount: number };
        error?: string;
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error ?? "Notifikasi belum bisa dimuat");
      }

      setNotifications(body.data.notifications);
      setUnreadCount(body.data.unreadCount);
      return body.data;
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Notifikasi belum bisa dimuat");
      return null;
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => {
      void loadNotifications();
    }, 45_000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!notificationsOpen) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function markOpenedNotifications() {
      const data = await loadNotifications();
      const hasUnread = Boolean(data?.notifications.some((notification) => !notification.readAt));
      if (!hasUnread || cancelled) return;

      timer = setTimeout(async () => {
        try {
          const response = await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ all: true })
          });
          const body = (await response.json()) as { data?: { readAt: string } };
          if (!response.ok || !body.data || cancelled) return;

          setUnreadCount(0);
          setNotifications((current) => current.map((notification) => (notification.readAt ? notification : { ...notification, readAt: body.data!.readAt })));
        } catch {
          if (!cancelled) setNotificationsError("Status baca belum bisa diperbarui");
        }
      }, 900);
    }

    void markOpenedNotifications();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [loadNotifications, notificationsOpen]);

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
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
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
                    {unreadCount} baru
                  </span>
                </div>
              </div>

              <div className="max-h-[23rem] overflow-y-auto">
                {notificationsLoading && !notifications.length ? (
                  <div className="px-4 py-5 text-center text-xs font-medium text-slate-500">Memuat notifikasi...</div>
                ) : notifications.length ? (
                  <div className="divide-y">
                    {notifications.map((notification) => {
                      const href = safeNotificationHref(notification.href);
                      const content = (
                        <div className="flex min-w-0 gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
                          <span
                            className={cn(
                              "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                              notification.readAt ? "border-slate-200 bg-slate-50 text-slate-500" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            )}
                          >
                            {notification.readAt ? <CheckCheck className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-start justify-between gap-2">
                              <span className="min-w-0 text-sm font-semibold text-slate-950">{notification.title}</span>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                  notification.readAt ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-800"
                                )}
                              >
                                <Circle className={cn("h-2 w-2", notification.readAt ? "fill-slate-400 text-slate-400" : "fill-emerald-600 text-emerald-600")} />
                                {notification.readAt ? "Sudah dibaca" : "Belum dibaca"}
                              </span>
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-600">{notification.message}</span>
                            <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                              <span>{formatNotificationDate(notification.createdAt)}</span>
                              {notification.actor ? <span>oleh {notification.actor.name ?? notification.actor.username}</span> : null}
                            </span>
                          </span>
                        </div>
                      );

                      return href ? (
                        <Link key={notification.id} href={href} onClick={() => setNotificationsOpen(false)}>
                          {content}
                        </Link>
                      ) : (
                        <div key={notification.id}>{content}</div>
                      );
                    })}
                  </div>
                ) : (
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
                )}
                {notificationsError ? <div className="border-t bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700">{notificationsError}</div> : null}
              </div>

              <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Sistem aktif
                </span>
                <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold", unreadCount > 0 ? "text-amber-700" : "text-emerald-700")}>
                  <CheckCheck className="h-3.5 w-3.5" />
                  {unreadCount > 0 ? "Ada belum dibaca" : "Semua terbaca"}
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
