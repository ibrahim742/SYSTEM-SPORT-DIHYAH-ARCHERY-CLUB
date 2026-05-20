import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { ApiError, assertApiRateLimit, assertSameOrigin, created, handleApiError, requireSession } from "@/lib/api";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/upload-limits";
import { isUploadedFile, validateUploadFile } from "@/lib/upload-security";

export const runtime = "nodejs";

const maxFileSize = MAX_IMAGE_UPLOAD_BYTES;

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    assertApiRateLimit(request, "uploads:profile", 30, 60 * 1000);
    await requireSession();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!isUploadedFile(file)) throw new ApiError(422, "File wajib diisi");
    const { bytes, extension } = await validateUploadFile(file, "image", maxFileSize);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `profile-${randomUUID()}.${extension}`;
    await writeFile(path.join(uploadsDir, fileName), bytes);

    return created({ url: `/uploads/${fileName}` });
  } catch (error) {
    return handleApiError(error);
  }
}
