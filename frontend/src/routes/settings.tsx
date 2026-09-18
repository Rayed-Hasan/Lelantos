import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Shield, Trash2, Key, Loader2, LogOut, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/lelantos/app-layout";
import { PixelC } from "@/components/lelantos/pixel-c";
import { useAuth } from "@/lib/auth-context";
import { deleteAllMemories } from "@/lib/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Lelantos Vault Control" },
      { name: "description", content: "Manage your Lelantos user profile and context vault configuration." },
    ],
  }),
  component: SettingsPage,
});

export function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate({ to: "/login" });
  }, [isAuthenticated, authLoading, navigate]);

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL memories? This permanently purges your vault and cannot be undone.")) return;
    setDeleting(true);
    try {
      const result = await deleteAllMemories();
      setDeleteResult(`PURGE COMPLETE: Removed ${result.count} context records.`);
    } catch (e: any) {
      setDeleteResult(`PURGE ERROR: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-10 font-mono text-zinc-300 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
            <span className="h-2 w-2 bg-emerald-400 animate-pulse" />
            <span>VAULT CONFIGURATION</span>
            <span className="text-zinc-700">//</span>
            <span>NODE CREDENTIALS</span>
          </div>
          <h1 className="font-pixel text-2xl sm:text-3xl font-bold tracking-wide text-white">
            SETTINGS & VAULT <PixelC size="inner" />ONTROL
          </h1>
          <p className="mt-1 text-xs text-zinc-500 font-sans">
            Manage your account identity, security partition, and context memory retention.
          </p>
        </div>

        <div className="space-y-6">
          {/* User Profile Dossier */}
          <div className="border border-zinc-800 bg-[#09090b] p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-800 pb-2">
              <User className="h-4 w-4 text-zinc-300" />
              <span>GUARDIAN USER IDENTITY</span>
            </div>

            <div className="grid gap-3 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-900 py-2">
                <span className="text-zinc-500">OPERATOR NAME</span>
                <span className="font-bold text-white">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 py-2">
                <span className="text-zinc-500">VERIFIED EMAIL</span>
                <span className="text-zinc-200">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 py-2">
                <span className="text-zinc-500">DYNAMODB USER PARTITION KEY</span>
                <span className="font-mono text-zinc-400 text-[11px]">{user?.user_id}</span>
              </div>
            </div>
          </div>

          {/* Context Vault Controls */}
          <div className="border border-zinc-800 bg-[#09090b] p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-800 pb-2">
              <Shield className="h-4 w-4 text-zinc-300" />
              <span>VAULT REPOSITORY NAVIGATION</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Direct access to your structured context matrix and chronological event stream.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => navigate({ to: "/memory" })}
                className="inline-flex items-center gap-2 border border-zinc-700 bg-black px-4 py-2 text-xs text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors"
              >
                <span>OPEN MEMORY VAULT</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => navigate({ to: "/timeline" })}
                className="inline-flex items-center gap-2 border border-zinc-700 bg-black px-4 py-2 text-xs text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors"
              >
                <span>AUDIT TIMELINE</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* External Access Credentials */}
          <div className="border border-zinc-800 bg-[#09090b] p-6 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider border-b border-zinc-800 pb-2">
              <Key className="h-4 w-4 text-zinc-300" />
              <span>EXTERNAL CLIENT AUTHENTICATION</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Provide this token in the <code>Authorization: Bearer &lt;token&gt;</code> header when interacting from external CLI tools, IDE extensions, or agent workflows.
            </p>
            <div className="border border-zinc-800 bg-black p-3 text-[11px] text-zinc-400 font-mono">
              BEARER TOKEN: <span className="text-emerald-400 font-bold">AWS_COGNITO_JWT // ACTIVE SESSION</span>
            </div>
          </div>

          {/* Danger Zone: Memory Purge */}
          <div className="border border-red-500/30 bg-red-950/10 p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider border-b border-red-500/20 pb-2">
              <Trash2 className="h-4 w-4" />
              <span>DANGER ZONE // PURGE CONTEXT RECORDS</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Permanently delete all memory records stored under your partition in DynamoDB. This action is irreversible.
            </p>

            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className="inline-flex items-center gap-2 border border-red-500/60 bg-red-950/40 px-5 py-2.5 text-xs font-bold text-red-300 hover:bg-red-900/60 transition-colors disabled:opacity-40"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              <span>PURGE ALL MEMORY RECORDS</span>
            </button>

            {deleteResult && (
              <div className="border border-zinc-800 bg-black p-3 text-xs text-zinc-300 font-mono">
                {deleteResult}
              </div>
            )}
          </div>

          {/* Sign Out Control */}
          <div className="pt-2">
            <button
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="w-full flex items-center justify-center gap-2 border border-zinc-800 bg-black py-3 text-xs font-bold text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>TERMINATE SESSION & SIGN OUT</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
