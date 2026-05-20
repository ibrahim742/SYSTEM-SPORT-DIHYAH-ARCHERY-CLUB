import { cn } from "@/lib/utils";

export function levelTone(level: string) {
  const normalized = level.toLowerCase();

  if (normalized === "pengenalan") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (normalized === "dasar") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "lanjutan") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (normalized === "prestasi") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function levelAccent(level: string) {
  const normalized = level.toLowerCase();

  if (normalized === "pengenalan") return "border-l-sky-300 bg-sky-50/20";
  if (normalized === "dasar") return "border-l-emerald-300 bg-emerald-50/20";
  if (normalized === "lanjutan") return "border-l-violet-300 bg-violet-50/20";
  if (normalized === "prestasi") return "border-l-amber-300 bg-amber-50/20";

  return "border-l-slate-300 bg-slate-50/20";
}

export function intensityTone(intensity: string) {
  const normalized = intensity.toLowerCase();

  if (normalized === "rendah") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "sedang") return "border-sky-200 bg-sky-50 text-sky-700";
  if (normalized === "tinggi") return "border-rose-200 bg-rose-50 text-rose-700";

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function softPill(className?: string) {
  return cn("inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-semibold", className);
}
