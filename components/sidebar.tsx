"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  ChevronDown,
  ClipboardCheck,
  X,
  FileText,
  KeyRound,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  PanelsTopLeft,
  Trophy,
  Target,
  TrendingUp,
  UserCircle,
  UserRoundCheck,
  Users
} from "lucide-react";

import { cn } from "@/lib/utils";

const navGroups = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { href: "/dashboard", label: "Dashboard Coach", icon: LayoutDashboard },
      { href: "/profil", label: "Profil Saya", icon: UserCircle }
    ]
  },
  {
    id: "management",
    label: "Manajemen",
    icon: Users,
    items: [
      { href: "/murid", label: "Data Murid", icon: Users },
      { href: "/program", label: "Program Latihan", icon: Target },
      { href: "/assign", label: "Assign Program", icon: UserRoundCheck },
      { href: "/jadwal", label: "Jadwal Latihan", icon: CalendarClock }
    ]
  },
  {
    id: "admin",
    label: "Admin",
    icon: KeyRound,
    items: [
      { href: "/akun", label: "Manajemen Akun", icon: KeyRound },
      { href: "/admin/pengaturan", label: "Pengaturan Admin", icon: Settings },
      { href: "/admin/cabang-olahraga", label: "Cabang Olahraga", icon: Trophy },
      { href: "/admin/company-profile", label: "CMS Landing Page", icon: PanelsTopLeft }
    ]
  },
  {
    id: "training",
    label: "Latihan Logbook",
    icon: ShieldCheck,
    items: [
      { href: "/absensi", label: "Absensi", icon: CalendarCheck },
      { href: "/penilaian", label: "Penilaian", icon: ClipboardCheck },
      { href: "/monitoring", label: "Monitoring", icon: Activity }
    ]
  },
  {
    id: "report",
    label: "Laporan",
    icon: FileText,
    items: [{ href: "/laporan", label: "Laporan", icon: FileText }]
  }
];

const muridGroups = [
  {
    id: "portal",
    label: "Ringkasan",
    icon: LayoutDashboard,
    items: [
      { href: "/portal", label: "Ringkasan Saya", icon: LayoutDashboard },
      { href: "/profil", label: "Profil Saya", icon: UserCircle }
    ]
  },
  {
    id: "murid-program",
    label: "Program",
    icon: Target,
    items: [
      { href: "/portal/program", label: "Program Saya", icon: Target },
      { href: "/portal/progress", label: "Progress Saya", icon: TrendingUp },
      { href: "/portal/jadwal", label: "Jadwal Saya", icon: CalendarClock }
    ]
  },
  {
    id: "murid-evaluasi",
    label: "Evaluasi",
    icon: ClipboardCheck,
    items: [
      { href: "/portal/absensi", label: "Absensi Saya", icon: CalendarCheck },
      { href: "/portal/nilai", label: "Nilai Coach", icon: ClipboardCheck }
    ]
  },
  {
    id: "murid-latihan",
    label: "Latihan",
    icon: Activity,
    items: [{ href: "/portal/log", label: "Log Latihan", icon: FileText }]
  }
];

type SidebarRole = "ADMIN" | "COACH" | "MURID" | undefined;
type SidebarBranding = {
  systemName: string;
  systemSubtitle: string;
  logoUrl: string | null;
};

function groupsForRole(role: SidebarRole) {
  if (role === "MURID") return muridGroups;
  if (role === "ADMIN") return navGroups;
  return navGroups.filter((group) => group.id !== "admin");
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ role, branding, onNavigate }: { role?: SidebarRole; branding: SidebarBranding; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = groupsForRole(role);
  const activeGroupId =
    groups.find((group) => group.items.some((item) => isActive(pathname, item.href)))?.id ?? groups[0]?.id ?? "dashboard";
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.id, group.id === activeGroupId]))
  );

  const expandedGroups = useMemo(
    () => ({
      ...openGroups,
      [activeGroupId]: true
    }),
    [activeGroupId, openGroups]
  );

  function toggleGroup(groupId: string) {
    setOpenGroups((current) => ({
      ...current,
      [groupId]: !current[groupId]
    }));
  }

  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-500 text-white shadow-sm shadow-emerald-950/20">
          {branding.logoUrl ? <Image src={branding.logoUrl} alt={branding.systemName} width={36} height={36} unoptimized className="h-full w-full object-cover" /> : <BarChart3 className="h-[18px] w-[18px]" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-5 text-white">{branding.systemName}</p>
          <p className="truncate text-xs leading-4 text-slate-400">{branding.systemSubtitle}</p>
        </div>
      </div>
      <nav className="space-y-1.5 px-2.5 py-4">
        {groups.map((group) => {
          const groupActive = group.items.some((item) => isActive(pathname, item.href));
          const groupOpen = expandedGroups[group.id];
          const GroupIcon = group.icon;

          return (
            <div key={group.id}>
              <button
                aria-expanded={groupOpen}
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-900/80 hover:text-white",
                  groupActive && "bg-slate-900 text-white ring-1 ring-inset ring-slate-700/80"
                )}
                onClick={() => toggleGroup(group.id)}
                type="button"
              >
                <GroupIcon className={cn("h-[18px] w-[18px] shrink-0", groupActive && "text-emerald-300")} />
                <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", groupOpen && "rotate-180 text-slate-200")} />
              </button>

              {groupOpen ? (
                <motion.div initial={false} animate={{ opacity: 1 }} className="ml-4 mt-1.5 space-y-1 border-l border-slate-800 pl-2">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;

                    return (
                      <Link key={item.href} href={item.href} onClick={onNavigate}>
                        <motion.div
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-900/70 hover:text-white",
                            active && "bg-emerald-500/15 text-emerald-100 ring-1 ring-inset ring-emerald-400/25"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", active && "text-emerald-300")} />
                          <span className="truncate">{item.label}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                </motion.div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar({ role, branding }: { role?: SidebarRole; branding: SidebarBranding }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-y-auto border-r border-slate-900 bg-slate-950 md:block">
      <SidebarContent role={role} branding={branding} />
    </aside>
  );
}

export function MobileSidebar({ role, branding, open, onClose }: { role?: SidebarRole; branding: SidebarBranding; open: boolean; onClose: () => void }) {
  return (
    <div className={cn("fixed inset-0 z-50 md:hidden", !open && "pointer-events-none")}>
      <motion.div
        animate={{ opacity: open ? 1 : 0 }}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        initial={false}
        onClick={onClose}
      />
      <motion.aside
        animate={{ x: open ? 0 : -288 }}
        className="absolute inset-y-0 left-0 w-64 border-r border-slate-900 bg-slate-950 shadow-xl"
        initial={false}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
      >
        <button
          aria-label="Tutup menu"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent role={role} branding={branding} onNavigate={onClose} />
      </motion.aside>
    </div>
  );
}
