"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgentStatusBadge } from "@/components/agents/AgentStatusBadge";
import { timeAgo, formatDuration, truncateHash } from "@/lib/utils";
import { fetchRuns } from "@/lib/api/client";
import Link from "next/link";
import { Play, Search, Eye } from "lucide-react";

export default function RunsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "failed" | "running">("all");

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["runs"],
    queryFn: () => fetchRuns(),
  });

  const filtered = runs.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (
      search &&
      !r.input.toLowerCase().includes(search.toLowerCase()) &&
      !r.agentName?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Run History</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{runs.length} total runs</p>
        </div>
      </div>

      <div className="surface p-4 flex gap-3 flex-wrap animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input className="input pl-9" placeholder="Search runs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: "auto" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}>
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
        </select>
      </div>

      <div className="surface overflow-hidden animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        {isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map((i)=><div key={i} className="skeleton h-10 w-full" />)}</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Agent", "Input", "Status", "Tokens", "Duration", "Proof", "Time", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((run) => (
                <tr key={run.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{run.agentName || "—"}</td>
                  <td className="px-4 py-3 text-sm max-w-xs" style={{ color: "var(--text-muted)" }}><div className="truncate max-w-48">{run.input}</div></td>
                  <td className="px-4 py-3"><AgentStatusBadge status={run.status} /></td>
                  <td className="px-4 py-3 text-sm mono" style={{ color: "var(--text-muted)" }}>{run.tokenCount || "—"}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{run.durationMs ? formatDuration(run.durationMs) : "—"}</td>
                  <td className="px-4 py-3">
                    {run.proofHash ? <span className="proof-hash text-xs">{truncateHash(run.proofHash)}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(run.startedAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/agents/${run.agentId}/runs/${run.id}`} className="btn btn-ghost btn-sm"><Eye size={12} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
            <Play size={32} className="mx-auto mb-3" />
            <p>No runs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
