import React from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "./lelantos-data";

interface ChatPanelProps {
  messages: ChatMessage[];
  inputText: string;
  setInputText: (val: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  isLoading: boolean;
}

export function ChatPanel({
  messages,
  inputText,
  setInputText,
  onSendMessage,
  isLoading,
}: ChatPanelProps) {
  return (
    <section className="flex flex-col h-full justify-between overflow-hidden relative bg-zinc-950">
      {/* Top Header */}
      <div className="h-11 shrink-0 px-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/60 backdrop-blur-sm">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
          Chat Space / Stream Terminal
        </span>
        <span className="text-xs font-mono text-zinc-500">
          {messages.length} messages
        </span>
      </div>

      {/* Chat Transcript Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-600 select-none">
            <p className="text-sm font-medium text-zinc-400">Memory Guardrail Stream Ready</p>
            <p className="text-xs text-zinc-600 mt-1 max-w-sm">
              Transmit messages or rules. Core facts are extracted and synced to AWS DynamoDB in real-time.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`grid grid-cols-[5rem_minmax(0,1fr)] gap-4 rounded-lg border px-4 py-3 text-sm leading-6 transition-colors ${
                msg.source === "user"
                  ? "border-indigo-500/30 bg-indigo-950/20 text-zinc-200"
                  : msg.source === "system"
                  ? "border-rose-500/30 bg-rose-950/20 text-rose-300"
                  : "border-zinc-800/80 bg-zinc-900/60 text-zinc-100"
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 pt-0.5">
                {msg.source === "user" ? "USER" : msg.source === "worker" ? "WORKER" : "SYSTEM"}
              </span>
              <div className="min-w-0 break-words whitespace-pre-wrap">
                {msg.text}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 p-2 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
            Evaluating constraints & inferencing Meta Llama 3.1 70B...
          </div>
        )}
      </div>

      {/* Bottom Text Input Box */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-900 shrink-0">
        <form onSubmit={onSendMessage} className="flex items-center gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Transmit state constraint (e.g., 'My budget is 0 rupees and I only use Python')..."
            className="h-10 bg-zinc-900/90 border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-indigo-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="lelantos"
            size="icon"
            disabled={isLoading || !inputText.trim()}
            className="h-10 w-10 shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-none disabled:opacity-40"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </section>
  );
}