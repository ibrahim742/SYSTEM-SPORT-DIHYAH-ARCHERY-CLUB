import { handleApiError, ok, requireRole } from "@/lib/api";
import { ensureLandingCmsDefaults, getLandingContent } from "@/lib/landing";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    await ensureLandingCmsDefaults();
    return ok(await getLandingContent({ admin: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
