"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ListChecks,
  ShieldCheck,
  Target,
  Trophy,
  Users
} from "lucide-react";

import { CountUpValue } from "@/components/count-up-value";
import { ScrollReveal } from "@/components/scroll-reveal";
import type { LandingItemView } from "@/lib/landing";

export type HomeBannerSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  eyebrow: string | null;
  imageUrl: string | null;
};

type HomeBannerSliderProps = {
  slides: HomeBannerSlide[];
  statItems: LandingItemView[];
  contactWhatsappHref: string | null;
};

const fallbackVisuals = [
  "bg-[linear-gradient(125deg,#0f172a_0%,#065f46_42%,#0369a1_100%)]",
  "bg-[linear-gradient(125deg,#111827_0%,#0f766e_44%,#b45309_100%)]",
  "bg-[linear-gradient(125deg,#1e293b_0%,#4338ca_48%,#047857_100%)]"
];

const statIconMap = {
  CalendarCheck,
  ClipboardCheck,
  ListChecks,
  ShieldCheck,
  Target,
  Trophy,
  Users
};

const statCardTones = [
  "from-emerald-600 to-sky-600 text-white",
  "from-slate-50 to-emerald-50 text-slate-950",
  "from-sky-600 to-emerald-600 text-white"
];

function iconFor(name: string | null | undefined) {
  return statIconMap[(name ?? "") as keyof typeof statIconMap] ?? ShieldCheck;
}

function nextIndex(current: number, total: number) {
  return current + 1 >= total ? 0 : current + 1;
}

function previousIndex(current: number, total: number) {
  return current - 1 < 0 ? total - 1 : current - 1;
}

export function HomeBannerSlider({ slides, statItems, contactWhatsappHref }: HomeBannerSliderProps) {
  const safeSlides = useMemo(
    () =>
      slides.length
        ? slides
        : [
          {
            id: "default-hero",
            title: "Akademi Olahraga dengan Monitoring Latihan Terukur",
            subtitle: "Pembinaan atlet, program latihan, absensi, evaluasi coach, dan laporan progress dalam satu sistem academy.",
            description: null,
            eyebrow: "Academy olahraga modern",
            imageUrl: null
          }
        ],
    [slides]
  );
  const [active, setActive] = useState(0);
  const activeSlide = safeSlides[active] ?? safeSlides[0];
  const hasMultipleSlides = safeSlides.length > 1;
  const contactHref = contactWhatsappHref ?? "#footer";

  useEffect(() => {
    setActive(0);
  }, [safeSlides.length]);

  useEffect(() => {
    if (!hasMultipleSlides) return;
    const interval = window.setInterval(() => {
      setActive((current) => nextIndex(current, safeSlides.length));
    }, 6500);

    return () => window.clearInterval(interval);
  }, [hasMultipleSlides, safeSlides.length]);

  return (
    <section className={`relative flex min-h-[640px] flex-col justify-center overflow-hidden bg-slate-950 text-white sm:min-h-[720px] lg:min-h-screen ${statItems.length ? "pb-8 md:mb-28 md:overflow-visible md:pb-24" : ""}`}>
      <div className="absolute inset-0">
        {safeSlides.map((slide, index) => (
          <div
            aria-hidden={index !== active}
            className={`absolute inset-0 transition-opacity duration-700 ${index === active ? "opacity-100" : "opacity-0"}`}
            key={slide.id}
          >
            {slide.imageUrl ? (
              <Image src={slide.imageUrl} alt={slide.title} fill priority={index === 0} sizes="100vw" unoptimized className="object-cover" />
            ) : (
              <div className={`absolute inset-0 ${fallbackVisuals[index % fallbackVisuals.length]}`}>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:88px_88px]" />
                <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.12)_48%,transparent_49%,transparent_100%)] bg-[size:44px_44px]" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-slate-950/65" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/15 to-slate-950/45" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-28 text-center sm:pb-16 md:pb-20 md:pt-36">
        <div className="mx-auto max-w-5xl">
          {activeSlide.eyebrow ? <p className="text-sm font-bold uppercase leading-7 text-emerald-100 sm:text-base">{activeSlide.eyebrow}</p> : null}
          <h1 className="mx-auto mt-4 max-w-5xl text-3xl font-semibold leading-tight text-white sm:mt-5 sm:text-6xl sm:leading-[1.08] lg:text-7xl">{activeSlide.title}</h1>
          {activeSlide.subtitle ? <p className="mx-auto mt-6 max-w-3xl text-base font-medium leading-7 text-slate-100 sm:text-lg">{activeSlide.subtitle}</p> : null}
          {activeSlide.description ? <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-200">{activeSlide.description}</p> : null}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link href="/login" className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-gradient-to-r from-emerald-600 to-sky-600 px-5 text-sm font-bold text-white shadow-lg shadow-slate-950/20 hover:from-emerald-700 hover:to-sky-700 sm:h-14 sm:w-auto sm:min-w-[260px] sm:px-7">
              Masuk Sistem
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#about" className="inline-flex h-12 w-full items-center justify-center rounded-md border border-white/60 bg-white/5 px-5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/15 sm:h-14 sm:w-auto sm:min-w-[220px] sm:px-6">
              Tentang Academy
            </Link>
            <Link href={contactHref} target={contactWhatsappHref ? "_blank" : undefined} rel={contactWhatsappHref ? "noreferrer" : undefined} className="inline-flex h-12 w-full items-center justify-center rounded-md border border-white/60 bg-white/5 px-5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/15 sm:h-14 sm:w-auto sm:min-w-[220px] sm:px-6">
              Hubungi Kami
            </Link>
          </div>
        </div>

        {hasMultipleSlides ? (
          <div className="pointer-events-none absolute inset-x-4 top-1/2 hidden -translate-y-1/2 items-center justify-between md:flex">
            <button
              aria-label="Slide sebelumnya"
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-md border border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15"
              onClick={() => setActive((current) => previousIndex(current, safeSlides.length))}
              type="button"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              aria-label="Slide berikutnya"
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-md border border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15"
              onClick={() => setActive((current) => nextIndex(current, safeSlides.length))}
              type="button"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>
        ) : null}
      </div>

      {hasMultipleSlides ? (
        <div className="relative z-10 mb-5 flex items-center justify-center gap-2 md:absolute md:bottom-36 md:left-1/2 md:mb-0 md:-translate-x-1/2">
          {safeSlides.map((slide, index) => (
            <button
              aria-label={`Tampilkan slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70"}`}
              key={slide.id}
              onClick={() => setActive(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}

      {statItems.length ? (
        <div className="relative z-20 mx-auto w-[calc(100%-2rem)] max-w-6xl md:absolute md:inset-x-4 md:bottom-0 md:w-auto md:translate-y-1/2">
          <ScrollReveal className="grid overflow-hidden rounded-md bg-white shadow-2xl shadow-slate-950/20 md:grid-cols-3" delay={0.1} distance={34}>
            {statItems.slice(0, 3).map((item, index) => {
              const Icon = iconFor(item.icon);
              const isLight = index % 3 === 1;

              return (
                <div key={item.id ?? item.title} className={`flex min-h-28 items-center gap-4 bg-gradient-to-r px-4 py-5 sm:justify-center sm:gap-5 sm:px-6 sm:py-7 md:min-h-36 ${statCardTones[index % statCardTones.length]}`}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md sm:h-14 sm:w-14 ${isLight ? "bg-sky-600 text-white" : "bg-white text-sky-600"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-base font-semibold sm:text-lg ${isLight ? "text-sky-600" : "text-white"}`}>{item.title}</p>
                    {item.value ? <CountUpValue value={item.value} className={`mt-1 block text-3xl font-semibold leading-none sm:text-4xl ${isLight ? "text-slate-950" : "text-white"}`} /> : null}
                  </div>
                </div>
              );
            })}
          </ScrollReveal>
        </div>
      ) : null}
    </section>
  );
}
