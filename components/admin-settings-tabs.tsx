"use client";

import { useState } from "react";
import { Building2, Layers3, Settings, Wrench } from "lucide-react";

import { BrandingSettingsManager } from "@/components/branding-settings-manager";
import { ClubAdminManager } from "@/components/club-admin-manager";
import { MaintenanceManager } from "@/components/maintenance-manager";
import { ProgramAdminManager } from "@/components/program-admin-manager";
import { cn } from "@/lib/utils";

type Level = "PENGENALAN" | "DASAR" | "LANJUTAN" | "PRESTASI";
type ProgramStatus = "ACTIVE" | "INACTIVE";
type ProgramType = "LATIHAN" | "PERSIAPAN_TURNAMEN";
type SportOption = { id: string; name: string };

type ProgramRow = {
  id: string;
  slug: string;
  sportId: string;
  sportName: string;
  type: ProgramType;
  name: string;
  level: Level;
  duration: string;
  materials: number;
  intensity: string;
  description: string | null;
  status: ProgramStatus;
  details: Array<{
    id: string;
    day: string;
    material: string;
    set: string;
    reps: string;
    duration: string;
    note: string | null;
    order: number;
  }>;
};

type BrandingSettings = {
  systemName: string;
  systemSubtitle: string;
  loginSubtitle: string;
  contactWhatsapp: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
};

type ClubRow = {
  id: string;
  name: string;
  city: string | null;
  status: ProgramStatus;
  coachCount: number;
  studentCount: number;
};

type Tab = "branding" | "program" | "club" | "maintenance";

export function AdminSettingsTabs({ settings, programs, sports, clubs }: { settings: BrandingSettings; programs: ProgramRow[]; sports: SportOption[]; clubs: ClubRow[] }) {
  const [tab, setTab] = useState<Tab>("branding");

  return (
    <div className="space-y-3">
      <section className="rounded-md border bg-background shadow-sm shadow-slate-200/60">
        <div className="border-b bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 px-3 py-2">
          <h2 className="text-sm font-semibold">Pengaturan Admin</h2>
          <p className="text-xs text-muted-foreground">Kelola branding sistem, master Program Latihan, dan Club Coach.</p>
        </div>
        <div className="flex flex-wrap gap-2 px-3 py-2 text-xs">
          <button
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-medium transition-colors",
              tab === "branding" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
            onClick={() => setTab("branding")}
            type="button"
          >
            <Settings className="h-3.5 w-3.5" />
            Branding Sistem
          </button>
          <button
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-medium transition-colors",
              tab === "program" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
            onClick={() => setTab("program")}
            type="button"
          >
            <Layers3 className="h-3.5 w-3.5" />
            Program Latihan
          </button>
          <button
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-medium transition-colors",
              tab === "club" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
            onClick={() => setTab("club")}
            type="button"
          >
            <Building2 className="h-3.5 w-3.5" />
            Club Coach
          </button>
          <button
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-medium transition-colors",
              tab === "maintenance" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white text-slate-600 hover:bg-slate-50"
            )}
            onClick={() => setTab("maintenance")}
            type="button"
          >
            <Wrench className="h-3.5 w-3.5" />
            Maintenance
          </button>
        </div>
      </section>

      {tab === "branding" ? <BrandingSettingsManager settings={settings} /> : null}
      {tab === "program" ? <ProgramAdminManager programs={programs} sports={sports} /> : null}
      {tab === "club" ? <ClubAdminManager clubs={clubs} /> : null}
      {tab === "maintenance" ? <MaintenanceManager /> : null}
    </div>
  );
}
