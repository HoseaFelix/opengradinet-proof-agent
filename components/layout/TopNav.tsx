"use client";

import Link from "next/link";
import { Search, Bell, Plus, LogOut } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

const BREADCRUMB_MAP: Record<string, string> = {
    "/": "Dashboard",
    "/agents": "Agents",
    "/agents/new": "New Agent",
    "/runs": "Run History",
    "/memory": "Memory Explorer",
    "/models": "Model Hub",
    "/settings": "Settings",
};

export function TopNav() {
    const { sidebarCollapsed, setCommandPaletteOpen } = useAppStore();
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const label =
        BREADCRUMB_MAP[pathname] ||
        (pathname.includes("/runs/") ? "Run Audit" : pathname.includes("/agents/") ? "Agent Detail" : "ProofAgent");

    return (
        <header
            className="fixed top-0 right-0 z-30 h-14 flex items-center px-5 gap-4 border-b"
            style={{
                left: sidebarCollapsed ? "64px" : "240px",
                background: "rgba(10,10,15,0.85)",
                backdropFilter: "blur(12px)",
                borderColor: "var(--border)",
                transition: "left 0.3s",
            }}
        >
            {/* Page title */}
            <h1
                className="text-sm font-semibold mr-auto"
                style={{ color: "var(--text-primary)" }}
            >
                {label}
            </h1>

            {/* Search */}
            <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                }}
            >
                <Search size={14} />
                <span>Search...</span>
                <kbd
                    className="ml-3 text-xs px-1.5 py-0.5 rounded"
                    style={{ background: "var(--surface-hover)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                >
                    ⌘K
                </kbd>
            </button>

            {/* New agent */}
            <Link
                href="/agents/new"
                className="btn btn-primary btn-sm"
            >
                <Plus size={14} />
                New Agent
            </Link>

            {/* Notifications */}
            <button
                className="w-9 h-9 rounded-lg flex items-center justify-center relative"
                style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                }}
            >
                <Bell size={16} />
                <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{ background: "var(--primary)" }}
                />
            </button>

            <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title={user?.email || "Sign out"}
            >
                <LogOut size={14} />
            </button>
        </header>
    );
}
