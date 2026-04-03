import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { memsyncRequest } from "@/lib/server/memsyncClient";
import { getMemSyncApiKeyForUserOptional } from "@/lib/server/memsync";
import { Memory } from "@/types";

function normalizeMemories(payload: unknown): Memory[] {
  if (Array.isArray(payload)) return payload as Memory[];
  if (payload && typeof payload === "object") {
    const asObj = payload as { memories?: Memory[]; data?: Memory[] };
    return asObj.memories || asObj.data || [];
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const apiKey = await getMemSyncApiKeyForUserOptional(auth.user.uid);
    if (!apiKey) {
      return ok([] as Memory[]);
    }

    const res = await memsyncRequest(auth.user.uid, ["/memory", "/memories"], {
      method: "GET",
    });

    if (!res.ok) {
      return badRequest(`MemSync error: ${await res.text()}`);
    }

    const json = (await res.json()) as unknown;
    return ok(normalizeMemories(json));
  } catch (error) {
    return serverError(error);
  }
}
