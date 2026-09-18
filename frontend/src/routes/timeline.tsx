import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, ArrowRight, GitBranch, Plus, Trash2, RefreshCw, Shield } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { PixelC } from "@/components/lelantos/pixel-c";
import { useAuth } from "@/lib/auth-context";
import { getMemoryTimeline } from "@/lib/api";
import type { TimelineEvent } from "@/lib/types";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Context Timeline — Lelantos" },
      { name: "description", content: "Chronological audit trail of memory and context evolution." },
    ],
  }),
  component: TimelinePage,
});

export function TimelinePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      getMemoryTimeline()
        .then((data) => setEvents(data.events || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  // Group events by date
  const grouped = events.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
    const date = new Date(event.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  const getEventBadge = (type: string) => {
    switch (type) {
      case "memory_created":
        return <span className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[9px] font-bold">CREATED</span>;
      case "memory_updated":
        return <span className="border border-blue-500/40 bg-blue-500/10 text-blue-400 px-2 py-0.5 text-[9px] font-bold">MODIFIED</span>;
      case "memory_conflict":
        return <span className="border border-amber-500/40 bg-amber-500/10 text-amber-400 px-2 py-0.5 text-[9px] font-bold">CONFLICT</span>;
      case "memory_deleted":
        return <span className="border border-red-500/40 bg-red-500/10 text-red-400 px-2 py-0.5 text-[9px] font-bold">FORGOTTEN</span>;
      default:
        return <span className="border border-zinc-700 bg-zinc-900 text-zinc-400 px-2 py-0.5 text-[9px] font-bold">EVENT</span>;
    }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 font-mono text-zinc-300 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
            <span className="h-2 w-2 bg-emerald-400 animate-pulse" />
            <span>IMMUTABLE EVENT STREAM</span>
            <span className="text-zinc-700">//</span>
            <span>{events.length} TOTAL AUDIT NODES</span>
          </div>
          <h1 className="font-pixel text-2xl sm:text-3xl font-bold tracking-wide text-white">
            <PixelC size="inner" />ONTEXT <PixelC size="inner" />HRONOLOGY TIMELINE
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-sans">
            A chronological record of every statement extracted, conflict resolved, and memory updated by Lelantos.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse border border-zinc-800 bg-[#09090b]" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-10">
            {Object.entries(grouped).map(([date, dateEvents]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-black px-3 py-1 border border-zinc-800">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>

                <div className="relative border-l-2 border-zinc-800 ml-4 pl-6 space-y-4">
                  {dateEvents.map((event) => (
                    <div
                      key={event.event_id}
                      className="group relative border border-zinc-800 bg-[#09090b] p-4 transition-all hover:border-zinc-600 hover:bg-black"
                    >
                      {/* Node point */}
                      <div className="absolute -left-[31px] top-4 h-3 w-3 border-2 border-zinc-500 bg-black group-hover:border-white transition-colors" />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getEventBadge(event.event_type)}
                          <span className="text-xs font-bold text-white font-sans">{event.description}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>

                      {event.old_value && event.new_value && (
                        <div className="mt-3 border-t border-zinc-800/80 pt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-zinc-500 line-through font-sans">{event.old_value}</span>
                          <ArrowRight className="h-3 w-3 text-zinc-600" />
                          <span className="font-bold text-emerald-400 font-sans">{event.new_value}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-800 bg-[#09090b] p-16 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
            <div className="text-sm font-bold text-white mb-1">TIMELINE STREAM EMPTY</div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto font-sans">
              As you converse and build context, events will automatically register in this immutable log.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
