import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Code2, Copy, Check, Terminal, Cpu, Layers } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { PixelC } from "@/components/lelantos/pixel-c";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/api-docs")({
  head: () => ({
    meta: [
      { title: "API Reference — Lelantos Context Protocol" },
      { name: "description", content: "Lelantos REST and MCP Context Protocol endpoint documentation." },
    ],
  }),
  component: ApiDocsPage,
});

const ENDPOINTS = [
  {
    method: "POST",
    path: "/chat",
    desc: "Send user message, execute context retrieval, extract memories, and stream Bedrock response",
    body: '{\n  "message": "What backend should I use for this service?",\n  "conversation_id": "conv_abc123"\n}',
    response: '{\n  "response": "Based on your verified Python 3.12 + FastAPI preference...",\n  "conversation_id": "conv_abc123",\n  "memories_used": [\n    {"type": "PREFERENCE", "key": "primary_language", "value": "Python 3.12"}\n  ],\n  "memories_extracted": [\n    {"type": "DECISION", "key": "auth_standard", "value": "Cognito JWT", "confidence": 0.98}\n  ],\n  "conflicts_detected": []\n}',
  },
  {
    method: "POST",
    path: "/memory/query",
    desc: "Retrieve ranked context memories relevant to an arbitrary query string",
    body: '{\n  "query": "What are my project constraints and budget?"\n}',
    response: '{\n  "context": [\n    {\n      "type": "CONSTRAINT",\n      "key": "monthly_budget",\n      "value": "₹5000/month",\n      "confidence": 0.98\n    }\n  ]\n}',
  },
  {
    method: "GET",
    path: "/memory/profile",
    desc: "Get user's complete context profile, type breakdown, and recent memory history",
    response: '{\n  "user_id": "usr_94f8b2c",\n  "total_memories": 12,\n  "active_memories": 10,\n  "type_counts": {"DECISION": 3, "CONSTRAINT": 2, "PREFERENCE": 5},\n  "context_summary": [...],\n  "recent_memories": [...]\n}',
  },
  {
    method: "GET",
    path: "/memory/{memory_id}",
    desc: "Inspect a specific memory record with complete forensic provenance and version history",
    response: '{\n  "memory": {\n    "memory_id": "mem_01J8F94D2KP",\n    "type": "DECISION",\n    "key": "backend",\n    "value": "FastAPI",\n    "version": 2,\n    "status": "ACTIVE",\n    "confidence": 0.98,\n    "source": {\n      "text": "Migrating to Python FastAPI on AWS Lambda",\n      "conversation_id": "conv_8f0a21bc9e",\n      "message_id": "msg_01J8F93"\n    }\n  },\n  "history": [\n    {"version": 1, "value": "Express", "status": "REPLACED"},\n    {"version": 2, "value": "FastAPI", "status": "ACTIVE"}\n  ]\n}',
  },
  {
    method: "POST",
    path: "/memory",
    desc: "Manually forge a structured context block into the user's vault",
    body: '{\n  "type": "DECISION",\n  "key": "database",\n  "value": "Amazon DynamoDB Single-Table",\n  "confidence": 0.99\n}',
  },
  {
    method: "PATCH",
    path: "/memory/{memory_id}",
    desc: "Update a memory record's value or status, automatically updating revision",
    body: '{\n  "value": "Python 3.12 + FastAPI",\n  "confidence": 0.95\n}',
  },
  {
    method: "DELETE",
    path: "/memory/{memory_id}",
    desc: "Permanently forget a context block from the user's active vault",
  },
  {
    method: "GET",
    path: "/memory/timeline",
    desc: "Chronological audit stream of all context creation, update, and conflict events",
  },
  {
    method: "GET",
    path: "/conversations",
    desc: "List user conversation sessions with timestamp metadata",
  },
  {
    method: "GET",
    path: "/conversations/{id}",
    desc: "Fetch full message transcript for provenance verification",
  },
  {
    method: "GET",
    path: "/health",
    desc: "Health check verifying DynamoDB and AWS Bedrock service availability",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="border border-zinc-800 bg-black p-1.5 text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function ApiDocsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 font-mono text-zinc-300 max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
            <span className="h-2 w-2 bg-emerald-400 animate-pulse" />
            <span>INTEROPERABILITY MATRIX</span>
            <span className="text-zinc-700">//</span>
            <span>REST & MCP SPECS</span>
          </div>
          <h1 className="font-pixel text-2xl sm:text-3xl font-bold tracking-wide text-white">
            <PixelC size="inner" />ONTEXT PROTO<PixelC size="inner" />OL API REFEREN<PixelC size="inner" />E
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-sans">
            Client-agnostic REST endpoints. Any LLM, CLI tool, or web agent can authenticate and consume the Lelantos context layer.
          </p>
        </div>

        {/* Endpoints List */}
        <div className="space-y-4">
          {ENDPOINTS.map((ep) => (
            <details
              key={`${ep.method}-${ep.path}`}
              className="group border border-zinc-800 bg-[#09090b] transition-all open:border-zinc-600"
            >
              <summary className="flex cursor-pointer items-center gap-4 p-4 hover:bg-zinc-900/60 transition-colors list-none">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold ${
                    ep.method === "GET"
                      ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : ep.method === "POST"
                      ? "border border-white bg-white text-black"
                      : ep.method === "PATCH"
                      ? "border border-amber-500/40 bg-amber-500/10 text-amber-400"
                      : "border border-red-500/40 bg-red-500/10 text-red-400"
                  }`}
                >
                  {ep.method}
                </span>
                <code className="text-xs font-bold text-white tracking-wide">{ep.path}</code>
                <span className="ml-auto text-[11px] text-zinc-500 font-sans hidden sm:inline-block truncate max-w-md">
                  {ep.desc}
                </span>
              </summary>

              <div className="border-t border-zinc-800/80 p-5 bg-black space-y-4 text-xs">
                <p className="text-zinc-400 font-sans sm:hidden">{ep.desc}</p>

                {ep.body && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-[10px] text-zinc-500 uppercase">
                      <span>REQUEST PAYLOAD</span>
                      <CopyButton text={ep.body} />
                    </div>
                    <pre className="overflow-x-auto border border-zinc-800 bg-zinc-950 p-3 text-[11px] text-zinc-300 font-mono">
                      {ep.body}
                    </pre>
                  </div>
                )}

                {ep.response && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-[10px] text-zinc-500 uppercase">
                      <span>RESPONSE CONTRACT</span>
                      <CopyButton text={ep.response} />
                    </div>
                    <pre className="overflow-x-auto border border-zinc-800 bg-zinc-950 p-3 text-[11px] text-emerald-400/90 font-mono">
                      {ep.response}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>

        {/* MCP Architecture Blueprint Section */}
        <div className="border border-zinc-800 bg-[#09090b] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Cpu className="h-4 w-4 text-zinc-300" />
            <span>MODEL CONTEXT PROTOCOL (MCP) INTERFACE</span>
          </div>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Lelantos tools can be exposed directly to Claude Desktop, Cursor, and custom agentic frameworks through an MCP server bridge.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
            {[
              "get_user_context",
              "search_memory",
              "get_memory_provenance",
              "create_memory",
              "update_memory",
              "delete_memory",
            ].map((tool) => (
              <div
                key={tool}
                className="border border-zinc-800 bg-black p-3 text-xs text-zinc-300 flex items-center justify-between"
              >
                <span>{tool}()</span>
                <span className="text-[10px] text-zinc-600">TOOL</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
