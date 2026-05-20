"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";

type LandingHeaderProps = {
  galleryVisible: boolean;
  coachesVisible: boolean;
  logoUrl: string | null;
  systemName: string;
  systemSubtitle: string;
};

const baseNavItems = [
  { href: "/", label: "Home" },
  { href: "#about", label: "Tentang" },
  { href: "#program", label: "Program" },
  { href: "#sports", label: "Olahraga" },
  { href: "#footer", label: "Kontak" }
];

export function LandingHeader({ galleryVisible, coachesVisible, logoUrl, systemName, systemSubtitle }: LandingHeaderProps) {
  const [open, setOpen] = useState(false);
  const navItems = [
    baseNavItems[0],
    baseNavItems[1],
    ...(galleryVisible ? [{ href: "#gallery", label: "Galeri" }] : []),
    ...(coachesVisible ? [{ href: "#coaches", label: "Coach" }] : []),
    ...baseNavItems.slice(2)
  ];

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/85 text-white shadow-lg shadow-slate-950/15 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:h-20">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={closeMenu}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-emerald-500 to-sky-600 text-white shadow-sm shadow-slate-950/20 md:h-12 md:w-12">
            {logoUrl ? <Image src={logoUrl} alt={systemName} width={48} height={48} unoptimized className="h-full w-full object-cover" /> : <BarChart3 className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-5 text-white sm:text-lg md:text-2xl">{systemName}</p>
            <p className="truncate text-[11px] font-medium text-white/70">{systemSubtitle}</p>
          </div>
        </Link>

        <nav className="hidden h-full items-stretch text-sm font-semibold tracking-normal text-white/90 lg:flex">
          {navItems.map((item, index) => (
            <Link key={item.href} href={item.href} className={`flex items-center px-4 hover:text-sky-300 ${index === 0 ? "border-b-2 border-sky-400 text-sky-300" : ""}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/login" className="hidden h-10 items-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-sky-600 px-4 text-xs font-semibold text-white shadow-sm shadow-slate-950/20 hover:from-emerald-700 hover:to-sky-700 sm:inline-flex md:h-11 md:px-5 md:text-sm">
            <LogIn className="h-3.5 w-3.5" />
            Login
          </Link>
          <button
            aria-expanded={open}
            aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white hover:bg-white/15 lg:hidden"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl shadow-slate-950/20 lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1 text-sm font-semibold text-white/90">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-3 hover:bg-white/10 hover:text-sky-300" onClick={closeMenu}>
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-sky-600 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 sm:hidden" onClick={closeMenu}>
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
