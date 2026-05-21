import { ApiError, handleApiError, ok, readJson, requireRole } from "@/lib/api";
import { ensureLandingSection, landingSectionKeys, type LandingSectionKey } from "@/lib/landing";
import { notifyActiveUsers } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { landingSectionSchema } from "@/lib/validation";

type Params = { params: Promise<{ key: string }> };

function parseKey(key: string): LandingSectionKey {
  if (!landingSectionKeys.includes(key as LandingSectionKey)) {
    throw new ApiError(404, "Section landing tidak ditemukan");
  }

  return key as LandingSectionKey;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { key: rawKey } = await params;
    const key = parseKey(rawKey);
    const session = await requireRole(["ADMIN"]);
    await ensureLandingSection(key);
    const payload = await readJson(request, landingSectionSchema);
    const section = await prisma.landingSection.update({
      where: { key },
      data: {
        title: payload.title,
        subtitle: payload.subtitle,
        description: payload.description,
        eyebrow: payload.eyebrow,
        imageUrl: payload.imageUrl,
        ctaLabel: payload.ctaLabel,
        ctaHref: payload.ctaHref,
        status: payload.status ?? "ACTIVE",
        sortOrder: payload.sortOrder
      }
    });

    if (key === "hero") {
      const firstHeroItem = await prisma.landingItem.findFirst({
        where: { sectionKey: "hero", deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      });
      const syncedHeroItem = {
        sectionKey: "hero",
        title: payload.title,
        subtitle: payload.subtitle,
        description: payload.description,
        eyebrow: payload.eyebrow,
        imageUrl: payload.imageUrl,
        ctaLabel: payload.ctaLabel,
        ctaHref: payload.ctaHref,
        icon: "Target",
        value: null,
        href: null,
        sortOrder: 1,
        status: payload.status ?? "ACTIVE"
      };

      if (firstHeroItem) {
        await prisma.landingItem.update({
          where: { id: firstHeroItem.id },
          data: syncedHeroItem
        });
      } else {
        await prisma.landingItem.create({ data: syncedHeroItem });
      }
    }

    await prisma.auditLog.create({
      data: { actorId: session.user.id, action: "UPDATE_LANDING_SECTION", entity: "LandingSection", entityId: section.id }
    });
    await notifyActiveUsers(prisma, {
      actorId: session.user.id,
      title: "Informasi sistem diperbarui",
      message: `Admin memperbarui section "${section.title}" pada halaman sistem.`,
      href: "/dashboard"
    });

    return ok(section);
  } catch (error) {
    return handleApiError(error);
  }
}
