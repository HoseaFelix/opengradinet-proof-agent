import { NextRequest } from "next/server";
import { AgentRun } from "@/types";
import { createRun, listRuns } from "@/lib/server/firestoreRepo";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const agentId = request.nextUrl.searchParams.get("agentId") || undefined;
    const runs = await listRuns(auth.user.uid, agentId);
    return ok(runs);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as AgentRun;
    if (!body?.id || !body?.agentId || !body?.input || !body?.status) {
      return badRequest("Invalid run payload");
    }

    const payload: AgentRun = {
      ...body,
      userId: auth.user.uid,
    };

    await createRun(auth.user.uid, payload);
    return ok(payload, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
