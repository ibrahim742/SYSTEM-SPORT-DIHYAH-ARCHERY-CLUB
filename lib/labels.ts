export function levelLabel(level: string) {
  const labels: Record<string, string> = {
    PENGENALAN: "Pengenalan",
    DASAR: "Dasar",
    LANJUTAN: "Lanjutan",
    PRESTASI: "Prestasi"
  };

  return labels[level] ?? level;
}

export function studentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    AKTIF: "Aktif",
    PEMULIHAN: "Pemulihan",
    NONAKTIF: "Nonaktif"
  };

  return labels[status] ?? status;
}

export function trainingStatusLabel(status: string) {
  const labels: Record<string, string> = {
    SELESAI: "selesai",
    PROSES: "proses",
    BELUM: "belum"
  };

  return labels[status] ?? status.toLowerCase();
}

export function attendanceStatusLabel(status: string) {
  const labels: Record<string, string> = {
    HADIR: "Hadir",
    TIDAK_MASUK: "Tidak Masuk",
    IZIN: "Izin",
    SAKIT: "Sakit",
    ALPA: "Alpa"
  };

  return labels[status] ?? status;
}
