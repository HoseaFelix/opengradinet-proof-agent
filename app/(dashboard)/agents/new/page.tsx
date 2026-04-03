"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AVAILABLE_MODELS } from "@/lib/opengradient";
import { randomId } from "@/lib/utils";
import { createAgent, fetchSettings } from "@/lib/api/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Agent } from "@/types";
import {
  User,
  Brain,
  MemoryStick,
  Clock,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Webhook,
  CalendarClock,
  Hand,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Identity", description: "Name and describe your agent", icon: User },
  { id: 2, label: "Intelligence", description: "Choose model and system prompt", icon: Brain },
  { id: 3, label: "Memory", description: "Configure MemSync memory", icon: MemoryStick },
  { id: 4, label: "Triggers", description: "How will this agent run?", icon: Clock },
  { id: 5, label: "Deploy", description: "Review and create", icon: CheckCircle },
];

const TEMPLATES = [
  {
    name: "Research Assistant",
    prompt:
      "You are an expert research assistant. Analyze information thoroughly, cite your reasoning, and provide well-structured summaries with key insights.",
  },
  {
    name: "Code Reviewer",
    prompt:
      "You are an expert code reviewer. Identify security vulnerabilities, performance issues, and adherence to best practices. Provide actionable, specific feedback.",
  },
  {
    name: "Data Analyst",
    prompt:
      "You are a data analyst. Interpret datasets, identify patterns and anomalies, and provide clear business insights with your methodology explained.",
  },
  {
    name: "Customer Support",
    prompt:
      "You are a helpful customer support specialist. Be empathetic, clear, and solution-focused. Always aim to fully resolve the customer's issue.",
  },
];

const EMOJIS = ["🤖", "🔬", "💻", "📊", "🧪", "🎯", "⚡", "🔐", "🌐", "🧠"];
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
const MEMORY_CATEGORIES = ["career", "interests", "goals", "preferences", "relationships", "health", "finance"];

export default function NewAgentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 30_000,
  });
  const memsyncConfigured = !!settings?.memSyncKey?.trim();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("🤖");
  const [color, setColor] = useState("#6366f1");

  const [model, setModel] = useState(AVAILABLE_MODELS[0] || "gemini-3-flash");
  const [systemPrompt, setSystemPrompt] = useState("");

  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [memsyncGateOpen, setMemsyncGateOpen] = useState(false);
  const [memCategories, setMemCategories] = useState<string[]>(["career", "interests"]);
  const [memRetention, setMemRetention] = useState<"both" | "semantic" | "episodic">("both");

  const [triggerType, setTriggerType] = useState<"manual" | "scheduled" | "webhook">("manual");
  const [cronExpr, setCronExpr] = useState("0 9 * * 1-5");

  const [deployed, setDeployed] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const newAgent: Agent = {
        id: `agent_${randomId()}`,
        userId: user?.uid || "",
        name,
        description,
        systemPrompt,
        model,
        triggerType,
        triggerConfig: triggerType === "scheduled" ? { cron: cronExpr } : undefined,
        memoryEnabled,
        agentId: `mem_${randomId()}`,
        status: "active",
        avatar,
        color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalRuns: 0,
      };
      return createAgent(newAgent);
    },
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["agents"] });
      setDeployed(true);
      await new Promise((r) => setTimeout(r, 900));
      router.push(`/agents/${created.id}`);
    },
  });

  async function deploy() {
    createMutation.mutate();
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: done ? "var(--success)" : active ? "var(--primary)" : "var(--surface-hover)",
                    color: done || active ? "#fff" : "var(--text-muted)",
                    border: `2px solid ${done ? "var(--success)" : active ? "var(--primary)" : "var(--border)"}`,
                  }}
                >
                  {done ? <CheckCircle size={14} /> : <Icon size={14} />}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold" style={{ color: active ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {s.label}
                  </div>
                </div>
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px" style={{ background: done ? "var(--success)" : "var(--border)" }} />}
            </div>
          );
        })}
      </div>

      <div className="surface p-8">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Define Your Agent</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Give your agent an identity</p>
            </div>
            <div>
              <label className="label">Agent Name *</label>
              <input className="input" placeholder="e.g. Research Assistant" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input textarea" placeholder="What does this agent do?" value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: 80 }} />
            </div>
            <div>
              <label className="label">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setAvatar(e)} className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all" style={{ background: avatar === e ? "var(--primary-glow)" : "var(--surface-hover)", border: `2px solid ${avatar === e ? "var(--primary)" : "var(--border)"}` }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className="w-8 h-8 rounded-full transition-all" style={{ background: c, border: `3px solid ${color === c ? "#fff" : "transparent"}`, transform: color === c ? "scale(1.15)" : "scale(1)" }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Configure Intelligence</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Choose the AI model and define behavior</p>
            </div>
            <div>
              <label className="label">Model</label>
              <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
                {AVAILABLE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">System Prompt *</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {TEMPLATES.map((t) => (
                  <button key={t.name} onClick={() => setSystemPrompt(t.prompt)} className="btn btn-secondary btn-sm"><Sparkles size={12} /> {t.name}</button>
                ))}
              </div>
              <textarea className="input textarea" placeholder="You are a helpful AI assistant..." value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} style={{ minHeight: 160 }} />
              <div className="text-xs mt-1 text-right" style={{ color: "var(--text-muted)" }}>{systemPrompt.length} chars</div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Memory Configuration</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Enable MemSync to give your agent persistent memory</p>
            </div>
            {!memsyncConfigured && (
              <div className="surface p-4" style={{ borderColor: "rgba(245,158,11,0.25)" }}>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  MemSync needs an API key
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Add your MemSync API key in Settings to enable persistent memory.
                </div>
                <div className="mt-3">
                  <Link href="/settings" className="btn btn-secondary btn-sm">
                    Open Settings
                  </Link>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--surface-hover)", border: "1px solid var(--border)" }}>
              <div>
                <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Enable MemSync Memory</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Agent will remember context across runs</div>
              </div>
              <button
                onClick={() => {
                  if (!memsyncConfigured) {
                    setMemsyncGateOpen(true);
                    return;
                  }
                  setMemoryEnabled(!memoryEnabled);
                }}
                className="w-12 h-6 rounded-full transition-all relative"
                style={{
                  background: memoryEnabled ? "var(--primary)" : "var(--border)",
                  opacity: memsyncConfigured ? 1 : 0.4,
                  cursor: memsyncConfigured ? "pointer" : "not-allowed",
                }}
                aria-disabled={!memsyncConfigured}
              >
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: memoryEnabled ? "26px" : "2px" }} />
              </button>
            </div>
            {memsyncGateOpen && !memsyncConfigured && (
              <div className="text-xs" style={{ color: "var(--warning)" }}>
                MemSync is disabled until you add a MemSync API key in Settings.
              </div>
            )}
            {memoryEnabled && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="label">Memory Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {MEMORY_CATEGORIES.map((cat) => {
                      const active = memCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => setMemCategories(active ? memCategories.filter((c) => c !== cat) : [...memCategories, cat])}
                          className="badge cursor-pointer"
                          style={{
                            background: active ? "rgba(99,102,241,0.15)" : "var(--surface-hover)",
                            color: active ? "#818cf8" : "var(--text-muted)",
                            border: `1px solid ${active ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="label">Retention Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["both", "semantic", "episodic"] as const).map((r) => (
                      <button key={r} onClick={() => setMemRetention(r)} className="p-3 rounded-xl text-sm text-center" style={{ background: memRetention === r ? "rgba(99,102,241,0.15)" : "var(--surface-hover)", border: `1px solid ${memRetention === r ? "var(--primary)" : "var(--border)"}`, color: memRetention === r ? "#818cf8" : "var(--text-secondary)" }}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Trigger Configuration</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>How should this agent be activated?</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: "manual" as const, icon: Hand, label: "Manual", desc: "Run on demand" },
                { type: "scheduled" as const, icon: CalendarClock, label: "Scheduled", desc: "Cron schedule" },
                { type: "webhook" as const, icon: Webhook, label: "Webhook", desc: "External POST" },
              ].map(({ type, icon: Icon, label, desc }) => (
                <button key={type} onClick={() => setTriggerType(type)} className="p-4 rounded-xl text-left" style={{ background: triggerType === type ? "rgba(99,102,241,0.12)" : "var(--surface-hover)", border: `1.5px solid ${triggerType === type ? "var(--primary)" : "var(--border)"}` }}>
                  <Icon size={20} style={{ color: triggerType === type ? "var(--primary)" : "var(--text-muted)" }} />
                  <div className="mt-2 font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</div>
                </button>
              ))}
            </div>
            {triggerType === "scheduled" && (
              <div className="animate-fade-in">
                <label className="label">CRON Expression</label>
                <input className="input mono" value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} />
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            {!deployed ? (
              <>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Review & Deploy</h2>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Review your configuration before deploying</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Name", value: name || "—" },
                    { label: "Model", value: model },
                    { label: "Trigger", value: triggerType },
                    { label: "Memory", value: memoryEnabled ? `Enabled (${memCategories.join(", ")})` : "Disabled" },
                    { label: "Avatar", value: avatar },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm p-3 rounded-lg" style={{ background: "var(--surface-hover)" }}>
                      <span style={{ color: "var(--text-muted)" }}>{label}</span>
                      <span style={{ color: "var(--text-primary)" }}>{value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={deploy} disabled={!name || !systemPrompt || createMutation.isPending} className="btn btn-primary btn-lg w-full justify-center" style={{ opacity: !name || !systemPrompt ? 0.5 : 1 }}>
                  {createMutation.isPending ? <><div className="spin w-4 h-4 rounded-full border-2 border-white border-t-transparent" /> Deploying...</> : <><Sparkles size={16} /> Deploy Agent</>}
                </button>
              </>
            ) : (
              <div className="text-center py-8 animate-fade-in">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow" style={{ background: "rgba(16,185,129,0.15)", border: "2px solid var(--success)" }}>
                  <CheckCircle size={40} style={{ color: "var(--success)" }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Agent Deployed!</h3>
              </div>
            )}
          </div>
        )}

        {!deployed && (
          <div className="flex justify-between mt-8 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="btn btn-secondary" style={{ opacity: step === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={16} /> Back
            </button>
            {step < 5 && (
              <button onClick={() => setStep(Math.min(5, step + 1))} className="btn btn-primary">
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
