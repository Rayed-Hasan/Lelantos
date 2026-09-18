import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessagesSquare, Clock } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { useAuth } from "@/lib/auth-context";
import { listConversations, getConversation } from "@/lib/api";
import type { Conversation, Message } from "@/lib/types";

export const Route = createFileRoute("/conversations")({
  head: () => ({
    meta: [
      { title: "Conversations — Lelantos" },
      { name: "description", content: "View stored conversations and source messages." },
    ],
  }),
  component: ConversationsPage,
});

function ConversationsPage() {
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
        .then((data) => setConversations(data.conversations || []))
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

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Conversation List */}
        <div className="w-80 shrink-0 border-r border-zinc-800/60 flex flex-col">
          <div className="p-4 border-b border-zinc-800/60">
            <h1 className="text-lg font-bold text-white">Conversations</h1>
            <p className="mt-0.5 text-xs text-zinc-600">Source messages for memory provenance</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg border border-zinc-800/40 bg-zinc-900/20" />
                ))}
              </div>
            ) : conversations.length > 0 ? (
              <div className="space-y-1 p-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => handleSelectConversation(conv.conversation_id)}
                    className={`w-full rounded-lg px-3 py-3 text-left transition-all ${
                      selectedId === conv.conversation_id
                        ? "bg-indigo-500/10 border border-indigo-500/20"
                        : "hover:bg-zinc-900/50 border border-transparent"
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-zinc-300">
                      {conv.title || "Untitled"}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-zinc-600">
                      {new Date(conv.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <MessagesSquare className="mx-auto mb-2 h-6 w-6 text-zinc-700" />
                <p className="text-xs text-zinc-600">No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {selectedId ? (
            <>
              <div className="h-14 shrink-0 flex items-center px-6 border-b border-zinc-800/60">
                <h2 className="text-sm font-semibold text-zinc-300">
                  {conversations.find((c) => c.conversation_id === selectedId)?.title || "Conversation"}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messagesLoading ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="h-3 w-3 animate-spin" /> Loading messages...
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.message_id}
                      className={`rounded-lg px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "ml-auto max-w-md border border-indigo-500/20 bg-indigo-500/5 text-zinc-200"
                          : "max-w-lg border border-zinc-800/60 bg-zinc-900/20 text-zinc-300"
                      }`}
                    >
                      <span className="mb-1 block font-mono text-[10px] text-zinc-600 uppercase">
                        {msg.role}
                      </span>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <span className="mt-1.5 block font-mono text-[9px] text-zinc-700">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-600">No messages in this conversation</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessagesSquare className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">Select a conversation</p>
                <p className="mt-1 text-xs text-zinc-600">
                  View source messages for memory provenance
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
