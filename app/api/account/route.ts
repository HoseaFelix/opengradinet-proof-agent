import { NextRequest } from "next/server";
import { deleteAllUserData } from "@/lib/server/firestoreRepo";
import { ok, serverError } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    await deleteAllUserData(auth.user.uid);
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
