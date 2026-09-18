import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Shield,
  Layers,
  Zap,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Plus,
  MessageSquare,
  Activity,
  Cpu,
  Eye,
} from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { useAuth } from "@/lib/auth-context";
import { getMemoryProfile } from "@/lib/api";
import type { MemoryProfile } from "@/lib/types";
import { MEMORY_TYPE_COLORS } from "@/lib/types";
import { PixelC } from "@/components/lelantos/pixel-c";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lelantos Context Command Center" },
      { name: "description", content: "Your Lelantos context overview and telemetry." },
    ],
  }),
  component: DashboardPage,
});

export function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
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

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 font-mono text-zinc-300 max-w-7xl mx-auto space-y-10">
        {/* Command Center Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
              <span className="h-2 w-2 bg-emerald-400 animate-pulse" />
              <span>LELANTOS CONTEXT ENGINE // NODE 01</span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-400">AWS BEDROCK L3.1</span>
            </div>
            <h1 className="font-pixel text-2xl sm:text-3xl font-bold tracking-wide text-white">
              <PixelC size="inner" />ONTEXT <PixelC size="inner" />OMMAND <PixelC size="inner" />ENTER
            </h1>
            <p className="mt-1 text-xs text-zinc-500 font-sans">
              Real-time telemetry of your portable AI memory shield and verified context records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: "/chat" })}
              className="inline-flex items-center gap-2 border border-white bg-white px-4 py-2 font-mono text-xs font-bold text-black transition-all hover:bg-zinc-200"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>[ OPEN CHAT ]</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metric HUD Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Total Memories */}
          <div className="relative border border-zinc-800 bg-[#09090b] p-5">
            <div className="absolute top-0 right-0 p-2 text-[9px] text-zinc-600 font-mono">
              METRIC_01
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
              <Shield className="h-4 w-4 text-white" />
              <span>TOTAL VAULT RECORDS</span>
            </div>
            <div className="font-pixel text-4xl font-bold text-white mb-1">
              {loading ? "..." : profile?.total_memories ?? 0}
            </div>
            <div className="text-[10px] text-zinc-500 font-sans">
              Extracted & verified by Lelantos
            </div>
          </div>

          {/* Active Context */}
          <div className="relative border border-zinc-800 bg-[#09090b] p-5">
            <div className="absolute top-0 right-0 p-2 text-[9px] text-zinc-600 font-mono">
              METRIC_02
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span>ACTIVE CONTEXT BLOCKS</span>
            </div>
            <div className="font-pixel text-4xl font-bold text-emerald-400 mb-1">
              {loading ? "..." : profile?.active_memories ?? 0}
            </div>
            <div className="text-[10px] text-zinc-500 font-sans">
              Currently injected into AI prompts
            </div>
          </div>

          {/* Category Dimensions */}
          <div className="relative border border-zinc-800 bg-[#09090b] p-5">
            <div className="absolute top-0 right-0 p-2 text-[9px] text-zinc-600 font-mono">
              METRIC_03
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
              <Layers className="h-4 w-4 text-zinc-300" />
              <span>CONTEXT DIMENSIONS</span>
            </div>
            <div className="font-pixel text-4xl font-bold text-white mb-1">
              {loading ? "..." : Object.keys(profile?.type_counts ?? {}).length}
            </div>
            <div className="text-[10px] text-zinc-500 font-sans">
              Identity, Preferences, Decisions, etc.
            </div>
          </div>
        </div>

        {/* Type Distribution Breakdown */}
        {profile?.type_counts && Object.keys(profile.type_counts).length > 0 && (
          <div className="border border-zinc-800/80 bg-[#09090b] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold text-white">CONTEXT DISTRIBUTION BY TYPE</span>
              <span className="text-[10px] text-zinc-500">VOXEL RATIO</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(profile.type_counts).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center gap-2 border border-zinc-800 bg-black px-3 py-1.5 text-xs"
                >
                  <span className="font-pixel text-zinc-300">{type}:</span>
                  <span className="font-bold text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Context Matrix */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="h-4 w-4 text-zinc-400" />
                ACTIVE CONTEXT MATRIX
              </h2>
              <p className="text-[11px] text-zinc-500 font-sans">
                These structured facts are actively presented to your AI models when relevant.
              </p>
            </div>
            <button
              onClick={() => navigate({ to: "/memory" })}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <span>[ VIEW ALL IN VAULT ]</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse border border-zinc-800/60 bg-zinc-950"
                />
              ))}
            </div>
          ) : profile?.context_summary && profile.context_summary.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.context_summary.map((mem, i) => (
                <div
                  key={i}
                  className="group relative border border-zinc-800 bg-black p-5 transition-all hover:border-zinc-600 hover:bg-zinc-950"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-200">
                      {mem.type}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {(mem.confidence * 100).toFixed(0)}% CONF
                    </span>
                  </div>

                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-mono">
                    {mem.key}
                  </div>
                  <div className="text-sm font-bold text-white font-sans break-words">
                    {mem.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-zinc-800 bg-[#09090b] p-12 text-center">
              <Shield className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
              <div className="text-sm font-bold text-white mb-1">NO CONTEXT BLOCKS FORGED YET</div>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto font-sans mb-6">
                Start chatting with Lelantos or create memories manually to build your permanent context world.
              </p>
              <button
                onClick={() => navigate({ to: "/chat" })}
                className="border border-white bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-zinc-200"
              >
                [ INITIALIZE CHAT CONVERSATION ]
              </button>
            </div>
          )}
        </div>

        {/* Recent Memory History Feed */}
        {profile?.recent_memories && profile.recent_memories.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  RECENT CONTEXT AUDIT LOG
                </h2>
                <p className="text-[11px] text-zinc-500 font-sans">
                  Chronological record of memory creations, edits, and conflict versioning.
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/timeline" })}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <span>[ OPEN TIMELINE ]</span>
                <Clock className="h-3 w-3" />
              </button>
            </div>

            <div className="divide-y divide-zinc-800/60 border border-zinc-800 bg-black">
              {profile.recent_memories.slice(0, 6).map((mem) => (
                <div
                  key={mem.memory_id}
                  onClick={() => navigate({ to: "/memory/$id", params: { id: mem.memory_id } })}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-zinc-900/60 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[9px] font-bold text-zinc-300 shrink-0">
                      {mem.type}
                    </span>
                    <div>
                      <div className="text-xs text-zinc-400">
                        <span className="text-zinc-500 uppercase">{mem.key}:</span>{" "}
                        <span className="font-bold text-white font-sans">{mem.value}</span>
                      </div>
                      <div className="text-[10px] text-zinc-600 font-mono">
                        v{mem.version} • {mem.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-zinc-500">
                    <span>{new Date(mem.updated_at).toLocaleString()}</span>
                    <Eye className="h-3.5 w-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
