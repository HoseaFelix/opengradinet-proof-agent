"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AgentCard } from "@/components/agents/AgentCard";
import { Plus, Search, SlidersHorizontal, Bot } from "lucide-react";
import { Agent, AgentStatus } from "@/types";
import { deleteAgent, fetchAgents, updateAgent } from "@/lib/api/client";

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AgentStatus | "all">("all");
  const [filterMemory, setFilterMemory] = useState<"all" | "yes" | "no">("all");
  const [sortBy, setSortBy] = useState<"lastRun" | "totalRuns" | "created">("lastRun");
  const [runTarget, setRunTarget] = useState<Agent | null>(null);

  const queryClient = useQueryClient();
  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (agent: Agent) => {
      const nextStatus: AgentStatus = agent.status === "active" ? "paused" : "active";
      await updateAgent(agent.id, { status: nextStatus, updatedAt: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteAgent(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
  });

  const filtered = agents
    .filter((a) => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (filterMemory === "yes" && !a.memoryEnabled) return false;
      if (filterMemory === "no" && a.memoryEnabled) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "lastRun") {
        return (b.lastRunAt || b.createdAt) > (a.lastRunAt || a.createdAt) ? 1 : -1;
      }
      if (sortBy === "totalRuns") return (b.totalRuns || 0) - (a.totalRuns || 0);
      return b.createdAt > a.createdAt ? 1 : -1;
    });

  if (error) {
    return (
      <div className="surface p-6">
        <p style={{ color: "var(--error)" }}>{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Agents
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {agents.length} agents configured
          </p>
        </div>
        <Link href="/agents/new" className="btn btn-primary">
          <Plus size={16} /> New Agent
        </Link>
      </div>

      <div
        className="surface p-4 flex flex-wrap items-center gap-3 animate-fade-in-up"
        style={{ animationDelay: "60ms" }}
      >
        <div className="relative flex-1 min-w-48">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            className="input pl-9"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <SlidersHorizontal size={14} style={{ color: "var(--text-muted)" }} />

          <select
            className="input"
            style={{ width: "auto" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AgentStatus | "all")}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>

          <select
            className="input"
            style={{ width: "auto" }}
            value={filterMemory}
            onChange={(e) => setFilterMemory(e.target.value as "all" | "yes" | "no")}
          >
            <option value="all">All Memory</option>
            <option value="yes">Memory ON</option>
            <option value="no">No Memory</option>
          </select>

          <select
            className="input"
            style={{ width: "auto" }}
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "lastRun" | "totalRuns" | "created")
            }
          >
            <option value="lastRun">Sort: Last Run</option>
            <option value="totalRuns">Sort: Total Runs</option>
            <option value="created">Sort: Created</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-52 rounded-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((agent, i) => (
            <div key={agent.id} style={{ animationDelay: `${i * 60}ms` }}>
              <AgentCard
                agent={agent}
                onRunNow={(a) => setRunTarget(a)}
                onTogglePause={(a) => toggleStatusMutation.mutate(a)}
                onDelete={(a) => {
                  if (confirm(`Delete agent "${a.name}"?`)) {
                    deleteMutation.mutate(a.id);
                  }
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="surface flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
          <Bot size={48} style={{ color: "var(--text-muted)" }} />
          <div className="text-center">
            <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
              No agents found
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {search ? "Try adjusting your search" : "Create your first agent to get started"}
            </p>
          </div>
          {!search && (
            <Link href="/agents/new" className="btn btn-primary">
              <Plus size={14} /> Create Agent
            </Link>
          )}
        </div>
      )}

      {runTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-end" onClick={() => setRunTarget(null)}>
          <div
            className="w-full max-w-md h-full max-h-96 bottom-0 right-0 p-6 rounded-tl-2xl animate-fade-in-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Run: {runTarget.name}
            </h3>
            <textarea className="input textarea mb-4" placeholder="Enter your message for the agent..." />
            <div className="flex gap-2">
              <button onClick={() => setRunTarget(null)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <Link href={`/agents/${runTarget.id}`} className="btn btn-primary flex-1 justify-center">
                Open Agent
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
