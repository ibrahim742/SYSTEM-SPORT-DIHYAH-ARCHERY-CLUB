"use client";

import type React from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { MobileSidebar, Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

type AppShellUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
  role?: "ADMIN" | "COACH" | "MURID";
} | null;

type AppShellBranding = {
  systemName: string;
  systemSubtitle: string;
  logoUrl: string | null;
  faviconUrl: string | null;
};

export function AppShell({ children, user, branding }: { children: React.ReactNode; user?: AppShellUser; branding: AppShellBranding }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <Sidebar role={user?.role} branding={branding} />
      <MobileSidebar role={user?.role} branding={branding} open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-col md:pl-64">
        <Topbar user={user} branding={branding} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="min-w-0 flex-1 p-3">{children}</main>
      </div>
    </div>
  );
}
