"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AVAILABLE_MODELS } from "@/lib/opengradient";
import { deleteMyData, fetchSettings, updateSettings, UserSettings } from "@/lib/api/client";
import { Eye, EyeOff, Key, Bell, Cpu, Trash2, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const [draft, setDraft] = useState<UserSettings | null>(null);
  const [showOgKey, setShowOgKey] = useState(false);
  const [showMemKey, setShowMemKey] = useState(false);

  const state = useMemo(() => draft ?? data ?? null, [draft, data]);

  const saveMutation = useMutation({
    mutationFn: (payload: UserSettings) => updateSettings(payload),
    onSuccess: (saved) => {
      setDraft(saved);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const wipeMutation = useMutation({
    mutationFn: deleteMyData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
  });

  if (isLoading || !state) {
    return <div className="skeleton h-80 w-full rounded-xl" />;
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Manage your API keys and preferences</p>
      </div>

      <div className="surface p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Key size={16} style={{ color: "var(--primary)" }} />
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>API Keys</h2>
        </div>

        <div>
          <label className="label">OpenGradient API Key</label>
          <div className="flex gap-2">
            <input
              className="input"
              type={showOgKey ? "text" : "password"}
              placeholder={state.usingServerOgKey ? "Using server default key" : "0x..."}
              value={state.ogApiKey}
              onChange={(e) => setDraft({ ...state, ogApiKey: e.target.value })}
            />
            <button onClick={() => setShowOgKey(!showOgKey)} className="btn btn-secondary">{showOgKey ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Optional. Paste your own wallet private key to override the server default. This value is write-only and won&apos;t be shown again.
          </p>
        </div>

        <div>
          <label className="label">MemSync API Key (Optional)</label>
          <div className="flex gap-2">
            <input className="input" type={showMemKey ? "text" : "password"} placeholder="ms_..." value={state.memSyncKey} onChange={(e) => setDraft({ ...state, memSyncKey: e.target.value })} />
            <button onClick={() => setShowMemKey(!showMemKey)} className="btn btn-secondary">{showMemKey ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Leave empty to disable paid MemSync features (memory explorer + persistent memory).
          </p>
        </div>
      </div>

      <div className="surface p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Cpu size={16} style={{ color: "var(--primary)" }} />
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Preferences</h2>
        </div>

        <div>
          <label className="label">Default Model</label>
          <select className="input" value={state.defaultModel} onChange={(e) => setDraft({ ...state, defaultModel: e.target.value })}>
            {AVAILABLE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="surface p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={16} style={{ color: "var(--primary)" }} />
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Notifications</h2>
        </div>
        {[
          { key: "runCompletion", label: "Notify on run completion" },
          { key: "proofConfirmation", label: "Notify on proof confirmation" },
          { key: "runFailure", label: "Notify on run failure" },
        ].map((item) => {
          const key = item.key as keyof UserSettings["notifications"];
          const active = state.notifications[key];
          return (
            <button key={item.key} className="flex items-center justify-between w-full" onClick={() => setDraft({ ...state, notifications: { ...state.notifications, [key]: !active } })}>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
              <div className="w-10 h-5 rounded-full relative cursor-pointer" style={{ background: active ? "var(--primary)" : "var(--border)" }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: active ? "22px" : "2px" }} />
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={() => saveMutation.mutate(state)} className="btn btn-primary btn-lg w-full justify-center" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? "Saving..." : <><CheckCircle size={16} /> Save Settings</>}
      </button>

      <div className="surface p-6 space-y-4" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Trash2 size={16} style={{ color: "var(--error)" }} />
          <h2 className="font-semibold" style={{ color: "var(--error)" }}>Danger Zone</h2>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Delete all agents, runs, and memory data. This action is irreversible.</p>
        <button
          onClick={() => {
            if (confirm("Delete all data? This is irreversible.")) wipeMutation.mutate();
          }}
          className="btn btn-danger"
          disabled={wipeMutation.isPending}
        >
          <Trash2 size={14} /> {wipeMutation.isPending ? "Deleting..." : "Delete All Data"}
        </button>
      </div>
    </div>
  );
}
