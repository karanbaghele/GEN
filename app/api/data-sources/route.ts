import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import { listProductionDataSources } from "@/src/server/services/data-source-service";

export async function GET() {
  try {
    return Response.json(
      { sources: await listProductionDataSources() },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
