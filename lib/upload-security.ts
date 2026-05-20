import path from "path";

import { ApiError } from "@/lib/api";
import { MAX_IMAGE_UPLOAD_LABEL } from "@/lib/upload-limits";

type UploadKind = "image" | "favicon";
type UploadedFile = {
  name: string;
  size: number;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

const mimeByExtension: Record<string, string[]> = {
  ico: ["image/x-icon", "image/vnd.microsoft.icon"],
  jpeg: ["image/jpeg"],
  jpg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"]
};

function extensionFromName(fileName: string) {
  return path.extname(fileName).replace(".", "").toLowerCase();
}

function hasSignature(bytes: Uint8Array, extension: string) {
  if (extension === "png") {
    return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }

  if (extension === "jpg" || extension === "jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (extension === "webp") {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  if (extension === "ico") {
    return bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00;
  }

  return false;
}

function allowedExtensionsFor(kind: UploadKind) {
  return kind === "favicon" ? new Set(["ico", "png"]) : new Set(["png", "jpg", "jpeg", "webp"]);
}

export function isUploadedFile(value: unknown): value is UploadedFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    "arrayBuffer" in value &&
    typeof value.name === "string" &&
    typeof value.size === "number" &&
    typeof value.arrayBuffer === "function"
  );
}

export async function validateUploadFile(file: UploadedFile, kind: UploadKind, maxFileSize: number) {
  if (file.size > maxFileSize) throw new ApiError(422, `Ukuran file maksimal ${MAX_IMAGE_UPLOAD_LABEL}`);

  const extension = extensionFromName(file.name);
  const allowedExtensions = allowedExtensionsFor(kind);
  if (!allowedExtensions.has(extension)) {
    throw new ApiError(422, kind === "favicon" ? "Favicon harus ico atau png" : "File harus png, jpg, jpeg, atau webp");
  }

  if (file.type && !mimeByExtension[extension]?.includes(file.type)) {
    throw new ApiError(422, "Tipe file tidak sesuai dengan ekstensi");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!hasSignature(bytes, extension)) {
    throw new ApiError(422, "Isi file tidak sesuai dengan format gambar");
  }

  return {
    bytes,
    extension
  };
}
