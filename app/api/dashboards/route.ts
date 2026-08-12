import { readDashboardSaveRequest, routeErrorResponse } from "@/src/server/http/dashboard-request";
import { createWorkspaceDashboard } from "@/src/server/services/workspace-service";

export async function POST(request: Request) {
  try {
    const input = await readDashboardSaveRequest(request);
    const dashboard = await createWorkspaceDashboard(input);
    return Response.json({ dashboard }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
