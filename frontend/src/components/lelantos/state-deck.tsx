import React from "react";
import type { SupervisorLog } from "./lelantos-data";

interface StateDeckProps {
  memoryItems: string[];
  supervisorLogs: SupervisorLog[];
  rawSupervisorThoughts: string;
}

export function StateDeck({
  memoryItems,
  supervisorLogs,
  rawSupervisorThoughts,
}: StateDeckProps) {
  return (
    <section className="h-full overflow-hidden flex flex-col p-6 gap-4 border-l border-zinc-900 bg-zinc-950">
      {/* Card Alpha: AWS DynamoDB Live Sync Matrix */}
      <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-sm">
        <div className="h-11 shrink-0 px-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/70">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-xs font-semibold tracking-wide text-zinc-200 uppercase">
              AWS DynamoDB Live Sync Matrix
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
            {memoryItems.length} active constraints
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin flex flex-col gap-2">
          {memoryItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 select-none">
              <div className="h-8 w-8 rounded-md bg-zinc-800/50 border border-zinc-700/40 flex items-center justify-center mb-2.5">
                <span className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse" />
              </div>
              <p className="font-mono text-xs font-medium uppercase tracking-wider text-zinc-400">
                CACHE EMPTY • Awaiting State Extraction
              </p>
              <p className="font-mono text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                When you declare rules or constraints in the chat, the Supervisor AI will extract and sync the memory keys here.
              </p>
            </div>
          ) : (
            memoryItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-md border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-xs font-mono text-emerald-200"
              >
                <span className="text-emerald-400 font-bold select-none pt-0.5">✓</span>
                <span className="min-w-0 break-words leading-relaxed">{item}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Card Beta: Supervisor Log Engine */}
      <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-sm">
        <div className="h-11 shrink-0 px-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/70">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            <span className="font-mono text-xs font-semibold tracking-wide text-zinc-200 uppercase">
              Supervisor Log Engine
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
            realtime stream
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-zinc-400 scrollbar-thin flex flex-col gap-2 bg-zinc-950/40">
          {supervisorLogs.map((log) => (
            <div key={log.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 border-b border-zinc-900/80 pb-1.5">
              <span className="text-zinc-600 text-[11px]">{log.timestamp}</span>
              <span className={`min-w-0 break-words ${log.entry.includes("[GUARDRAIL") ? "text-emerald-400 font-semibold" : log.entry.includes("[SYSTEM") || log.entry.includes("[CLOUD") ? "text-zinc-400" : "text-cyan-300/90"}`}>
                {log.entry}
              </span>
            </div>
          ))}

          {rawSupervisorThoughts && (
            <div className="mt-2 pt-2 border-t border-cyan-500/20">
              <div className="text-[10px] uppercase tracking-wider text-cyan-500 font-semibold mb-1">
                Supervisor Thoughts Extract:
              </div>
              <pre className="text-[11px] text-cyan-200/80 whitespace-pre-wrap font-mono bg-cyan-950/20 p-2 rounded border border-cyan-500/20">
                {rawSupervisorThoughts}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}