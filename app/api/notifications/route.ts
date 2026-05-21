import { handleApiError, ok, readJson, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { notificationReadSchema } from "@/lib/validation";

export async function GET() {
  try {
    const session = await requireSession();
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: session.user.id,
          deletedAt: null
        },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 30
      }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          readAt: null,
          deletedAt: null
        }
      })
    ]);

    return ok({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const payload = await readJson(request, notificationReadSchema);
    const now = new Date();

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
        readAt: null,
        ...(payload.all ? {} : { id: { in: payload.ids ?? [] } })
      },
      data: { readAt: now }
    });

    return ok({ readAt: now });
  } catch (error) {
    return handleApiError(error);
  }
}
