import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessagesSquare, Clock, MessageSquare, Terminal, ChevronRight, Shield } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { PixelC } from "@/components/lelantos/pixel-c";
import { useAuth } from "@/lib/auth-context";
import { listConversations, getConversation } from "@/lib/api";
import type { Conversation, Message } from "@/lib/types";

export const Route = createFileRoute("/conversations")({
  head: () => ({
    meta: [
      { title: "Conversations Archive — Lelantos" },
      { name: "description", content: "Inspect historical conversations and raw transcripts for provenance." },
    ],
  }),
  component: ConversationsPage,
});

export function ConversationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      listConversations()
        .then((data) => {
          const list = data.conversations || [];
          setConversations(list);
          if (list.length > 0 && !selectedId) {
            handleSelectConversation(list[0].conversation_id);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  const handleSelectConversation = async (convId: string) => {
    setSelectedId(convId);
    setMessagesLoading(true);
    try {
      const data = await getConversation(convId);
      setMessages(data.messages || []);
    } catch (e) {
      console.error(e);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  const selectedConv = conversations.find((c) => c.conversation_id === selectedId);

  return (
    <AppLayout>
      <div className="flex h-full bg-black font-mono text-zinc-300">
        {/* Left Side: Conversation Archive Index */}
        <div className="w-80 shrink-0 border-r border-zinc-800/80 bg-[#09090b] flex flex-col">
          <div className="p-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>TRANSCRIPT ARCHIVE</span>
            </div>
            <h1 className="font-pixel text-lg font-bold text-white"><PixelC size="inner" />ONVERSATIONS</h1>
            <p className="mt-0.5 text-[11px] text-zinc-500 font-sans">
              Source transcripts backing memory extractions.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse border border-zinc-800/60 bg-black" />
                ))}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => {
                const isSelected = selectedId === conv.conversation_id;
                return (
                  <button
                    key={conv.conversation_id}
                    onClick={() => handleSelectConversation(conv.conversation_id)}
                    className={`w-full text-left p-3 border transition-all ${
                      isSelected
                        ? "border-white bg-black text-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.1)]"
                        : "border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/60 hover:text-zinc-200"
                    }`}
                  >
                    <div className="truncate text-xs font-sans text-zinc-200">
                      {conv.title || "Untitled Session"}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{new Date(conv.created_at).toLocaleDateString()}</span>
                      <span>{conv.model?.split(".").pop() || "Bedrock"}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-zinc-600">
                <MessagesSquare className="mx-auto mb-2 h-6 w-6 text-zinc-700" />
                <span>No conversation logs recorded yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Transcript Inspection View */}
        <div className="flex-1 flex flex-col bg-black">
          {selectedId ? (
            <>
              {/* Header */}
              <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-zinc-800/80 bg-[#09090b]">
                <div>
                  <div className="text-xs font-bold text-white font-sans truncate">
                    {selectedConv?.title || "Conversation Session"}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    ID: {selectedId}
                  </div>
                </div>
                <div className="border border-zinc-800 bg-black px-3 py-1 text-[10px] text-zinc-400">
                  {messages.length} MESSAGES LOGGED
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading transcript records...</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.message_id}
                      className={`border p-4 ${
                        msg.role === "user"
                          ? "ml-auto max-w-2xl border-zinc-700 bg-[#0c0c0e] text-zinc-100"
                          : "max-w-3xl border-zinc-800 bg-[#09090b] text-zinc-300"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800/60 pb-1">
                        <span className="font-bold uppercase tracking-wider text-zinc-400">
                          {msg.role === "user" ? "► USER" : "◄ ASSISTANT"}
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-200">
                        {msg.content}
                      </div>
                      <div className="mt-2 text-[9px] text-zinc-600 font-mono">
                        MSG_ID: {msg.message_id}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-xs text-zinc-600">
                    No message entries found in this transcript.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center p-8">
              <div>
                <Shield className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
                <div className="text-sm font-bold text-white mb-1">SELECT A CONVERSATION</div>
                <p className="text-xs text-zinc-500 max-w-xs font-sans">
                  Choose a session from the archive to inspect message logs and memory provenance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
