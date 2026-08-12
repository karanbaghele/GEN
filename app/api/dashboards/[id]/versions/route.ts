import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import { listWorkspaceDashboardVersions } from "@/src/server/services/workspace-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id || id.length > 256) {
      return Response.json({ error: { code: "INVALID_INPUT", message: "Dashboard id is invalid." } }, { status: 400 });
    }
    const versions = await listWorkspaceDashboardVersions(id);
    return Response.json({ versions }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
