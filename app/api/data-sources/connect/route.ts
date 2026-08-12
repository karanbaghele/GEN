import { z } from "zod";

import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import {
  DataSourceServiceError,
  connectProductionSource,
} from "@/src/server/services/data-source-service";

const GoogleSheetsSchema = z.object({
  name: z.string().trim().min(1).max(160),
  kind: z.literal("google_sheets"),
  config: z.object({
    spreadsheetId: z.string().trim().min(20).max(500),
    sheetName: z.string().trim().max(100).optional(),
    range: z.string().trim().max(150).optional(),
  }).strict(),
  credential: z.object({
    apiKey: z.string().trim().max(500).optional(),
    accessToken: z.string().trim().max(4_000).optional(),
  }).strict().optional(),
}).strict();

const PostgresSchema = z.object({
  name: z.string().trim().min(1).max(160),
  kind: z.literal("postgresql"),
  config: z.object({
    schema: z.string().trim().min(1).max(63).default("public"),
    table: z.string().trim().min(1).max(63),
  }).strict(),
  credential: z.object({
    connectionString: z.string().trim().min(12).max(4_000),
  }).strict(),
}).strict();

const ConnectSchema = z.discriminatedUnion("kind", [GoogleSheetsSchema, PostgresSchema]);

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 16_000) {
      throw new DataSourceServiceError("INVALID_INPUT", "The connector request is too large.");
    }
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      throw new DataSourceServiceError("INVALID_INPUT", "The connector request must contain valid JSON.");
    }
    const parsed = ConnectSchema.safeParse(payload);
    if (!parsed.success) {
      throw new DataSourceServiceError("INVALID_INPUT", "The connector settings are not valid.");
    }
    return Response.json(
      { snapshot: await connectProductionSource(parsed.data) },
      { status: 201, headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
