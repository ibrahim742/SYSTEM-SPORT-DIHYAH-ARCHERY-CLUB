import { CoachScoringTable } from "@/components/coach-scoring-table";
import { auth } from "@/lib/auth";
import { levelLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { scopedStudentWhere } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isDateString(date: string | undefined) {
  return Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date));
}

export default async function CoachScoringPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) return null;
  const resolvedSearchParams = await searchParams;

  const scope = scopedStudentWhere({
    user: {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      clubIds: session.user.clubIds
    }
  });

  const latestSession = await prisma.attendanceSession.findFirst({
    where: {
      deletedAt: null,
      records: {
        some: {
          student: scope
        }
      }
    },
    orderBy: { date: "desc" },
    select: { date: true }
  });
  const selectedDate = isDateString(resolvedSearchParams?.date) ? resolvedSearchParams!.date! : latestSession?.date.toISOString().slice(0, 10) ?? isoToday();
  const range = dayRange(selectedDate);
  const attendance = await prisma.attendanceSession.findFirst({
    where: {
      deletedAt: null,
      date: { gte: range.start, lt: range.end },
      records: {
        some: {
          student: scope
        }
      }
    },
    include: {
      records: {
        where: { status: "HADIR", student: scope },
        include: {
          student: {
            include: {
              club: true,
              assignments: {
                where: { deletedAt: null },
                include: {
                  program: {
                    include: {
                      details: {
                        orderBy: { order: "asc" }
                      }
                    }
                  }
                },
                orderBy: { assignedAt: "desc" }
              },
              scores: { where: { deletedAt: null, scoredAt: { gte: range.start, lt: range.end } }, orderBy: { scoredAt: "desc" }, take: 1 }
            }
          }
        }
      }
    }
  });
  const records = [...(attendance?.records ?? [])].sort((a, b) => a.student.name.localeCompare(b.student.name));

  return (
    <CoachScoringTable
      selectedDate={selectedDate}
      rows={records.map((record) => {
        const latestScore = record.student.scores[0];
        const activeAssignment = record.student.assignments.find((assignment) => assignment.status === "AKTIF") ?? record.student.assignments[0] ?? null;
        const materialOptions = activeAssignment?.program.details.map((detail) => ({
          id: detail.id,
          label: detail.material,
          meta: [detail.day, detail.set, detail.reps, detail.duration].filter(Boolean).join(" · ")
        })) ?? [];
        const fallbackMaterial = materialOptions[0]?.label ?? "Belum ada materi program";
        const savedMaterialIsAvailable = latestScore ? materialOptions.some((option) => option.label === latestScore.material) : false;

        return {
          studentId: record.student.id,
          name: record.student.name,
          clubName: record.student.club.name,
          branch: record.student.branch,
          levelLabel: levelLabel(record.student.level),
          material: savedMaterialIsAvailable ? latestScore!.material : fallbackMaterial,
          materialOptions,
          programName: activeAssignment?.program.name ?? null,
          technique: latestScore?.technique ?? 70,
          focus: latestScore?.focus ?? 70,
          stamina: latestScore?.stamina ?? 70,
          grade: latestScore?.grade ?? "B",
          note: latestScore?.note ?? "",
          scoredAt: latestScore?.scoredAt.toISOString() ?? null
        };
      })}
    />
  );
}
