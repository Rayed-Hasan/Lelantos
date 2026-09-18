import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { SendHorizontal, Brain, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { useAuth } from "@/lib/auth-context";
import { sendChatMessage } from "@/lib/api";
import type { ChatResponse } from "@/lib/types";
import { MEMORY_TYPE_COLORS } from "@/lib/types";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — Lelantos" },
      { name: "description", content: "Chat with AI using your portable context." },
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

function ChatPage() {
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
  }, [messages]);

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
          content: `Error: ${err.message || "Failed to get response"}`,
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
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/60 px-6">
          <div>
            <h1 className="text-sm font-semibold text-zinc-200">Context Chat</h1>
            <p className="font-mono text-[10px] text-zinc-600">
              Memories are extracted in real-time
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 font-mono text-[11px] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Llama 3.1 70B
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Brain className="mb-4 h-10 w-10 text-zinc-700" />
              <h2 className="text-lg font-semibold text-zinc-300">Start a conversation</h2>
              <p className="mt-2 max-w-md text-sm text-zinc-600">
                Tell me about your project, preferences, or constraints.
                Lelantos will automatically extract and remember important context.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  "I'm building a SaaS called Lelantos. Backend is Python, budget is ₹5000/month.",
                  "My name is Rayed and I prefer React for frontend.",
                  "What architecture should I use for my project?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="rounded-lg border border-zinc-800/60 bg-zinc-900/20 px-3 py-2 text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition-all text-left max-w-xs"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={`rounded-xl px-5 py-4 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "ml-auto max-w-lg border border-indigo-500/20 bg-indigo-500/5 text-zinc-200"
                    : msg.role === "system"
                    ? "max-w-lg border border-red-500/20 bg-red-500/5 text-red-300"
                    : "max-w-2xl border border-zinc-800/60 bg-zinc-900/20 text-zinc-300"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                    {msg.role === "user" ? "You" : msg.role === "assistant" ? "Lelantos" : "System"}
                  </span>
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>

              {/* Memory extraction indicators */}
              {msg.memoriesExtracted && msg.memoriesExtracted.length > 0 && (
                <div className="mt-2 max-w-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
                    <Sparkles className="h-3 w-3" />
                    {msg.memoriesExtracted.length} memor{msg.memoriesExtracted.length === 1 ? "y" : "ies"} extracted
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.memoriesExtracted.map((mem, i) => (
                      <span
                        key={i}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${MEMORY_TYPE_COLORS[mem.type as keyof typeof MEMORY_TYPE_COLORS] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/30"}`}
                      >
                        {mem.key}: {mem.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conflict indicators */}
              {msg.conflictsDetected && msg.conflictsDetected.length > 0 && (
                <div className="mt-2 max-w-2xl space-y-1.5">
                  {msg.conflictsDetected.map((conflict, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <div className="text-xs text-amber-300">
                        <span className="font-semibold">Conflict detected:</span>{" "}
                        {conflict.candidate.key} changed from{" "}
                        <span className="line-through text-zinc-500">{conflict.previous_value}</span>{" "}
                        → <span className="font-semibold">{conflict.candidate.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 px-2 text-xs text-indigo-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking with context...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-zinc-800/60 bg-zinc-950/50 p-4">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Tell Lelantos about your project, preferences, or ask a question..."
              className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-indigo-500/50 transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 disabled:opacity-40"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
