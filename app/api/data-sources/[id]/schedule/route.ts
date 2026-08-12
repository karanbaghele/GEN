import { z } from "zod";

import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import { updateProductionSourceSchedule } from "@/src/server/services/data-source-service";

const ScheduleRequestSchema = z.object({
  intervalMinutes: z.union([z.literal(15), z.literal(60), z.literal(360), z.literal(1440), z.null()]),
}).strict();

export async function PATCH(
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
    const parsed = ScheduleRequestSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return Response.json(
        { error: { code: "INVALID_INPUT", message: "Choose a supported refresh schedule." } },
        { status: 400 },
      );
    }
    return Response.json(
      { source: await updateProductionSourceSchedule(id, parsed.data.intervalMinutes) },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
