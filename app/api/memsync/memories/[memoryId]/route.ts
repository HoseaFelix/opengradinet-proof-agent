import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { memsyncRequest } from "@/lib/server/memsyncClient";
import { getMemSyncApiKeyForUserOptional } from "@/lib/server/memsync";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const apiKey = await getMemSyncApiKeyForUserOptional(auth.user.uid);
    if (!apiKey) {
      return ok({ success: false, disabled: true });
    }

    const { memoryId } = await params;
    if (!memoryId) return badRequest("Missing memoryId");

    const res = await memsyncRequest(
      auth.user.uid,
      [`/memory/${memoryId}`, `/memories/${memoryId}`],
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      return badRequest(`MemSync delete error: ${await res.text()}`);
    }

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
