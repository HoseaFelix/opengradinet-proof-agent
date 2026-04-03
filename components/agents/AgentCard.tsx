"use client";

import Link from "next/link";
import { Agent } from "@/types";
import { AgentStatusBadge } from "./AgentStatusBadge";
import { timeAgo } from "@/lib/utils";
import {
    Play,
    Edit,
    Trash2,
    Pause,
    MemoryStick,
    Cpu,
    Clock,
} from "lucide-react";

interface AgentCardProps {
    agent: Agent;
    onRunNow?: (agent: Agent) => void;
    onTogglePause?: (agent: Agent) => void;
    onDelete?: (agent: Agent) => void;
}

export function AgentCard({ agent, onRunNow, onTogglePause, onDelete }: AgentCardProps) {
    return (
        <div
            className="surface surface-hover p-5 flex flex-col gap-4 cursor-pointer group animate-fade-in-up"
            style={{ transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1.01)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 0 1px var(--border-bright), 0 8px 24px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                        background: `${agent.color || "#6366f1"}18`,
                        border: `1.5px solid ${agent.color || "#6366f1"}30`,
                    }}
                >
                    {agent.avatar || "🤖"}
                </div>

                <div className="flex-1 min-w-0">
                    <Link
                        href={`/agents/${agent.id}`}
                        className="font-semibold text-sm block truncate hover:underline"
                        style={{ color: "var(--text-primary)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {agent.name}
                    </Link>
                    {agent.description && (
                        <p
                            className="text-xs mt-0.5 line-clamp-2"
                            style={{ color: "var(--text-muted)" }}
                        >
                            {agent.description}
                        </p>
                    )}
                </div>

                <AgentStatusBadge status={agent.status} />
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-2">
                <div
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: "var(--text-muted)" }}
                >
                    <Cpu size={12} />
                    <span>{agent.model}</span>
                </div>
                <div
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: agent.memoryEnabled ? "var(--success)" : "var(--text-muted)" }}
                >
                    <MemoryStick size={12} />
                    <span>{agent.memoryEnabled ? "Memory ON" : "No memory"}</span>
                </div>
                <div
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: "var(--text-muted)" }}
                >
                    <Play size={12} />
                    <span>{agent.totalRuns || 0} runs</span>
                </div>
                {agent.lastRunAt && (
                    <div
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <Clock size={12} />
                        <span>{timeAgo(agent.lastRunAt)}</span>
                    </div>
                )}
            </div>

            {/* Last run status */}
            {agent.lastRunStatus && (
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Last run:
                    </span>
                    <AgentStatusBadge status={agent.lastRunStatus} />
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                    onClick={() => onRunNow?.(agent)}
                    className="btn btn-primary btn-sm flex-1 justify-center"
                >
                    <Play size={12} /> Run Now
                </button>
                <Link
                    href={`/agents/${agent.id}`}
                    className="btn btn-secondary btn-sm"
                    title="Edit"
                >
                    <Edit size={12} />
                </Link>
                <button
                    onClick={() => onTogglePause?.(agent)}
                    className="btn btn-secondary btn-sm"
                    title={agent.status === "active" ? "Pause" : "Resume"}
                >
                    <Pause size={12} />
                </button>
                <button
                    onClick={() => onDelete?.(agent)}
                    className="btn btn-danger btn-sm"
                    title="Delete"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}
