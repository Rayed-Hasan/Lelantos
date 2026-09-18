import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { useAuth } from "@/lib/auth-context";
import { getMemoryProfile } from "@/lib/api";
import type { Memory, MemoryType } from "@/lib/types";
import { MEMORY_TYPE_LABELS, MEMORY_TYPE_COLORS } from "@/lib/types";

export const Route = createFileRoute("/memory")({
  head: () => ({
    meta: [
      { title: "Memory — Lelantos" },
      { name: "description", content: "View and manage your Lelantos memories." },
    ],
  }),
  component: MemoryPage,
});

const ALL_TYPES: (MemoryType | "ALL")[] = [
  "ALL", "IDENTITY", "PREFERENCE", "CONSTRAINT", "PROJECT",
  "GOAL", "DECISION", "FACT", "RELATIONSHIP", "TEMPORARY",
];

function MemoryPage() {
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
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Memory</h1>
          <p className="mt-1 text-sm text-zinc-500">
            All your extracted memories — inspect, edit, or forget
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <Filter className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            {ALL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  filter === type
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                    : "text-zinc-600 hover:text-zinc-400 border border-transparent"
                }`}
              >
                {type === "ALL" ? "All" : MEMORY_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Memory Grid */}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl border border-zinc-800/40 bg-zinc-900/20" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((memory) => (
              <button
                key={memory.memory_id}
                onClick={() => navigate({ to: "/memory/$id", params: { id: memory.memory_id } })}
                className="group rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-5 text-left transition-all hover:border-zinc-700/60 hover:bg-zinc-900/40"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${MEMORY_TYPE_COLORS[memory.type] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/30"}`}>
                    {memory.type}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-600">
                    {Math.round(memory.confidence * 100)}%
                  </span>
                </div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {memory.key.replace(/_/g, " ")}
                </h3>
                <p className="text-base font-bold text-indigo-400">{memory.value}</p>
                <p className="mt-3 font-mono text-[10px] text-zinc-600">
                  v{memory.version} · {new Date(memory.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800/60 bg-zinc-900/10 p-12 text-center">
            <Brain className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-500">
              {search || filter !== "ALL" ? "No memories match your filter" : "No memories yet"}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Start a conversation to build your context
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
