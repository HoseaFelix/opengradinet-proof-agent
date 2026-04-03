import { Memory, UserProfile } from "@/types";
import { firebaseAuth } from "@/lib/firebase/client";

async function authHeaders(extra?: Record<string, string>) {
  const token = await firebaseAuth.currentUser?.getIdToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Request failed" }))) as {
      error?: string;
    };
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function storeConversationMemory(params: {
  apiKey: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  agentId: string;
  threadId: string;
}): Promise<void> {
  void params.apiKey;
  const res = await fetch("/api/memsync/store", {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      messages: params.messages,
      agentId: params.agentId,
      threadId: params.threadId,
    }),
  });

  await parseJson<{ success: boolean }>(res);
}

export async function searchMemories(params: {
  apiKey: string;
  query: string;
  limit?: number;
  rerank?: boolean;
}): Promise<{ user_bio: string; memories: Memory[] }> {
  void params.apiKey;
  const res = await fetch("/api/memsync/search", {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      query: params.query,
      limit: params.limit,
      rerank: params.rerank,
    }),
  });

  return parseJson<{ user_bio: string; memories: Memory[] }>(res);
}

export async function getUserProfile(apiKey: string): Promise<UserProfile> {
  void apiKey;
  const res = await fetch("/api/memsync/profile", {
    cache: "no-store",
    headers: await authHeaders(),
  });

  return parseJson<UserProfile>(res);
}

export async function getAllMemories(apiKey: string): Promise<Memory[]> {
  void apiKey;
  const res = await fetch("/api/memsync/memories", {
    cache: "no-store",
    headers: await authHeaders(),
  });

  return parseJson<Memory[]>(res);
}

export async function deleteMemory(apiKey: string, memoryId: string): Promise<void> {
  void apiKey;
  const res = await fetch(`/api/memsync/memories/${memoryId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });

  await parseJson<{ success: boolean }>(res);
}
