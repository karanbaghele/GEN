import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import { synchronizeProductionSource } from "@/src/server/services/data-source-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return Response.json(
        { error: { code: "INVALID_INPUT", message: "Data source id is invalid." } },
        { status: 400 },
      );
    }
    return Response.json(
      { snapshot: await synchronizeProductionSource(id) },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
