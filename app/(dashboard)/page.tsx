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
    { label: "Total Agents", value: agents.length, icon: Bot, color: "#6366f1" },
    { label: "Total Runs", value: runs.length, icon: Play, color: "#10b981" },
    { label: "Verified Proofs", value: runs.filter((r) => !!r.proofHash).length, icon: Shield, color: "#8b5cf6" },
    { label: "Tokens Used", value: runs.reduce((sum, r) => sum + (r.tokenCount || 0), 0), icon: Cpu, color: "#f59e0b" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color }, i) => (
        <div key={label} className="surface p-5 flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none" style={{ color: "var(--text-primary)" }}><AnimatedNumber target={value} /></div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityFeed() {
  const { data: runs = [] } = useQuery({ queryKey: ["runs"], queryFn: () => fetchRuns() });

  return (
    <div className="surface p-5 flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Activity size={16} style={{ color: "var(--primary)" }} /><h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Activity Feed</h2></div>
        <Link href="/runs" className="text-xs flex items-center gap-1" style={{ color: "var(--primary)" }}>View all <ChevronRight size={12} /></Link>
      </div>
      <div className="space-y-1">
        {runs.slice(0, 8).map((run) => (
          <Link key={run.id} href={`/agents/${run.agentId}/runs/${run.id}`} className="flex items-center gap-3 p-3 rounded-lg group transition-all" style={{ color: "inherit", textDecoration: "none" }}>
            <div className="flex-shrink-0">
              {run.status === "completed" ? <CheckCircle size={16} style={{ color: "var(--success)" }} /> : run.status === "running" ? <Clock size={16} style={{ color: "var(--warning)" }} /> : <XCircle size={16} style={{ color: "var(--error)" }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{run.agentName}</div>
              <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{run.input.slice(0, 60)}...</div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{timeAgo(run.startedAt)}</span>
              {run.proofHash && <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", fontFamily: "var(--font-mono)" }}>{truncateHash(run.proofHash)}</span>}
            </div>
            <ArrowRight size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }} />
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
        { label: "Status", value: networkStatus.status, color: networkStatus.status === "online" ? "var(--success)" : networkStatus.status === "degraded" ? "var(--warning)" : "var(--error)" },
        { label: "Latency", value: `${networkStatus.latencyMs}ms`, color: "var(--primary)" },
        { label: "Models Reachable", value: networkStatus.modelCount, color: "#8b5cf6" },
      ]
    : [];

  return (
    <div className="surface p-5 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} style={{ color: "var(--warning)" }} />
        <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Network Status</h2>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full pulse-glow"
            style={{
              background:
                networkStatus?.status === "online"
                  ? "var(--success)"
                  : networkStatus?.status === "degraded"
                    ? "var(--warning)"
                    : "var(--error)",
            }}
          />
          <span
            className="text-xs"
            style={{
              color:
                networkStatus?.status === "online"
                  ? "var(--success)"
                  : networkStatus?.status === "degraded"
                    ? "var(--warning)"
                    : "var(--error)",
            }}
          >
            {networkStatus?.status || "checking"}
          </span>
        </div>
      </div>

      {networkStatus ? (
        <div className="space-y-3">
          {metrics.map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span><span className="text-sm font-semibold mono" style={{ color }}>{value}</span></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-4 w-full" />)}</div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Welcome back 👋</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Every AI decision is cryptographically provable on OpenGradient.</p>
      </div>
      <StatsBar />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><ActivityFeed /></div>
        <div className="space-y-4"><NetworkStatusWidget /></div>
      </div>
    </div>
  );
}
