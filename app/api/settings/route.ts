import { NextRequest } from "next/server";
import { getSettings, setSettings, UserSettings } from "@/lib/server/firestoreRepo";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const settings = await getSettings(auth.user.uid);
    return ok(settings);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as UserSettings;
    if (!body || !body.notifications || !body.defaultModel) {
      return badRequest("Invalid settings payload");
    }

    const settings = await setSettings(auth.user.uid, body);
    return ok(settings);
  } catch (error) {
    return serverError(error);
  }
}
