import { handleApiError, created, readJson, requireRole } from "@/lib/api";
import { ensureLandingSection } from "@/lib/landing";
import { notifyActiveUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { landingItemSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN"]);
    const payload = await readJson(request, landingItemSchema);
    await ensureLandingSection(payload.sectionKey);
    const item = await prisma.landingItem.create({
      data: {
        sectionKey: payload.sectionKey,
        title: payload.title,
        subtitle: payload.subtitle,
        description: payload.description,
        eyebrow: payload.eyebrow,
        imageUrl: payload.imageUrl,
        ctaLabel: payload.ctaLabel,
        ctaHref: payload.ctaHref,
        icon: payload.icon,
        value: payload.value,
        href: payload.href,
        sortOrder: payload.sortOrder ?? 0,
        status: payload.status ?? "ACTIVE"
      }
    });

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "CREATE_LANDING_ITEM", entity: "LandingItem", entityId: item.id }
    });
    await notifyActiveUsers(prisma, {
      actorId: session.user.id,
      title: "Informasi sistem ditambahkan",
      message: `Admin menambahkan informasi "${item.title}" pada halaman sistem.`,
      href: "/dashboard"
    });

    return created(item);
  } catch (error) {
    return handleApiError(error);
  }
}
