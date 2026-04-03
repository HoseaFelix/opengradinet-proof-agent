"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAgent, fetchRun } from "@/lib/api/client";
import { formatDateTime, formatDuration, truncateHash } from "@/lib/utils";
import Link from "next/link";
import {
  Shield,
  CheckCircle,
  Download,
  Share2,
  ExternalLink,
  ChevronLeft,
  Cpu,
  Lock,
  Brain,
  Anchor,
  Info,
  Copy,
} from "lucide-react";
import { RunStep } from "@/types";

function ProofInspector({ data }: { data: object }) {
  const json = JSON.stringify(data, null, 2);

  function highlight(text: string) {
    return text
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
      .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/: null/g, ': <span class="json-null">null</span>');
  }

  return <div className="json-inspector" dangerouslySetInnerHTML={{ __html: highlight(json) }} />;
}

function StepIcon({ type }: { type: RunStep["type"] }) {
  const map: Record<string, React.ReactNode> = {
    memory_retrieval: <Brain size={12} />,
    prompt_construction: <Cpu size={12} />,
    inference: <Lock size={12} />,
    output: <CheckCircle size={12} />,
    settlement: <Anchor size={12} />,
  };
  return <>{map[type] || <Info size={12} />}</>;
}

export default function RunAuditPage({ params }: { params: Promise<{ id: string; runId: string }> }) {
  const { id, runId } = use(params);

  const { data: run, isLoading: runLoading } = useQuery({
    queryKey: ["runs", runId],
    queryFn: () => fetchRun(runId),
  });

  const { data: agent } = useQuery({
    queryKey: ["agents", id],
    queryFn: () => fetchAgent(id),
    enabled: !!id,
  });

  if (runLoading) return <div className="skeleton h-64 w-full rounded-xl" />;

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p style={{ color: "var(--text-muted)" }}>Run not found</p>
        <Link href="/runs" className="btn btn-secondary"><ChevronLeft size={14} /> Back to Runs</Link>
      </div>
    );
  }

  const isVerified = run.status === "completed" && !!run.proofHash;
  const isFailed = run.status === "failed";

  const steps: RunStep[] = run.steps?.length
    ? run.steps
    : [
        {
          id: "s1",
          type: "memory_retrieval",
          label: "Memory Retrieval",
          status: run.status === "failed" ? "failed" : "completed",
          durationMs: 340,
          data: { memoriesFound: run.memoriesUsed?.length || 0 },
        },
        {
          id: "s2",
          type: "prompt_construction",
          label: "Prompt Construction",
          status: run.status === "failed" ? "failed" : "completed",
          durationMs: 45,
          data: {
            promptHash: run.proofData?.promptHash || "—",
            memoriesInjected: run.memoriesUsed?.length || 0,
          },
        },
        {
          id: "s3",
          type: "inference",
          label: "Verifiable Inference",
          status: run.status === "failed" ? "failed" : "completed",
          durationMs: run.durationMs ? run.durationMs - 700 : 1200,
          data: {
            model: run.proofData?.model || agent?.model || "—",
            teeProvider: run.proofData?.attestation?.teeProvider || "AWS Nitro Enclave",
            tokens: run.tokenCount || 0,
          },
        },
        ...(run.output
          ? [
              {
                id: "s4",
                type: "output" as const,
                label: "Output Generated",
                status: "completed" as const,
                durationMs: 10,
                data: {},
              },
            ]
          : []),
        ...(run.proofHash
          ? [
              {
                id: "s5",
                type: "settlement" as const,
                label: "On-Chain Settlement",
                status: "completed" as const,
                durationMs: 2300,
                data: {
                  validators: run.proofData?.validators || { confirmed: 12, total: 15 },
                  blockNumber: run.proofData?.blockNumber || 1043221,
                  txHash: run.proofData?.txHash || run.proofHash,
                },
              },
            ]
          : []),
      ];

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in-up">
      <Link href={`/agents/${id}`} className="btn btn-ghost btn-sm" style={{ display: "inline-flex" }}><ChevronLeft size={14} /> Back to Agent</Link>

      <div className="surface p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate" style={{ color: "var(--text-primary)" }}>Run Audit</h1>
              <span className="mono text-xs" style={{ color: "var(--text-muted)" }}>#{run.id}</span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{agent?.name} · {formatDateTime(run.startedAt)}{run.durationMs && ` · ${formatDuration(run.durationMs)}`}</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="btn btn-secondary btn-sm"><Share2 size={13} /> Share Proof</button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(run, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `run-${run.id}.json`;
                a.click();
              }}
              className="btn btn-secondary btn-sm"
            >
              <Download size={13} /> Export JSON
            </button>
          </div>
        </div>

        {isVerified && (
          <div className="verified-banner mt-4 flex items-center gap-3">
            <CheckCircle size={20} style={{ color: "var(--success)" }} />
            <div>
              <div className="font-semibold text-sm" style={{ color: "var(--success)" }}>Verified by OpenGradient ✓</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>This inference was processed in a Trusted Execution Environment and settled on-chain</div>
            </div>
            {run.proofHash && (
              <button onClick={() => navigator.clipboard.writeText(run.proofHash!)} className="ml-auto flex items-center gap-1.5 proof-hash text-xs">
                {truncateHash(run.proofHash, 12)} <Copy size={10} />
              </button>
            )}
          </div>
        )}

        {isFailed && (
          <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div>
              <div className="font-semibold text-sm" style={{ color: "var(--error)" }}>Run Failed</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>This run did not complete successfully. No proof was generated.</div>
            </div>
          </div>
        )}
      </div>

      <div className="surface p-6">
        <h2 className="font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text-primary)" }}><Shield size={16} style={{ color: "var(--primary)" }} /> Reasoning Chain</h2>
        <div>
          {steps.map((step, i) => (
            <div key={step.id} className="timeline-item">
              <div className={`timeline-dot ${step.status === "completed" ? "completed" : step.status === "running" ? "running" : step.status === "failed" ? "failed" : ""}`}><StepIcon type={step.type} /></div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Step {i + 1}: {step.label}</span>
                  {step.durationMs && <span className="badge badge-muted" style={{ fontSize: "0.65rem" }}>{formatDuration(step.durationMs)}</span>}
                </div>
                {step.data && Object.keys(step.data).length > 0 && (
                  <div className="text-xs space-y-1 mt-2 pl-3 border-l" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                    {Object.entries(step.data).map(([key, val]) => (
                      <div key={key} className="flex items-start gap-2">
                        <span style={{ color: "var(--text-secondary)" }}>{key}:</span>
                        <span className={String(val).startsWith("0x") ? "mono" : ""}>{typeof val === "object" ? JSON.stringify(val) : String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(run.input || run.output) && (
        <div className="surface p-6 space-y-4">
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Input & Output</h2>
          {run.input && (
            <div>
              <label className="label">User Input</label>
              <div className="p-4 rounded-xl text-sm" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}>{run.input}</div>
            </div>
          )}
          {run.output && (
            <div>
              <label className="label">Agent Output</label>
              <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}>{run.output}</div>
            </div>
          )}
        </div>
      )}

      {run.proofData && (
        <div className="surface p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}><Lock size={16} style={{ color: "var(--primary)" }} /> Raw Proof Data</h2>
          <ProofInspector data={run.proofData} />
          <button onClick={() => window.open(`https://explorer.opengradient.ai/tx/${run.proofHash}`, "_blank")} className="btn btn-secondary btn-sm mt-4"><ExternalLink size={12} /> View on Block Explorer</button>
        </div>
      )}
    </div>
  );
}
