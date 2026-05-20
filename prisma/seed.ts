import { PrismaClient, type Level, type StudentStatus, type TrainingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  attendanceRows,
  coachScoreRows,
  clubs,
  programDetails,
  programs,
  progressRows,
  students,
  todayTraining
} from "../lib/data";

const prisma = new PrismaClient();

function toLevel(level: string): Level {
  const normalized = level.toUpperCase();
  if (normalized === "PENGENALAN") return "PENGENALAN";
  if (normalized === "DASAR") return "DASAR";
  if (normalized === "LANJUTAN") return "LANJUTAN";
  return "PRESTASI";
}

function toStudentStatus(status: string): StudentStatus {
  return status.toLowerCase() === "pemulihan" ? "PEMULIHAN" : "AKTIF";
}

function toTrainingStatus(status: string): TrainingStatus {
  if (status === "selesai") return "SELESAI";
  if (status === "belum") return "BELUM";
  return "PROSES";
}

function toAttendanceStatus(status: string) {
  if (status === "Tidak Masuk") return "TIDAK_MASUK" as const;
  if (status === "Izin") return "IZIN" as const;
  if (status === "Sakit") return "SAKIT" as const;
  if (status === "Alpa") return "ALPA" as const;
  return "HADIR" as const;
}

function usernameFromName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "");
}

function detailTemplate(sportSlug: string, type: string) {
  const tournament = type === "PERSIAPAN_TURNAMEN";
  const templates: Record<string, string[]> = {
    panahan: tournament ? ["Simulasi scoring 30m", "Manajemen waktu rambahan", "Evaluasi grouping turnamen"] : ["Postur berdiri dan grip", "Anchor point stabil", "Release dan follow through"],
    boxing: tournament ? ["Skenario sparring ronde", "Defense saat tertekan", "Recovery antar ronde"] : ["Footwork dasar", "Jab-cross-hook", "Slip dan guard"],
    futsal: tournament ? ["Set piece kick-in", "Transisi pressing", "Simulasi match 2x20"] : ["Passing support", "Rotasi posisi", "Finishing cepat"],
    bola: tournament ? ["Game plan matchday", "Transisi menyerang bertahan", "Set piece turnamen"] : ["First touch", "Passing kombinasi", "Finishing ke gawang"]
  };
  const materials = templates[sportSlug] ?? programDetails.map((detail) => detail.material);

  return materials.map((material, index) => ({
    day: `Hari ${index + 1}`,
    material,
    set: tournament ? "4 set" : "3 set",
    reps: tournament ? "Simulasi" : "10 repetisi",
    duration: tournament ? "60 menit" : "45 menit",
    note: tournament ? "Fokus kesiapan pertandingan" : "Fokus teknik dasar",
    order: index + 1
  }));
}

const landingSections = [
  {
    key: "hero",
    title: "Akademi Olahraga dengan Monitoring Latihan Terukur",
    subtitle: "Pembinaan atlet, program latihan, absensi, evaluasi coach, dan laporan progress dalam satu sistem academy.",
    description: "Kami membantu club dan academy olahraga mengelola proses latihan lebih rapi, transparan, dan mudah dipantau oleh coach, admin, serta murid.",
    eyebrow: "Academy olahraga modern",
    ctaLabel: "Masuk Sistem",
    ctaHref: "/login",
    sortOrder: 1
  },
  {
    key: "features",
    title: "Program dan Layanan Academy",
    subtitle: "Program pembinaan",
    description: "Layanan utama untuk membantu coach menyusun latihan, memantau kehadiran, memberi penilaian, dan membaca perkembangan atlet.",
    sortOrder: 2
  },
  {
    key: "gallery",
    title: "Momen latihan, program, dan aktivitas academy",
    subtitle: "Galeri Academy",
    description: "Dokumentasi visual dari konten yang tersimpan di sistem landing dan upload academy.",
    sortOrder: 3
  },
  {
    key: "coaches",
    title: "Coach yang mendampingi proses latihan",
    subtitle: "Profile Coach",
    description: "Data coach diambil langsung dari akun dan profil coach yang tersimpan di sistem.",
    ctaLabel: "Lihat Data Coach",
    sortOrder: 4
  },
  {
    key: "sports",
    title: "Cabang Olahraga yang Tersedia",
    subtitle: "Pilihan latihan",
    description: "Academy dapat menampilkan dan mengelola cabang olahraga sesuai kebutuhan pembinaan atlet.",
    sortOrder: 5
  },
  {
    key: "statistics",
    title: "Ringkasan Academy",
    subtitle: "Statistik pembinaan",
    description: "Angka utama yang membantu orang tua, coach, dan pengelola melihat aktivitas academy secara cepat.",
    sortOrder: 6
  },
  {
    key: "cta",
    title: "Masuk ke dashboard untuk mulai memantau latihan",
    subtitle: "Akses sistem",
    description: "Kelola data murid, program latihan, absensi, penilaian coach, dan laporan progress dari dashboard academy.",
    ctaLabel: "Login Dashboard",
    ctaHref: "/login",
    sortOrder: 7
  },
  {
    key: "footer",
    title: "DIHYAH ARCHERY CLUB",
    subtitle: "Academy olahraga",
    description: "Company profile dan sistem monitoring latihan untuk academy, club olahraga, coach, dan atlet.",
    sortOrder: 8
  }
];

const landingItems = [
  { sectionKey: "hero", title: "Pembinaan Panahan dengan Data Latihan yang Rapi", subtitle: "Program academy", description: "Pantau latihan, absensi, evaluasi coach, dan perkembangan atlet dari satu dashboard.", eyebrow: "DIHYAH ARCHERY CLUB", ctaLabel: "Masuk Sistem", ctaHref: "/login", icon: "Target", sortOrder: 1 },
  { sectionKey: "hero", title: "Coach Lebih Mudah Membaca Progress Atlet", subtitle: "Monitoring latihan", description: "Setiap catatan latihan dan penilaian coach tersimpan sebagai dasar evaluasi berikutnya.", eyebrow: "Evaluasi terukur", ctaLabel: "Lihat Program", ctaHref: "#program", icon: "TrendingUp", sortOrder: 2 },
  { sectionKey: "hero", title: "Operasional Academy Lebih Terstruktur", subtitle: "Satu sistem club", description: "Kelola murid, coach, cabang olahraga, program, absensi, dan laporan tanpa tercecer.", eyebrow: "Dashboard academy", ctaLabel: "Tentang Academy", ctaHref: "#about", icon: "ShieldCheck", sortOrder: 3 },
  { sectionKey: "gallery", title: "Dokumentasi latihan academy", imageUrl: "/uploads/landing-e85301d5-52a0-44ad-8185-26b32039623a.jpg", sortOrder: 1 },
  { sectionKey: "gallery", title: "Program pembinaan atlet", imageUrl: "/uploads/landing-8ca8be68-1f24-419a-b3de-7fab761c0a0d.jpg", sortOrder: 2 },
  { sectionKey: "gallery", title: "Aktivitas kelas latihan", imageUrl: "/uploads/landing-748068b0-8c6e-42ec-84c8-c1ff57f7d10f.jpg", sortOrder: 3 },
  { sectionKey: "gallery", title: "Suasana evaluasi coach", imageUrl: "/uploads/landing-e7caa871-d36a-4038-9259-85e2e072f61c.jpg", sortOrder: 4 },
  { sectionKey: "gallery", title: "Momen academy", imageUrl: "/uploads/landing-da0351c5-cc2d-4c49-aa62-a5e087bb325d.jpg", sortOrder: 5 },
  { sectionKey: "features", title: "Program Latihan Berlevel", description: "Materi latihan dapat disusun sesuai level atlet, target pembinaan, dan intensitas program.", icon: "Target", sortOrder: 1 },
  { sectionKey: "features", title: "Absensi dan Logbook", description: "Kehadiran dan catatan latihan tersimpan rapi untuk melihat konsistensi atlet.", icon: "CalendarCheck", sortOrder: 2 },
  { sectionKey: "features", title: "Penilaian Coach", description: "Coach dapat memberi evaluasi teknik, fokus, stamina, dan catatan perkembangan.", icon: "ClipboardCheck", sortOrder: 3 },
  { sectionKey: "features", title: "Monitoring Progress", description: "Admin dan coach dapat membaca perkembangan atlet dari data latihan yang terukur.", icon: "TrendingUp", sortOrder: 4 },
  { sectionKey: "sports", title: "Panahan", description: "Pembinaan teknik dasar, scoring, konsistensi grouping, dan simulasi kompetisi.", icon: "Target", sortOrder: 1 },
  { sectionKey: "sports", title: "Boxing", description: "Latihan teknik, footwork, stamina, disiplin, dan evaluasi intensitas latihan.", icon: "Dumbbell", sortOrder: 2 },
  { sectionKey: "sports", title: "Futsal", description: "Program tim, kehadiran latihan, perkembangan pemain, dan evaluasi performa.", icon: "Trophy", sortOrder: 3 },
  { sectionKey: "statistics", title: "Atlet Aktif", value: "120+", description: "Murid yang mengikuti program pembinaan academy.", icon: "Users", sortOrder: 1 },
  { sectionKey: "statistics", title: "Program Latihan", value: "30+", description: "Materi pembinaan untuk beberapa level kemampuan.", icon: "ListChecks", sortOrder: 2 },
  { sectionKey: "statistics", title: "Coach Terlibat", value: "12+", description: "Pelatih yang membantu evaluasi dan pembinaan atlet.", icon: "Trophy", sortOrder: 3 },
  { sectionKey: "statistics", title: "Kehadiran Latihan", value: "92%", description: "Rekap kedisiplinan latihan yang mudah ditindaklanjuti.", icon: "CalendarCheck", sortOrder: 4 },
  { sectionKey: "footer", title: "Email", value: "info@altlit.academy", icon: "Mail", href: "mailto:info@altlit.academy", sortOrder: 1 },
  { sectionKey: "footer", title: "Lokasi", value: "Jakarta, Indonesia", icon: "MapPin", sortOrder: 2 },
  { sectionKey: "footer", title: "Login", value: "Dashboard Academy", icon: "LogIn", href: "/login", sortOrder: 3 }
];

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  const studentPasswordHash = await bcrypt.hash("murid123", 10);
  const coachPasswordHash = await bcrypt.hash("coach123", 10);

  await prisma.auditLog.deleteMany();
  await prisma.landingItem.deleteMany();
  await prisma.landingSection.deleteMany();
  await prisma.trainingLog.deleteMany();
  await prisma.coachScore.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.programAssignment.deleteMany();
  await prisma.programMaterial.deleteMany();
  await prisma.program.deleteMany();
  await prisma.student.deleteMany();
  await prisma.coachProfile.deleteMany();
  await prisma.coachClub.deleteMany();
  await prisma.club.deleteMany();
  await prisma.coachCategory.deleteMany();
  await prisma.sport.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin AltLit",
      username: "admin",
      passwordHash,
      role: "ADMIN"
    }
  });

  const clubRecords = await Promise.all(
    clubs.map((club, index) =>
      prisma.club.create({
        data: {
          name: club,
          city: ["Jakarta", "Bandung", "Yogyakarta", "Surabaya"][index] ?? "Jakarta"
        }
      })
    )
  );

  const sportRecords = await Promise.all(
    [
      { name: "Panahan", slug: "panahan", icon: "target", description: "Cabang olahraga panahan." },
      { name: "Boxing", slug: "boxing", icon: "gloves", description: "Cabang olahraga tinju." },
      { name: "Futsal", slug: "futsal", icon: "ball", description: "Cabang olahraga futsal." },
      { name: "Bola", slug: "bola", icon: "football", description: "Cabang olahraga sepak bola." }
    ].map((sport) => prisma.sport.create({ data: sport }))
  );
  const categoryRecords = await Promise.all(
    [
      { name: "Coach Umum", slug: "coach-umum", description: "Kategori coach default." },
      { name: "Head Coach", slug: "head-coach", description: "Pelatih kepala." },
      { name: "Assistant Coach", slug: "assistant-coach", description: "Asisten pelatih." }
    ].map((category) => prisma.coachCategory.create({ data: category }))
  );

  const coachNames = ["Coach Ardi", "Coach Melati", "Coach Bagas", "Coach Raka"];
  const coachRecords = await Promise.all(
    coachNames.map((name, index) =>
      prisma.user.create({
        data: {
          name,
          username: `coach${index + 1}`,
          passwordHash: coachPasswordHash,
          role: "COACH"
        }
      })
    )
  );

  await Promise.all([
    prisma.coachClub.create({ data: { coachId: coachRecords[0].id, clubId: clubRecords[0].id } }),
    prisma.coachClub.create({ data: { coachId: coachRecords[0].id, clubId: clubRecords[1].id } }),
    prisma.coachClub.create({ data: { coachId: coachRecords[1].id, clubId: clubRecords[2].id } }),
    prisma.coachClub.create({ data: { coachId: coachRecords[2].id, clubId: clubRecords[3].id } }),
    prisma.coachClub.create({ data: { coachId: coachRecords[3].id, clubId: clubRecords[0].id } })
  ]);

  await Promise.all(
    coachRecords.map((coach, index) =>
      prisma.coachProfile.create({
        data: {
          userId: coach.id,
          sportId: sportRecords[index % sportRecords.length].id,
          categoryId: categoryRecords[index % categoryRecords.length].id,
          phone: `08130000000${index + 1}`,
          gender: index === 1 ? "PEREMPUAN" : "LAKI_LAKI",
          birthDate: new Date(1990 + index, index, 12),
          address: `Jl. Coach No. ${index + 1}`,
          experienceYears: 3 + index,
          certification: index === 0 ? "Sertifikasi Nasional Panahan" : null,
          bio: "Coach aktif untuk pembinaan atlet."
        }
      })
    )
  );

  await Promise.all(
    landingSections.map((section) =>
      prisma.landingSection.create({
        data: section
      })
    )
  );

  await Promise.all(
    landingItems.map((item) =>
      prisma.landingItem.create({
        data: item
      })
    )
  );

  const studentRecords = await Promise.all(
    students.map(async (student, index) => {
      const user = await prisma.user.create({
        data: {
          name: student.name,
          username: usernameFromName(student.name),
          passwordHash: studentPasswordHash,
          role: "MURID"
        }
      });
      const club = clubRecords.find((item) => item.name === student.club) ?? clubRecords[0];
      const sport = sportRecords[index % sportRecords.length];
      const coach = coachRecords.find((record, coachIndex) => sportRecords[coachIndex % sportRecords.length].id === sport.id) ?? coachRecords[0];

      return prisma.student.create({
        data: {
          userId: user.id,
          clubId: club.id,
          sportId: sport.id,
          coachId: coach.id,
          name: student.name,
          age: student.age,
          birthDate: new Date(2012 + (index % 5), index % 12, 10 + index),
          branch: student.branch,
          level: toLevel(student.level),
          phone: student.phone,
          address: `Jl. Latihan Panahan No. ${index + 1}`,
          status: toStudentStatus(student.status),
          progress: student.progress,
          attendance: student.attendance
        }
      });
    })
  );

  const programRecords = await Promise.all(
    programs.map((program) =>
      prisma.program.create({
        data: {
          slug: program.id,
          sportId: sportRecords.find((sport) => sport.slug === program.sportSlug)?.id ?? sportRecords[0].id,
          type: program.type === "PERSIAPAN_TURNAMEN" ? "PERSIAPAN_TURNAMEN" : "LATIHAN",
          createdById: admin.id,
          name: program.name,
          level: toLevel(program.level),
          duration: program.duration,
          materials: program.materials,
          intensity: program.intensity,
          description: `Program ${program.name} untuk level ${program.level}.`
        },
        include: { sport: true }
      })
    )
  );

  await Promise.all(
    programRecords.flatMap((program) =>
      detailTemplate(program.sport.slug, program.type).map((detail) =>
        prisma.programMaterial.create({
          data: {
            programId: program.id,
            day: detail.day,
            material: detail.material,
            set: detail.set,
            reps: detail.reps,
            duration: detail.duration,
            note: detail.note,
            order: detail.order
          }
        })
      )
    )
  );

  await Promise.all(
    studentRecords.map((student, index) => {
      const matchingPrograms = programRecords.filter((program) => program.sportId === student.sportId);
      const program = matchingPrograms[index % matchingPrograms.length] ?? programRecords[0];
      return prisma.programAssignment.create({
        data: {
          studentId: student.id,
          programId: program.id,
          status: index % 2 === 0 ? "AKTIF" : "SELESAI",
          startedAt: new Date("2026-05-01")
        }
      });
    })
  );

  const attendanceSession = await prisma.attendanceSession.create({
    data: {
      date: new Date("2026-05-05T00:00:00.000Z"),
      title: "Sesi Sore",
      note: "Seed absensi sesi latihan harian."
    }
  });

  await Promise.all(
    attendanceRows.map((row) => {
      const student = studentRecords.find((item) => item.name === row.name);
      if (!student) return null;

      return prisma.attendanceRecord.create({
        data: {
          sessionId: attendanceSession.id,
          studentId: student.id,
          status: toAttendanceStatus(row.status),
          checkIn: row.checkIn === "-" ? null : row.checkIn,
          checkOut: row.checkOut === "-" ? null : row.checkOut
        }
      });
    })
  );

  await Promise.all(
    coachScoreRows.map((score, index) => {
      const dummyStudent = students.find((item) => item.id === score.studentId);
      const student = studentRecords.find((item) => item.name === dummyStudent?.name) ?? studentRecords[index];

      return prisma.coachScore.create({
        data: {
          studentId: student.id,
          coachId: coachRecords[index % coachRecords.length].id,
          material: score.material,
          technique: score.technique,
          focus: score.focus,
          stamina: score.stamina,
          grade: score.score,
          note: score.note,
          scoredAt: new Date("2026-05-05T10:00:00.000Z")
        }
      });
    })
  );

  await Promise.all(
    progressRows.map((row, index) => {
      const student = studentRecords.find((item) => item.name === row.student) ?? studentRecords[index % studentRecords.length];

      return prisma.trainingLog.create({
        data: {
          studentId: student.id,
          date: new Date("2026-05-05T09:00:00.000Z"),
          result: row.actual,
          duration: index % 2 === 0 ? "75 menit" : "90 menit",
          rpe: 6 + (index % 3),
          note: todayTraining[index % todayTraining.length],
          status: toTrainingStatus(row.status)
        }
      });
    })
  );

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SEED_DATABASE",
      entity: "System",
      metadata: {
        students: studentRecords.length,
        programs: programRecords.length,
        clubs: clubRecords.length
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
