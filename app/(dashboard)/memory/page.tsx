"use client";

import { useState, useEffect } from "react";
import { Memory, UserProfile } from "@/types";
import { getAllMemories, getUserProfile, deleteMemory, searchMemories } from "@/lib/memsync";
import { timeAgo } from "@/lib/utils";
import { Search, Trash2, Brain, Tag, KeyRound } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "@/lib/api/client";

export default function MemoryPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<"all" | "semantic" | "episodic">("all");
    const [error, setError] = useState<string | null>(null);

    const { data: settings } = useQuery({
        queryKey: ["settings"],
        queryFn: fetchSettings,
    });

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const [mems, prof] = await Promise.all([
                    getAllMemories(""),
                    getUserProfile(""),
                ]);
                setMemories(mems);
                setProfile(prof);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load memories");
                setMemories([]);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleSearch() {
        if (!query.trim()) {
            try {
                setError(null);
                const mems = await getAllMemories("");
                setMemories(mems);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Search failed");
            }
            return;
        }
        setLoading(true);
        try {
            setError(null);
            const res = await searchMemories({ apiKey: "", query, rerank: true });
            setMemories(res.memories);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Search failed");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this memory?")) return;
        try {
            setError(null);
            await deleteMemory("", id);
            setMemories((m) => m.filter((mem) => mem.id !== id));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Delete failed");
        }
    }

    const filtered = memories.filter((m) => filterType === "all" || m.type === filterType);
    const memsyncNotConfigured =
        !loading &&
        !!settings &&
        !settings.memSyncKey?.trim() &&
        memories.length === 0 &&
        (profile?.user_bio || "") === "";

    return (
        <div className="max-w-7xl space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Memory Explorer</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {memories.length} memories in MemSync
                </p>
            </div>

            {memsyncNotConfigured && (
                <div className="surface p-5 flex items-start gap-3">
                    <KeyRound size={16} style={{ color: "var(--warning)" }} />
                    <div className="flex-1">
                        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            MemSync is not configured
                        </div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            MemSync is optional (paid). Add a MemSync API key in Settings to enable persistent memory and this explorer.
                        </div>
                    </div>
                    <Link href="/settings" className="btn btn-secondary btn-sm">
                        Open Settings
                    </Link>
                </div>
            )}

            {error && (
                <div className="surface p-4" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
                    <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
                {/* ── Left: Memory grid ── */}
                <div className="space-y-4">
                    {/* Search & Filter */}
                    <div className="surface p-4 flex gap-3 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                            <input
                                className="input pl-9"
                                placeholder="Semantic search memories..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>
                        <button onClick={handleSearch} className="btn btn-primary" disabled={memsyncNotConfigured}>
                            Search
                        </button>
                        <select className="input" style={{ width: "auto" }} value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)}>
                            <option value="all">All Types</option>
                            <option value="semantic">Semantic</option>
                            <option value="episodic">Episodic</option>
                        </select>
                    </div>

                    {/* Memory cards */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full rounded-xl" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="surface flex flex-col items-center justify-center py-16 animate-fade-in">
                            <Brain size={40} style={{ color: "var(--text-muted)" }} />
                            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                                {memsyncNotConfigured ? "MemSync is disabled" : "No memories found"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((mem, i) => (
                                <div
                                    key={mem.id}
                                    className="surface p-4 flex gap-4 animate-fade-in-up"
                                    style={{ animationDelay: `${i * 40}ms` }}
                                >
                                    <div className="flex-1 space-y-2 min-w-0">
                                        <p className="text-sm" style={{ color: "var(--text-primary)" }}>{mem.memory}</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`badge ${mem.type === "semantic" ? "badge-primary" : "badge-warning"}`}>
                                                {mem.type}
                                            </span>
                                            {mem.categories.map((c) => (
                                                <span key={c} className="badge badge-muted">
                                                    <Tag size={9} /> {c}
                                                </span>
                                            ))}
                                            <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                                                {timeAgo(mem.created_at)} · {mem.source}
                                            </span>
                                        </div>
                                        {/* Relevance bar */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Relevance</span>
                                            <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--surface-hover)" }}>
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${mem.rerank_score * 100}%`,
                                                        background: `hsl(${mem.rerank_score * 120}, 60%, 50%)`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs mono" style={{ color: "var(--text-muted)" }}>
                                                {(mem.rerank_score * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(mem.id)} className="btn btn-danger btn-sm self-start">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Right: User profile ── */}
                <div className="space-y-4">
                    <div className="surface p-5 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
                        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <Brain size={16} style={{ color: "var(--primary)" }} /> Auto-Generated Profile
                        </h2>
                        {profile ? (
                            <div className="space-y-4">
                                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                    {profile.user_bio}
                                </p>
                                <div className="space-y-2">
                                    {Object.entries(profile.profiles).map(([key, val]) => (
                                        <div key={key}>
                                            <div className="text-xs font-semibold uppercase mb-0.5" style={{ color: "var(--text-muted)" }}>{key}</div>
                                            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                                {profile.insights.length > 0 && (
                                    <div>
                                        <div className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-muted)" }}>Insights</div>
                                        <ul className="space-y-1">
                                            {profile.insights.map((ins, i) => (
                                                <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-secondary)" }}>
                                                    <span style={{ color: "var(--primary)" }}>•</span>
                                                    {ins}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-4 w-full" />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
