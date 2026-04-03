import { CollectionReference } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { Agent, AgentRun } from "@/types";

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

const DEFAULT_SETTINGS: UserSettings = {
  ogApiKey: "",
  memSyncKey: "",
  defaultModel: "gemini-3-flash",
  notifications: {
    runCompletion: true,
    proofConfirmation: true,
    runFailure: true,
  },
};

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (value && typeof value === "object") {
    const cleaned = Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, val]) => {
        if (val !== undefined) {
          acc[key] = stripUndefined(val);
        }
        return acc;
      },
      {} as Record<string, unknown>
    );
    return cleaned as T;
  }
  return value;
}

function agentsCollection(uid: string) {
  return db.collection("users").doc(uid).collection("agents") as CollectionReference<Agent>;
}

function runsCollection(uid: string) {
  return db.collection("users").doc(uid).collection("runs") as CollectionReference<AgentRun>;
}

function settingsDoc(uid: string) {
  return db.collection("users").doc(uid).collection("meta").doc("settings");
}

export async function listAgents(uid: string): Promise<Agent[]> {
  const snapshot = await agentsCollection(uid).get();
  return snapshot.docs
    .map((d) => d.data())
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export async function getAgentById(uid: string, id: string): Promise<Agent | null> {
  const snapshot = await agentsCollection(uid).doc(id).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as Agent;
}

export async function createAgent(uid: string, agent: Agent): Promise<Agent> {
  await agentsCollection(uid).doc(agent.id).set(stripUndefined(agent));
  return agent;
}

export async function patchAgent(uid: string, id: string, updates: Partial<Agent>): Promise<void> {
  await agentsCollection(uid).doc(id).update(stripUndefined(updates));
}

export async function removeAgent(uid: string, id: string): Promise<void> {
  await agentsCollection(uid).doc(id).delete();
}

export async function listRuns(uid: string, agentId?: string): Promise<AgentRun[]> {
  const snapshot = await runsCollection(uid).get();
  const runs = snapshot.docs.map((d) => d.data());
  const filtered = agentId ? runs.filter((r) => r.agentId === agentId) : runs;
  return filtered.sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1));
}

export async function getRunById(uid: string, id: string): Promise<AgentRun | null> {
  const snapshot = await runsCollection(uid).doc(id).get();
  if (!snapshot.exists) return null;
  return snapshot.data() as AgentRun;
}

export async function createRun(uid: string, run: AgentRun): Promise<AgentRun> {
  await runsCollection(uid).doc(run.id).set(stripUndefined(run));
  return run;
}

export async function patchRun(uid: string, id: string, updates: Partial<AgentRun>): Promise<void> {
  await runsCollection(uid).doc(id).update(stripUndefined(updates));
}

export async function getSettings(uid: string): Promise<UserSettings> {
  const ref = settingsDoc(uid);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    await ref.set(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return snapshot.data() as UserSettings;
}

export async function setSettings(uid: string, settings: UserSettings): Promise<UserSettings> {
  const ref = settingsDoc(uid);
  await ref.set(stripUndefined(settings));
  return settings;
}

export async function deleteAllUserData(uid: string): Promise<void> {
  const [agentsSnapshot, runsSnapshot] = await Promise.all([
    agentsCollection(uid).get(),
    runsCollection(uid).get(),
  ]);

  await Promise.all([
    ...agentsSnapshot.docs.map((d) => d.ref.delete()),
    ...runsSnapshot.docs.map((d) => d.ref.delete()),
    settingsDoc(uid).delete().catch(() => undefined),
  ]);
}
