import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  SendHorizontal,
  Shield,
  AlertTriangle,
  Loader2,
  Sparkles,
  Cpu,
  Layers,
  Terminal,
  Database,
  Eye,
} from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { LelantosLogo } from "@/components/lelantos/logo";
import { PixelC } from "@/components/lelantos/pixel-c";
import { useAuth } from "@/lib/auth-context";
import { sendChatMessage } from "@/lib/api";
import type { ChatResponse } from "@/lib/types";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — Lelantos Guardian Console" },
      { name: "description", content: "Chat with AI using your portable, persistent context." },
    ],
  }),
  component: ChatPage,
});

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  memoriesExtracted?: ChatResponse["memories_extracted"];
  conflictsDetected?: ChatResponse["conflicts_detected"];
  memoriesUsed?: ChatResponse["memories_used"];
}

export function ChatPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage(text, conversationId);
      setConversationId(response.conversation_id);

      const assistantMsg: ChatMessage = {
        id: response.message_id || `msg-${Date.now()}-a`,
        role: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        memoriesExtracted: response.memories_extracted,
        conflictsDetected: response.conflicts_detected,
        memoriesUsed: response.memories_used,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "system",
          content: `Pipeline Error: ${err.message || "Failed to communicate with context engine"}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="flex h-full flex-col bg-black font-mono text-zinc-300">
        {/* Command Console Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/80 px-6 bg-[#09090b]">
          <div className="flex items-center gap-3">
            <LelantosLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-sm font-bold text-white">GUARDIAN <PixelC size="inner" />ONVERSATION</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase">
                Real-Time Memory Extraction & Dynamic Context Injection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border border-zinc-800 bg-black px-3 py-1.5 text-[11px] text-zinc-400">
            <Cpu className="h-3.5 w-3.5 text-zinc-300" />
            <span>AWS BEDROCK: META LLAMA 3.1 70B</span>
          </div>
        </div>

        {/* Message Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-xl mx-auto">
              <div className="relative mb-4 flex h-14 w-14 items-center justify-center border border-zinc-700 bg-zinc-900 shadow-2xl">
                <Shield className="h-7 w-7 text-white" />
                <div className="absolute -top-1 -left-1 h-2 w-2 bg-white" />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-white" />
                <div className="absolute -bottom-1 -left-1 h-2 w-2 bg-white" />
                <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-white" />
              </div>

              <h2 className="font-pixel text-xl sm:text-2xl font-bold text-white mb-2">
                <PixelC size="inner" />ONTEXT ENGINE READY
              </h2>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-8">
                Speak naturally. State your technical goals, preferred frameworks, and project constraints.
                Lelantos will forge them into persistent context records.
              </p>

              <div className="w-full space-y-2 text-left">
                <div className="text-[10px] uppercase text-zinc-500 tracking-wider mb-1 text-center">
                  [ SAMPLE STATEMENTS TO INITIALIZE CONTEXT ]
                </div>
                {[
                  "I am building Lelantos. Backend is Python FastAPI, and monthly budget is ₹5000.",
                  "My name is Rayed and I prefer TypeScript and clean architecture.",
                  "What architecture should we use for our context engine?",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => setInput(promptText)}
                    className="w-full border border-zinc-800/90 bg-[#09090b] p-3 text-xs text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900 hover:text-white transition-all text-left flex items-center justify-between"
                  >
                    <span className="truncate">{promptText}</span>
                    <span className="text-zinc-600 text-[10px] shrink-0 ml-2">↵ SEND</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              {/* Main Message Bubble */}
              <div
                className={`relative border p-5 ${
                  msg.role === "user"
                    ? "ml-auto max-w-2xl border-zinc-700 bg-[#0f0f12] text-zinc-100"
                    : msg.role === "system"
                    ? "max-w-2xl border-red-500/40 bg-red-950/20 text-red-300"
                    : "max-w-3xl border-zinc-800 bg-[#09090b] text-zinc-200"
                }`}
              >
                {/* Header Tag */}
                <div className="mb-2 flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800/60 pb-1.5">
                  <span className="font-bold tracking-wider text-zinc-400 uppercase">
                    {msg.role === "user"
                      ? "► USER INPUT"
                      : msg.role === "assistant"
                      ? "◄ LELANTOS GUARDIAN"
                      : "▲ SYSTEM ALERT"}
                  </span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>

                {/* Content */}
                <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-200">
                  {msg.content}
                </div>
              </div>

              {/* Injected Context Indicator (What Lelantos injected to assist the model) */}
              {msg.memoriesUsed && msg.memoriesUsed.length > 0 && (
                <div className="max-w-3xl border border-zinc-800/60 bg-black/80 p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase font-bold">
                    <Database className="h-3 w-3 text-zinc-400" />
                    <span>CONTEXT INJECTED INTO BEDROCK PROMPT ({msg.memoriesUsed.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.memoriesUsed.map((mem, i) => (
                      <span
                        key={i}
                        className="border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-300"
                      >
                        <strong className="text-zinc-500">{mem.type}:</strong> {mem.key} = {mem.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-Time Memory Extraction Tray */}
              {msg.memoriesExtracted && msg.memoriesExtracted.length > 0 && (
                <div className="max-w-3xl border border-emerald-500/30 bg-[#07130c] p-3 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-[10px] uppercase font-bold">
                    <Sparkles className="h-3 w-3" />
                    <span>
                      {msg.memoriesExtracted.length} NEW CONTEXT RECORD
                      {msg.memoriesExtracted.length === 1 ? "" : "S"} EXTRACTED & SAVED TO VAULT
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.memoriesExtracted.map((mem, i) => (
                      <div
                        key={i}
                        className="border border-emerald-500/40 bg-black px-2.5 py-1 text-[11px] text-emerald-300 flex items-center gap-2"
                      >
                        <span className="font-pixel text-[9px] uppercase text-white bg-zinc-800 px-1">
                          {mem.type}
                        </span>
                        <span>
                          {mem.key}: <strong className="text-white">{mem.value}</strong>
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          ({(mem.confidence * 100).toFixed(0)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflict Detection Banner */}
              {msg.conflictsDetected && msg.conflictsDetected.length > 0 && (
                <div className="max-w-3xl border border-amber-500/40 bg-[#161005] p-3 text-xs space-y-2">
                  {msg.conflictsDetected.map((conflict, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-[10px] uppercase">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>CONTEXT CONFLICT RESOLVED BY GUARDIAN</span>
                      </div>
                      <div className="text-xs text-zinc-300 font-sans">
                        Key <span className="font-mono text-amber-300">{conflict.candidate.key}</span> changed:
                        {" "}
                        <span className="line-through text-zinc-500">{conflict.previous_value}</span>
                        {" "}→{" "}
                        <span className="text-emerald-400 font-bold">{conflict.candidate.value}</span>.
                        Old record archived as REPLACED; new record promoted to ACTIVE.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 border border-zinc-800 bg-[#09090b] px-4 py-3 text-xs text-zinc-400 max-w-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              <span>Querying Bedrock & parsing context layers...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="shrink-0 border-t border-zinc-800/80 bg-[#09090b] p-4">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="relative flex-1">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Instruct the guardian or converse with your context..."
                className="w-full border border-zinc-800 bg-black px-4 py-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex h-11 items-center gap-2 border border-white bg-white px-5 text-xs font-bold text-black transition-all hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>SEND</span>
              <SendHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mx-auto max-w-4xl mt-2 flex items-center justify-between text-[10px] text-zinc-600">
            <span>PRESS [ENTER ↵] TO DISPATCH</span>
            <span>END-TO-END VERIFIABLE MEMORY LOG</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
