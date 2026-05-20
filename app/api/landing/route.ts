import { handleApiError, ok } from "@/lib/api";
import { getLandingContent } from "@/lib/landing";

export async function GET() {
  try {
    return ok(await getLandingContent());
  } catch (error) {
    return handleApiError(error);
  }
}
