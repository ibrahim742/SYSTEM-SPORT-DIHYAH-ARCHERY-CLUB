import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";

const uploadUrlPrefix = "/uploads/";

function collectUploadUrl(url: string | null | undefined, urls: Set<string>) {
  if (url?.startsWith(uploadUrlPrefix)) urls.add(url);
}

async function getReferencedUploadUrls() {
  const urls = new Set<string>();
  const [settings, sections, items, users, coaches, students] = await Promise.all([
    prisma.systemSetting.findMany({ select: { logoUrl: true, faviconUrl: true } }),
    prisma.landingSection.findMany({ where: { deletedAt: null }, select: { imageUrl: true } }),
    prisma.landingItem.findMany({ where: { deletedAt: null }, select: { imageUrl: true } }),
    prisma.user.findMany({ where: { deletedAt: null }, select: { image: true } }),
    prisma.coachProfile.findMany({ where: { deletedAt: null }, select: { photoUrl: true } }),
    prisma.student.findMany({ where: { deletedAt: null }, select: { photoUrl: true } })
  ]);

  for (const row of settings) {
    collectUploadUrl(row.logoUrl, urls);
    collectUploadUrl(row.faviconUrl, urls);
  }
  for (const row of sections) collectUploadUrl(row.imageUrl, urls);
  for (const row of items) collectUploadUrl(row.imageUrl, urls);
  for (const row of users) collectUploadUrl(row.image, urls);
  for (const row of coaches) collectUploadUrl(row.photoUrl, urls);
  for (const row of students) collectUploadUrl(row.photoUrl, urls);

  return urls;
}

async function cleanupUnusedUploads(cutoff: Date) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const referencedUrls = await getReferencedUploadUrls();
  const files = await readdir(uploadsDir).catch(() => []);
  let deletedFiles = 0;
  let deletedBytes = 0;

  for (const fileName of files) {
    const filePath = path.join(uploadsDir, fileName);
    const fileStat = await stat(filePath).catch(() => null);
    if (!fileStat?.isFile()) continue;
    if (fileStat.mtime >= cutoff) continue;
    if (referencedUrls.has(`${uploadUrlPrefix}${fileName}`)) continue;

    await unlink(filePath);
    deletedFiles += 1;
    deletedBytes += fileStat.size;
  }

  return { deletedFiles, deletedBytes };
}

export async function cleanupOldMaintenanceData({ actorId, logRetentionDays = 90, uploadGraceDays = 7 }: { actorId: string; logRetentionDays?: number; uploadGraceDays?: number }) {
  const now = Date.now();
  const logCutoff = new Date(now - logRetentionDays * 24 * 60 * 60 * 1000);
  const uploadCutoff = new Date(now - uploadGraceDays * 24 * 60 * 60 * 1000);

  const [auditResult, uploadResult] = await Promise.all([
    prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: logCutoff },
        action: { not: "CLEANUP_MAINTENANCE" }
      }
    }),
    cleanupUnusedUploads(uploadCutoff)
  ]);

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "CLEANUP_MAINTENANCE",
      entity: "SystemMaintenance",
      entityId: "default",
      metadata: {
        deletedAuditLogs: auditResult.count,
        deletedUploadBytes: uploadResult.deletedBytes,
        deletedUploadFiles: uploadResult.deletedFiles,
        logRetentionDays,
        uploadGraceDays
      }
    }
  });

  return {
    deletedAuditLogs: auditResult.count,
    ...uploadResult,
    logRetentionDays,
    uploadGraceDays
  };
}
