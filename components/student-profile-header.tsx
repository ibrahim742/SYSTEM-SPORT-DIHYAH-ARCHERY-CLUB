import { Badge } from "@/components/ui/badge";
import { levelLabel } from "@/lib/labels";

type StudentProfileHeaderProps = {
  student: {
    name: string;
    branch: string;
    level: string;
    status: string;
    club: {
      name: string;
    };
    sport?: {
      name: string;
    };
    coach?: {
      name: string | null;
      username: string;
    } | null;
  };
};

export function StudentProfileHeader({ student }: StudentProfileHeaderProps) {
  return (
    <section className="rounded-md border bg-gradient-to-r from-slate-50 via-white to-emerald-50/60 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{student.name}</h2>
          <p className="text-xs text-muted-foreground">
            {student.club.name} · {student.sport?.name ?? student.branch} · Coach: {student.coach?.name ?? student.coach?.username ?? "Belum dipilih"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{levelLabel(student.level)}</Badge>
          <Badge variant="green">{student.status}</Badge>
        </div>
      </div>
    </section>
  );
}
