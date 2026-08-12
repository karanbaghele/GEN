import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import { disconnectProductionSource } from "@/src/server/services/data-source-service";

export async function DELETE(
  request: Request,
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
    const confirmDependencies = new URL(request.url).searchParams.get("confirmDependencies") === "true";
    return Response.json(
      { result: await disconnectProductionSource(id, { confirmDependencies }) },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
