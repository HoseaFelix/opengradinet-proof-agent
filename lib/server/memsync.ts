import { getSettings } from "@/lib/server/firestoreRepo";

export function getMemSyncBaseUrl() {
  return process.env.MEMSYNC_BASE_URL || "https://api.memchat.io/v1";
}

export async function getMemSyncApiKeyForUserOptional(
  uid: string
): Promise<string | null> {
  const settings = await getSettings(uid);
  const fromSettings = settings.memSyncKey?.trim();
  const fromEnv = process.env.MEMSYNC_API_KEY?.trim();
  const key = fromSettings || fromEnv;

  return key || null;
}

export async function requireMemSyncApiKeyForUser(uid: string): Promise<string> {
  const key = await getMemSyncApiKeyForUserOptional(uid);
  if (!key) {
    throw new Error(
      "Missing MemSync API key. Set it in Settings > MemSync API Key or MEMSYNC_API_KEY env var."
    );
  }
  return key;
}
