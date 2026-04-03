// =============================================================================
// ProofAgent — TypeScript Interfaces
// =============================================================================

export interface User {
    id: string;
    email: string;
    name?: string;
    apiKey?: string;
    memSyncKey?: string;
    createdAt: string;
}

export type AgentStatus = "active" | "paused" | "archived";
export type TriggerType = "manual" | "scheduled" | "webhook";
export type RunStatus = "running" | "completed" | "failed";
export type MemoryType = "semantic" | "episodic";
export type ModelVerification = "TEE" | "ZKML" | "Vanilla";

export interface Agent {
    id: string;
    userId: string;
    name: string;
    description?: string;
    systemPrompt: string;
    model: string;
    triggerType: TriggerType;
    triggerConfig?: Record<string, unknown>;
    memoryEnabled: boolean;
    agentId: string;
    status: AgentStatus;
    avatar?: string;
    color?: string;
    createdAt: string;
    updatedAt: string;
    totalRuns?: number;
    lastRunAt?: string;
    lastRunStatus?: RunStatus;
}

export interface RunStep {
    id: string;
    type:
    | "memory_retrieval"
    | "prompt_construction"
    | "inference"
    | "output"
    | "settlement";
    label: string;
    status: "pending" | "running" | "completed" | "failed";
    startedAt?: string;
    completedAt?: string;
    durationMs?: number;
    data?: Record<string, unknown>;
}

export interface Attestation {
    teeProvider: string;
    enclaveHash: string;
    timestamp: number;
    signature: string;
}

export interface ProofData {
    attestation: Attestation;
    promptHash: string;
    promptContent?: string;
    model: string;
    enclaveHash?: string;
    validators?: { confirmed: number; total: number };
    blockNumber?: number;
    settlementTime?: number;
    txHash?: string;
}

export interface AgentRun {
    id: string;
    agentId: string;
    agentName?: string;
    userId: string;
    status: RunStatus;
    input: string;
    output?: string;
    steps: RunStep[];
    memoriesUsed?: string[];
    proofHash?: string;
    proofData?: ProofData;
    tokenCount?: number;
    durationMs?: number;
    startedAt: string;
    completedAt?: string;
}

export interface Memory {
    id: string;
    memory: string;
    categories: string[];
    type: MemoryType;
    vector_distance: number;
    rerank_score: number;
    source: string;
    created_at: string;
}

export interface UserProfile {
    user_bio: string;
    profiles: Record<string, string>;
    insights: string[];
}

export interface AIModel {
    id: string;
    name: string;
    description: string;
    architecture: string;
    version: string;
    type: "LLM" | "ML" | "Embedding";
    size: string;
    verification: ModelVerification;
    provider: string;
    contextLength?: number;
}

export interface InferenceResult {
    content: string;
    proofHash: string;
    attestation: Attestation;
    promptHash: string;
    model: string;
    tokenUsage: {
        prompt: number;
        completion: number;
        total: number;
    };
}

export interface NetworkStatus {
    blockHeight: number;
    tps: number;
    inferenceNodes: number;
    status: "online" | "degraded" | "offline";
}

export interface DashboardStats {
    totalAgents: number;
    totalRuns: number;
    successfulProofs: number;
    tokensUsed: number;
}

export interface WizardStep {
    id: number;
    label: string;
    description: string;
}
