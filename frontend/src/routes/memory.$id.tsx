import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Pencil, Trash2, Clock, MessageSquare, History } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { useAuth } from "@/lib/auth-context";
import { getMemoryDetail, updateMemory, deleteMemory } from "@/lib/api";
import type { Memory } from "@/lib/types";
import { MEMORY_TYPE_COLORS, MEMORY_STATUS_COLORS } from "@/lib/types";

export const Route = createFileRoute("/memory/$id")({
  head: () => ({
    meta: [
      { title: "Memory Inspector — Lelantos" },
      { name: "description", content: "Inspect memory provenance, history, and source." },
    ],
  }),
  component: MemoryInspectorPage,
});

function MemoryInspectorPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [history, setHistory] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && id) {
      getMemoryDetail(id)
        .then((data) => {
          setMemory(data.memory);
          setHistory(data.history || []);
          setEditValue(data.memory.value);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, id]);

  const handleUpdate = async () => {
    if (!memory || !editValue.trim()) return;
    try {
      const result = await updateMemory(memory.memory_id, { value: editValue });
      setMemory(result.memory);
      setEditing(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!memory) return;
    if (!confirm("Are you sure you want to forget this memory?")) return;
    try {
      await deleteMemory(memory.memory_id);
      navigate({ to: "/memory" });
    } catch (e) { console.error(e); }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <button
          onClick={() => navigate({ to: "/memory" })}
          className="mb-6 flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to memories
        </button>

        {loading ? (
          <div className="mx-auto max-w-2xl space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-zinc-800/40 bg-zinc-900/20" />
            ))}
          </div>
        ) : memory ? (
          <div className="mx-auto max-w-2xl">
            {/* Header */}
            <div className="mb-6 rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${MEMORY_TYPE_COLORS[memory.type]}`}>
                    {memory.type}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${MEMORY_STATUS_COLORS[memory.status]}`}>
                    {memory.status}
                  </span>
                </div>
                <span className="font-mono text-xs text-zinc-600">v{memory.version}</span>
              </div>

              <h1 className="mb-1 text-lg font-semibold text-zinc-300">
                {memory.key.replace(/_/g, " ")}
              </h1>

              {editing ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-lg font-bold text-indigo-400 outline-none focus:border-indigo-500"
                  />
                  <button onClick={handleUpdate} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Save</button>
                  <button onClick={() => setEditing(false)} className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-700">Cancel</button>
                </div>
              ) : (
                <p className="text-2xl font-bold text-indigo-400">{memory.value}</p>
              )}

              {/* Confidence */}
              <div className="mt-4">
                <p className="mb-1 font-mono text-[10px] text-zinc-600">CONFIDENCE</p>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${memory.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {Math.round(memory.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Forget
                </button>
                <button
                  onClick={() => setShowWhy(!showWhy)}
                  className="flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                >
                  <Eye className="h-3 w-3" /> Why did you remember this?
                </button>
              </div>
            </div>

            {/* "Why did you remember this?" panel — Section 33 */}
            {showWhy && (
              <div className="mb-6 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-cyan-400">
                  <Eye className="h-4 w-4" />
                  Why did Lelantos remember this?
                </h2>

                <div className="space-y-4">
                  {memory.source?.text && (
                    <div>
                      <p className="font-mono text-[10px] text-zinc-600">SOURCE</p>
                      <p className="mt-1 text-sm italic text-zinc-300">"{memory.source.text}"</p>
                    </div>
                  )}

                  <div>
                    <p className="font-mono text-[10px] text-zinc-600">MEMORY TYPE</p>
                    <p className="mt-1 text-sm text-zinc-300">{memory.type}</p>
                  </div>

                  <div>
                    <p className="font-mono text-[10px] text-zinc-600">CONFIDENCE</p>
                    <p className="mt-1 text-sm text-zinc-300">
                      {Math.round(memory.confidence * 100)}% — {memory.confidence >= 0.8 ? "High confidence, explicit statement" : "Moderate confidence, may be inferred"}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[10px] text-zinc-600">DETECTED</p>
                    <p className="mt-1 text-sm text-zinc-300">{new Date(memory.created_at).toLocaleString()}</p>
                  </div>

                  {memory.source?.conversation_id && (
                    <div>
                      <p className="font-mono text-[10px] text-zinc-600">SOURCE CONVERSATION</p>
                      <p className="mt-1 font-mono text-xs text-zinc-400">{memory.source.conversation_id}</p>
                    </div>
                  )}

                  {memory.source?.message_id && (
                    <div>
                      <p className="font-mono text-[10px] text-zinc-600">SOURCE MESSAGE</p>
                      <p className="mt-1 font-mono text-xs text-zinc-400">{memory.source.message_id}</p>
                    </div>
                  )}

                  {/* Version history */}
                  {history.length > 1 && (
                    <div>
                      <p className="font-mono text-[10px] text-zinc-600">MEMORY HISTORY</p>
                      <div className="mt-2 space-y-1.5">
                        {history.map((h, i) => (
                          <div key={h.memory_id} className="flex items-center gap-2 text-sm">
                            {i < history.length - 1 && (
                              <span className="text-zinc-600">↓</span>
                            )}
                            <span className={h.status === "ACTIVE" ? "font-semibold text-indigo-400" : "text-zinc-500 line-through"}>
                              {h.value}
                            </span>
                            <span className={`text-[10px] ${MEMORY_STATUS_COLORS[h.status]}`}>
                              {h.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-6">
              <h2 className="mb-4 text-sm font-semibold text-zinc-400">Details</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-zinc-600">
                    <Clock className="h-3 w-3" /> Created
                  </span>
                  <span className="font-mono text-xs text-zinc-400">
                    {new Date(memory.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-zinc-600">
                    <Clock className="h-3 w-3" /> Updated
                  </span>
                  <span className="font-mono text-xs text-zinc-400">
                    {new Date(memory.updated_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-zinc-600">
                    <History className="h-3 w-3" /> Version
                  </span>
                  <span className="font-mono text-xs text-zinc-400">v{memory.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-zinc-600">
                    <MessageSquare className="h-3 w-3" /> Memory ID
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500">{memory.memory_id}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-sm text-zinc-500">Memory not found</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
