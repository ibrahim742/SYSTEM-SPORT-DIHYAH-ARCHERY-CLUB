export type Level = "Pengenalan" | "Dasar" | "Lanjutan" | "Prestasi";
export type TrainingStatus = "selesai" | "proses" | "belum";
export type AttendanceStatus = "Hadir" | "Tidak Masuk" | "Izin" | "Sakit" | "Alpa";

export const clubs = [
  "Bhirawa Archery Club",
  "Garuda Muda Archery",
  "Satria Panahan Nusantara",
  "Rajawali Archery Academy"
];

export const students = [
  {
    id: "farhan",
    name: "Farhan Maulana",
    age: 14,
    club: "Bhirawa Archery Club",
    branch: "Recurve",
    level: "Dasar" as Level,
    phone: "0812-4477-9012",
    status: "Aktif",
    progress: 76,
    attendance: 92
  },
  {
    id: "nadia",
    name: "Nadia Putri",
    age: 16,
    club: "Garuda Muda Archery",
    branch: "Compound",
    level: "Prestasi" as Level,
    phone: "0857-2201-1188",
    status: "Aktif",
    progress: 88,
    attendance: 96
  },
  {
    id: "bima",
    name: "Bima Pratama",
    age: 13,
    club: "Satria Panahan Nusantara",
    branch: "Barebow",
    level: "Pengenalan" as Level,
    phone: "0821-7012-4455",
    status: "Aktif",
    progress: 42,
    attendance: 84
  },
  {
    id: "salsabila",
    name: "Salsabila Aulia",
    age: 15,
    club: "Bhirawa Archery Club",
    branch: "Recurve",
    level: "Lanjutan" as Level,
    phone: "0813-9950-3321",
    status: "Pemulihan",
    progress: 64,
    attendance: 78
  },
  {
    id: "rizky",
    name: "Rizky Ramadhan",
    age: 17,
    club: "Rajawali Archery Academy",
    branch: "Compound",
    level: "Prestasi" as Level,
    phone: "0822-1188-4510",
    status: "Aktif",
    progress: 91,
    attendance: 94
  },
  {
    id: "kartika",
    name: "Kartika Dewi",
    age: 12,
    club: "Garuda Muda Archery",
    branch: "Recurve",
    level: "Dasar" as Level,
    phone: "0852-4411-7099",
    status: "Aktif",
    progress: 58,
    attendance: 87
  }
];

export const programs = [
  {
    id: "panahan-fondasi-stance",
    name: "Panahan - Fondasi Stance & Grip",
    sportSlug: "panahan",
    type: "LATIHAN",
    level: "Pengenalan" as Level,
    duration: "2 minggu",
    materials: 6,
    intensity: "Rendah"
  },
  {
    id: "panahan-persiapan-turnamen",
    name: "Panahan - Persiapan Turnamen 30m",
    sportSlug: "panahan",
    type: "PERSIAPAN_TURNAMEN",
    level: "Dasar" as Level,
    duration: "3 minggu",
    materials: 9,
    intensity: "Sedang"
  },
  {
    id: "boxing-fundamental-combo",
    name: "Boxing - Fundamental Combo & Defense",
    sportSlug: "boxing",
    type: "LATIHAN",
    level: "Lanjutan" as Level,
    duration: "4 minggu",
    materials: 12,
    intensity: "Sedang"
  },
  {
    id: "boxing-persiapan-turnamen",
    name: "Boxing - Persiapan Turnamen Sparring",
    sportSlug: "boxing",
    type: "PERSIAPAN_TURNAMEN",
    level: "Prestasi" as Level,
    duration: "5 minggu",
    materials: 15,
    intensity: "Tinggi"
  },
  {
    id: "futsal-possession-finishing",
    name: "Futsal - Possession & Finishing",
    sportSlug: "futsal",
    type: "LATIHAN",
    level: "Dasar" as Level,
    duration: "3 minggu",
    materials: 9,
    intensity: "Sedang"
  },
  {
    id: "futsal-persiapan-turnamen",
    name: "Futsal - Persiapan Turnamen Tim",
    sportSlug: "futsal",
    type: "PERSIAPAN_TURNAMEN",
    level: "Prestasi" as Level,
    duration: "4 minggu",
    materials: 12,
    intensity: "Tinggi"
  },
  {
    id: "bola-basic-control-passing",
    name: "Bola - Kontrol, Passing, dan Finishing",
    sportSlug: "bola",
    type: "LATIHAN",
    level: "Dasar" as Level,
    duration: "3 minggu",
    materials: 9,
    intensity: "Sedang"
  },
  {
    id: "bola-persiapan-turnamen",
    name: "Bola - Persiapan Turnamen Matchday",
    sportSlug: "bola",
    type: "PERSIAPAN_TURNAMEN",
    level: "Prestasi" as Level,
    duration: "4 minggu",
    materials: 12,
    intensity: "Tinggi"
  }
];

export const programDetails = [
  {
    day: "Hari 1",
    material: "Postur berdiri dan keseimbangan",
    set: "4",
    reps: "8 anak panah",
    duration: "45 menit",
    note: "Fokus kaki sejajar dan bahu rileks"
  },
  {
    day: "Hari 2",
    material: "Grip tanpa torsi",
    set: "5",
    reps: "6 anak panah",
    duration: "50 menit",
    note: "Evaluasi tekanan telapak"
  },
  {
    day: "Hari 3",
    material: "Draw cycle stabil",
    set: "5",
    reps: "8 anak panah",
    duration: "60 menit",
    note: "Tempo tarikan konsisten"
  },
  {
    day: "Hari 4",
    material: "Anchor point",
    set: "6",
    reps: "6 anak panah",
    duration: "55 menit",
    note: "Catat deviasi anchor"
  },
  {
    day: "Hari 5",
    material: "Release dan follow through",
    set: "6",
    reps: "8 anak panah",
    duration: "65 menit",
    note: "Video review 2 sesi"
  }
];

export const monitoringRows = [
  {
    student: "Farhan Maulana",
    level: "Dasar" as Level,
    program: "Anchor Point & Release",
    status: "proses" as TrainingStatus,
    progress: 76,
    attendance: 92
  },
  {
    student: "Nadia Putri",
    level: "Prestasi" as Level,
    program: "Simulasi Kompetisi 30m",
    status: "selesai" as TrainingStatus,
    progress: 88,
    attendance: 96
  },
  {
    student: "Bima Pratama",
    level: "Pengenalan" as Level,
    program: "Fondasi Stance & Grip",
    status: "belum" as TrainingStatus,
    progress: 42,
    attendance: 84
  },
  {
    student: "Salsabila Aulia",
    level: "Lanjutan" as Level,
    program: "Grouping Konsisten 18m",
    status: "proses" as TrainingStatus,
    progress: 64,
    attendance: 78
  },
  {
    student: "Rizky Ramadhan",
    level: "Prestasi" as Level,
    program: "Simulasi Kompetisi 30m",
    status: "selesai" as TrainingStatus,
    progress: 91,
    attendance: 94
  }
];

export const weeklyProgress = [
  { week: "M1", progress: 52, attendance: 84 },
  { week: "M2", progress: 58, attendance: 86 },
  { week: "M3", progress: 63, attendance: 88 },
  { week: "M4", progress: 69, attendance: 90 },
  { week: "M5", progress: 74, attendance: 89 },
  { week: "M6", progress: 79, attendance: 92 }
];

export const attendanceRows = [
  { name: "Farhan Maulana", date: "2026-05-05", checkIn: "15:55", checkOut: "17:20", status: "Hadir" as AttendanceStatus },
  { name: "Nadia Putri", date: "2026-05-05", checkIn: "15:48", checkOut: "17:32", status: "Hadir" as AttendanceStatus },
  { name: "Bima Pratama", date: "2026-05-05", checkIn: "-", checkOut: "-", status: "Izin" as AttendanceStatus },
  { name: "Salsabila Aulia", date: "2026-05-05", checkIn: "16:02", checkOut: "17:15", status: "Hadir" as AttendanceStatus },
  { name: "Kartika Dewi", date: "2026-05-05", checkIn: "-", checkOut: "-", status: "Tidak Masuk" as AttendanceStatus }
];

export const attendanceRecapRows = [
  { name: "Farhan Maulana", club: "Bhirawa Archery Club", hadir: 22, izin: 1, sakit: 0, tidakMasuk: 1, attendance: 92 },
  { name: "Nadia Putri", club: "Garuda Muda Archery", hadir: 24, izin: 0, sakit: 0, tidakMasuk: 1, attendance: 96 },
  { name: "Bima Pratama", club: "Satria Panahan Nusantara", hadir: 19, izin: 3, sakit: 1, tidakMasuk: 2, attendance: 84 },
  { name: "Salsabila Aulia", club: "Bhirawa Archery Club", hadir: 18, izin: 2, sakit: 3, tidakMasuk: 2, attendance: 78 },
  { name: "Rizky Ramadhan", club: "Rajawali Archery Academy", hadir: 23, izin: 1, sakit: 0, tidakMasuk: 1, attendance: 94 },
  { name: "Kartika Dewi", club: "Garuda Muda Archery", hadir: 20, izin: 2, sakit: 0, tidakMasuk: 3, attendance: 87 }
];

export const coachScoreRows = [
  { studentId: "farhan", material: "Anchor point", score: "B+", technique: 78, focus: 80, stamina: 74, note: "Anchor makin konsisten, release masih perlu halus." },
  { studentId: "nadia", material: "Simulasi end", score: "A-", technique: 90, focus: 88, stamina: 86, note: "Tempo bagus dan grouping stabil." },
  { studentId: "salsabila", material: "Grouping 18m", score: "B", technique: 72, focus: 70, stamina: 66, note: "Perlu jaga bahu saat set akhir." }
];

export const progressRows = [
  { student: "Farhan Maulana", material: "Anchor point", target: "60 arrow", actual: "54 arrow", progress: 76, score: "B+", status: "proses" as TrainingStatus },
  { student: "Nadia Putri", material: "Simulasi end", target: "12 end", actual: "12 end", progress: 88, score: "A-", status: "selesai" as TrainingStatus },
  { student: "Bima Pratama", material: "Stance", target: "40 arrow", actual: "18 arrow", progress: 42, score: "C", status: "belum" as TrainingStatus },
  { student: "Salsabila Aulia", material: "Grouping 18m", target: "72 arrow", actual: "48 arrow", progress: 64, score: "B", status: "proses" as TrainingStatus },
  { student: "Rizky Ramadhan", material: "Scoring 30m", target: "90 arrow", actual: "90 arrow", progress: 91, score: "A", status: "selesai" as TrainingStatus }
];

export const todayTraining = [
  "Pemanasan bahu dan core 10 menit",
  "Drill anchor point 5 set x 6 anak panah",
  "Scoring pendek 18m 6 end",
  "Cooldown dan catatan evaluasi"
];

export const reports = [
  { period: "Minggu 1 Mei", activeStudents: 6, avgProgress: 72, attendance: 88, finishedPrograms: 2 },
  { period: "Minggu 4 Apr", activeStudents: 6, avgProgress: 68, attendance: 86, finishedPrograms: 1 },
  { period: "Minggu 3 Apr", activeStudents: 5, avgProgress: 64, attendance: 84, finishedPrograms: 1 },
  { period: "Minggu 2 Apr", activeStudents: 5, avgProgress: 61, attendance: 82, finishedPrograms: 0 }
];
