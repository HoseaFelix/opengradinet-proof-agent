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
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-200 group hover:shadow-lg hover:shadow-slate-900/20">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        agent.color ? '' : 'bg-indigo-500/10 border border-indigo-500/20'
                    }`}
                    style={agent.color ? {
                        background: `${agent.color}18`,
                        border: `1.5px solid ${agent.color}30`,
                    } : {}}
                >
                    {agent.avatar || "🤖"}
                </div>

                <div className="flex-1 min-w-0">
                    <Link
                        href={`/agents/${agent.id}`}
                        className="font-semibold text-white text-lg block truncate hover:text-indigo-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {agent.name}
                    </Link>
                    {agent.description && (
                        <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                            {agent.description}
                        </p>
                    )}
                </div>

                <AgentStatusBadge status={agent.status} />
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Cpu size={14} />
                    <span className="truncate">{agent.model}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm ${
                    agent.memoryEnabled ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                    <MemoryStick size={14} />
                    <span>{agent.memoryEnabled ? "Memory ON" : "No memory"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Play size={14} />
                    <span>{agent.totalRuns || 0} runs</span>
                </div>
                {agent.lastRunAt && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock size={14} />
                        <span>{timeAgo(agent.lastRunAt)}</span>
                    </div>
                )}
            </div>

            {/* Last run status */}
            {agent.lastRunStatus && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-slate-400">Last run:</span>
                    <AgentStatusBadge status={agent.lastRunStatus} />
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-slate-700/50">
                <button
                    onClick={() => onRunNow?.(agent)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Play size={14} /> Run Now
                </button>
                <Link
                    href={`/agents/${agent.id}`}
                    className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Edit"
                >
                    <Edit size={16} />
                </Link>
                <button
                    onClick={() => onTogglePause?.(agent)}
                    className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title={agent.status === "active" ? "Pause" : "Resume"}
                >
                    <Pause size={16} />
                </button>
                <button
                    onClick={() => onDelete?.(agent)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}
