import { handleApiError, noContent, ok, readJson, requireRole } from "@/lib/api";
import { defaultSystemSettings, getSystemSettings } from "@/lib/system-settings";
import { prisma } from "@/lib/prisma";
import { systemSettingSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    return ok(await getSystemSettings());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireRole(["ADMIN"]);
    const payload = await readJson(request, systemSettingSchema);
    const settings = await prisma.systemSetting.upsert({
      where: { key: "default" },
      create: {
        key: "default",
        systemName: payload.systemName,
        systemSubtitle: payload.systemSubtitle,
        loginSubtitle: payload.loginSubtitle,
        contactWhatsapp: payload.contactWhatsapp,
        logoUrl: payload.logoUrl,
        faviconUrl: payload.faviconUrl
      },
      update: {
        systemName: payload.systemName,
        systemSubtitle: payload.systemSubtitle,
        loginSubtitle: payload.loginSubtitle,
        contactWhatsapp: payload.contactWhatsapp,
        logoUrl: payload.logoUrl,
        faviconUrl: payload.faviconUrl
      },
      select: {
        systemName: true,
        systemSubtitle: true,
        loginSubtitle: true,
        contactWhatsapp: true,
        logoUrl: true,
        faviconUrl: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "UPDATE_SYSTEM_SETTINGS",
        entity: "SystemSetting",
        entityId: "default"
      }
    });

    return ok(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const session = await requireRole(["ADMIN"]);
    await prisma.systemSetting.upsert({
      where: { key: "default" },
      create: {
        key: "default",
        ...defaultSystemSettings
      },
      update: defaultSystemSettings
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "RESET_SYSTEM_SETTINGS",
        entity: "SystemSetting",
        entityId: "default"
      }
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
