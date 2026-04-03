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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-white">Agents</h1>
          <p className="text-slate-400 text-lg mt-1">
            {agents.length} agents configured
          </p>
        </div>
        <Link
          href="/agents/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <Plus size={16} /> New Agent
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 md:p-6 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-10 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <SlidersHorizontal size={16} className="text-slate-400 shrink-0" />

            <select
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AgentStatus | "all")}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>

            <select
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              value={filterMemory}
              onChange={(e) => setFilterMemory(e.target.value as "all" | "yes" | "no")}
            >
              <option value="all">All Memory</option>
              <option value="yes">Memory ON</option>
              <option value="no">No Memory</option>
            </select>

            <select
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "lastRun" | "totalRuns" | "created")
              }
            >
              <option value="lastRun">Last Run</option>
              <option value="totalRuns">Total Runs</option>
              <option value="created">Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-700 rounded"></div>
                <div className="h-3 bg-slate-700 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((agent, i) => (
            <div key={agent.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-in-up">
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
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 flex flex-col items-center justify-center py-20 gap-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center">
            <Bot size={32} className="text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-white mb-2">
              No agents found
            </p>
            <p className="text-slate-400">
              {search ? "Try adjusting your search or filters" : "Create your first agent to get started"}
            </p>
          </div>
          {!search && (
            <Link
              href="/agents/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
            >
              <Plus size={16} /> Create Agent
            </Link>
          )}
        </div>
      )}

      {/* Run Modal */}
      {runTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setRunTarget(null)}>
          <div
            className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 p-6 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Run: {runTarget.name}
            </h3>
            <textarea
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
              placeholder="Enter your message for the agent..."
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRunTarget(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <Link
                href={`/agents/${runTarget.id}`}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-center"
              >
                Open Agent
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
