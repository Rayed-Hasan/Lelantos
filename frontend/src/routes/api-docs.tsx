import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Code2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/api-docs")({
  head: () => ({
    meta: [
      { title: "API — Lelantos" },
      { name: "description", content: "Lelantos Context API documentation." },
    ],
  }),
  component: ApiDocsPage,
});

const ENDPOINTS = [
  {
    method: "POST",
    path: "/chat",
    desc: "Send a message and receive AI response with context",
    body: '{\n  "message": "What backend should I use?",\n  "conversation_id": "conv_abc123"\n}',
    response: '{\n  "response": "Based on your Python preference...",\n  "conversation_id": "conv_abc123",\n  "memories_used": [...],\n  "memories_extracted": [...]\n}',
  },
  {
    method: "POST",
    path: "/memory/query",
    desc: "Query for relevant memories",
    body: '{\n  "query": "What are my project constraints?"\n}',
    response: '{\n  "context": [\n    {\n      "type": "CONSTRAINT",\n      "key": "budget",\n      "value": "₹5000/month",\n      "confidence": 0.98\n    }\n  ]\n}',
  },
  {
    method: "GET",
    path: "/memory/profile",
    desc: "Get user's complete memory profile",
    response: '{\n  "total_memories": 12,\n  "active_memories": 10,\n  "type_counts": {"DECISION": 3, "CONSTRAINT": 2},\n  "context_summary": [...]\n}',
  },
  {
    method: "GET",
    path: "/memory/{memory_id}",
    desc: "Get a specific memory with version history",
    response: '{\n  "memory": {...},\n  "history": [{...}, {...}]\n}',
  },
  {
    method: "POST",
    path: "/memory",
    desc: "Create a memory manually",
    body: '{\n  "type": "DECISION",\n  "key": "backend",\n  "value": "Python",\n  "confidence": 0.95\n}',
  },
  {
    method: "PATCH",
    path: "/memory/{memory_id}",
    desc: "Update a memory's value or status",
    body: '{\n  "value": "Node.js",\n  "confidence": 0.9\n}',
  },
  {
    method: "DELETE",
    path: "/memory/{memory_id}",
    desc: "Soft-delete a memory",
  },
  {
    method: "GET",
    path: "/memory/timeline",
    desc: "Get chronological memory changes",
  },
  {
    method: "GET",
    path: "/conversations",
    desc: "List all user conversations",
  },
  {
    method: "GET",
    path: "/conversations/{id}",
    desc: "Get conversation with messages",
  },
  {
    method: "GET",
    path: "/health",
    desc: "Health check",
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-500/10",
  POST: "text-blue-400 bg-blue-500/10",
  PATCH: "text-amber-400 bg-amber-500/10",
  DELETE: "text-red-400 bg-red-500/10",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="rounded p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function ApiDocsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Lelantos Context API</h1>
          <p className="mt-1 text-sm text-zinc-500">
            API-first architecture — any AI client can consume your context
          </p>
        </div>

        <div className="mx-auto max-w-3xl space-y-4">
          {ENDPOINTS.map((ep) => (
            <details key={`${ep.method}-${ep.path}`} className="group rounded-xl border border-zinc-800/60 bg-zinc-900/20">
              <summary className="flex cursor-pointer items-center gap-3 p-4 hover:bg-zinc-900/30 transition-colors">
                <span className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${METHOD_COLORS[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="font-mono text-sm text-zinc-300">{ep.path}</code>
                <span className="ml-auto text-xs text-zinc-600">{ep.desc}</span>
              </summary>
              <div className="border-t border-zinc-800/40 p-4 space-y-3">
                {ep.body && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-zinc-600">REQUEST BODY</span>
                      <CopyButton text={ep.body} />
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-zinc-800/40 bg-zinc-950 p-3 font-mono text-xs text-zinc-400">
                      {ep.body}
                    </pre>
                  </div>
                )}
                {ep.response && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-zinc-600">RESPONSE</span>
                      <CopyButton text={ep.response} />
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-zinc-800/40 bg-zinc-950 p-3 font-mono text-xs text-emerald-400/80">
                      {ep.response}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>

        {/* MCP Section */}
        <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">MCP-Ready Architecture</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Lelantos is designed for an MCP adapter to expose these tools to any AI system:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "get_user_context", "search_memory", "get_memory",
              "create_memory", "update_memory", "delete_memory", "get_memory_source",
            ].map((tool) => (
              <div key={tool} className="rounded-lg border border-zinc-800/40 bg-zinc-950 px-3 py-2 font-mono text-xs text-indigo-400">
                {tool}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
