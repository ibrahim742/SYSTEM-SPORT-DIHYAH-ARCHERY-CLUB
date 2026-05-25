import type { Metadata } from "next";
import type React from "react";

import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveExistingUploadUrl } from "@/lib/upload-path";
import { getSystemSettings } from "@/lib/system-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();

  return {
    title: settings.systemName,
    description: settings.systemSubtitle,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, settings] = await Promise.all([auth(), getSystemSettings()]);
  const freshUser = session?.user?.id
    ? await prisma.user.findFirst({
        where: { id: session.user.id, deletedAt: null },
        select: { id: true, name: true, email: true, image: true, username: true, role: true }
      })
    : null;
  const shellUser = freshUser ? { ...session?.user, ...freshUser, image: resolveExistingUploadUrl(freshUser.image) } : session?.user;

  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppShell user={shellUser} branding={settings}>{children}</AppShell>
      </body>
    </html>
  );
}
