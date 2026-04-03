"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { sidebarCollapsed } = useAppStore();
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div className="p-6">
                <div className="skeleton h-10 w-56 mb-4" />
                <div className="skeleton h-72 w-full" />
            </div>
        );
    }

    return (
        <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
            <Sidebar />
            <TopNav />
            <main
                className="transition-all duration-300"
                style={{
                    marginLeft: sidebarCollapsed ? "64px" : "240px",
                    paddingTop: "56px",
                    minHeight: "100vh",
                }}
            >
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
