"use client";

import { use, useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AgentStatusBadge } from "@/components/agents/AgentStatusBadge";
import { timeAgo, truncateHash, randomId } from "@/lib/utils";
import { streamVerifiableInference } from "@/lib/opengradient";
import { createRun, fetchAgent, fetchRuns, updateRun } from "@/lib/api/client";
import { searchMemories, storeConversationMemory } from "@/lib/memsync";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import {
  Bot,
  Cpu,
  MemoryStick,
  Shield,
  Send,
  ChevronRight,
  CheckCircle,
  Lock,
  Anchor,
  Eye,
  Copy,
  Edit3,
} from "lucide-react";
import { AgentRun } from "@/types";

type ProofPhase = "idle" | "inference" | "attestation" | "settling" | "confirmed";

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ["agents", id],
    queryFn: () => fetchAgent(id),
  });

  const { data: agentRuns = [] } = useQuery({
    queryKey: ["runs", id],
    queryFn: () => fetchRuns(id),
    enabled: !!id,
  });

  const createRunMutation = useMutation({
    mutationFn: createRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runs", id] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  const updateRunMutation = useMutation({
    mutationFn: async ({ runId, updates }: { runId: string; updates: Partial<AgentRun> }) => {
      await updateRun(runId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runs", id] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [runError, setRunError] = useState<string | null>(null);
  const [proofPhase, setProofPhase] = useState<ProofPhase>("idle");
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [proofHash, setProofHash] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamedText]);

  if (agentLoading) {
    return <div className="skeleton h-64 w-full rounded-xl" />;
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "var(--text-muted)" }}>Agent not found</p>
      </div>
    );
  }

  async function handleRun() {
    if (!input.trim() || streaming) return;
    const currentAgent = agent;
    if (!currentAgent) return;
    const runId = `run_${randomId()}`;
    setCurrentRunId(runId);
    setStreaming(true);
    setStreamedText("");
    setRunError(null);
    setProofPhase("inference");
    setProofHash(null);

    const runInput = input;
    let retrievedMemories: string[] = [];
    const startedAt = new Date().toISOString();
    const newRun: AgentRun = {
      id: runId,
      agentId: currentAgent.id,
      agentName: currentAgent.name,
      userId: user?.uid || "",
      status: "running",
      input: runInput,
      steps: [],
      startedAt,
    };

    let runCreated = false;
    let accumulatedText = "";

    try {
      if (currentAgent.memoryEnabled) {
        try {
          const memoryResult = await searchMemories({
            apiKey: "",
            query: runInput,
            limit: 5,
            rerank: true,
          });
          retrievedMemories = memoryResult.memories.map((m) => m.memory);
        } catch {
          // Memory retrieval should not block inference.
          retrievedMemories = [];
        }
      }

      await createRunMutation.mutateAsync(newRun);
      runCreated = true;

      const gen = streamVerifiableInference({
        model: currentAgent.model,
        systemPrompt: currentAgent.systemPrompt,
        userMessage: runInput,
        memories: retrievedMemories,
      });

      for await (const event of gen) {
        if (event.type === "token") {
          accumulatedText += event.content;
          setStreamedText(accumulatedText);
        } else if (event.type === "error") {
          throw new Error(event.message || "Inference stream error");
        } else if (event.type === "proof") {
          setProofPhase("attestation");
          setProofHash(event.proofHash);
          await new Promise((r) => setTimeout(r, 600));
          setProofPhase("settling");
          await new Promise((r) => setTimeout(r, 1200));
          setProofPhase("confirmed");
        } else if (event.type === "done") {
          if (!accumulatedText && event.result.content) {
            setStreamedText(event.result.content);
          }
          await updateRunMutation.mutateAsync({
            runId,
            updates: {
              status: "completed",
              output: event.result.content,
              proofHash: event.result.proofHash,
              tokenCount: event.result.tokenUsage.total,
              durationMs: Date.now() - new Date(startedAt).getTime(),
              completedAt: new Date().toISOString(),
            },
          });

          if (currentAgent.memoryEnabled) {
            void storeConversationMemory({
              apiKey: "",
              agentId: currentAgent.id,
              threadId: runId,
              messages: [
                { role: "user", content: runInput },
                { role: "assistant", content: event.result.content },
              ],
            }).catch(() => undefined);
          }
        }
      }

      setInput("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Run failed";
      setRunError(message);
      setProofPhase("idle");

      if (runCreated) {
        try {
          await updateRunMutation.mutateAsync({
            runId,
            updates: {
              status: "failed",
              output: accumulatedText || undefined,
              durationMs: Date.now() - new Date(startedAt).getTime(),
              completedAt: new Date().toISOString(),
            },
          });
        } catch {
          // If even run update fails, still unblock the UI.
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  const proofSteps: { phase: ProofPhase; icon: React.ReactNode; label: string }[] = [
    { phase: "inference", icon: <Cpu size={12} />, label: "Inference running..." },
    { phase: "attestation", icon: <Lock size={12} />, label: "TEE attestation received" },
    { phase: "settling", icon: <Anchor size={12} />, label: "Settling on-chain..." },
    { phase: "confirmed", icon: <CheckCircle size={12} />, label: "Proof confirmed" },
  ];

  const proofPhaseIndex = proofSteps.findIndex((s) => s.phase === proofPhase);

  return (
    <div className="max-w-7xl animate-fade-in-up">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[30%_1fr_20%]">
        <div className="space-y-4">
          <div className="surface p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  background: `${agent.color || "#6366f1"}18`,
                  border: `1.5px solid ${agent.color || "#6366f1"}30`,
                }}
              >
                {agent.avatar || "🤖"}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {agent.name}
                </h1>
                <AgentStatusBadge status={agent.status} />
              </div>
            </div>

            {agent.description && (
              <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                {agent.description}
              </p>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-muted)" }}>Model</span>
                <span className="badge badge-primary" style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                  <Cpu size={10} /> {agent.model}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-muted)" }}>Memory</span>
                <span className={`badge ${agent.memoryEnabled ? "badge-success" : "badge-muted"}`}>
                  <MemoryStick size={10} />
                  {agent.memoryEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-muted)" }}>Trigger</span>
                <span className="badge badge-muted">{agent.triggerType}</span>
              </div>
            </div>
          </div>

          <div className="surface p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                System Prompt
              </span>
              <button className="btn btn-ghost btn-sm">
                <Edit3 size={12} />
              </button>
            </div>
            <p className="text-xs leading-relaxed line-clamp-6" style={{ color: "var(--text-secondary)" }}>
              {agent.systemPrompt || "No system prompt defined."}
            </p>
          </div>

          {agent.memoryEnabled && (
            <div className="surface p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                  Memory
                </span>
                <Link href="/memory" className="text-xs" style={{ color: "var(--primary)" }}>
                  View all <ChevronRight size={10} className="inline" />
                </Link>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Persistent memory via MemSync. Recent context is automatically injected into each run.
              </p>
            </div>
          )}
        </div>

        <div className="surface flex flex-col" style={{ minHeight: 600 }}>
          <div ref={outputRef} className="flex-1 p-5 overflow-y-auto" style={{ minHeight: 200 }}>
            {proofPhase === "idle" && !streamedText && (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                <Bot size={40} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Send a message to run this agent
                </p>
              </div>
            )}

            {streamedText && (
              <div>
                <pre
                  className={`text-sm whitespace-pre-wrap leading-relaxed ${streaming ? "stream-cursor" : ""}`}
                  style={{ color: "var(--text-primary)", fontFamily: "inherit" }}
                >
                  {streamedText}
                </pre>
              </div>
            )}

            {runError && (
              <div
                className="mt-3 p-3 rounded-lg"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <div className="text-xs font-semibold" style={{ color: "var(--error)" }}>Run Error</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{runError}</div>
              </div>
            )}
          </div>

          {proofPhase !== "idle" && (
            <div className="px-5 py-3 border-t space-y-2" style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.2)" }}>
              <div className="flex gap-4 flex-wrap">
                {proofSteps.map((s, i) => {
                  const done = proofPhaseIndex > i;
                  const active = proofPhaseIndex === i;
                  return (
                    <div key={s.phase} className="flex items-center gap-1.5 text-xs" style={{ color: done ? "var(--success)" : active ? "var(--warning)" : "var(--text-muted)", opacity: i > proofPhaseIndex ? 0.4 : 1 }}>
                      {done ? <CheckCircle size={12} /> : s.icon}
                      {s.label}
                    </div>
                  );
                })}
              </div>

              {proofPhase === "confirmed" && proofHash && (
                <div className="flex items-center gap-2">
                  <Shield size={12} style={{ color: "var(--success)" }} />
                  <span className="proof-hash text-xs">{truncateHash(proofHash, 16)}</span>
                  <button onClick={() => navigator.clipboard.writeText(proofHash)} className="btn btn-ghost btn-sm" style={{ padding: "2px 6px" }}>
                    <Copy size={11} />
                  </button>
                  {currentRunId && (
                    <Link href={`/agents/${agent.id}/runs/${currentRunId}`} className="btn btn-secondary btn-sm ml-auto">
                      <Eye size={11} /> View Full Proof
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="p-4 border-t flex gap-3" style={{ borderColor: "var(--border)" }}>
            <textarea
              className="input textarea flex-1"
              style={{ minHeight: 60, resize: "none" }}
              placeholder="Enter your message for the agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRun();
                }
              }}
              disabled={streaming}
            />
            <button onClick={handleRun} disabled={!input.trim() || streaming} className="btn btn-primary self-end" style={{ opacity: !input.trim() || streaming ? 0.5 : 1 }}>
              {streaming ? <div className="spin w-4 h-4 rounded-full border-2 border-white border-t-transparent" /> : <Send size={16} />}
            </button>
          </div>
        </div>

        <div className="surface p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
              Recent Runs
            </span>
            <Link href="/runs" className="text-xs" style={{ color: "var(--primary)" }}>
              All <ChevronRight size={10} className="inline" />
            </Link>
          </div>

          <div className="space-y-2">
            {agentRuns.length === 0 && (
              <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>
                No runs yet
              </p>
            )}
            {agentRuns.slice(0, 15).map((run) => (
              <Link
                key={run.id}
                href={`/agents/${agent.id}/runs/${run.id}`}
                className="block p-3 rounded-xl text-xs transition-all"
                style={{ background: "var(--surface-hover)", textDecoration: "none" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AgentStatusBadge status={run.status} />
                  <span className="ml-auto" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(run.startedAt)}
                  </span>
                </div>
                <p className="truncate" style={{ color: "var(--text-secondary)" }}>
                  {run.input}
                </p>
                {run.proofHash && (
                  <p className="mono truncate mt-0.5" style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
                    {truncateHash(run.proofHash)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
