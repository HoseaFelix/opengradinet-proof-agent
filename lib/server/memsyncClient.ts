import { requireMemSyncApiKeyForUser, getMemSyncBaseUrl } from "@/lib/server/memsync";

async function tryRequest(
  uid: string,
  path: string,
  init: RequestInit
): Promise<Response> {
  const apiKey = await requireMemSyncApiKeyForUser(uid);
  const baseUrl = getMemSyncBaseUrl();

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...(init.headers || {}),
    },
  });
}

export async function memsyncRequest(
  uid: string,
  paths: string[],
  init: RequestInit
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (const path of paths) {
    const res = await tryRequest(uid, path, init);
    if (res.ok) return res;

    // Retry alternative paths for 404s only.
    if (res.status !== 404) {
      return res;
    }
    lastResponse = res;
  }

  if (!lastResponse) {
    throw new Error("No MemSync paths provided");
  }

  return lastResponse;
}
