import { z } from "zod";

import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import {
  HistoryServiceError,
  linkHistoryRunToDashboard,
  listWorkspaceHistory,
} from "@/src/server/services/history-service";

const LinkHistorySchema = z.object({
  runId: z.string().min(1).max(256),
  dashboardId: z.string().min(1).max(256),
}).strict();

function historyError(error: HistoryServiceError) {
  const status = error.code === "NOT_FOUND" ? 404 : error.code === "INVALID_INPUT" ? 400 : 500;
  return Response.json({ error: { code: error.code, message: error.message } }, { status });
}

export async function GET(request: Request) {
  try {
    const rawLimit = Number(new URL(request.url).searchParams.get("limit") ?? 100);
    const history = await listWorkspaceHistory(Number.isFinite(rawLimit) ? rawLimit : 100);
    return Response.json({ history }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return error instanceof HistoryServiceError ? historyError(error) : routeErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = LinkHistorySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: { code: "INVALID_INPUT", message: "The history link is invalid." } }, { status: 400 });
    }
    await linkHistoryRunToDashboard(parsed.data);
    return Response.json({ linked: true }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return error instanceof HistoryServiceError ? historyError(error) : routeErrorResponse(error);
  }
}
