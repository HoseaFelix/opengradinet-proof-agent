import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { memsyncRequest } from "@/lib/server/memsyncClient";
import { getMemSyncApiKeyForUserOptional } from "@/lib/server/memsync";

type StorePayload = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  agentId: string;
  threadId: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const apiKey = await getMemSyncApiKeyForUserOptional(auth.user.uid);
    if (!apiKey) {
      return ok({ success: false, disabled: true });
    }

    const body = (await request.json()) as StorePayload;
    if (!body?.messages?.length || !body.agentId || !body.threadId) {
      return badRequest("Invalid memory store payload");
    }

    const res = await memsyncRequest(auth.user.uid, ["/memory", "/memories"], {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return badRequest(`MemSync store error: ${await res.text()}`);
    }

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
