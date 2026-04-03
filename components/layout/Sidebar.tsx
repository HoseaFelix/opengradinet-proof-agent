"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Bot,
    Play,
    Brain,
    Database,
    Settings,
    ChevronLeft,
    Zap,
    Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const NAV = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/agents", icon: Bot, label: "Agents" },
    { href: "/runs", icon: Play, label: "Run History" },
    { href: "/memory", icon: Brain, label: "Memory" },
    { href: "/models", icon: Database, label: "Model Hub" },
    { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { sidebarCollapsed, toggleSidebar } = useAppStore();

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-full z-40 flex flex-col border-r transition-all duration-300",
                sidebarCollapsed ? "w-16" : "w-[240px]"
            )}
            style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-3 px-4 h-14 border-b flex-shrink-0"
                style={{ borderColor: "var(--border)" }}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--primary)" }}
                >
                    <Shield size={16} color="white" />
                </div>
                {!sidebarCollapsed && (
                    <div>
                        <div
                            className="font-bold text-sm leading-none"
                            style={{ color: "var(--text-primary)" }}
                        >
                            ProofAgent
                        </div>
                        <div
                            className="text-xs mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Verifiable AI
                        </div>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {NAV.map(({ href, icon: Icon, label }) => {
                    const active =
                        href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                                active
                                    ? "text-white"
                                    : "hover:text-white"
                            )}
                            style={{
                                background: active ? "var(--primary)" : "transparent",
                                color: active ? "white" : "var(--text-secondary)",
                            }}
                            onMouseEnter={(e) => {
                                if (!active)
                                    (e.currentTarget as HTMLElement).style.background =
                                        "var(--surface-hover)";
                            }}
                            onMouseLeave={(e) => {
                                if (!active)
                                    (e.currentTarget as HTMLElement).style.background =
                                        "transparent";
                            }}
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            {!sidebarCollapsed && <span>{label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Status pill */}
            {!sidebarCollapsed && (
                <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.15)" }}
                    >
                        <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: "var(--success)", boxShadow: "0 0 6px var(--success)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--success)" }}>
                            Network Online
                        </span>
                        <Zap size={12} style={{ color: "var(--success)", marginLeft: "auto" }} />
                    </div>
                </div>
            )}

            {/* Collapse button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-16 w-6 h-6 rounded-full border flex items-center justify-center transition-all"
                style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                }}
            >
                <ChevronLeft
                    size={12}
                    style={{
                        transform: sidebarCollapsed ? "rotate(180deg)" : "none",
                        transition: "transform 0.3s",
                    }}
                />
            </button>
        </aside>
    );
}
