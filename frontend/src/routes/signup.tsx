import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LelantosLogo } from "@/components/lelantos/logo";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Initialize Vault — Lelantos Context Layer" },
      { name: "description", content: "Create your portable, persistent AI context vault on AWS." },
    ],
  }),
  component: SignupPage,
});

export function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [error, setError] = useState("");
  const { signup, confirmSignup, isLoading} = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signup(name, email, password);
      setNeedsConfirmation(true);
    } catch (err: any) {
      setError(err.message || "Vault initialization failed");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-4 font-mono text-zinc-300 selection:bg-zinc-800">
      {/* Background Matrix */}
      <div className="fixed inset-0 pixel-grid opacity-50 pointer-events-none" />

      <div className="relative w-full max-w-md border border-zinc-800 bg-[#09090b] p-8 shadow-2xl z-10">
        {/* Voxel corner markers */}
        <div className="absolute -top-1.5 -left-1.5 h-3 w-3 border-t-2 border-l-2 border-white" />
        <div className="absolute -top-1.5 -right-1.5 h-3 w-3 border-t-2 border-r-2 border-white" />
        <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 border-b-2 border-l-2 border-white" />
        <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 border-b-2 border-r-2 border-white" />

        {/* Brand header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block mb-3">
            <LelantosLogo size="lg" className="mx-auto shadow-lg" />
          </Link>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">
            INITIALIZE CONTEXT LAYER
          </div>
          <h1 className="font-pixel text-2xl font-bold text-white">FORGE YOUR VAULT</h1>
          <p className="mt-1 text-xs text-zinc-400 font-sans">
            Own your AI context across models and machines
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {needsConfirmation ? (
  <>
    <div>
      <label
        htmlFor="confirmation-code"
        className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400"
      >
        VERIFICATION CODE
      </label>

      <p className="mb-2 text-[10px] leading-relaxed text-zinc-600">
  Verification email sent. If you don't see it, check your spam or junk folder.
</p>

      <input
        id="confirmation-code"
        type="text"
        value={confirmationCode}
        onChange={(e) => setConfirmationCode(e.target.value)}
        placeholder="Enter the code sent to your email"
        className="w-full border border-zinc-800 bg-black px-4 py-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-white transition-colors"
        required
      />
    </div>

    <button
      type="button"
      disabled={isLoading}
      onClick={async () => {
        setError("");

        try {
          await confirmSignup(email, confirmationCode);
          navigate({ to: "/login" });
        } catch (err: any) {
          setError(err.message || "Verification failed");
        }
      }}
      className="w-full flex items-center justify-center gap-2 border border-white bg-white py-3 text-xs font-bold text-black transition-all hover:bg-zinc-200 disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      VERIFY EMAIL
    </button>
  </>
) : (
  <>
          {error ? (
            <div className="border border-red-500/40 bg-red-950/20 p-3 text-xs text-red-300 font-sans">
              {error}
            </div>
          ) : null}

          <div>
            <label htmlFor="signup-name" className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">
              OPERATOR HANDLE / NAME
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rayed Hasan"
              className="w-full border border-zinc-800 bg-black px-4 py-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-white transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">
              OPERATOR EMAIL
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@lelantos.ai"
              className="w-full border border-zinc-800 bg-black px-4 py-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-white transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="mb-1.5 block text-[11px] uppercase tracking-wider text-zinc-400">
              SECURITY KEY / PASSPHRASE
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full border border-zinc-800 bg-black px-4 py-2.5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-white transition-colors"
              required
            />
            <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
              Minimum 8 characters • 1 uppercase • 1 lowercase • 1 number • 1 special character
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 border border-white bg-white py-3 text-xs font-bold text-black transition-all hover:bg-zinc-200 disabled:opacity-50 mt-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>INITIALIZE VAULT</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </>
  )}
        </form>

        <div className="mt-8 border-t border-zinc-800/80 pt-4 text-center text-xs text-zinc-500 font-sans">
          Already possess an active partition?{" "}
          <Link to="/login" className="text-white hover:underline font-mono font-bold">
            [ Authenticate ]
          </Link>
        </div>
      </div>
    </div>
  );
}
