import { routeErrorResponse } from "@/src/server/http/dashboard-request";
import {
  DataSourceServiceError,
  uploadProductionDataset,
} from "@/src/server/services/data-source-service";

const MAX_REQUEST_BYTES = 11 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      throw new DataSourceServiceError("INVALID_INPUT", "Upload a file up to 10 MB.");
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new DataSourceServiceError("INVALID_INPUT", "Choose a CSV, TSV, or XLSX file.");
    }
    return Response.json(
      { snapshot: await uploadProductionDataset(file) },
      { status: 201, headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return routeErrorResponse(error);
  }
}
