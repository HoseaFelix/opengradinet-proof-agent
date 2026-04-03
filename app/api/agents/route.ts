import { NextRequest } from "next/server";
import { Agent } from "@/types";
import { createAgent, listAgents } from "@/lib/server/firestoreRepo";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";
import { requireMemSyncApiKeyForUser } from "@/lib/server/memsync";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const agents = await listAgents(auth.user.uid);
    return ok(agents);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as Agent;
    if (!body?.id || !body?.name || !body?.systemPrompt || !body?.model) {
      return badRequest("Invalid agent payload");
    }

    if (body.memoryEnabled) {
      try {
        await requireMemSyncApiKeyForUser(auth.user.uid);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Missing MemSync API key in settings";
        return badRequest(message);
      }
    }

    const payload: Agent = {
      ...body,
      userId: auth.user.uid,
    };

    await createAgent(auth.user.uid, payload);
    return ok(payload, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
