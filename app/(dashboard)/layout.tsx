"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { sidebarCollapsed, toggleSidebar } = useAppStore();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="animate-pulse">
                    <div className="w-12 h-12 bg-slate-700 rounded-full mb-4"></div>
                    <div className="h-4 bg-slate-700 rounded w-32"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
            <Sidebar />
            <TopNav />
            <CommandPalette />
            <main
                className={`transition-all duration-300 ease-in-out ${
                    isMobile 
                        ? 'ml-0' 
                        : sidebarCollapsed ? 'ml-16' : 'ml-60'
                } pt-16 px-4 md:px-6 lg:px-8`}
            >
                <div className="max-w-7xl mx-auto py-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
