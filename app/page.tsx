import { readdir } from "node:fs/promises";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Dumbbell,
  ExternalLink,
  ListChecks,
  LogIn,
  Mail,
  MapPin,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Users
} from "lucide-react";

import { CoachProfileSection, type LandingCoach } from "@/components/coach-profile-section";
import { CountUpValue } from "@/components/count-up-value";
import { HomeBannerSlider, type HomeBannerSlide } from "@/components/home-banner-slider";
import { LandingHeader } from "@/components/landing-header";
import { LandingGallerySection, type GalleryImage } from "@/components/landing-gallery-section";
import { ScrollReveal } from "@/components/scroll-reveal";
import { getLandingContent, type LandingItemView } from "@/lib/landing";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/system-settings";
import { whatsappHref } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const iconMap = {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Dumbbell,
  ListChecks,
  LogIn,
  Mail,
  MapPin,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Users
};

const benefits = [
  {
    title: "Latihan lebih terarah",
    description: "Setiap murid mengikuti program sesuai level, target, dan evaluasi coach.",
    icon: Target,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  {
    title: "Progress mudah dipantau",
    description: "Coach dan admin bisa melihat perkembangan atlet dari absensi, nilai, dan log latihan.",
    icon: TrendingUp,
    tone: "border-sky-200 bg-sky-50 text-sky-700"
  },
  {
    title: "Operasional club lebih rapi",
    description: "Data murid, coach, cabang olahraga, dan laporan tersimpan dalam satu sistem.",
    icon: ClipboardCheck,
    tone: "border-amber-200 bg-amber-50 text-amber-700"
  }
];

const cardTones = [
  {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white hover:border-emerald-300",
    icon: "bg-emerald-100 text-emerald-700",
    value: "text-emerald-700"
  },
  {
    card: "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white hover:border-sky-300",
    icon: "bg-sky-100 text-sky-700",
    value: "text-sky-700"
  },
  {
    card: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white hover:border-amber-300",
    icon: "bg-amber-100 text-amber-700",
    value: "text-amber-700"
  },
  {
    card: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white hover:border-rose-300",
    icon: "bg-rose-100 text-rose-700",
    value: "text-rose-700"
  },
  {
    card: "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white hover:border-indigo-300",
    icon: "bg-indigo-100 text-indigo-700",
    value: "text-indigo-700"
  }
];

function iconFor(name: string | null | undefined) {
  return iconMap[(name ?? "") as keyof typeof iconMap] ?? ShieldCheck;
}

function SectionHeader({ label, title, description, tone = "emerald" }: { label?: string | null; title: string; description?: string | null; tone?: "emerald" | "sky" | "amber" | "rose" | "indigo" }) {
  const labelTone = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-100",
    sky: "text-sky-700 bg-sky-50 border-sky-100",
    amber: "text-amber-700 bg-amber-50 border-amber-100",
    rose: "text-rose-700 bg-rose-50 border-rose-100",
    indigo: "text-indigo-700 bg-indigo-50 border-indigo-100"
  }[tone];

  return (
    <div className="mx-auto max-w-2xl text-center">
      {label ? <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-normal ${labelTone}`}>{label}</p> : null}
      <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
    </div>
  );
}

function ItemCard({ item, mode = "default", toneIndex = 0 }: { item: LandingItemView; mode?: "default" | "sport" | "stat"; toneIndex?: number }) {
  const Icon = iconFor(item.icon);
  const tone = cardTones[toneIndex % cardTones.length];
  const content = (
    <div className={`h-full rounded-md border p-4 shadow-sm shadow-slate-200/60 transition-colors ${tone.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tone.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        {mode === "stat" && item.value ? <CountUpValue value={item.value} className={`text-2xl font-semibold leading-none ${tone.value}`} /> : null}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-950">{item.title}</h3>
      {mode !== "stat" && item.value ? <p className={`mt-1 text-xl font-semibold ${tone.value}`}>{item.value}</p> : null}
      {item.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p> : null}
      {item.ctaLabel ? (
        <p className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${tone.value}`}>
          {item.ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </p>
      ) : null}
    </div>
  );

  if (item.href) {
    return <Link href={item.href}>{content}</Link>;
  }

  return content;
}

function locationItemFrom(items: LandingItemView[]) {
  return (
    items.find((item) => item.title.toLowerCase().includes("lokasi") || item.icon === "MapPin") ??
    items.find((item) => item.value)
  );
}

async function getUploadedGalleryImages() {
  try {
    const files = await readdir("public/uploads");

    return files
      .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
      .map((file) => `/uploads/${file}`);
  } catch {
    return [];
  }
}

function uniqueGalleryImages(content: Awaited<ReturnType<typeof getLandingContent>>, uploadedImages: string[]): GalleryImage[] {
  const cmsImages = content.items.gallery.flatMap((item) => (item.imageUrl ? [{ src: item.imageUrl, alt: item.title }] : []));
  const fallbackImages = uploadedImages.map((src, index) => ({ src, alt: `Dokumentasi academy ${index + 1}` }));
  const images = cmsImages.length ? cmsImages : fallbackImages;
  const seen = new Set<string>();

  return images.filter((image) => {
    if (seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
}

async function getLandingCoaches(): Promise<LandingCoach[]> {
  const coaches = await prisma.user.findMany({
    where: { role: "COACH", status: "ACTIVE", deletedAt: null },
    include: {
      coachClubs: { include: { club: true } },
      coachProfile: { include: { category: true, sport: true } }
    },
    orderBy: { createdAt: "asc" },
    take: 9
  });

  return coaches.map((coach) => ({
    id: coach.id,
    name: coach.name ?? coach.username,
    username: coach.username,
    image: coach.image ?? coach.coachProfile?.photoUrl ?? null,
    phone: coach.coachProfile?.phone ?? null,
    gender: coach.coachProfile?.gender ?? null,
    address: coach.coachProfile?.address ?? null,
    experienceYears: coach.coachProfile?.experienceYears ?? 0,
    certification: coach.coachProfile?.certification ?? null,
    bio: coach.coachProfile?.bio ?? null,
    sportName: coach.coachProfile?.sport.name ?? "Cabang olahraga",
    categoryName: coach.coachProfile?.category.name ?? "Coach",
    clubNames: coach.coachClubs.map((coachClub) => coachClub.club.name)
  }));
}

export default async function LandingPage() {
  const [content, settings, coaches, uploadedImages] = await Promise.all([getLandingContent(), getSystemSettings(), getLandingCoaches(), getUploadedGalleryImages()]);
  const { hero, features, gallery, coaches: coachSection, sports, statistics, cta, footer } = content.sections;
  const statItems = content.items.statistics.slice(0, 4);
  const galleryImages = uniqueGalleryImages(content, uploadedImages).slice(0, 12);
  const locationItem = locationItemFrom(content.items.footer);
  const locationQuery = locationItem?.value || locationItem?.title || "Jakarta, Indonesia";
  const locationMapHref = locationItem?.href || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;
  const locationEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(locationQuery)}&output=embed`;
  const contactWhatsappHref = whatsappHref(settings.contactWhatsapp);
  const heroItemSlides: HomeBannerSlide[] = content.items.hero.map((item) => ({
    id: item.id ?? `${item.sectionKey}-${item.sortOrder}-${item.title}`,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    eyebrow: item.eyebrow,
    imageUrl: item.imageUrl
  }));
  const heroSectionSlide: HomeBannerSlide = {
    id: hero.id ?? "hero-section",
    title: hero.title,
    subtitle: hero.subtitle,
    description: hero.description,
    eyebrow: hero.eyebrow,
    imageUrl: hero.imageUrl
  };
  const heroSlides: HomeBannerSlide[] = heroItemSlides.length ? heroItemSlides : [heroSectionSlide];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/30 to-orange-50/30 text-slate-950">
      <LandingHeader
        coachesVisible={coachSection.status === "ACTIVE" && Boolean(coaches.length)}
        galleryVisible={gallery.status === "ACTIVE" && Boolean(galleryImages.length)}
        logoUrl={settings.logoUrl}
        systemName={settings.systemName}
        systemSubtitle={settings.systemSubtitle}
      />

      <HomeBannerSlider slides={heroSlides} statItems={statItems} contactWhatsappHref={contactWhatsappHref} />

      <section id="about" className="scroll-mt-20 border-b border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1fr_420px] lg:items-center">
          <ScrollReveal>
            <p className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-emerald-700">Tentang Academy</p>
            <h2 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
              Membantu coach dan pengelola club membina atlet dengan data latihan yang jelas.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              {footer.description || hero.description || `${settings.systemName} mendukung proses pembinaan atlet dari program latihan, absensi, evaluasi coach, hingga laporan perkembangan.`}
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {[
                { label: "Program sesuai level", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                { label: "Evaluasi coach berkala", tone: "border-sky-200 bg-sky-50 text-sky-700" },
                { label: "Laporan progress atlet", tone: "border-amber-200 bg-amber-50 text-amber-700" }
              ].map((item) => (
                <div key={item.label} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${item.tone}`}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {item.label}
                </div>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal className="rounded-md border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-sm shadow-emerald-100/70" delay={0.12} direction="left">
            <p className="text-xs font-semibold uppercase text-slate-500">Fokus Pembinaan</p>
            <div className="mt-3 grid gap-3">
              {content.items.features.slice(0, 3).map((item, index) => {
                const Icon = iconFor(item.icon);
                const tone = cardTones[index % cardTones.length];

                return (
                  <ScrollReveal key={item.id ?? item.title} className={`flex gap-3 rounded-md border bg-white p-3 shadow-sm shadow-slate-200/60 ${tone.card}`} delay={0.16 + index * 0.08} distance={18}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${tone.icon}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p> : null}
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <LandingGallerySection images={galleryImages} section={gallery} />

      <CoachProfileSection coaches={coaches} section={coachSection} />

      <section id="program" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12">
        <ScrollReveal>
          <SectionHeader label={features.subtitle} title={features.title} description={features.description} tone="sky" />
        </ScrollReveal>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {content.items.features.map((item, index) => (
            <ScrollReveal key={item.id ?? item.title} delay={index * 0.07} distance={24}>
              <ItemCard item={item} toneIndex={index} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section id="benefits" className="scroll-mt-20 border-y border-amber-100 bg-gradient-to-br from-white via-amber-50/45 to-sky-50/50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <ScrollReveal>
            <SectionHeader label="Keunggulan" title="Pembinaan atlet lebih rapi dari latihan pertama sampai evaluasi akhir" description="Homepage ini menjelaskan academy, sedangkan sistem di baliknya membantu tim mengelola proses latihan sehari-hari." tone="amber" />
          </ScrollReveal>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {benefits.map((item, index) => {
              const Icon = item.icon;

              return (
                <ScrollReveal key={item.title} className={`rounded-md border p-4 shadow-sm shadow-slate-200/60 ${item.tone}`} delay={index * 0.08} distance={24}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/80 shadow-sm shadow-slate-200/70">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="sports" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12">
        <ScrollReveal>
          <SectionHeader label={sports.subtitle} title={sports.title} description={sports.description} tone="rose" />
        </ScrollReveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.sports.map((item, index) => (
            <ScrollReveal key={item.id ?? item.title} delay={index * 0.08} distance={24}>
              <ItemCard item={item} mode="sport" toneIndex={index + 2} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section id="statistics" className="scroll-mt-20 border-y border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-emerald-50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <ScrollReveal>
            <SectionHeader label={statistics.subtitle} title={statistics.title} description={statistics.description} tone="indigo" />
          </ScrollReveal>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {content.items.statistics.map((item, index) => (
              <ScrollReveal key={item.id ?? item.title} delay={index * 0.07} distance={24}>
                <ItemCard item={item} mode="stat" toneIndex={index + 1} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(120deg,#0f172a_0%,#065f46_45%,#0369a1_100%)] px-4 py-12 text-white">
        <ScrollReveal className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div className="max-w-2xl">
            {cta.subtitle ? <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-normal text-emerald-100">{cta.subtitle}</p> : null}
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{cta.title}</h2>
            {cta.description ? <p className="mt-2 text-sm leading-6 text-slate-200">{cta.description}</p> : null}
          </div>
          <Link href={cta.ctaHref || "/login"} className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-amber-400 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 hover:from-orange-600 hover:to-amber-500 sm:w-auto">
            {cta.ctaLabel || "Masuk Sistem"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </section>

      <footer id="footer" className="scroll-mt-20 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[0.85fr_1.15fr]">
          <ScrollReveal>
            <h2 className="text-base font-semibold">{footer.title}</h2>
            {footer.subtitle ? <p className="mt-1 text-xs font-medium uppercase tracking-normal text-emerald-700">{footer.subtitle}</p> : null}
            {footer.description ? <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">{footer.description}</p> : null}
          </ScrollReveal>
          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {content.items.footer.map((item, index) => {
                const Icon = iconFor(item.icon);
                const tone = cardTones[index % cardTones.length];
                const body = (
                  <div className={`rounded-md border p-3 text-sm shadow-sm shadow-slate-200/60 ${tone.card}`}>
                    <Icon className={`mb-2 h-4 w-4 ${tone.value}`} />
                    <p className="font-semibold">{item.title}</p>
                    {item.value ? <p className="mt-1 break-words text-xs text-slate-500">{item.value}</p> : null}
                  </div>
                );

                return (
                  <ScrollReveal key={item.id ?? item.title} delay={index * 0.07} distance={18}>
                    {item.href ? <Link href={item.href}>{body}</Link> : body}
                  </ScrollReveal>
                );
              })}
            </div>

            <ScrollReveal delay={0.16} distance={18}>
              <div className="overflow-hidden rounded-md border border-sky-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="flex flex-col gap-3 border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">Maps Lokasi</p>
                      <p className="mt-1 break-words text-xs leading-5 text-slate-500">{locationQuery}</p>
                    </div>
                  </div>
                  <Link href={locationMapHref} target="_blank" rel="noreferrer" className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-sky-600 px-3 text-xs font-semibold text-white shadow-sm shadow-sky-200 hover:bg-sky-700 sm:w-auto">
                    Buka Maps
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <iframe
                  title={`Maps lokasi ${locationQuery}`}
                  src={locationEmbedSrc}
                  className="h-64 w-full border-0 sm:h-72"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </footer>
    </main>
  );
}
