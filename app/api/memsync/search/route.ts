import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { memsyncRequest } from "@/lib/server/memsyncClient";
import { getMemSyncApiKeyForUserOptional } from "@/lib/server/memsync";
import { Memory } from "@/types";

type SearchPayload = {
  query: string;
  limit?: number;
  rerank?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const apiKey = await getMemSyncApiKeyForUserOptional(auth.user.uid);
    if (!apiKey) {
      return ok({ user_bio: "", memories: [] as Memory[] });
    }

    const body = (await request.json()) as SearchPayload;
    if (!body?.query?.trim()) {
      return badRequest("Missing search query");
    }

    const res = await memsyncRequest(auth.user.uid, ["/memory/search", "/memories/search"], {
      method: "POST",
      body: JSON.stringify({
        query: body.query,
        limit: body.limit,
        rerank: body.rerank,
      }),
    });

    if (!res.ok) {
      return badRequest(`MemSync search error: ${await res.text()}`);
    }

    const json = (await res.json()) as {
      user_bio?: string;
      memories?: Memory[];
      data?: { user_bio?: string; memories?: Memory[] };
    };

    return ok({
      user_bio: json.user_bio || json.data?.user_bio || "",
      memories: json.memories || json.data?.memories || [],
    });
  } catch (error) {
    return serverError(error);
  }
}
