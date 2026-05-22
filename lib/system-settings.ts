import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/dev-auth";

export type SystemSettings = {
  systemName: string;
  systemSubtitle: string;
  loginSubtitle: string;
  contactWhatsapp: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
};

export const defaultSystemSettings: SystemSettings = {
  systemName: "DIHYAH ARCHERY CLUB",
  systemSubtitle: "Coach Panel",
  loginSubtitle: "Masuk untuk monitoring latihan panahan.",
  contactWhatsapp: null,
  logoUrl: null,
  faviconUrl: null
};

export const getSystemSettings = cache(async function getSystemSettings(): Promise<SystemSettings> {
  const settings = await prisma.systemSetting
    .findUnique({
      where: { key: "default" },
      select: {
        systemName: true,
        systemSubtitle: true,
        loginSubtitle: true,
        contactWhatsapp: true,
        logoUrl: true,
        faviconUrl: true
      }
    })
    .catch((error) => {
      if (isDatabaseUnavailable(error)) return null;
      console.error("System settings lookup failed", error);
      return null;
    });

  return settings ?? defaultSystemSettings;
});
