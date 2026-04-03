"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchModelHub } from "@/lib/opengradient";
import { Search, Bot } from "lucide-react";
import Link from "next/link";

export default function ModelsPage() {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterVerification, setFilterVerification] = useState("all");

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["model-hub", query, filterType, filterVerification],
    queryFn: () => fetchModelHub({ query, type: filterType, verification: filterVerification }),
  });

  const verificationColors: Record<string, string> = {
    TEE: "var(--primary)",
    ZKML: "var(--success)",
    Vanilla: "var(--text-muted)",
  };

  return (
    <div className="max-w-7xl space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Model Hub</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          1,000+ models available on OpenGradient&apos;s decentralized infrastructure
        </p>
      </div>

      <div className="surface p-4 flex gap-3 flex-wrap animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input className="input pl-9" placeholder="Search models..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input" style={{ width: "auto" }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="LLM">LLM</option>
          <option value="ML">ML</option>
          <option value="Embedding">Embedding</option>
        </select>
        <select className="input" style={{ width: "auto" }} value={filterVerification} onChange={(e) => setFilterVerification(e.target.value)}>
          <option value="all">All Verification</option>
          <option value="TEE">TEE</option>
          <option value="ZKML">ZKML</option>
          <option value="Vanilla">Vanilla</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {models.map((model, i) => (
            <div key={model.id} className="surface p-5 space-y-3 animate-fade-in-up surface-hover" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{model.name}</h3>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{model.provider}</div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className="badge" style={{ background: `${verificationColors[model.verification]}18`, color: verificationColors[model.verification], border: `1px solid ${verificationColors[model.verification]}30` }}>{model.verification}</span>
                  <span className="badge badge-muted">{model.type}</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{model.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span style={{ color: "var(--text-muted)" }}>Architecture: </span><span style={{ color: "var(--text-secondary)" }}>{model.architecture}</span></div>
                <div><span style={{ color: "var(--text-muted)" }}>Size: </span><span style={{ color: "var(--text-secondary)" }}>{model.size}</span></div>
                {model.contextLength && <div><span style={{ color: "var(--text-muted)" }}>Context: </span><span style={{ color: "var(--text-secondary)" }}>{(model.contextLength / 1000).toFixed(0)}K</span></div>}
                <div><span style={{ color: "var(--text-muted)" }}>v{model.version}</span></div>
              </div>

              <Link href="/agents/new" className="btn btn-secondary btn-sm w-full justify-center"><Bot size={12} /> Use in Agent</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
