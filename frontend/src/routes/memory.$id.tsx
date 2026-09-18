import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  Pencil,
  Trash2,
  Clock,
  MessageSquare,
  History,
  Shield,
  Check,
  Copy,
  AlertTriangle,
  GitBranch,
} from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { useAuth } from "@/lib/auth-context";
import { getMemoryDetail, updateMemory, deleteMemory } from "@/lib/api";
import type { Memory } from "@/lib/types";

export const Route = createFileRoute("/memory/$id")({
  head: () => ({
    meta: [
      { title: "Memory Inspector — Lelantos Forensic Dossier" },
      { name: "description", content: "Inspect memory provenance, source quote, and version history." },
    ],
  }),
  component: MemoryInspectorPage,
});

export function MemoryInspectorPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [history, setHistory] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [copiedId, setCopiedId] = useState(false);

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
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!memory) return;
    if (!confirm("Are you sure you want to permanently forget this memory record?")) return;
    try {
      await deleteMemory(memory.memory_id);
      navigate({ to: "/memory" });
    } catch (e) {
      console.error(e);
    }
  };

  const copyMemoryId = () => {
    if (!memory) return;
    navigator.clipboard.writeText(memory.memory_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 font-mono text-zinc-300 max-w-5xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <button
            onClick={() => navigate({ to: "/memory" })}
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>[ RETURN TO VAULT ]</span>
          </button>

          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
            FORENSIC CONTEXT DOSSIER
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse border border-zinc-800 bg-[#09090b]" />
            ))}
          </div>
        ) : memory ? (
          <div className="space-y-8">
            {/* Primary Memory Record Card */}
            <div className="relative border border-zinc-700 bg-black p-6 sm:p-8 shadow-2xl">
              {/* Corner brackets */}
              <div className="absolute -top-1.5 -left-1.5 h-3 w-3 border-t-2 border-l-2 border-white" />
              <div className="absolute -top-1.5 -right-1.5 h-3 w-3 border-t-2 border-r-2 border-white" />
              <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 border-b-2 border-r-2 border-white" />

              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="border border-white bg-white px-2.5 py-0.5 text-xs font-bold text-black uppercase">
                    {memory.type}
                  </span>
                  <span
                    className={`border px-2.5 py-0.5 text-xs font-bold ${
                      memory.status === "ACTIVE"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    STATUS: {memory.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  REVISION: <strong className="text-white">v{memory.version}.0</strong>
                </div>
              </div>

              {/* Key and Value */}
              <div className="mb-6">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  CONTEXT KEY: {memory.key}
                </div>

                {editing ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 min-w-[240px] border border-zinc-600 bg-zinc-900 px-4 py-2 text-base font-bold text-white outline-none focus:border-white"
                    />
                    <button
                      onClick={handleUpdate}
                      className="border border-white bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200"
                    >
                      SAVE
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="border border-zinc-700 bg-black px-4 py-2 text-xs text-zinc-400 hover:text-white"
                    >
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <div className="text-2xl sm:text-3xl font-bold text-white font-sans break-words mt-1">
                    {memory.value}
                  </div>
                )}
              </div>

              {/* Confidence Meter (Voxel Segmented Bar) */}
              <div className="mb-6 border-t border-zinc-800/80 pt-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-zinc-500 uppercase">GUARDIAN VERIFICATION CONFIDENCE</span>
                  <span className="text-emerald-400 font-bold">
                    {(memory.confidence * 100).toFixed(1)}% VERIFIED
                  </span>
                </div>

                {/* 10-segment voxel bar */}
                <div className="grid grid-cols-10 gap-1.5 h-3">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const threshold = (idx + 1) * 0.1;
                    const filled = memory.confidence >= threshold - 0.05;
                    return (
                      <div
                        key={idx}
                        className={`h-full border ${
                          filled
                            ? "border-emerald-500 bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            : "border-zinc-800 bg-zinc-950"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1.5 font-sans">
                  {memory.confidence >= 0.85
                    ? "Explicit user directive extracted directly from source statement."
                    : "Inferred context with high semantic probability."}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setEditing(!editing)}
                  className="inline-flex items-center gap-1.5 border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  <span>{editing ? "CANCEL EDIT" : "EDIT VALUE"}</span>
                </button>

                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 border border-red-500/30 bg-red-950/20 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>PERMANENTLY FORGET</span>
                </button>
              </div>
            </div>

            {/* "Why did Lelantos remember this?" Forensic Provenance Dossier */}
            <div className="border border-zinc-800 bg-[#09090b] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-zinc-300" />
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    WHY DID LELANTOS REMEMBER THIS?
                  </h2>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">[PROVENANCE VERIFIED]</span>
              </div>

              {/* Forensic Source Text */}
              <div>
                <div className="text-[10px] uppercase text-zinc-500 mb-2">
                  EXACT SOURCE STATEMENT (UNALTERED TRANSCRIPT)
                </div>
                {memory.source?.text ? (
                  <div className="border-l-2 border-white bg-black p-4 text-sm font-serif italic text-zinc-200 leading-relaxed">
                    "{memory.source.text}"
                  </div>
                ) : (
                  <div className="border border-zinc-800 bg-black p-4 text-xs text-zinc-500 italic">
                    Created via manual console entry or API insertion.
                  </div>
                )}
              </div>

              {/* Source Provenance Linkages */}
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="border border-zinc-800 bg-black p-3 space-y-1">
                  <div className="text-[10px] uppercase text-zinc-500">SOURCE CONVERSATION</div>
                  <div className="text-zinc-300 font-mono break-all">
                    {memory.source?.conversation_id || "N/A"}
                  </div>
                </div>

                <div className="border border-zinc-800 bg-black p-3 space-y-1">
                  <div className="text-[10px] uppercase text-zinc-500">SOURCE MESSAGE ID</div>
                  <div className="text-zinc-300 font-mono break-all">
                    {memory.source?.message_id || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Conflict & Version History Timeline */}
            <div className="border border-zinc-800 bg-[#09090b] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-zinc-300" />
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    CONFLICT RESOLUTION & VERSION TIMELINE
                  </h2>
                </div>
                <span className="text-[10px] text-zinc-500">
                  {history.length > 0 ? `${history.length} VERSIONS` : "1 VERSION (CANONICAL)"}
                </span>
              </div>

              {history.length > 1 ? (
                <div className="relative border-l-2 border-zinc-700 pl-6 space-y-6">
                  {history.map((h, i) => {
                    const isLatest = h.status === "ACTIVE";
                    return (
                      <div key={h.memory_id} className="relative space-y-1.5">
                        {/* Dot */}
                        <div
                          className={`absolute -left-[31px] top-1 h-3.5 w-3.5 border-2 ${
                            isLatest
                              ? "border-emerald-400 bg-black"
                              : "border-zinc-600 bg-zinc-800"
                          }`}
                        />

                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-white">v{h.version}.0</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold ${
                              isLatest
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : "bg-zinc-900 text-zinc-500 line-through border border-zinc-800"
                            }`}
                          >
                            {h.status}
                          </span>
                          <span className="text-zinc-600 text-[10px]">
                            {new Date(h.updated_at).toLocaleString()}
                          </span>
                        </div>

                        <div
                          className={`text-sm font-sans ${
                            isLatest ? "font-bold text-white" : "line-through text-zinc-500"
                          }`}
                        >
                          {h.value}
                        </div>

                        {i < history.length - 1 && (
                          <div className="text-[10px] text-amber-400/80 font-mono pt-1">
                            ⚡ Conflict detected: Obsolete value retired in favor of newer declaration.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-zinc-500 font-sans">
                  This memory record has no prior conflicts or revisions. It was created as canonical Version 1.
                </div>
              )}
            </div>

            {/* Technical Database Metadata */}
            <div className="border border-zinc-800 bg-black p-6 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                DATABASE TELEMETRY & ATTRIBUTES
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-900 py-1.5">
                  <span className="text-zinc-500">MEMORY ID</span>
                  <button
                    onClick={copyMemoryId}
                    className="flex items-center gap-1.5 font-mono text-zinc-300 hover:text-white"
                  >
                    <span className="truncate max-w-[180px]">{memory.memory_id}</span>
                    {copiedId ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-zinc-500" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between border-b border-zinc-900 py-1.5">
                  <span className="text-zinc-500">CREATED AT</span>
                  <span className="font-mono text-zinc-300">
                    {new Date(memory.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-zinc-900 py-1.5">
                  <span className="text-zinc-500">LAST UPDATED</span>
                  <span className="font-mono text-zinc-300">
                    {new Date(memory.updated_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-zinc-900 py-1.5">
                  <span className="text-zinc-500">STORAGE PARTITION</span>
                  <span className="font-mono text-zinc-300">USER_ISOLATED / DYNAMODB</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-zinc-800 bg-[#09090b] p-16 text-center">
            <Shield className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
            <div className="text-sm font-bold text-white mb-2">MEMORY RECORD NOT FOUND</div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-6">
              The memory record you are requesting could not be located in the guardian index.
            </p>
            <button
              onClick={() => navigate({ to: "/memory" })}
              className="border border-white bg-white px-4 py-2 text-xs font-bold text-black"
            >
              [ RETURN TO VAULT ]
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
