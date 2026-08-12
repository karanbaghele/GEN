import { z } from "zod";

import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import {
  DashboardSharingError,
  inviteDashboardMember,
  listDashboardShares,
  removeDashboardShare,
} from "@/src/server/services/dashboard-sharing-service";

const InviteSchema = z.object({
  email: z.string().trim().email().max(320),
  access: z.enum(["view", "edit", "export"]),
}).strict();

function sharingError(error: DashboardSharingError) {
  const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : error.code === "INVALID_INPUT" ? 400 : 500;
  return Response.json({ error: { code: error.code, message: error.message } }, { status });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json({ shares: await listDashboardShares(id) }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return error instanceof DashboardSharingError ? sharingError(error) : routeErrorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, payload] = await Promise.all([context.params, request.json()]);
    const parsed = InviteSchema.safeParse(payload);
    if (!parsed.success) return Response.json({ error: { code: "INVALID_INPUT", message: "Enter a valid email and permission." } }, { status: 400 });
    return Response.json({ share: await inviteDashboardMember(id, parsed.data) }, { status: 201 });
  } catch (error) {
    return error instanceof DashboardSharingError ? sharingError(error) : routeErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const permissionId = new URL(request.url).searchParams.get("permissionId") ?? "";
    if (!permissionId || permissionId.length > 256) return Response.json({ error: { code: "INVALID_INPUT", message: "Permission id is invalid." } }, { status: 400 });
    await removeDashboardShare(id, permissionId);
    return Response.json({ deleted: true });
  } catch (error) {
    return error instanceof DashboardSharingError ? sharingError(error) : routeErrorResponse(error);
  }
}
