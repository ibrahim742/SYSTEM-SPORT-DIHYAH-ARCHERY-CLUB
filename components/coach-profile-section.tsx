"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Award, ChevronLeft, ChevronRight, MapPin, Phone, UserRound, X } from "lucide-react";

import { ScrollReveal } from "@/components/scroll-reveal";
import type { LandingSectionView } from "@/lib/landing";

export type LandingCoach = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  phone: string | null;
  gender: string | null;
  address: string | null;
  experienceYears: number;
  certification: string | null;
  bio: string | null;
  sportName: string;
  categoryName: string;
  clubNames: string[];
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CoachProfileSection({ coaches, section }: { coaches: LandingCoach[]; section: LandingSectionView }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCoach, setSelectedCoach] = useState<LandingCoach | null>(null);
  const visibleCoaches = useMemo(() => {
    if (coaches.length <= 3) return coaches;
    return [0, 1, 2].map((offset) => coaches[(activeIndex + offset) % coaches.length]);
  }, [activeIndex, coaches]);

  if (section.status !== "ACTIVE" || !coaches.length) return null;

  return (
    <section id="coaches" className="scroll-mt-20 border-y border-sky-100 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 px-4 py-12">
      <ScrollReveal className="mx-auto max-w-3xl text-center">
        {section.subtitle ? <p className="inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-sky-700">{section.subtitle}</p> : null}
        <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{section.title}</h2>
        {section.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p> : null}
      </ScrollReveal>

      <div className="mx-auto mt-8 flex max-w-7xl items-center gap-3">
        {coaches.length > 3 ? (
          <button
            aria-label="Coach sebelumnya"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-md border border-sky-200 bg-white text-sky-700 shadow-sm shadow-slate-200/70 hover:bg-sky-50 md:flex"
            onClick={() => setActiveIndex((current) => (current - 1 + coaches.length) % coaches.length)}
            type="button"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}

        <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-3">
          {visibleCoaches.map((coach, index) => (
            <ScrollReveal key={coach.id} delay={index * 0.08} distance={26}>
              <article className="overflow-hidden rounded-md border border-sky-100 bg-white shadow-lg shadow-slate-200/70">
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                  <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white/80 bg-white shadow-lg shadow-slate-950/20">
                    {coach.image ? (
                      <Image src={coach.image} alt={coach.name} fill sizes="112px" unoptimized className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-semibold text-sky-700">{initials(coach.name)}</div>
                    )}
                  </div>
                </div>
                <div className="-mt-2 rounded-t-[1.25rem] bg-white px-4 pb-5 pt-6 text-center sm:px-5">
                  <h3 className="text-sm font-semibold text-slate-950">{coach.name}</h3>
                  <p className="mt-1 text-xs font-medium text-sky-700">{coach.categoryName} · {coach.sportName}</p>
                  <p className="mx-auto mt-3 line-clamp-3 max-w-xs text-xs leading-5 text-slate-500">{coach.bio || "Coach aktif untuk pembinaan atlet dan pendampingan latihan academy."}</p>
                  <button
                    className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-gradient-to-r from-emerald-600 to-sky-600 px-5 text-xs font-semibold text-white shadow-sm shadow-slate-200/70 hover:from-emerald-700 hover:to-sky-700"
                    onClick={() => setSelectedCoach(coach)}
                    type="button"
                  >
                    {section.ctaLabel || "Lihat Data Coach"}
                  </button>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {coaches.length > 3 ? (
          <button
            aria-label="Coach berikutnya"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-md border border-sky-200 bg-white text-sky-700 shadow-sm shadow-slate-200/70 hover:bg-sky-50 md:flex"
            onClick={() => setActiveIndex((current) => (current + 1) % coaches.length)}
            type="button"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        ) : null}
      </div>

      {coaches.length > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {coaches.map((coach, index) => (
            <button
              aria-label={`Tampilkan coach ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-sky-600" : "w-2.5 bg-sky-200 hover:bg-sky-300"}`}
              key={coach.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}

      {selectedCoach ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-md border bg-white shadow-2xl shadow-slate-950/30">
            <div className="flex items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-950">{selectedCoach.name}</h3>
                <p className="text-xs font-medium text-sky-700">{selectedCoach.categoryName} · {selectedCoach.sportName}</p>
              </div>
              <button aria-label="Tutup data coach" className="flex h-9 w-9 items-center justify-center rounded-md border text-slate-600 hover:bg-slate-50" onClick={() => setSelectedCoach(null)} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[220px_1fr]">
              <div className="relative h-56 overflow-hidden rounded-md bg-slate-100 sm:h-64">
                {selectedCoach.image ? (
                  <Image src={selectedCoach.image} alt={selectedCoach.name} fill sizes="220px" unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-emerald-100 text-4xl font-semibold text-sky-700">{initials(selectedCoach.name)}</div>
                )}
              </div>
              <div className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">{selectedCoach.bio || "Coach aktif untuk pembinaan atlet dan pendampingan latihan academy."}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-sky-100 bg-sky-50 p-3">
                    <Award className="mb-2 h-4 w-4 text-sky-700" />
                    <p className="text-xs font-semibold text-slate-950">Pengalaman</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedCoach.experienceYears} tahun</p>
                  </div>
                  <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                    <UserRound className="mb-2 h-4 w-4 text-emerald-700" />
                    <p className="text-xs font-semibold text-slate-950">Sertifikasi</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedCoach.certification || "-"}</p>
                  </div>
                  <div className="rounded-md border border-amber-100 bg-amber-50 p-3">
                    <Phone className="mb-2 h-4 w-4 text-amber-700" />
                    <p className="text-xs font-semibold text-slate-950">Kontak</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedCoach.phone || "-"}</p>
                  </div>
                  <div className="rounded-md border border-rose-100 bg-rose-50 p-3">
                    <MapPin className="mb-2 h-4 w-4 text-rose-700" />
                    <p className="text-xs font-semibold text-slate-950">Club</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedCoach.clubNames.length ? selectedCoach.clubNames.join(", ") : selectedCoach.address || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
