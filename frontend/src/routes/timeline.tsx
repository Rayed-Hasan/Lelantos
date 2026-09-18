import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, ArrowRight, GitBranch, Plus, Trash2, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { useAuth } from "@/lib/auth-context";
import { getMemoryTimeline } from "@/lib/api";
import type { TimelineEvent } from "@/lib/types";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Lelantos" },
      { name: "description", content: "Chronological memory changes." },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
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
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  const getEventIcon = (type: string) => {
    switch (type) {
      case "memory_created": return <Plus className="h-3.5 w-3.5 text-emerald-400" />;
      case "memory_updated": return <RefreshCw className="h-3.5 w-3.5 text-blue-400" />;
      case "memory_conflict": return <GitBranch className="h-3.5 w-3.5 text-amber-400" />;
      case "memory_deleted": return <Trash2 className="h-3.5 w-3.5 text-red-400" />;
      default: return <Clock className="h-3.5 w-3.5 text-zinc-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "memory_created": return "border-emerald-500/20 bg-emerald-500/5";
      case "memory_updated": return "border-blue-500/20 bg-blue-500/5";
      case "memory_conflict": return "border-amber-500/20 bg-amber-500/5";
      case "memory_deleted": return "border-red-500/20 bg-red-500/5";
      default: return "border-zinc-800/60 bg-zinc-900/20";
    }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Timeline</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Chronological record of your context changes
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border border-zinc-800/40 bg-zinc-900/20" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="mx-auto max-w-2xl space-y-8">
            {Object.entries(grouped).map(([date, dateEvents]) => (
              <div key={date}>
                <h2 className="mb-3 font-mono text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  {date}
                </h2>
                <div className="space-y-2">
                  {dateEvents.map((event) => (
                    <div
                      key={event.event_id}
                      className={`rounded-lg border p-4 transition-colors hover:border-zinc-700/60 ${getEventColor(event.event_type)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getEventIcon(event.event_type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300">{event.description}</p>
                          {event.old_value && event.new_value && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="text-zinc-500 line-through">{event.old_value}</span>
                              <ArrowRight className="h-3 w-3 text-zinc-600" />
                              <span className="font-semibold text-indigo-400">{event.new_value}</span>
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-zinc-600">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800/60 bg-zinc-900/10 p-12 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-500">No timeline events yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              Memory changes will appear here chronologically
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
