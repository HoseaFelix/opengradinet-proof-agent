"use client";

import Link from "next/link";
import { Search, Plus, LogOut, Menu } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { NotificationsPanel } from "./NotificationsPanel";

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
    const { sidebarCollapsed, setCommandPaletteOpen, setSidebarCollapsed } = useAppStore();
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const label =
        BREADCRUMB_MAP[pathname] ||
        (pathname.includes("/runs/") ? "Run Audit" : pathname.includes("/agents/") ? "Agent Detail" : "ProofAgent");

    return (
        <header className="fixed top-0 right-0 z-30 h-16 flex items-center px-4 md:px-6 lg:px-8 gap-4 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-xl">
            {/* Mobile menu button */}
            <button
                onClick={() => setSidebarCollapsed(false)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
                <Menu size={20} />
            </button>

            {/* Page title */}
            <h1 className="text-sm font-semibold text-white mr-auto truncate">
                {label}
            </h1>

            {/* Search */}
            <button
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
                <Search size={14} />
                <span>Search...</span>
                <kbd className="ml-3 text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600">
                    ⌘K
                </kbd>
            </button>

            {/* Mobile search button */}
            <button
                onClick={() => setCommandPaletteOpen(true)}
                className="sm:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
                <Search size={18} />
            </button>

            {/* New agent */}
            <Link
                href="/agents/new"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
                <Plus size={14} />
                New Agent
            </Link>

            {/* Mobile new agent button */}
            <Link
                href="/agents/new"
                className="sm:hidden p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
                <Plus size={18} />
            </Link>

            {/* Notifications */}
            <NotificationsPanel />

            {/* User menu */}
            <button
                onClick={logout}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title={user?.email || "Sign out"}
            >
                <LogOut size={14} />
                Sign out
            </button>

            {/* Mobile sign out */}
            <button
                onClick={logout}
                className="sm:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Sign out"
            >
                <LogOut size={18} />
            </button>
        </header>
    );
}
