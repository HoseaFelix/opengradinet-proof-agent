"use client";

import { RunStatus, AgentStatus } from "@/types";
import { CheckCircle, XCircle, Clock, Pause } from "lucide-react";

export function AgentStatusBadge({ status }: { status: AgentStatus | RunStatus }) {
    const map: Record<string, { label: string; cls: string }> = {
        active: { label: "Active", cls: "badge-success" },
        paused: { label: "Paused", cls: "badge-warning" },
        archived: { label: "Archived", cls: "badge-muted" },
        completed: { label: "Completed", cls: "badge-success" },
        running: { label: "Running", cls: "badge-warning" },
        failed: { label: "Failed", cls: "badge-error" },
    };
    const { label, cls } = map[status] || { label: status, cls: "badge-muted" };

    const Icon =
        status === "completed" || status === "active"
            ? CheckCircle
            : status === "running"
                ? Clock
                : status === "paused"
                    ? Pause
                    : XCircle;

    return (
        <span className={`badge ${cls}`}>
            <Icon size={10} />
            {label}
        </span>
    );
}
