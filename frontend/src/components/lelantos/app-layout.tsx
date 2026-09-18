/**
 * App Layout — Authenticated layout with sidebar navigation.
 * Master Plan section 26, 30.
 */

import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquare,
  Brain,
  Clock,
  MessagesSquare,
  Code2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { LelantosLogo } from "./logo";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/memory", label: "Memory", icon: Brain },
  { path: "/timeline", label: "Timeline", icon: Clock },
  { path: "/conversations", label: "Conversations", icon: MessagesSquare },
  { path: "/api-docs", label: "API", icon: Code2 },
  { path: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-black text-zinc-300">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-zinc-800/80 bg-[#09090b] transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo / Guardian Brand */}
        <Link
          to="/dashboard"
          className="flex h-16 items-center gap-3 border-b border-zinc-800/80 px-4 transition-colors hover:bg-zinc-900/40"
        >
          <LelantosLogo size="md" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-pixel text-xs font-bold tracking-widest text-white">LELANTOS</span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                Context Guardian
              </div>
            </div>
          )}
        </Link>

        {/* System Telemetry Banner */}
        {!collapsed && (
          <div className="border-b border-zinc-800/60 bg-black/40 px-4 py-2 font-mono text-[10px] text-zinc-500 flex items-center justify-between">
            <span className="tracking-wider text-zinc-400">SYS.STATUS</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              [ACTIVE]
            </span>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 p-2 pt-3">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 px-3 py-2.5 text-xs font-mono tracking-wide transition-all ${
                  isActive
                    ? "border border-zinc-700 bg-zinc-900/90 text-white font-semibold"
                    : "border border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/40 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-zinc-800/80 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 border border-transparent px-3 py-2 font-mono text-[11px] text-zinc-500 transition-colors hover:border-zinc-800 hover:bg-zinc-900/50 hover:text-zinc-300"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>[ COLLAPSE NAV ]</span>
              </>
            )}
          </button>
        </div>

        {/* User & Logout */}
        <div className="border-t border-zinc-800/80 bg-zinc-950 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-800 bg-zinc-900 font-mono text-xs font-bold text-zinc-300">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-zinc-200">
                  {user?.name}
                </div>
                <div className="truncate font-mono text-[10px] text-zinc-500">
                  {user?.email}
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="shrink-0 border border-transparent p-1.5 text-zinc-500 transition-colors hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-black">{children}</main>
    </div>
  );
}
