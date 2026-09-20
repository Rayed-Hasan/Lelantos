import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Cpu } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ChatPanel } from "./chat-panel";
import { StateDeck } from "./state-deck";
import type { ChatMessage, SupervisorLog } from "./lelantos-data";
import { useAuth } from "@/lib/auth-context";
export function ProjectLelantosShell() {
  const { user, getAccessToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [guardrailEnabled, setGuardrailEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [memoryItems, setMemoryItems] = useState<string[]>([]);
  const [supervisorLogs, setSupervisorLogs] = useState<SupervisorLog[]>([
    {
      id: "init-01",
      timestamp: "00:01",
      entry: "[SYSTEM 00:01] Lelantos core microservice architecture initialized successfully.",
    },
    {
      id: "init-02",
      timestamp: "00:02",
      entry: "[CLOUD 00:02] Connected to AWS DynamoDB container 'AgentMemoryCache' in us-east-1.",
    },
    {
      id: "init-03",
      timestamp: "00:03",
      entry: "[GUARDRAIL 00:03] Multi-agent supervisor loop armed. Model target: Meta Llama 3.1 70B.",
    },
  ]);
  const [rawSupervisorThoughts, setRawSupervisorThoughts] = useState<string>("");
  const userId = user?.user_id;

  // Fetch initial memory on mount from live DynamoDB endpoint proxy
  useEffect(() => {
    const fetchInitialMemory = async () => {
      try {
        const res = await fetch(`/api/memory/${userId}`);
        if (res.ok) {
          const data = await res.json();
          let facts: string[] = [];
          if (data.memory_constraints && Array.isArray(data.memory_constraints)) {
            facts = data.memory_constraints;
          } else if (data.core_facts) {
            facts = Array.isArray(data.core_facts)
              ? data.core_facts
              : String(data.core_facts)
                  .split("\n")
                  .map((l) => l.trim().replace(/^[-*•]\s*/, ""))
                  .filter(Boolean);
          }
          if (facts.length > 0) {
            setMemoryItems(facts);
            const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            setSupervisorLogs((prev) => [
              ...prev,
              {
                id: `log-${Date.now()}`,
                timestamp: now,
                entry: `[CACHE] Synchronized ${facts.length} active persistent constraints from AWS DynamoDB`,
              },
            ]);
          }
        }
      } catch (err) {
        console.warn("Could not load initial DynamoDB cache:", err);
      }
    };
    fetchInitialMemory();
  }, [userId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isLoading) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      source: "user",
      text: cleanText,
      timestamp: userTimestamp,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText("");
    setIsLoading(true);

    const logTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setSupervisorLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-req`,
        timestamp: logTimestamp,
        entry: `[INFERENCE] Evaluating turn (Guardrail: ${guardrailEnabled ? "ARMED" : "BYPASSED"}) via Bedrock Meta Llama 3.1 70B`,
      },
    ]);

    try {
      const payload = {
        user_id: userId,
        message: cleanText,
        chat_history: messages.map((m) => ({
          role: m.source === "user" ? "user" : "assistant",
          content: [{ text: m.text }],
        })),
        guardrail_enabled: guardrailEnabled,
      };

      const token = await getAccessToken();
      console.log(
        "Cognito token format:",
        token ? `${token.split(".").length} parts, ${token.length} chars` : "NO TOKEN"
      );
if (!token) {
  throw new Error("You are not authenticated.");
}

const response = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const rawData = await response.json();
      const bodyData = rawData.body || rawData;

      const replyText =
        bodyData.worker_reply ||
        bodyData.response ||
        (typeof bodyData === "string" ? bodyData : "State transaction acknowledged.");

      const workerTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const workerMsg: ChatMessage = {
        id: `msg-${Date.now()}-worker`,
        source: "worker",
        text: replyText,
        timestamp: workerTimestamp,
      };

      setMessages([...newHistory, workerMsg]);

      // Update DynamoDB memory state
      const updatedConstraints = bodyData.current_memory_state || bodyData.memory_constraints || [];
      if (Array.isArray(updatedConstraints)) {
        setMemoryItems(updatedConstraints);
      }

      // Update supervisor thoughts
      if (bodyData.supervisor_thoughts) {
        setRawSupervisorThoughts(String(bodyData.supervisor_thoughts));
      }

      const newExtracted = bodyData.new_constraints_extracted;
      const completeTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      
      let logDetail = "[PIPELINE] Execution cycle finalized successfully";
      if (Array.isArray(newExtracted) && newExtracted.length > 0) {
        logDetail = `[SYNC] Pushed ${newExtracted.length} updated constraint(s) to DynamoDB in us-east-1`;
      }

      setSupervisorLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-done`,
          timestamp: completeTimestamp,
          entry: logDetail,
        },
      ]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          source: "system",
          text: `[Error: Backend request failed. Verify FastAPI server at :8000. ${err.message}]`,
          timestamp: errTimestamp,
        },
      ]);
      setSupervisorLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-err`,
          timestamp: errTimestamp,
          entry: `[ERROR] Pipeline exception: ${err.message || "Endpoint unreachable"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-zinc-950 flex flex-col font-sans select-none text-zinc-100">
      {/* 1. Navbar */}
      <header className="h-14 shrink-0 bg-zinc-950 border-b border-zinc-900 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-wide text-zinc-100">Project Lelantos</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                v1.0 Serverless
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">LLM Memory Guardrail Matrix • us-east-1</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-md border border-zinc-800">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Meta Llama 3.1 70B</span>
          </div>

          <div className="flex items-center gap-2.5 bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800">
            {guardrailEnabled ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span className="text-xs font-medium text-zinc-300">Memory Guardrail</span>
            <Switch
              checked={guardrailEnabled}
              onCheckedChange={setGuardrailEnabled}
              aria-label="Toggle Memory Guardrail"
            />
          </div>
        </div>
      </header>

      {/* 2. Rigid 50/50 Split */}
      <main className="flex-1 grid grid-cols-2 overflow-hidden border-t border-zinc-900">
        <ChatPanel
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
        <StateDeck
          memoryItems={memoryItems}
          supervisorLogs={supervisorLogs}
          rawSupervisorThoughts={rawSupervisorThoughts}
        />
      </main>
    </div>
  );
}