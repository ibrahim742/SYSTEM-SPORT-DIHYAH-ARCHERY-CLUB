export const MAX_IMAGE_UPLOAD_BYTES = 1 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_LABEL = "1MB";

export const uploadPixelGuidelines = {
  favicon: "Rekomendasi 64 x 64 px atau 32 x 32 px.",
  gallery: "Rekomendasi 1200 x 900 px.",
  hero: "Rekomendasi 1920 x 1080 px.",
  logo: "Rekomendasi 512 x 512 px.",
  profile: "Rekomendasi 800 x 800 px.",
  section: "Rekomendasi 1600 x 900 px."
} as const;

export function uploadHelpText(kind: keyof typeof uploadPixelGuidelines, formatText: string) {
  return `${formatText}. ${uploadPixelGuidelines[kind]} Maksimal ${MAX_IMAGE_UPLOAD_LABEL}.`;
}
