import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const landingSectionKeys = ["hero", "features", "gallery", "coaches", "sports", "statistics", "cta", "footer"] as const;
export type LandingSectionKey = (typeof landingSectionKeys)[number];

export type LandingSectionView = {
  id?: string;
  key: LandingSectionKey;
  title: string;
  subtitle: string | null;
  description: string | null;
  eyebrow: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  status: "ACTIVE" | "INACTIVE";
  sortOrder: number;
};

export type LandingItemView = {
  id?: string;
  sectionKey: LandingSectionKey;
  title: string;
  subtitle: string | null;
  description: string | null;
  eyebrow: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  icon: string | null;
  value: string | null;
  href: string | null;
  sortOrder: number;
  status: "ACTIVE" | "INACTIVE";
};

export type LandingContent = {
  sections: Record<LandingSectionKey, LandingSectionView>;
  items: Record<LandingSectionKey, LandingItemView[]>;
};

const defaultSections: Record<LandingSectionKey, LandingSectionView> = {
  hero: {
    key: "hero",
    title: "Akademi Olahraga dengan Monitoring Latihan Terukur",
    subtitle: "Pembinaan atlet, program latihan, absensi, evaluasi coach, dan laporan progress dalam satu sistem academy.",
    description: "Kami membantu club dan academy olahraga mengelola proses latihan lebih rapi, transparan, dan mudah dipantau oleh coach, admin, serta murid.",
    eyebrow: "Academy olahraga modern",
    imageUrl: null,
    ctaLabel: "Masuk Sistem",
    ctaHref: "/login",
    status: "ACTIVE",
    sortOrder: 1
  },
  features: {
    key: "features",
    title: "Program dan Layanan Academy",
    subtitle: "Program pembinaan",
    description: "Layanan utama untuk membantu coach menyusun latihan, memantau kehadiran, memberi penilaian, dan membaca perkembangan atlet.",
    eyebrow: null,
    imageUrl: null,
    ctaLabel: null,
    ctaHref: null,
    status: "ACTIVE",
    sortOrder: 2
  },
  gallery: {
    key: "gallery",
    title: "Momen latihan, program, dan aktivitas academy",
    subtitle: "Galeri Academy",
    description: "Dokumentasi visual dari konten yang tersimpan di sistem landing dan upload academy.",
    eyebrow: null,
    imageUrl: null,
    ctaLabel: null,
    ctaHref: null,
    status: "ACTIVE",
    sortOrder: 3
  },
  coaches: {
    key: "coaches",
    title: "Coach yang mendampingi proses latihan",
    subtitle: "Profile Coach",
    description: "Data coach diambil langsung dari akun dan profil coach yang tersimpan di sistem.",
    eyebrow: null,
    imageUrl: null,
    ctaLabel: "Lihat Data Coach",
    ctaHref: null,
    status: "ACTIVE",
    sortOrder: 4
  },
  sports: {
    key: "sports",
    title: "Cabang Olahraga yang Tersedia",
    subtitle: "Pilihan latihan",
    description: "Academy dapat menampilkan dan mengelola cabang olahraga sesuai kebutuhan pembinaan atlet.",
    eyebrow: null,
    imageUrl: null,
    ctaLabel: null,
    ctaHref: null,
    status: "ACTIVE",
    sortOrder: 5
  },
  statistics: {
    key: "statistics",
    title: "Ringkasan Academy",
    subtitle: "Statistik pembinaan",
    description: "Angka utama yang membantu orang tua, coach, dan pengelola melihat aktivitas academy secara cepat.",
    eyebrow: null,
    imageUrl: null,
    ctaLabel: null,
    ctaHref: null,
    status: "ACTIVE",
    sortOrder: 6
  },
  cta: {
    key: "cta",
    title: "Masuk ke dashboard untuk mulai memantau latihan",
    subtitle: "Akses sistem",
    description: "Kelola data murid, program latihan, absensi, penilaian coach, dan laporan progress dari dashboard academy.",
    eyebrow: null,
    imageUrl: null,
    ctaLabel: "Login Dashboard",
    ctaHref: "/login",
    status: "ACTIVE",
    sortOrder: 7
  },
  footer: {
    key: "footer",
    title: "DIHYAH ARCHERY CLUB",
    subtitle: "Academy olahraga",
    description: "Company profile dan sistem monitoring latihan untuk academy, club olahraga, coach, dan atlet.",
    eyebrow: null,
    imageUrl: null,
    ctaLabel: null,
    ctaHref: null,
    status: "ACTIVE",
    sortOrder: 8
  }
};

const defaultItems: Record<LandingSectionKey, LandingItemView[]> = {
  hero: [
    { sectionKey: "hero", title: "Pembinaan Panahan dengan Data Latihan yang Rapi", subtitle: "Program academy", description: "Pantau latihan, absensi, evaluasi coach, dan perkembangan atlet dari satu dashboard.", eyebrow: "DIHYAH ARCHERY CLUB", imageUrl: null, ctaLabel: "Masuk Sistem", ctaHref: "/login", icon: "Target", value: null, href: null, sortOrder: 1, status: "ACTIVE" },
    { sectionKey: "hero", title: "Coach Lebih Mudah Membaca Progress Atlet", subtitle: "Monitoring latihan", description: "Setiap catatan latihan dan penilaian coach tersimpan sebagai dasar evaluasi berikutnya.", eyebrow: "Evaluasi terukur", imageUrl: null, ctaLabel: "Lihat Program", ctaHref: "#program", icon: "TrendingUp", value: null, href: null, sortOrder: 2, status: "ACTIVE" },
    { sectionKey: "hero", title: "Operasional Academy Lebih Terstruktur", subtitle: "Satu sistem club", description: "Kelola murid, coach, cabang olahraga, program, absensi, dan laporan tanpa tercecer.", eyebrow: "Dashboard academy", imageUrl: null, ctaLabel: "Tentang Academy", ctaHref: "#about", icon: "ShieldCheck", value: null, href: null, sortOrder: 3, status: "ACTIVE" }
  ],
  cta: [],
  gallery: [
    { sectionKey: "gallery", title: "Dokumentasi latihan academy", subtitle: null, description: null, eyebrow: null, imageUrl: "/uploads/landing-e85301d5-52a0-44ad-8185-26b32039623a.jpg", ctaLabel: null, ctaHref: null, icon: null, value: null, href: null, sortOrder: 1, status: "ACTIVE" },
    { sectionKey: "gallery", title: "Program pembinaan atlet", subtitle: null, description: null, eyebrow: null, imageUrl: "/uploads/landing-8ca8be68-1f24-419a-b3de-7fab761c0a0d.jpg", ctaLabel: null, ctaHref: null, icon: null, value: null, href: null, sortOrder: 2, status: "ACTIVE" },
    { sectionKey: "gallery", title: "Aktivitas kelas latihan", subtitle: null, description: null, eyebrow: null, imageUrl: "/uploads/landing-748068b0-8c6e-42ec-84c8-c1ff57f7d10f.jpg", ctaLabel: null, ctaHref: null, icon: null, value: null, href: null, sortOrder: 3, status: "ACTIVE" },
    { sectionKey: "gallery", title: "Suasana evaluasi coach", subtitle: null, description: null, eyebrow: null, imageUrl: "/uploads/landing-e7caa871-d36a-4038-9259-85e2e072f61c.jpg", ctaLabel: null, ctaHref: null, icon: null, value: null, href: null, sortOrder: 4, status: "ACTIVE" },
    { sectionKey: "gallery", title: "Momen academy", subtitle: null, description: null, eyebrow: null, imageUrl: "/uploads/landing-da0351c5-cc2d-4c49-aa62-a5e087bb325d.jpg", ctaLabel: null, ctaHref: null, icon: null, value: null, href: null, sortOrder: 5, status: "ACTIVE" }
  ],
  coaches: [],
  features: [
    { sectionKey: "features", title: "Program Latihan Berlevel", subtitle: null, description: "Materi latihan dapat disusun sesuai level atlet, target pembinaan, dan intensitas program.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "Target", value: null, href: null, sortOrder: 1, status: "ACTIVE" },
    { sectionKey: "features", title: "Absensi dan Logbook", subtitle: null, description: "Kehadiran dan catatan latihan tersimpan rapi untuk melihat konsistensi atlet.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "CalendarCheck", value: null, href: null, sortOrder: 2, status: "ACTIVE" },
    { sectionKey: "features", title: "Penilaian Coach", subtitle: null, description: "Coach dapat memberi evaluasi teknik, fokus, stamina, dan catatan perkembangan.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "ClipboardCheck", value: null, href: null, sortOrder: 3, status: "ACTIVE" },
    { sectionKey: "features", title: "Monitoring Progress", subtitle: null, description: "Admin dan coach dapat membaca perkembangan atlet dari data latihan yang terukur.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "TrendingUp", value: null, href: null, sortOrder: 4, status: "ACTIVE" }
  ],
  sports: [
    { sectionKey: "sports", title: "Panahan", subtitle: null, description: "Pembinaan teknik dasar, scoring, konsistensi grouping, dan simulasi kompetisi.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "Target", value: null, href: null, sortOrder: 1, status: "ACTIVE" },
    { sectionKey: "sports", title: "Boxing", subtitle: null, description: "Latihan teknik, footwork, stamina, disiplin, dan evaluasi intensitas latihan.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "Dumbbell", value: null, href: null, sortOrder: 2, status: "ACTIVE" },
    { sectionKey: "sports", title: "Futsal", subtitle: null, description: "Program tim, kehadiran latihan, perkembangan pemain, dan evaluasi performa.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "Trophy", value: null, href: null, sortOrder: 3, status: "ACTIVE" }
  ],
  statistics: [
    { sectionKey: "statistics", title: "Atlet Aktif", subtitle: null, description: "Murid yang mengikuti program pembinaan academy.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "Users", value: "120+", href: null, sortOrder: 1, status: "ACTIVE" },
    { sectionKey: "statistics", title: "Program Latihan", subtitle: null, description: "Materi pembinaan untuk beberapa level kemampuan.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "ListChecks", value: "30+", href: null, sortOrder: 2, status: "ACTIVE" },
    { sectionKey: "statistics", title: "Coach Terlibat", subtitle: null, description: "Pelatih yang membantu evaluasi dan pembinaan atlet.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "Trophy", value: "12+", href: null, sortOrder: 3, status: "ACTIVE" },
    { sectionKey: "statistics", title: "Kehadiran Latihan", subtitle: null, description: "Rekap kedisiplinan latihan yang mudah ditindaklanjuti.", eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "CalendarCheck", value: "92%", href: null, sortOrder: 4, status: "ACTIVE" }
  ],
  footer: [
    { sectionKey: "footer", title: "Email", subtitle: null, description: null, eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "Mail", value: "info@altlit.academy", href: "mailto:info@altlit.academy", sortOrder: 1, status: "ACTIVE" },
    { sectionKey: "footer", title: "Lokasi", subtitle: null, description: null, eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "MapPin", value: "Jakarta, Indonesia", href: null, sortOrder: 2, status: "ACTIVE" },
    { sectionKey: "footer", title: "Login", subtitle: null, description: null, eyebrow: null, imageUrl: null, ctaLabel: null, ctaHref: null, icon: "LogIn", value: "Dashboard Academy", href: "/login", sortOrder: 3, status: "ACTIVE" }
  ]
};

function isKnownSectionKey(value: string): value is LandingSectionKey {
  return landingSectionKeys.includes(value as LandingSectionKey);
}

function emptyItems() {
  return landingSectionKeys.reduce(
    (items, key) => ({
      ...items,
      [key]: []
    }),
    {} as Record<LandingSectionKey, LandingItemView[]>
  );
}

function fallbackContent() {
  return {
    sections: { ...defaultSections },
    items: landingSectionKeys.reduce(
      (items, key) => ({
        ...items,
        [key]: defaultItems[key].map((item) => ({ ...item }))
      }),
      {} as Record<LandingSectionKey, LandingItemView[]>
    )
  };
}

function toSectionView(section: Prisma.LandingSectionGetPayload<object>): LandingSectionView | null {
  if (!isKnownSectionKey(section.key)) return null;

  return {
    id: section.id,
    key: section.key,
    title: section.title,
    subtitle: section.subtitle,
    description: section.description,
    eyebrow: section.eyebrow,
    imageUrl: section.imageUrl,
    ctaLabel: section.ctaLabel,
    ctaHref: section.ctaHref,
    status: section.status,
    sortOrder: section.sortOrder
  };
}

function toItemView(item: Prisma.LandingItemGetPayload<object>): LandingItemView | null {
  if (!isKnownSectionKey(item.sectionKey)) return null;

  return {
    id: item.id,
    sectionKey: item.sectionKey,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    eyebrow: item.eyebrow,
    imageUrl: item.imageUrl,
    ctaLabel: item.ctaLabel,
    ctaHref: item.ctaHref,
    icon: item.icon,
    value: item.value,
    href: item.href,
    sortOrder: item.sortOrder,
    status: item.status
  };
}

export async function getLandingContent({ admin = false } = {}): Promise<LandingContent> {
  try {
    const [sections, items] = await Promise.all([
      prisma.landingSection.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { key: "asc" }]
      }),
      prisma.landingItem.findMany({
        where: admin ? { deletedAt: null } : { status: "ACTIVE", deletedAt: null, section: { status: "ACTIVE", deletedAt: null } },
        orderBy: [{ sectionKey: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      })
    ]);

    const content: LandingContent = {
      sections: { ...defaultSections },
      items: admin ? emptyItems() : fallbackContent().items
    };

    for (const section of sections) {
      const view = toSectionView(section);
      if (view) content.sections[view.key] = view;
    }

    if (items.length || admin) {
      content.items = emptyItems();
      for (const item of items) {
        const view = toItemView(item);
        if (view) content.items[view.sectionKey].push(view);
      }
    }

    if (!admin) {
      for (const key of landingSectionKeys) {
        if (!content.items[key].length) {
          content.items[key] = defaultItems[key].map((item) => ({ ...item }));
        }
      }
    }

    return content;
  } catch (error) {
    return fallbackContent();
  }
}

export async function ensureLandingSection(key: LandingSectionKey) {
  const fallback = defaultSections[key];

  return prisma.landingSection.upsert({
    where: { key },
    create: fallback,
    update: {}
  });
}

export async function ensureLandingCmsDefaults() {
  for (const key of landingSectionKeys) {
    await ensureLandingSection(key);

    const existingItems = await prisma.landingItem.count({
      where: { sectionKey: key, deletedAt: null }
    });

    if (!existingItems && defaultItems[key].length) {
      await prisma.landingItem.createMany({
        data: defaultItems[key].map((item) => ({
          sectionKey: item.sectionKey,
          title: item.title,
          subtitle: item.subtitle,
          description: item.description,
          eyebrow: item.eyebrow,
          imageUrl: item.imageUrl,
          ctaLabel: item.ctaLabel,
          ctaHref: item.ctaHref,
          icon: item.icon,
          value: item.value,
          href: item.href,
          sortOrder: item.sortOrder,
          status: item.status
        }))
      });
    }
  }
}
