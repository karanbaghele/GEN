import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import { getProductionDatasetSnapshot } from "@/src/server/services/data-source-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return Response.json(
        { error: { code: "INVALID_INPUT", message: "Dataset id is invalid." } },
        { status: 400 },
      );
    }
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 200);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 1 || offset < 0) {
      return Response.json(
        { error: { code: "INVALID_INPUT", message: "Preview range is invalid." } },
        { status: 400 },
      );
    }
    return Response.json(
      { snapshot: await getProductionDatasetSnapshot(id, { limit, offset }) },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
