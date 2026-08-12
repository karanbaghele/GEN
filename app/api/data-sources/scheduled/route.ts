import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import { runDueProductionSourceSynchronizations } from "@/src/server/services/data-source-service";

export async function POST() {
  try {
    return Response.json(
      { result: await runDueProductionSourceSynchronizations() },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
