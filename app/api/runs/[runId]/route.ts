import { NextRequest } from "next/server";
import { AgentRun } from "@/types";
import { getRunById, patchRun } from "@/lib/server/firestoreRepo";
import { badRequest, notFound, ok, serverError } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { runId } = await params;
    const run = await getRunById(auth.user.uid, runId);
    if (!run) return notFound("Run not found");
    return ok(run);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const { runId } = await params;
    const body = (await request.json()) as Partial<AgentRun>;
    if (!body || Object.keys(body).length === 0) {
      return badRequest("No updates provided");
    }

    await patchRun(auth.user.uid, runId, body);
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
