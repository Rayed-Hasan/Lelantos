import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  ArrowRight,
  Shield,
  Eye,
  GitBranch,
  Layers,
  Search,
  Lock,
  Zap,
  Globe,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lelantos — Portable AI Context Layer" },
      {
        name: "description",
        content:
          "Your AI changes. Your context shouldn't. Portable AI context layer for persistent, user-owned context across any AI system.",
      },
      { property: "og:title", content: "Lelantos — Portable AI Context Layer" },
      {
        property: "og:description",
        content:
          "Keep your identity, preferences, projects, constraints and decisions available across AI systems.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08090b] text-zinc-300 selection:bg-indigo-500/20 selection:text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/40 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10">
              <Brain className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-sm font-bold tracking-wider text-white">LELANTOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/[0.04] blur-[120px]" />
          <div className="absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-24 text-center lg:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-xs font-medium text-indigo-400">
            <Zap className="h-3 w-3" />
            AWS-Native Architecture
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your AI changes.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Your context shouldn't.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400">
            A portable context layer for AI. Keep your identity, preferences,
            projects, constraints and decisions available across any AI
            system — so you never start from zero again.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/25"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-zinc-800/40 bg-zinc-950/50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 font-mono text-xs tracking-widest text-indigo-400">THE PROBLEM</p>
            <h2 className="text-3xl font-bold text-white">AI conversations are siloed</h2>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="space-y-4">
              {[
                "Start a project in one AI.",
                "Reach the free usage limit.",
                "Switch to another AI.",
                "Lose the previous conversation's working context.",
                "Repeat project requirements, preferences, constraints, and decisions.",
                "Repeat again when switching models.",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-5 py-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-xs font-bold text-zinc-500">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-zinc-400">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-800/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 font-mono text-xs tracking-widest text-emerald-400">HOW IT WORKS</p>
            <h2 className="text-3xl font-bold text-white">Lelantos Memory Engine</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Brain,
                title: "Extract",
                desc: "Lelantos detects important facts from your conversations — identity, preferences, constraints, decisions — and structures them as typed memories with confidence scores.",
                color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
              },
              {
                icon: GitBranch,
                title: "Detect Conflicts",
                desc: "When information changes, Lelantos detects conflicts, versions old memories as REPLACED, and makes the change transparent with full provenance.",
                color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
              },
              {
                icon: Search,
                title: "Retrieve Relevantly",
                desc: "Instead of dumping all context, only relevant memories are retrieved based on your query — ranked by relevance, confidence, and recency.",
                color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-6">
                <div className={`mb-4 inline-flex rounded-lg border p-2.5 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="border-t border-zinc-800/40 bg-zinc-950/50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 font-mono text-xs tracking-widest text-rose-400">DIFFERENTIATORS</p>
            <h2 className="text-3xl font-bold text-white">Why Lelantos</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Globe, title: "Portability", desc: "Context exists independently from any single AI model." },
              { icon: Eye, title: "Transparency", desc: "Inspect every memory — see what Lelantos remembers and why." },
              { icon: Shield, title: "Provenance", desc: "Every memory traces back to the exact source message." },
              { icon: GitBranch, title: "Conflict Handling", desc: "Changed information creates versioned memory, not duplicates." },
              { icon: Lock, title: "User Control", desc: "Edit, forget, or manage any memory at any time." },
              { icon: Layers, title: "AWS-Native", desc: "Bedrock, Lambda, DynamoDB, Cognito, API Gateway, Amplify." },
            ].map((feat) => (
              <div key={feat.title} className="group rounded-xl border border-zinc-800/40 bg-zinc-900/10 p-5 transition-all hover:border-zinc-700/60 hover:bg-zinc-900/30">
                <feat.icon className="mb-3 h-5 w-5 text-zinc-500 transition-colors group-hover:text-indigo-400" />
                <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">{feat.title}</h3>
                <p className="text-xs leading-relaxed text-zinc-600">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Memory Inspector Preview */}
      <section className="border-t border-zinc-800/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 font-mono text-xs tracking-widest text-cyan-400">SIGNATURE FEATURE</p>
            <h2 className="text-3xl font-bold text-white">"Why did you remember this?"</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
              Every memory is inspectable. See the exact source statement, confidence score, version history, and provenance.
            </p>
          </div>

          <div className="mx-auto max-w-md rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-rose-400">
                DECISION
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                ACTIVE
              </span>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-white">Backend</h3>
            <p className="mb-4 text-2xl font-bold text-indigo-400">Python</p>

            <div className="space-y-3 border-t border-zinc-800/60 pt-4">
              <div>
                <p className="font-mono text-[10px] text-zinc-600">SOURCE</p>
                <p className="mt-1 text-sm italic text-zinc-400">
                  "I've decided to move the backend to Python."
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-zinc-600">CONFIDENCE</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-zinc-800">
                    <div className="h-full w-[98%] rounded-full bg-emerald-500" />
                  </div>
                  <span className="font-mono text-xs text-emerald-400">98%</span>
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] text-zinc-600">PREVIOUS VALUE</p>
                <p className="mt-1 text-sm text-zinc-500 line-through">Node.js</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800/40 bg-zinc-950/50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to own your AI context?
          </h2>
          <p className="mb-8 text-zinc-500">
            Stop re-explaining yourself every time you switch AI models.
          </p>
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/25"
          >
            Get Started Free
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/40 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-700">
            <Brain className="h-3.5 w-3.5" />
            <span>LELANTOS © 2026</span>
          </div>
          <p className="font-mono text-[10px] text-zinc-700">
            Bedrock • Lambda • DynamoDB • Cognito • API Gateway • Amplify
          </p>
        </div>
      </footer>
    </div>
  );
}
