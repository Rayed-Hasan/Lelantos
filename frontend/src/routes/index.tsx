import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Lelantos | Live State Shell" },
      {
        name: "description",
        content:
          "A strict split-screen enterprise SaaS shell with chat, live sync state, and supervisor logs.",
      },
      { property: "og:title", content: "Project Lelantos | Live State Shell" },
      {
        property: "og:description",
        content:
          "A strict split-screen enterprise SaaS shell with chat, live sync state, and supervisor logs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const constraints = [
  "Set strict development budget limits",
  "Define immutable tech stack profiles",
  "Require bug-free production handoff",
  "Keep decisions auditable and reversible",
];

const syncSlots = [
  ["slot:01", "DynamoDB / primary state"],
  ["slot:02", "DynamoDB / constraint index"],
  ["slot:03", "DynamoDB / audit stream"],
  ["slot:04", "DynamoDB / session memory"],
  ["slot:05", "DynamoDB / policy cache"],
  ["slot:06", "DynamoDB / recovery point"],
];

const startupLogs = [
  ["01:00:41", "info", "memory engine initialized"],
  ["01:00:41", "info", "local gateway handshake accepted"],
  ["01:00:42", "sync", "AWS sync matrix awaiting binding"],
];

function Index() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [activeConstraint, setActiveConstraint] = useState<string | null>(null);

  const visibleLogs = useMemo(
    () =>
      messages.length
        ? [...startupLogs, ["now", "input", messages[messages.length - 1]]]
        : startupLogs,
    [messages],
  );

  const transmit = () => {
    const value = draft.trim();
    if (!value) return;
    setMessages((current) => [...current, value]);
    setDraft("");
  };

  return (
    <main className="min-h-screen bg-[#08090b] text-zinc-300 selection:bg-zinc-700/60 selection:text-white">
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-5 px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-950 font-mono text-[10px] font-bold text-zinc-200 shadow-[0_0_24px_rgba(255,255,255,0.04)]">L/1</div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold tracking-[0.18em] text-zinc-100">LELANTOS</div>
              <div className="font-mono text-[10px] text-zinc-600">STATE CONSTRAINT WORKSPACE</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 font-mono text-[11px] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> llama 3.1 70B
            </div>
            <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 font-mono text-[11px] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Memory Guardrail
            </div>
          </div>
          <div className="font-mono text-[10px] tracking-[0.16em] text-zinc-600">SYS / ONLINE</div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1600px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.86fr)]">
        <section className="relative flex min-h-[650px] flex-col border-b border-zinc-800/80 lg:border-b-0 lg:border-r" aria-label="Client Interface Layer">
          <div className="flex items-center justify-between border-b border-zinc-900 px-5 py-4 lg:px-8">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-zinc-600">01 / CLIENT INTERFACE LAYER</p>
              <h1 className="mt-1 text-sm font-medium text-zinc-300">Constraint transmission console</h1>
            </div>
            <span className="rounded border border-zinc-900 bg-zinc-950 px-2 py-1 font-mono text-[10px] text-zinc-600">IDLE</span>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 py-12 lg:px-14">
            <div className="w-full max-w-[650px]">
              <div className="mb-8 border-l border-zinc-700 pl-5">
                <div className="mb-3 flex items-center gap-2 font-mono text-[10px] text-zinc-600"><span className="text-emerald-500">$</span> boot --safe-mode</div>
                <h2 className="text-xl font-medium tracking-tight text-white">Lelantos Memory Engine v1.0</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">Ready to extract durable constraints from your next state transmission.</p>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-600">SUGGESTED CORE CONSTRAINTS</span>
                <span className="font-mono text-[10px] text-zinc-700">{constraints.length.toString().padStart(2, "0")} AVAILABLE</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {constraints.map((constraint, index) => (
                  <button
                    key={constraint}
                    type="button"
                    onClick={() => { setActiveConstraint(constraint); setDraft(constraint); }}
                    className={`group rounded-lg border bg-zinc-900/10 p-3 text-left transition-all hover:border-zinc-800 hover:text-zinc-300 ${activeConstraint === constraint ? "border-zinc-700 text-zinc-300" : "border-zinc-900 text-zinc-500"}`}
                  >
                    <div className="mb-5 flex items-center justify-between font-mono text-[10px] text-zinc-700"><span>0{index + 1}</span><span className="opacity-0 transition-opacity group-hover:opacity-100">↗</span></div>
                    <span className="text-xs leading-5">{constraint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-900 p-5 lg:px-8">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/70 p-1.5 transition-all focus-within:border-zinc-700 focus-within:shadow-[0_0_0_3px_rgba(63,63,70,0.12)]">
              <span className="pl-3 font-mono text-xs text-emerald-500/70">›</span>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") transmit(); }}
                placeholder="Transmit state constraint (e.g., 'Budget is a 0 INR and code must be bug-free')..."
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-700"
                aria-label="Transmit state constraint"
              />
              <button type="button" onClick={transmit} aria-label="Transmit constraint" className="rounded bg-zinc-900 px-3 py-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100">→</button>
            </div>
            <div className="mt-2 flex justify-between px-1 font-mono text-[9px] text-zinc-700"><span>LOCAL / FASTAPI PROXY GATEWAY</span><span>ENTER TO TRANSMIT</span></div>
          </div>
        </section>

        <aside className="flex min-h-[650px] flex-col bg-[#0a0b0d]" aria-label="Stack Deck Live AWS Data Core">
          <div className="flex items-center justify-between border-b border-zinc-900 px-5 py-4 lg:px-7">
            <div><p className="font-mono text-[10px] tracking-[0.22em] text-zinc-600">02 / STACK DECK</p><h2 className="mt-1 text-sm font-medium text-zinc-300">Live AWS Data Core</h2></div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-600"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> SYNC PENDING</div>
          </div>
          <div className="flex-1 space-y-5 p-5 lg:p-7">
            <section>
              <div className="mb-3 flex items-end justify-between"><div><p className="font-mono text-[10px] text-zinc-600">CARD ALPHA / 01</p><h3 className="mt-1 text-xs font-medium text-zinc-400">AWS DynamoDB Sync Matrix</h3></div><span className="font-mono text-[10px] text-zinc-700">0 / 06 BOUND</span></div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {syncSlots.map(([slot, label]) => <div key={slot} className="flex min-h-[90px] flex-col justify-between rounded-lg border border-dashed border-zinc-800/60 bg-zinc-900/10 p-4"><span className="font-mono text-[10px] text-zinc-600">{slot}</span><span className="text-center font-mono text-[9px] text-zinc-700">+Awaiting memory binding...</span><span className="truncate font-mono text-[9px] text-zinc-800">{label}</span></div>)}
              </div>
            </section>
            <section>
              <div className="mb-3 flex items-end justify-between"><div><p className="font-mono text-[10px] text-zinc-600">CARD BETA / 02</p><h3 className="mt-1 text-xs font-medium text-zinc-400">Supervisor Log Engine</h3></div><span className="font-mono text-[10px] text-emerald-500/60">STREAMING</span></div>
              <div className="relative overflow-hidden rounded-lg border border-zinc-900 bg-black/40 p-4 font-mono text-[11px] shadow-inner">
                <div className="pointer-events-none absolute -left-5 top-8 h-20 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="relative flex flex-col gap-2">
                  <div className="mb-1 flex items-center gap-2 border-b border-zinc-900 pb-3 text-zinc-700"><span className="text-emerald-500/60">●</span> supervisor.telemetry <span className="ml-auto">tail -f</span></div>
                  {visibleLogs.map(([time, level, message], index) => <div key={`${time}-${index}`} className="grid grid-cols-[62px_42px_1fr] gap-2 leading-5"><span className="text-zinc-700">{time}</span><span className={level === "sync" ? "text-amber-500/70" : level === "input" ? "text-blue-400/70" : "text-zinc-600"}>{level}</span><span className="text-zinc-500">{message}</span></div>)}
                  <div className="mt-2 flex items-center gap-2 rounded border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-2 text-emerald-400/80 shadow-[0_0_28px_rgba(16,185,129,0.12)]"><span>✓</span><span>guardrail.armed</span><span className="ml-auto text-[10px] text-emerald-500/50">STRICT</span></div>
                </div>
              </div>
            </section>
          </div>
          <div className="border-t border-zinc-900 px-5 py-4 lg:px-7"><div className="flex items-center justify-between font-mono text-[9px] text-zinc-700"><span>ENCRYPTED LOCAL SESSION</span><span>v1.0.0 / 256-BIT</span></div></div>
        </aside>
      </div>
    </main>
  );
}
