"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X, ArrowRight, Bot, Play, Brain, Database, Settings } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const SEARCH_ITEMS = [
  { href: "/", label: "Dashboard", icon: Bot, description: "Overview and stats" },
  { href: "/agents", label: "Agents", icon: Bot, description: "Manage your AI agents" },
  { href: "/agents/new", label: "New Agent", icon: Bot, description: "Create a new agent" },
  { href: "/runs", label: "Run History", icon: Play, description: "View execution history" },
  { href: "/memory", label: "Memory", icon: Brain, description: "Explore agent memory" },
  { href: "/models", label: "Model Hub", icon: Database, description: "Available AI models" },
  { href: "/settings", label: "Settings", icon: Settings, description: "App preferences" },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filteredItems = SEARCH_ITEMS.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return;

      switch (e.key) {
        case "Escape":
          setCommandPaletteOpen(false);
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredItems.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => prev === 0 ? filteredItems.length - 1 : prev - 1);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            router.push(filteredItems[selectedIndex].href);
            setCommandPaletteOpen(false);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, selectedIndex, filteredItems, router, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, pages, and more..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-lg"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-2">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setCommandPaletteOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 transition-colors",
                      isSelected && "bg-slate-800"
                    )}
                  >
                    <Icon size={18} className="text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{item.label}</div>
                      <div className="text-slate-400 text-sm truncate">{item.description}</div>
                    </div>
                    <ArrowRight
                      size={16}
                      className={cn(
                        "text-slate-400 shrink-0 transition-transform",
                        isSelected && "translate-x-1"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
            <span>Cmd+K</span>
          </div>
        </div>
      </div>
    </div>
  );
}