import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Layers, Zap, Clock, ArrowUpRight } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { useAuth } from "@/lib/auth-context";
import { getMemoryProfile } from "@/lib/api";
import type { MemoryProfile } from "@/lib/types";
import { MEMORY_TYPE_COLORS } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lelantos" },
      { name: "description", content: "Your Lelantos context overview." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MemoryProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      getMemoryProfile()
        .then(setProfile)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  if (authLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your portable AI context at a glance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-medium text-zinc-500">Total Memories</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : profile?.total_memories ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-zinc-500">Active</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : profile?.active_memories ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-medium text-zinc-500">Types</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : Object.keys(profile?.type_counts ?? {}).length}
            </p>
          </div>
        </div>

        {/* Active Context */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">Active Context</h2>
            <button
              onClick={() => navigate({ to: "/memory" })}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-zinc-800/40 bg-zinc-900/20" />
              ))}
            </div>
          ) : profile?.context_summary && profile.context_summary.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.context_summary.map((mem, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-800/60 bg-zinc-900/20 p-4 transition-colors hover:border-zinc-700/60"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${MEMORY_TYPE_COLORS[mem.type as keyof typeof MEMORY_TYPE_COLORS] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/30"}`}>
                      {mem.type}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-600">
                      {Math.round(mem.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs font-medium text-zinc-500">{mem.key}</p>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-200">{mem.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800/60 bg-zinc-900/10 p-8 text-center">
              <Brain className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-500">No memories yet</p>
              <p className="mt-1 text-xs text-zinc-600">
                Start a conversation to build your context
              </p>
              <button
                onClick={() => navigate({ to: "/chat" })}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Start Chatting
              </button>
            </div>
          )}
        </div>

        {/* Recent Changes */}
        {profile?.recent_memories && profile.recent_memories.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300">Recent Memory Changes</h2>
              <button
                onClick={() => navigate({ to: "/timeline" })}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Timeline <Clock className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2">
              {profile.recent_memories.slice(0, 5).map((mem) => (
                <div
                  key={mem.memory_id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800/40 bg-zinc-900/10 px-4 py-3 transition-colors hover:border-zinc-700/40 cursor-pointer"
                  onClick={() => navigate({ to: "/memory/$id", params: { id: mem.memory_id } })}
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${MEMORY_TYPE_COLORS[mem.type as keyof typeof MEMORY_TYPE_COLORS] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/30"}`}>
                      {mem.type}
                    </span>
                    <div>
                      <span className="text-xs text-zinc-500">{mem.key}:</span>{" "}
                      <span className="text-sm font-medium text-zinc-200">{mem.value}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-600">
                    {new Date(mem.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
