import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Brain, Trash2, Key, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { useAuth } from "@/lib/auth-context";
import { deleteAllMemories } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Lelantos" },
      { name: "description", content: "Manage your Lelantos account settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, authLoading, navigate]);

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL memories? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const result = await deleteAllMemories();
      setDeleteResult(`Deleted ${result.count} memories`);
    } catch (e: any) {
      setDeleteResult(`Error: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your account and memories</p>
        </div>

        <div className="mx-auto max-w-2xl space-y-6">
          {/* Profile */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <User className="h-4 w-4 text-indigo-400" /> Profile
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Name</span>
                <span className="text-sm text-zinc-300">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Email</span>
                <span className="text-sm text-zinc-300">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">User ID</span>
                <span className="font-mono text-[10px] text-zinc-500">{user?.user_id}</span>
              </div>
            </div>
          </div>

          {/* Memory Management */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Brain className="h-4 w-4 text-emerald-400" /> Memory
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate({ to: "/memory" })}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-left text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
              >
                Manage memories →
              </button>
            </div>
          </div>

          {/* Privacy / Danger Zone */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.02] p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-red-400">
              <Trash2 className="h-4 w-4" /> Privacy — Danger Zone
            </div>
            <p className="mb-4 text-xs text-zinc-500">
              Permanently delete all your memories. This action cannot be undone.
            </p>
            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete all memory
            </button>
            {deleteResult && (
              <p className="mt-3 text-xs text-zinc-400">{deleteResult}</p>
            )}
          </div>

          {/* API Credentials */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Key className="h-4 w-4 text-amber-400" /> API
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              Use these credentials to access Lelantos from external AI clients.
            </p>
            <div className="rounded-lg border border-zinc-800/40 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-500">
              Bearer token: <span className="text-zinc-400">Available when Cognito is configured</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => { logout(); navigate({ to: "/" }); }}
            className="w-full rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-6 py-3 text-sm font-medium text-zinc-400 hover:border-zinc-700/60 hover:text-zinc-200 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
