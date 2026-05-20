import type { Prisma, Role } from "@prisma/client";

import type { ApiSession } from "@/lib/api";

export function isAdmin(session: ApiSession) {
  return session.user.role === "ADMIN";
}

export function isCoach(session: ApiSession) {
  return session.user.role === "COACH";
}

export function isStudent(session: ApiSession) {
  return session.user.role === "MURID";
}

export function assertRole(session: ApiSession, roles: Role[]) {
  if (!roles.includes(session.user.role)) {
    throw new Error("Akses ditolak");
  }
}

export function scopedStudentWhere(session: ApiSession): Prisma.StudentWhereInput {
  if (isAdmin(session)) {
    return { deletedAt: null };
  }

  if (isCoach(session)) {
    return {
      deletedAt: null,
      OR: [{ coachId: session.user.id }, { coachId: null, clubId: { in: session.user.clubIds } }]
    };
  }

  return {
    deletedAt: null,
    userId: session.user.id
  };
}

export function canMutateStudent(session: ApiSession, clubId: string, userId?: string | null, coachId?: string | null) {
  if (isAdmin(session)) return true;
  if (isCoach(session)) return coachId === session.user.id || (!coachId && session.user.clubIds.includes(clubId));
  return userId === session.user.id;
}

export function canManageStudent(session: ApiSession, clubId: string, coachId?: string | null) {
  if (isAdmin(session)) return true;
  if (isCoach(session)) return coachId === session.user.id || (!coachId && session.user.clubIds.includes(clubId));
  return false;
}

export function canCreateAccount(session: ApiSession) {
  return isAdmin(session);
}
