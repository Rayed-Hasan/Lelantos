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
    <div className="flex h-screen overflow-hidden bg-[#08090b] text-zinc-300">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-zinc-800/60 bg-zinc-950 transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b border-zinc-800/60 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
            <Cpu className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-wide text-zinc-100">
                LELANTOS
              </div>
              <div className="font-mono text-[9px] text-zinc-600">
                PORTABLE CONTEXT LAYER
              </div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 p-2 pt-3">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-zinc-800/60 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-900 hover:text-zinc-400 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User & Logout */}
        <div className="border-t border-zinc-800/60 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-400">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-zinc-300">
                  {user?.name}
                </div>
                <div className="truncate text-[10px] text-zinc-600">
                  {user?.email}
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="shrink-0 rounded p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-colors"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
