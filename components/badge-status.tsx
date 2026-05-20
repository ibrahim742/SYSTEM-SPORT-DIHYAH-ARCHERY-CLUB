import { Badge } from "@/components/ui/badge";
import type { AttendanceStatus, TrainingStatus } from "@/lib/data";

type BadgeStatusProps = {
  status: TrainingStatus | AttendanceStatus | string;
};

export function BadgeStatus({ status }: BadgeStatusProps) {
  const normalized = status.toLowerCase();
  const variant =
    normalized === "selesai" || normalized === "hadir" || normalized === "aktif"
      ? "green"
      : normalized === "proses" || normalized === "izin" || normalized === "sakit" || normalized === "pemulihan"
        ? "amber"
        : normalized === "belum" || normalized === "alpa" || normalized === "tidak masuk"
          ? "red"
          : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}
