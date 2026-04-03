import { getSettings } from "@/lib/server/firestoreRepo";

export function getOgBaseUrl() {
  const pyServer = (process.env.OG_PY_SERVER_URL || "").trim();
  if (pyServer) {
    const normalized = pyServer.replace(/\/+$/, "");
    if (normalized.endsWith("/v1")) return normalized;
    return `${normalized}/v1`;
  }

  const raw = (process.env.OG_LLM_BASE_URL || "https://llm.opengradient.ai").trim();
  const noTrailingSlash = raw.replace(/\/+$/, "");
  if (noTrailingSlash.endsWith("/v1")) return noTrailingSlash;
  return `${noTrailingSlash}/v1`;
}

export async function getOgTokenForUser(uid: string): Promise<string> {
  const settings = await getSettings(uid);
  const tokenFromSettings = settings.ogApiKey?.trim();
  const tokenFromEnv = process.env.OG_PRIVATE_KEY?.trim();
  const token = tokenFromSettings || tokenFromEnv;

  if (!token) {
    throw new Error(
      "Missing OpenGradient token. Set it in Settings > OpenGradient API Key or OG_PRIVATE_KEY env var."
    );
  }

  return token;
}

export function mapModelType(modelId: string): "LLM" | "ML" | "Embedding" {
  const id = modelId.toLowerCase();
  if (id.includes("embed")) return "Embedding";
  if (id.includes("vision") || id.includes("resnet") || id.includes("cnn")) return "ML";
  return "LLM";
}
