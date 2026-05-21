import { ApiError, handleApiError, noContent, ok, readJson, requireRole } from "@/lib/api";
import { ensureLandingSection } from "@/lib/landing";
import { notifyActiveUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { landingItemSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireRole(["ADMIN"]);
    const existing = await prisma.landingItem.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new ApiError(404, "Item landing tidak ditemukan");

    const payload = await readJson(request, landingItemSchema.partial());
    if (payload.sectionKey) await ensureLandingSection(payload.sectionKey);
    const item = await prisma.landingItem.update({
      where: { id },
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
        sortOrder: payload.sortOrder,
        status: payload.status
      }
    });

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "UPDATE_LANDING_ITEM", entity: "LandingItem", entityId: item.id }
    });
    await notifyActiveUsers(prisma, {
      actorId: session.user.id,
      title: "Informasi sistem diperbarui",
      message: `Admin memperbarui informasi "${item.title}" pada halaman sistem.`,
      href: "/dashboard"
    });

    return ok(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireRole(["ADMIN"]);
    const existing = await prisma.landingItem.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new ApiError(404, "Item landing tidak ditemukan");

    await prisma.landingItem.update({
      where: { id },
      data: {
        status: "INACTIVE",
        deletedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "DELETE_LANDING_ITEM", entity: "LandingItem", entityId: id }
    });
    await notifyActiveUsers(prisma, {
      actorId: session.user.id,
      title: "Informasi sistem dihapus",
      message: `Admin menghapus informasi "${existing.title}" dari halaman sistem.`,
      href: "/dashboard"
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
