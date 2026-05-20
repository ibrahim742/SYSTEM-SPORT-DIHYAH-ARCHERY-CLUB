import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { ApiError, assertApiRateLimit, assertSameOrigin, created, handleApiError, requireRole } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/upload-limits";
import { isUploadedFile, validateUploadFile } from "@/lib/upload-security";

export const runtime = "nodejs";

const maxFileSize = MAX_IMAGE_UPLOAD_BYTES;

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    assertApiRateLimit(request, "uploads:branding", 20, 60 * 1000);
    const session = await requireRole(["ADMIN"]);
    const formData = await request.formData();
    const kind = formData.get("kind");
    const file = formData.get("file");

    if (kind !== "logo" && kind !== "favicon" && kind !== "landing") throw new ApiError(422, "Jenis upload harus logo, favicon, atau landing");
    if (!isUploadedFile(file)) throw new ApiError(422, "File wajib diisi");
    const { bytes, extension } = await validateUploadFile(file, kind === "favicon" ? "favicon" : "image", maxFileSize);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `${kind}-${randomUUID()}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, bytes);

    const url = `/uploads/${fileName}`;

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: `UPLOAD_${kind.toUpperCase()}`,
        entity: kind === "landing" ? "LandingAsset" : "SystemSetting",
        entityId: kind === "landing" ? url : "default"
      }
    });

    return created({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
