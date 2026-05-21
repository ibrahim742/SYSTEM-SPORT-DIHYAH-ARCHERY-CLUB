import type { Prisma, PrismaClient, Role } from "@prisma/client";

type NotificationClient = PrismaClient | Prisma.TransactionClient;

type NotificationPayload = {
  actorId?: string | null;
  title: string;
  message: string;
  href?: string | null;
};

function uniqueUserIds(userIds: Array<string | null | undefined>, actorId?: string | null) {
  return Array.from(new Set(userIds.filter((id): id is string => Boolean(id)))).filter((id) => id !== actorId);
}

export async function notifyUsers(client: NotificationClient, userIds: Array<string | null | undefined>, payload: NotificationPayload) {
  const recipients = uniqueUserIds(userIds, payload.actorId);
  if (!recipients.length) return;

  await client.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      actorId: payload.actorId ?? null,
      title: payload.title,
      message: payload.message,
      href: payload.href ?? null
    }))
  });
}

export async function notifyActiveUsers(
  client: NotificationClient,
  payload: NotificationPayload,
  options?: { roles?: Role[] }
) {
  const users = await client.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      role: options?.roles ? { in: options.roles } : undefined
    },
    select: { id: true }
  });

  await notifyUsers(client, users.map((user) => user.id), payload);
}

export async function notifyStudent(client: NotificationClient, studentId: string, payload: NotificationPayload) {
  const student = await client.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { userId: true }
  });

  await notifyUsers(client, [student?.userId], payload);
}

export async function notifyStudents(client: NotificationClient, studentIds: string[], payload: NotificationPayload) {
  const students = await client.student.findMany({
    where: { id: { in: studentIds }, deletedAt: null },
    select: { userId: true }
  });

  await notifyUsers(client, students.map((student) => student.userId), payload);
}
