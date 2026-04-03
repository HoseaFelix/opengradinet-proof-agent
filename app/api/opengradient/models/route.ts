import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { badRequest, ok, serverError } from "@/lib/server/api";
import { getOgBaseUrl, getOgTokenForUser, mapModelType } from "@/lib/server/opengradient";
import { formatFetchError } from "@/lib/server/fetchError";
import { AIModel } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const token = await getOgTokenForUser(auth.user.uid);
    const baseUrl = getOgBaseUrl();
    let upstream: Response;
    try {
      upstream = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    } catch (e) {
      return badRequest(
        `OpenGradient network error (${formatFetchError(e)}). Check OG_LLM_BASE_URL (${baseUrl}) and your internet/DNS.`
      );
    }

    if (!upstream.ok) {
      return badRequest(`Failed to load models: ${await upstream.text()}`);
    }

    const json = (await upstream.json()) as {
      data?: Array<{ id: string; owned_by?: string; created?: number }>;
    };

    const models: AIModel[] = (json.data || []).map((m) => ({
      id: m.id,
      name: m.id,
      description: "OpenGradient hosted model",
      architecture: "Unknown",
      version: m.created ? String(m.created) : "latest",
      type: mapModelType(m.id),
      size: "Unknown",
      verification: "TEE",
      provider: m.owned_by || "OpenGradient",
    }));

    return ok(models);
  } catch (error) {
    return serverError(error);
  }
}
