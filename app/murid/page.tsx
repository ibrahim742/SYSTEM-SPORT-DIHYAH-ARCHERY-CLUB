import { StudentManager } from "@/components/student-manager";
import { auth } from "@/lib/auth";
import { levelLabel, studentStatusLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { scopedStudentWhere } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [students, clubs, sports, coaches] = await Promise.all([
    prisma.student.findMany({
      where: scopedStudentWhere({
        user: {
          id: session.user.id,
          username: session.user.username,
          role: session.user.role,
          clubIds: session.user.clubIds
        }
      }),
      include: { club: true, sport: true, coach: { select: { id: true, name: true, username: true } }, user: { select: { username: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.club.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.sport.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "COACH", status: "ACTIVE", deletedAt: null, coachProfile: { deletedAt: null } },
      include: { coachClubs: true, coachProfile: true },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <StudentManager
      canCreate={session.user.role === "ADMIN"}
      clubs={clubs.map((club) => ({ id: club.id, name: club.name }))}
      sports={sports.map((sport) => ({ id: sport.id, name: sport.name }))}
      coaches={coaches
        .filter((coach) => coach.coachProfile)
        .map((coach) => ({
          id: coach.id,
          name: coach.name ?? coach.username,
          username: coach.username,
          sportId: coach.coachProfile?.sportId ?? "",
          clubIds: coach.coachClubs.map((coachClub) => coachClub.clubId)
        }))}
      students={students.map((student) => ({
        id: student.id,
        name: student.name,
        username: student.user?.username ?? "",
        age: student.age,
        birthPlace: student.birthPlace,
        birthDate: student.birthDate?.toISOString().slice(0, 10) ?? "",
        clubId: student.clubId,
        clubName: student.club.name,
        sportId: student.sportId,
        sportName: student.sport.name,
        coachId: student.coachId,
        coachName: student.coach?.name ?? student.coach?.username ?? null,
        branch: student.branch,
        level: student.level,
        levelLabel: levelLabel(student.level),
        phone: student.phone,
        address: student.address,
        status: student.status,
        statusLabel: studentStatusLabel(student.status)
      }))}
    />
  );
}
