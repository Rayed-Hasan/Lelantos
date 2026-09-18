import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Filter, Shield, Eye, ArrowUpRight, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { PixelC } from "@/components/lelantos/pixel-c";
import { useAuth } from "@/lib/auth-context";
import { getMemoryProfile } from "@/lib/api";
import type { Memory, MemoryType } from "@/lib/types";
import { MEMORY_TYPE_LABELS } from "@/lib/types";

export const Route = createFileRoute("/memory")({
  head: () => ({
    meta: [
      { title: "Memory Vault — Lelantos" },
      { name: "description", content: "View and inspect all structured context blocks in your vault." },
    ],
  }),
  component: MemoryPage,
});

const ALL_TYPES: (MemoryType | "ALL")[] = [
  "ALL",
  "IDENTITY",
  "PREFERENCE",
  "CONSTRAINT",
  "PROJECT",
  "GOAL",
  "DECISION",
  "FACT",
  "RELATIONSHIP",
  "TEMPORARY",
];

export function MemoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MemoryType | "ALL">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      getMemoryProfile()
        .then((profile) => setMemories(profile.recent_memories || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  const filtered = memories.filter((m) => {
    if (filter !== "ALL" && m.type !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        m.key.toLowerCase().includes(s) ||
        m.value.toLowerCase().includes(s) ||
        m.type.toLowerCase().includes(s)
      );
    }
    return true;
  });

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 font-mono text-zinc-300 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
              <span className="h-2 w-2 bg-emerald-400 animate-pulse" />
              <span>GUARDIAN VAULT INDEX</span>
              <span className="text-zinc-700">//</span>
              <span>{memories.length} TOTAL RECORDS</span>
            </div>
            <h1 className="font-pixel text-2xl sm:text-3xl font-bold tracking-wide text-white">
              <PixelC size="inner" />ONTEXT MEMORY VAULT
            </h1>
            <p className="mt-1 text-xs text-zinc-500 font-sans">
              Structured context blocks preserved by Lelantos. Select any memory to inspect its forensic provenance.
            </p>
          </div>

          <button
            onClick={() => navigate({ to: "/chat" })}
            className="inline-flex items-center gap-2 border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>[ CONVERSE WITH VAULT ]</span>
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by key, value, or type filter..."
              className="w-full border border-zinc-800 bg-[#09090b] py-3 pl-10 pr-4 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Voxel Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <Filter className="h-3.5 w-3.5 shrink-0 text-zinc-500 mr-1" />
            {ALL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`shrink-0 border px-3 py-1.5 text-[11px] uppercase transition-all ${
                  filter === type
                    ? "border-white bg-white text-black font-bold shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                    : "border-zinc-800 bg-black text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                {type === "ALL" ? "[ ALL ]" : `[ ${MEMORY_TYPE_LABELS[type] || type} ]`}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Blocks Matrix */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse border border-zinc-800/60 bg-zinc-950"
              />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((memory) => (
              <button
                key={memory.memory_id}
                onClick={() => navigate({ to: "/memory/$id", params: { id: memory.memory_id } })}
                className="group relative border border-zinc-800 bg-black p-5 text-left transition-all hover:border-zinc-500 hover:bg-[#09090b] flex flex-col justify-between"
              >
                {/* Corner decorative marks */}
                <div className="absolute top-0 right-0 p-2 text-[8px] text-zinc-600 font-mono">
                  v{memory.version}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-200">
                      {memory.type}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {(memory.confidence * 100).toFixed(0)}% CONF
                    </span>
                  </div>

                  <div className="text-[11px] uppercase text-zinc-500 tracking-wider mb-1">
                    {memory.key.replace(/_/g, " ")}
                  </div>
                  <div className="text-sm font-bold text-white font-sans break-words mb-4">
                    {memory.value}
                  </div>
                </div>

                <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{new Date(memory.updated_at).toLocaleDateString()}</span>
                  <span className="group-hover:text-white group-hover:underline flex items-center gap-1 transition-colors">
                    INSPECT <Eye className="h-3 w-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-800 bg-[#09090b] p-16 text-center">
            <Shield className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
            <div className="text-sm font-bold text-white mb-1">NO MATCHING CONTEXT BLOCKS</div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto font-sans mb-6">
              {search || filter !== "ALL"
                ? "No memories match your query or type filter."
                : "Your vault is currently empty. Start chatting with Lelantos to forge memories."}
            </p>
            {(search || filter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                }}
                className="border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800"
              >
                [ RESET FILTERS ]
              </button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
