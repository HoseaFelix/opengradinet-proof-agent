"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatNumber, timeAgo, truncateHash } from "@/lib/utils";
import { fetchNetworkStatus } from "@/lib/opengradient";
import { fetchAgents, fetchRuns } from "@/lib/api/client";
import { Bot, Play, Shield, Cpu, Activity, Zap, ChevronRight, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";

function AnimatedNumber({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const step = target / 60;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{formatNumber(value)}</>;
}

function StatsBar() {
  const { data: agents = [] } = useQuery({ queryKey: ["agents"], queryFn: fetchAgents });
  const { data: runs = [] } = useQuery({ queryKey: ["runs"], queryFn: () => fetchRuns() });

  const cards = [
    { label: "Total Agents", value: agents.length, icon: Bot, color: "indigo", bgColor: "bg-indigo-500/10", borderColor: "border-indigo-500/20", iconColor: "text-indigo-400" },
    { label: "Total Runs", value: runs.length, icon: Play, color: "emerald", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", iconColor: "text-emerald-400" },
    { label: "Verified Proofs", value: runs.filter((r) => !!r.proofHash).length, icon: Shield, color: "purple", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20", iconColor: "text-purple-400" },
    { label: "Tokens Used", value: runs.reduce((sum, r) => sum + (r.tokenCount || 0), 0), icon: Cpu, color: "amber", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20", iconColor: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map(({ label, value, icon: Icon, bgColor, borderColor, iconColor }, i) => (
        <div
          key={label}
          className={`relative overflow-hidden rounded-xl border ${bgColor} ${borderColor} p-6 animate-fade-in-up backdrop-blur-sm`}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent" />

          <div className="relative flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={iconColor} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-bold text-white leading-none mb-1">
                <AnimatedNumber target={value} />
              </div>
              <div className="text-sm text-slate-400 truncate">{label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityFeed() {
  const { data: runs = [] } = useQuery({ queryKey: ["runs"], queryFn: () => fetchRuns() });

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Activity size={16} className="text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
        </div>
        <Link
          href="/runs"
          className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-700/50"
        >
          View all
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3">
        {runs.slice(0, 8).map((run) => (
          <Link
            key={run.id}
            href={`/agents/${run.agentId}/runs/${run.id}`}
            className="flex items-center gap-4 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200 group border border-transparent hover:border-slate-600/50"
          >
            <div className="shrink-0">
              {run.status === "completed" ? (
                <CheckCircle size={16} className="text-emerald-400" />
              ) : run.status === "running" ? (
                <Clock size={16} className="text-amber-400" />
              ) : (
                <XCircle size={16} className="text-red-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate mb-1">
                {run.agentName}
              </div>
              <div className="text-sm text-slate-400 truncate">
                {run.input.slice(0, 80)}...
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs text-slate-500">{timeAgo(run.startedAt)}</span>
              {run.proofHash && (
                <span className="text-xs px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  {truncateHash(run.proofHash)}
                </span>
              )}
            </div>
            <ArrowRight size={14} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function NetworkStatusWidget() {
  const [networkStatus, setNetworkStatus] = useState<{
    status: "online" | "degraded" | "offline";
    latencyMs: number;
    modelCount: number;
    checkedAt: string;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    async function poll() {
      while (alive) {
        const status = await fetchNetworkStatus();
        if (alive) setNetworkStatus(status);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    poll();
    return () => {
      alive = false;
    };
  }, []);

  const metrics = networkStatus
    ? [
        { label: "Status", value: networkStatus.status, color: networkStatus.status === "online" ? "text-emerald-400" : networkStatus.status === "degraded" ? "text-amber-400" : "text-red-400" },
        { label: "Latency", value: `${networkStatus.latencyMs}ms`, color: "text-indigo-400" },
        { label: "Models Reachable", value: networkStatus.modelCount, color: "text-purple-400" },
      ]
    : [];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Zap size={16} className="text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Network Status</h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              networkStatus?.status === "online"
                ? "bg-emerald-400 animate-pulse"
                : networkStatus?.status === "degraded"
                ? "bg-amber-400 animate-pulse"
                : "bg-red-400"
            }`}
          />
          <span
            className={`text-sm font-medium ${
              networkStatus?.status === "online"
                ? "text-emerald-400"
                : networkStatus?.status === "degraded"
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {networkStatus?.status || "checking"}
          </span>
        </div>
      </div>

      {networkStatus ? (
        <div className="space-y-4">
          {metrics.map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400">{label}</span>
              <span className={`text-sm font-semibold font-mono ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-16" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back 👋</h1>
        <p className="text-slate-400 text-lg">
          Every AI decision is cryptographically provable on OpenGradient.
        </p>
      </div>

      {/* Stats Grid */}
      <StatsBar />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Activity Feed - Takes 2 columns on xl screens */}
        <div className="xl:col-span-2">
          <ActivityFeed />
        </div>

        {/* Network Status - Takes 1 column */}
        <div className="space-y-6">
          <NetworkStatusWidget />
        </div>
      </div>
    </div>
  );
}
