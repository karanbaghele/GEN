import { readDashboardSaveRequest, routeErrorResponse } from "@/src/server/http/dashboard-request";
import { deleteWorkspaceDashboard, saveWorkspaceDashboard } from "@/src/server/services/workspace-service";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, input] = await Promise.all([context.params, readDashboardSaveRequest(request)]);
    if (!id || id.length > 256) return Response.json({ error: { code: "INVALID_INPUT", message: "Dashboard id is invalid." } }, { status: 400 });
    const dashboard = await saveWorkspaceDashboard(id, input);
    return Response.json({ dashboard }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id || id.length > 256) return Response.json({ error: { code: "INVALID_INPUT", message: "Dashboard id is invalid." } }, { status: 400 });
    await deleteWorkspaceDashboard(id);
    return Response.json({ deleted: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
