import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { ok } from "@/lib/server/api";
import { getOgBaseUrl, getOgTokenForUser } from "@/lib/server/opengradient";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const token = await getOgTokenForUser(auth.user.uid);
    const baseUrl = getOgBaseUrl();

    const startedAt = Date.now();
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch {
      return ok({
        status: "offline",
        latencyMs: 0,
        modelCount: 0,
        checkedAt: new Date().toISOString(),
      });
    }
    const latencyMs = Date.now() - startedAt;

    let modelCount = 0;
    if (res.ok) {
      const data = (await res.json()) as { data?: unknown[] };
      modelCount = data.data?.length || 0;
    }

    return ok({
      status: res.ok ? "online" : "degraded",
      latencyMs,
      modelCount,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return ok({
      status: "offline",
      latencyMs: 0,
      modelCount: 0,
      checkedAt: new Date().toISOString(),
    });
  }
}
