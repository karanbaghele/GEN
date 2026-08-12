import { z } from "zod";

import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import {
  generateProductionDashboard,
  ProductionGenerationError,
} from "@/src/server/services/ai-generation-service";

const DataValueSchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const DatasetProfileSchema = z
  .object({
    rowCount: z.number().int().min(1).max(10_000_000),
    columnCount: z.number().int().min(1).max(200),
    profiledRowCount: z.number().int().min(1).max(10_000),
    fields: z
      .array(
        z
          .object({
            name: z.string().min(1).max(256),
            physicalType: z.enum([
              "null",
              "boolean",
              "integer",
              "number",
              "date",
              "datetime",
              "string",
              "mixed",
            ]),
            nullable: z.boolean(),
            sampleValues: z.array(DataValueSchema).max(5),
            statistics: z
              .object({
                nullCount: z.number().int().min(0),
                nullPercentage: z.number().min(0).max(1),
                distinctCount: z.number().int().min(0),
                distinctCountIsApproximate: z.boolean(),
                uniquePercentage: z.number().min(0).max(1),
                min: DataValueSchema.optional(),
                max: DataValueSchema.optional(),
                mean: z.number().finite().optional(),
                sum: z.number().finite().optional(),
              })
              .strict(),
            semantics: z
              .object({
                role: z.enum(["measure", "dimension", "identifier", "time"]),
                type: z.enum([
                  "unknown",
                  "identifier",
                  "date",
                  "category",
                  "boolean",
                  "number",
                  "count",
                  "currency",
                  "percentage",
                  "duration",
                  "geography",
                ]),
                confidence: z.number().min(0).max(1),
                unit: z.string().max(40).optional(),
                reasons: z.array(z.string().max(200)).max(12),
              })
              .strict(),
          })
          .strict(),
      )
      .min(1)
      .max(200),
    warnings: z.array(z.string().max(300)).max(20),
  })
  .strict();

const GenerateRequestSchema = z
  .object({
    prompt: z.string().trim().min(1).max(12_000),
    sourceId: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/i),
    sourceName: z.string().trim().min(1).max(160),
    datasetId: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/i),
    sourceKind: z.enum(["sample", "csv", "xlsx", "google_sheets", "postgresql"]),
    dashboardId: z.string().min(1).max(128).optional(),
    profile: DatasetProfileSchema,
  })
  .strict();

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 500_000) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "The generation request is too large." } },
      { status: 413 },
    );
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "The request must contain valid JSON." } },
      { status: 400 },
    );
  }
  const parsed = GenerateRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: { code: "INVALID_INPUT", message: "The generation request is not valid." } },
      { status: 400 },
    );
  }

  try {
    return Response.json(await generateProductionDashboard(parsed.data), {
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof ProductionGenerationError) {
      const status =
        error.code === "RATE_LIMITED"
          ? 429
          : error.code === "AI_NOT_CONFIGURED"
            ? 503
            : 500;
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status },
      );
    }
    return routeErrorResponse(error);
  }
}
