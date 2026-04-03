"use client";

import { firebaseAuth } from "@/lib/firebase/client";
import { Agent, AgentRun } from "@/types";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Request failed" }))) as {
      error?: string;
    };
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

async function authHeaders(extra?: Record<string, string>) {
  const token = await firebaseAuth.currentUser?.getIdToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch("/api/agents", {
    cache: "no-store",
    headers: await authHeaders(),
  });
  return parseJson<Agent[]>(res);
}

export async function fetchAgent(id: string): Promise<Agent> {
  const res = await fetch(`/api/agents/${id}`, {
    cache: "no-store",
    headers: await authHeaders(),
  });
  return parseJson<Agent>(res);
}

export async function createAgent(payload: Agent): Promise<Agent> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseJson<Agent>(res);
}

export async function updateAgent(id: string, updates: Partial<Agent>): Promise<void> {
  const res = await fetch(`/api/agents/${id}`, {
    method: "PUT",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(updates),
  });
  await parseJson<{ success: boolean }>(res);
}

export async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`/api/agents/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await parseJson<{ success: boolean }>(res);
}

export async function fetchRuns(agentId?: string): Promise<AgentRun[]> {
  const query = agentId ? `?agentId=${encodeURIComponent(agentId)}` : "";
  const res = await fetch(`/api/runs${query}`, {
    cache: "no-store",
    headers: await authHeaders(),
  });
  return parseJson<AgentRun[]>(res);
}

export async function fetchRun(runId: string): Promise<AgentRun> {
  const res = await fetch(`/api/runs/${runId}`, {
    cache: "no-store",
    headers: await authHeaders(),
  });
  return parseJson<AgentRun>(res);
}

export async function createRun(payload: AgentRun): Promise<AgentRun> {
  const res = await fetch("/api/runs", {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseJson<AgentRun>(res);
}

export async function updateRun(runId: string, updates: Partial<AgentRun>): Promise<void> {
  const res = await fetch(`/api/runs/${runId}`, {
    method: "PUT",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(updates),
  });
  await parseJson<{ success: boolean }>(res);
}

export type UserSettings = {
  ogApiKey: string;
  memSyncKey: string;
  defaultModel: string;
  notifications: {
    runCompletion: boolean;
    proofConfirmation: boolean;
    runFailure: boolean;
  };
};

export async function fetchSettings(): Promise<UserSettings> {
  const res = await fetch("/api/settings", {
    cache: "no-store",
    headers: await authHeaders(),
  });
  return parseJson<UserSettings>(res);
}

export async function updateSettings(payload: UserSettings): Promise<UserSettings> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseJson<UserSettings>(res);
}

export async function deleteMyData(): Promise<void> {
  const res = await fetch("/api/account", {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await parseJson<{ success: boolean }>(res);
}
