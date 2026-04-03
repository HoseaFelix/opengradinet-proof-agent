import { AIModel, Attestation, InferenceResult } from "@/types";
import { firebaseAuth } from "@/lib/firebase/client";

export const AVAILABLE_MODELS = [
  "gemini-3-flash",
  "gpt-5",
  "claude-sonnet-4-6",
  "grok-4",
];

async function authHeaders(extra?: Record<string, string>) {
  const token = await firebaseAuth.currentUser?.getIdToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return `Request failed with status ${res.status}`;
  try {
    const asJson = JSON.parse(text) as { error?: string };
    if (asJson?.error) return asJson.error;
  } catch {
    // ignore
  }
  return text;
}

export async function runVerifiableInference(params: {
  model: string;
  systemPrompt: string;
  userMessage: string;
  memories?: string[];
}): Promise<InferenceResult> {
  const res = await fetch("/api/opengradient/chat", {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return (await res.json()) as InferenceResult;
}

export async function* streamVerifiableInference(params: {
  model: string;
  systemPrompt: string;
  userMessage: string;
  memories?: string[];
}): AsyncGenerator<
  | { type: "token"; content: string }
  | { type: "error"; message: string }
  | { type: "proof"; attestation: Attestation; proofHash: string }
  | { type: "done"; result: InferenceResult }
> {
  const res = await fetch("/api/opengradient/stream", {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(params),
  });

  if (!res.ok || !res.body) {
    throw new Error(await readErrorMessage(res));
  }

  const decoder = new TextDecoder();
  const reader = res.body.getReader();

  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const event = JSON.parse(trimmed) as
        | { type: "token"; content: string }
        | { type: "error"; message: string }
        | { type: "proof"; attestation: Attestation; proofHash: string }
        | { type: "done"; result: InferenceResult };

      yield event;
    }
  }
}

export async function fetchNetworkStatus(): Promise<{
  status: "online" | "degraded" | "offline";
  latencyMs: number;
  modelCount: number;
  checkedAt: string;
}> {
  const res = await fetch("/api/opengradient/network", {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch OpenGradient network status");
  }
  return (await res.json()) as {
    status: "online" | "degraded" | "offline";
    latencyMs: number;
    modelCount: number;
    checkedAt: string;
  };
}

export async function fetchModelHub(opts?: {
  query?: string;
  type?: string;
  verification?: string;
}): Promise<AIModel[]> {
  const res = await fetch("/api/opengradient/models", {
    cache: "no-store",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch OpenGradient models");
  }

  const models = (await res.json()) as AIModel[];

  let filtered = models;
  if (opts?.query) {
    const q = opts.query.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q)
    );
  }
  if (opts?.type && opts.type !== "all") {
    filtered = filtered.filter((m) => m.type === opts.type);
  }
  if (opts?.verification && opts.verification !== "all") {
    filtered = filtered.filter((m) => m.verification === opts.verification);
  }

  return filtered;
}
