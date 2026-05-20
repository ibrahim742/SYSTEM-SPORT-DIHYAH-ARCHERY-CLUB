import { assertApiRateLimit, assertSameOrigin, handleApiError, ok, requireRole } from "@/lib/api";
import { cleanupOldMaintenanceData } from "@/lib/maintenance";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    assertApiRateLimit(request, "admin:maintenance:cleanup", 5, 60 * 1000);
    const session = await requireRole(["ADMIN"]);
    const result = await cleanupOldMaintenanceData({ actorId: session.user.id });

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
