import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { memsyncRequest } from "@/lib/server/memsyncClient";
import { getMemSyncApiKeyForUserOptional } from "@/lib/server/memsync";
import { UserProfile } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const apiKey = await getMemSyncApiKeyForUserOptional(auth.user.uid);
    if (!apiKey) {
      const empty: UserProfile = { user_bio: "", profiles: {}, insights: [] };
      return ok(empty);
    }

    const res = await memsyncRequest(auth.user.uid, ["/users/profile", "/profile"], {
      method: "GET",
    });

    if (!res.ok) {
      return badRequest(`MemSync profile error: ${await res.text()}`);
    }

    const json = (await res.json()) as UserProfile | { data?: UserProfile };
    if ((json as { data?: UserProfile }).data) {
      return ok((json as { data?: UserProfile }).data as UserProfile);
    }

    return ok(json as UserProfile);
  } catch (error) {
    return serverError(error);
  }
}
