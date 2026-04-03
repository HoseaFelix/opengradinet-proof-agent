"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
    X,
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
    const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useAppStore();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setSidebarCollapsed(true);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [setSidebarCollapsed]);

    const handleLinkClick = () => {
        if (isMobile) {
            setSidebarCollapsed(true);
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            {isMobile && !sidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}

            <aside
                className={cn(
                    "fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out",
                    "bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50",
                    isMobile ? (
                        sidebarCollapsed ? "-translate-x-full" : "translate-x-0"
                    ) : (
                        sidebarCollapsed ? "w-16" : "w-60"
                    )
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg">
                            <Shield size={16} className="text-white" />
                        </div>
                        {!sidebarCollapsed && (
                            <div>
                                <div className="font-bold text-sm leading-none text-white">
                                    ProofAgent
                                </div>
                                <div className="text-xs mt-0.5 text-slate-400">
                                    Verifiable AI
                                </div>
                            </div>
                        )}
                    </div>
                    {isMobile && (
                        <button
                            onClick={() => setSidebarCollapsed(true)}
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {NAV.map(({ href, icon: Icon, label }) => {
                        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={handleLinkClick}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                                    active
                                        ? "bg-indigo-500/20 text-white border border-indigo-500/30"
                                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                                )}
                            >
                                <Icon
                                    size={18}
                                    className={cn(
                                        "shrink-0 transition-colors",
                                        active ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-300"
                                    )}
                                />
                                {!sidebarCollapsed && (
                                    <span className="truncate">{label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Status indicator */}
                {!sidebarCollapsed && (
                    <div className="px-4 py-4 border-t border-slate-700/50">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-emerald-400 font-medium">
                                Network Online
                            </span>
                            <Zap size={12} className="text-emerald-400 ml-auto" />
                        </div>
                    </div>
                )}

                {/* Collapse button - desktop only */}
                {!isMobile && (
                    <button
                        onClick={toggleSidebar}
                        className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center transition-all hover:bg-slate-700 hover:border-slate-500"
                    >
                        <ChevronLeft
                            size={12}
                            className={cn(
                                "text-slate-400 transition-transform duration-300",
                                sidebarCollapsed ? "rotate-180" : ""
                            )}
                        />
                    </button>
                )}
            </aside>
        </>
    );
}
