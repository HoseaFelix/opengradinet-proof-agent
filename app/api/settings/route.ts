import { NextRequest } from "next/server";
import { getSettings, setSettings, UserSettings } from "@/lib/server/firestoreRepo";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { requireUser } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const settings = await getSettings(auth.user.uid);
    // Never send stored secrets back to the client.
    // Users can set their own key, but it remains write-only.
    const ogApiKeyConfigured = !!settings.ogApiKey?.trim();
    const usingServerOgKey = !ogApiKeyConfigured && !!process.env.OG_PRIVATE_KEY?.trim();
    return ok({
      ...settings,
      ogApiKey: "",
      ogApiKeyConfigured,
      usingServerOgKey,
    });
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

    const existing = await getSettings(auth.user.uid);
    const next: UserSettings = {
      ...existing,
      ...body,
      // Write-only: keep existing unless user provides a non-empty value.
      ogApiKey: body.ogApiKey?.trim() ? body.ogApiKey.trim() : existing.ogApiKey,
    };

    const settings = await setSettings(auth.user.uid, next);
    return ok({
      ...settings,
      ogApiKey: "",
      ogApiKeyConfigured: !!settings.ogApiKey?.trim(),
      usingServerOgKey: !settings.ogApiKey?.trim() && !!process.env.OG_PRIVATE_KEY?.trim(),
    });
  } catch (error) {
    return serverError(error);
  }
}
