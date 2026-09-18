import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Eye,
  GitBranch,
  Search,
  Lock,
  Zap,
  Globe,
  ArrowRight,
  ChevronRight,
  Database,
  Cpu,
  RefreshCw,
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Fingerprint,
} from "lucide-react";
import { LelantosLogo } from "@/components/lelantos/logo";
import { PixelC } from "@/components/lelantos/pixel-c";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lelantos — Ancient Guardian of Portable AI Context" },
      {
        name: "description",
        content:
          "Your AI changes. Your context shouldn't. Lelantos is the ancient guardian and portable context layer for AI systems on AWS.",
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

const MEMORY_BLOCKS_DEMO = [
  {
    type: "IDENTITY",
    key: "role",
    val: "Senior Distributed Systems Architect",
    conf: 0.99,
    status: "ACTIVE",
    desc: "Extracted from intro statement; persists across all AI models",
  },
  {
    type: "PREFERENCE",
    key: "primary_language",
    val: "Python 3.12 + FastAPI",
    conf: 0.96,
    status: "ACTIVE",
    desc: "Detected during architecture debate; replaces older Node.js choice",
  },
  {
    type: "PROJECT",
    key: "current_target",
    val: "Lelantos Context Layer on AWS Bedrock",
    conf: 0.98,
    status: "ACTIVE",
    desc: "Single-table DynamoDB + Llama 3.1 70B pipeline",
  },
  {
    type: "CONSTRAINT",
    key: "monthly_budget",
    val: "True Serverless, $0 Idle Cost",
    conf: 0.94,
    status: "ACTIVE",
    desc: "Hard constraint enforced during system planning queries",
  },
  {
    type: "DECISION",
    key: "vector_strategy",
    val: "Recency & Confidence-Ranked Keyword/Semantic Retrieval",
    conf: 0.95,
    status: "ACTIVE",
    desc: "Zero-vector-DB overhead; instantaneous cold-start lookups",
  },
];

export function LandingPage() {
  const [selectedModel, setSelectedModel] = useState("Meta Llama 3.1 70B");
  const [activeTab, setActiveTab] = useState(0);
  const [resolvedConflict, setResolvedConflict] = useState(false);

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Background Matrix / Grid */}
      <div className="fixed inset-0 pixel-grid opacity-60 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-radial-gradient from-transparent via-black/60 to-black pointer-events-none z-0" />

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <LelantosLogo size="md" />
            <div>
              <div className="font-pixel text-xs font-bold tracking-widest text-white">LELANTOS</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                Ancient Guardian of AI Context
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/api-docs"
              className="hidden font-mono text-xs text-zinc-400 hover:text-white transition-colors sm:inline-block px-3 py-1.5 border border-transparent hover:border-zinc-800"
            >
              [ API DOCS ]
            </Link>
            <Link
              to="/login"
              className="font-mono text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 border border-transparent hover:border-zinc-800"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="relative inline-flex items-center gap-2 border border-white bg-white px-4 py-2 font-mono text-xs font-bold text-black transition-all hover:bg-zinc-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            >
              <span>ENTER THE VAULT</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ========================================================== */}
        {/* HERO SECTION — Ancient Guardian Meets AI Infrastructure */}
        {/* ========================================================== */}
        <section className="relative min-h-[92vh] border-b border-zinc-800/80 px-4 py-16 sm:px-6 sm:py-24 lg:px-8 flex items-center">
          <div className="mx-auto max-w-7xl w-full">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              {/* Left Column: Core Narrative & Value Proposition */}
              <div className="lg:col-span-7">
                {/* Meta telemetry tag */}
                <div className="mb-6 inline-flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-1 font-mono text-[11px] text-zinc-400">
                  <span className="h-2 w-2 bg-emerald-400 animate-pulse" />
                  <span>DEITY PROTOCOL: TITAN OF THE UNSEEN</span>
                  <span className="text-zinc-600">//</span>
                  <span className="text-zinc-500">AWS BEDROCK READY</span>
                </div>

                <h1 className="mb-6 font-pixel text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                  YOUR AI{" "}
                  <span className="inline-block whitespace-nowrap" aria-label="CHANGES.">
                    <span aria-hidden="true">
                      <PixelC />
                      HANGES.
                    </span>
                    <span className="sr-only">CHANGES.</span>
                  </span>
                  <br />
                  <span className="text-zinc-400 underline decoration-zinc-700 underline-offset-8">
                    YOUR{" "}
                    <span className="inline-block whitespace-nowrap" aria-label="CONTEXT">
                      <span aria-hidden="true">
                        <PixelC />
                        ONTEXT
                      </span>
                      <span className="sr-only">CONTEXT</span>
                    </span>{" "}
                    SHOULDN'T.
                  </span>
                </h1>

                <p className="mb-8 max-w-2xl font-sans text-base leading-relaxed text-zinc-400 sm:text-lg">
                  Named after the Greek Titan of the unseen, <strong className="text-white">Lelantos</strong> stands as the ancient guardian of your digital mind. A portable, user-owned context layer that extracts, versions, and shields your identity, preferences, and decisions across every AI model you touch.
                </p>

                <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 border border-white bg-white px-6 py-3 font-bold text-black transition-all hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                    <span>INITIALIZE GUARDIAN</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>

                  <a
                    href="#story"
                    className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-5 py-3 text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
                  >
                    <span>[ HOW CONTEXT PERSISTS ]</span>
                  </a>
                </div>

                {/* Tactical Metrics Bar */}
                <div className="mt-12 grid grid-cols-3 gap-4 border-t border-zinc-800/80 pt-8 font-mono">
                  <div className="border-l border-zinc-800 pl-4">
                    <div className="text-[10px] uppercase text-zinc-500">PORTABILITY</div>
                    <div className="font-pixel text-lg text-white">100%</div>
                    <div className="text-[10px] text-zinc-600">Model-Agnostic</div>
                  </div>
                  <div className="border-l border-zinc-800 pl-4">
                    <div className="text-[10px] uppercase text-zinc-500">LATENCY OVERHEAD</div>
                    <div className="font-pixel text-lg text-white">&lt;45ms</div>
                    <div className="text-[10px] text-zinc-600">Single-Table Dynamo</div>
                  </div>
                  <div className="border-l border-zinc-800 pl-4">
                    <div className="text-[10px] uppercase text-zinc-500">PROVENANCE</div>
                    <div className="font-pixel text-lg text-white">FULL</div>
                    <div className="text-[10px] text-zinc-600">Verifiable Source</div>
                  </div>
                </div>
              </div>

              {/* Right Column: The Ancient Guardian Voxel Monolith */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md border border-zinc-800 bg-[#09090b] p-3 shadow-2xl">
                  {/* Decorative Voxel Corner Brackets */}
                  <div className="absolute -top-1.5 -left-1.5 h-3 w-3 border-t-2 border-l-2 border-white" />
                  <div className="absolute -top-1.5 -right-1.5 h-3 w-3 border-t-2 border-r-2 border-white" />
                  <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 border-b-2 border-l-2 border-white" />
                  <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 border-b-2 border-r-2 border-white" />

                  {/* Header metadata bar */}
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 px-2 font-mono text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-zinc-400" />
                      <span>LELANTOS_ENGRAVING.VXL</span>
                    </span>
                    <span className="text-zinc-600">COORD: 38.4°N 23.6°E</span>
                  </div>

                  {/* Classical Illustration Container */}
                  <div className="relative overflow-hidden bg-black py-3 px-2 flex justify-center items-center">
                    {/* Subtle grid lines inside artwork */}
                    <div className="absolute inset-0 pixel-grid-dense opacity-40 pointer-events-none" />
                    
                    {/* The Classical Woodcut Engraving of Lelantos */}
                    <div className="relative z-10 max-h-[380px] overflow-hidden flex items-center justify-center">
                      <img
                        src="/lelantos.webp"
                        alt="Ancient Deity Lelantos Guardian of Context"
                        className="max-h-[360px] w-auto object-contain engraving-filter transition-transform duration-700 hover:scale-[1.02]"
                      />
                    </div>
                  </div>

                  {/* Voxel Data HUD / Deity Quote Section */}
                  <div className="mt-2 border border-zinc-800/90 bg-black/90 p-3 font-mono">
                    <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-white font-semibold tracking-wider">ACTIVE SHIELD</span>
                      </div>
                      <span className="text-emerald-400 font-bold text-[10px] tracking-widest">[ONLINE]</span>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed italic">
                      "He who moves unseen across the boundary of machines."
                    </p>
                  </div>

                  {/* Footer telemetry */}
                  <div className="mt-2 flex items-center justify-between px-2 pt-2 border-t border-zinc-800/80 font-mono text-[9px] text-zinc-600">
                    <span>SECURITY: AES-256 / USER-KEYED</span>
                    <span>AWS REGION: US-EAST-1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* INTERACTIVE SIMULATOR: "Switch Models, Keep Context" */}
        {/* ========================================================== */}
        <section className="border-b border-zinc-800/80 bg-[#070709] py-16 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <div className="font-mono text-xs tracking-widest text-zinc-500 uppercase mb-2">
                [ THE CORE PROMISE ]
              </div>
              <h2 className="font-pixel text-2xl sm:text-3xl font-bold text-white">
                SWIT<PixelC />H THE MODEL. PRESERVE THE MIND.
              </h2>
              <p className="mt-2 font-mono text-xs text-zinc-400 max-w-xl mx-auto">
                Test how Lelantos intercepts any AI provider and automatically injects your persistent context blocks.
              </p>
            </div>

            {/* Model Selector Switches */}
            <div className="flex flex-wrap justify-center gap-2 mb-8 font-mono text-xs">
              {[
                "Meta Llama 3.1 70B",
                "Claude 3.7 Sonnet",
                "OpenAI GPT-4o",
                "Amazon Titan Express",
              ].map((model) => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`border px-4 py-2 uppercase transition-all ${
                    selectedModel === model
                      ? "border-white bg-zinc-900 text-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                      : "border-zinc-800 bg-black text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {selectedModel === model ? `► ${model}` : model}
                </button>
              ))}
            </div>

            {/* Simulation Canvas */}
            <div className="border border-zinc-800 bg-black p-6 relative font-mono">
              <div className="absolute top-2 right-3 text-[10px] text-zinc-600">
                CONNECTED: {selectedModel}
              </div>

              <div className="grid gap-6 md:grid-cols-2 items-center">
                <div>
                  <div className="text-[11px] uppercase text-zinc-500 mb-2 flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-zinc-400" />
                    USER PROMPT TO AI
                  </div>
                  <div className="border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-200">
                    "Write the core authentication guard for our API endpoint."
                  </div>
                  <div className="mt-3 text-[11px] text-zinc-500 flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Without Lelantos: The AI asks what language, framework, and auth standard you use.
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase text-zinc-400 mb-2 flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    LELANTOS CONTEXT SHIELD (INJECTED)
                  </div>
                  <div className="border border-zinc-700 bg-[#09090b] p-4 text-xs space-y-1.5 text-zinc-300">
                    <div className="text-emerald-400 text-[10px] font-bold">
                      [+3 RELEVANT CONTEXT BLOCKS ATTACHED]
                    </div>
                    <div className="truncate text-zinc-400">
                      • <span className="text-white">PREFERENCE:</span> Python 3.12 + FastAPI
                    </div>
                    <div className="truncate text-zinc-400">
                      • <span className="text-white">DECISION:</span> Cognito JWT Header Validation
                    </div>
                    <div className="truncate text-zinc-400">
                      • <span className="text-white">CONSTRAINT:</span> $0 Idle Cost / Serverless
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-emerald-400 flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    With Lelantos: {selectedModel} writes perfect code on first try.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* STORY CHAPTER 01: THE SILOED PROBLEM */}
        {/* ========================================================== */}
        <section id="story" className="border-b border-zinc-800/80 py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14">
              <div className="font-mono text-xs tracking-widest text-zinc-500 uppercase mb-2">
                [ CHAPTER 01 ]
              </div>
              <h2 className="font-pixel text-3xl font-bold text-white">
                THE <PixelC />ONTEXT AMNESIA PARADOX
              </h2>
              <p className="mt-2 font-mono text-sm text-zinc-400 max-w-2xl">
                Every AI interaction today is trapped inside a proprietary silo. When you hit a rate limit, change tasks, or upgrade models, your working context disappears.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 font-mono">
              <div className="border border-zinc-800 bg-[#09090b] p-6">
                <div className="mb-4 text-2xl text-zinc-500 font-pixel">01 // SILOS</div>
                <h3 className="text-sm font-bold text-white mb-2">Walled Garden Traps</h3>
                <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                  Your coding decisions in Claude do not travel to ChatGPT. Your research notes in Gemini cannot inform Bedrock. You become a human clipboard.
                </p>
              </div>

              <div className="border border-zinc-800 bg-[#09090b] p-6">
                <div className="mb-4 text-2xl text-zinc-500 font-pixel">02 // COLD START</div>
                <h3 className="text-sm font-bold text-white mb-2">Groundhog Day Prompting</h3>
                <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                  "I prefer TypeScript, no semicolons, Tailwind v4, and AWS Lambda." You re-explain your architectural rules hundreds of times every month.
                </p>
              </div>

              <div className="border border-zinc-800 bg-[#09090b] p-6">
                <div className="mb-4 text-2xl text-zinc-500 font-pixel">03 // NO PROVENANCE</div>
                <h3 className="text-sm font-bold text-white mb-2">Unverifiable Hallucination</h3>
                <p className="text-xs leading-relaxed text-zinc-400 font-sans">
                  When an AI asserts something about your project, you cannot trace which conversation, timestamp, or prompt gave rise to that premise.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* STORY CHAPTER 02: STRUCTURED CONTEXT BLOCKS */}
        {/* ========================================================== */}
        <section className="border-b border-zinc-800/80 bg-[#09090b] py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14">
              <div className="font-mono text-xs tracking-widest text-zinc-500 uppercase mb-2">
                [ CHAPTER 02 ]
              </div>
              <h2 className="font-pixel text-3xl font-bold text-white">
                MEMORY AS STRU<PixelC />TURED VOXEL BLOCKS
              </h2>
              <p className="mt-2 font-mono text-sm text-zinc-400 max-w-2xl">
                Lelantos doesn't dump raw transcripts. It parses natural conversations into typed, versioned, confidence-weighted memory blocks.
              </p>
            </div>

            {/* Interactive Block Explorer */}
            <div className="grid gap-6 lg:grid-cols-12 font-mono">
              <div className="lg:col-span-5 space-y-2">
                {MEMORY_BLOCKS_DEMO.map((block, idx) => (
                  <button
                    key={block.key}
                    onClick={() => setActiveTab(idx)}
                    className={`w-full text-left p-4 border transition-all ${
                      activeTab === idx
                        ? "border-white bg-black text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                        : "border-zinc-800/80 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-pixel text-xs text-white">{block.type}</span>
                      <span className="text-[10px] text-zinc-500">{(block.conf * 100).toFixed(0)}% CONF</span>
                    </div>
                    <div className="text-xs font-bold text-zinc-300 truncate">{block.key}</div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-7">
                <div className="border border-zinc-800 bg-black p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 text-xs">
                      <span className="text-zinc-400 font-bold">
                        BLOCK INSPECTION: {MEMORY_BLOCKS_DEMO[activeTab].key}
                      </span>
                      <span className="text-emerald-400 font-mono">[STATUS: ACTIVE]</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500 mb-1">RECORD VALUE</div>
                        <div className="border border-zinc-800 bg-zinc-950 p-3 text-sm text-white font-bold">
                          {MEMORY_BLOCKS_DEMO[activeTab].val}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] uppercase text-zinc-500 mb-1">MEMORY TYPE</div>
                          <div className="border border-zinc-900 bg-black p-2 text-xs text-zinc-300">
                            {MEMORY_BLOCKS_DEMO[activeTab].type}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-zinc-500 mb-1">CONFIDENCE GAUGE</div>
                          <div className="border border-zinc-900 bg-black p-2 text-xs text-emerald-400">
                            {(MEMORY_BLOCKS_DEMO[activeTab].conf * 100).toFixed(0)}% Verified
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase text-zinc-500 mb-1">GUARDIAN RATIONALE</div>
                        <p className="text-xs text-zinc-400 font-sans leading-relaxed border-l-2 border-zinc-700 pl-3">
                          {MEMORY_BLOCKS_DEMO[activeTab].desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>VERSION: v1.0</span>
                    <Link to="/memory" className="text-white hover:underline">
                      Inspect In Vault →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* STORY CHAPTER 03: CONFLICT RESOLUTION PROTOCOL */}
        {/* ========================================================== */}
        <section className="border-b border-zinc-800/80 py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14">
              <div className="font-mono text-xs tracking-widest text-zinc-500 uppercase mb-2">
                [ CHAPTER 03 ]
              </div>
              <h2 className="font-pixel text-3xl font-bold text-white">
                <PixelC />ONFLI<PixelC />T DETE<PixelC />TION & VERSIONING
              </h2>
              <p className="mt-2 font-mono text-sm text-zinc-400 max-w-2xl">
                When you change your mind, naive memory systems duplicate or hallucinate. Lelantos detects the semantic contradiction, retires the obsolete memory, and promotes the latest truth.
              </p>
            </div>

            {/* Interactive Conflict Demo */}
            <div className="border border-zinc-800 bg-[#09090b] p-6 sm:p-8 font-mono">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                <div>
                  <div className="text-xs font-bold text-white">SIMULATED CONFLICT EVENT</div>
                  <div className="text-[10px] text-zinc-500">KEY: preference.backend_stack</div>
                </div>
                <button
                  onClick={() => setResolvedConflict(!resolvedConflict)}
                  className="border border-white bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition-colors"
                >
                  {resolvedConflict ? "RESET TIMELINE" : "TRIGGER CONFLICT RESOLUTION"}
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Previous Memory Card */}
                <div
                  className={`border p-5 transition-all ${
                    resolvedConflict
                      ? "border-zinc-800 bg-black opacity-60 line-through text-zinc-500"
                      : "border-zinc-700 bg-black text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-pixel">VERSION 1.0</span>
                    <span className={resolvedConflict ? "text-red-400" : "text-emerald-400"}>
                      [{resolvedConflict ? "REPLACED" : "ACTIVE"}]
                    </span>
                  </div>
                  <div className="text-lg font-bold mb-1">Node.js + Express</div>
                  <p className="text-xs font-sans text-zinc-500 mt-2">
                    Source: "Let's build the prototype with Express." (Recorded Sep 14)
                  </p>
                </div>

                {/* New Conflicted Memory Card */}
                <div
                  className={`border p-5 transition-all ${
                    resolvedConflict
                      ? "border-emerald-500/60 bg-black shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : "border-dashed border-zinc-800 bg-zinc-950 text-zinc-600"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-pixel text-white">VERSION 2.0</span>
                    <span className={resolvedConflict ? "text-emerald-400 font-bold" : "text-zinc-600"}>
                      [{resolvedConflict ? "ACTIVE & VERIFIED" : "PENDING DETECTION"}]
                    </span>
                  </div>
                  <div className={`text-lg font-bold ${resolvedConflict ? "text-white" : "text-zinc-600"}`}>
                    Python 3.12 + FastAPI
                  </div>
                  <p className="text-xs font-sans text-zinc-400 mt-2">
                    {resolvedConflict
                      ? 'Source: "I have migrated the entire service to FastAPI on AWS Lambda." (Recorded Today)'
                      : "Awaiting new contradictory statement..."}
                  </p>
                </div>
              </div>

              <div className="mt-6 text-xs text-zinc-400 border-t border-zinc-800/80 pt-4 flex items-center justify-between">
                <span>GUARDIAN RESOLUTION: ZERO DATA OVERWRITES. IMMUTABLE AUDIT TRAIL.</span>
                <span className="text-zinc-600">AWS DYNAMODB GSI-1</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* STORY CHAPTER 04: "WHY DID LELANTOS REMEMBER THIS?" */}
        {/* ========================================================== */}
        <section className="border-b border-zinc-800/80 bg-[#09090b] py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <div className="font-mono text-xs tracking-widest text-zinc-500 uppercase mb-2">
                [ SIGNATURE INSPECTOR ]
              </div>
              <h2 className="font-pixel text-3xl font-bold text-white">
                "WHY DID LELANTOS REMEMBER THIS?"
              </h2>
              <p className="mt-2 font-mono text-sm text-zinc-400 max-w-xl mx-auto">
                No black-box state. Click on any memory anywhere in Lelantos to view its forensic provenance: the exact user quote, source message ID, and confidence matrix.
              </p>
            </div>

            {/* Inspector Terminal UI */}
            <div className="border border-zinc-700 bg-black shadow-2xl p-6 sm:p-8 font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-6 text-xs text-zinc-500">
                <span className="flex items-center gap-2 text-white">
                  <Eye className="h-4 w-4 text-zinc-300" />
                  <span>MEMORY_INSPECTOR.EXE</span>
                </span>
                <span>ID: mem_01J8F94D2KP</span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] uppercase text-zinc-500 mb-1">SOURCE STATEMENT (PROVENANCE)</div>
                  <div className="border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200 italic font-serif">
                    "We must adhere to a strict serverless architecture on AWS. No EC2 instances, zero idle cost."
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="border border-zinc-800 p-3">
                    <div className="text-[10px] uppercase text-zinc-500 mb-1">CONFIDENCE SCORE</div>
                    <div className="text-xl font-bold text-emerald-400 font-pixel">98.4%</div>
                    <div className="text-[10px] text-zinc-500">Explicit User Directive</div>
                  </div>
                  <div className="border border-zinc-800 p-3">
                    <div className="text-[10px] uppercase text-zinc-500 mb-1">CONVERSATION ID</div>
                    <div className="text-xs text-zinc-300 font-mono truncate">conv_8f0a21bc9e</div>
                    <div className="text-[10px] text-zinc-500">Linked to Chat Session</div>
                  </div>
                  <div className="border border-zinc-800 p-3">
                    <div className="text-[10px] uppercase text-zinc-500 mb-1">IMMUTABLE TIMESTAMP</div>
                    <div className="text-xs text-zinc-300 font-mono">2026-09-18T16:42Z</div>
                    <div className="text-[10px] text-zinc-500">UTC Synchronized</div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-500">
                    USER AUTONOMY: You retain the power to edit, correct, or permanently forget any memory at any moment.
                  </span>
                  <Link
                    to="/memory"
                    className="border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-zinc-200 hover:bg-zinc-800"
                  >
                    Open Full Inspector →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* STORY CHAPTER 05: AWS ARCHITECTURE BLUEPRINT */}
        {/* ========================================================== */}
        <section className="border-b border-zinc-800/80 py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14">
              <div className="font-mono text-xs tracking-widest text-zinc-500 uppercase mb-2">
                [ INFRASTRUCTURE FORTRESS ]
              </div>
              <h2 className="font-pixel text-3xl font-bold text-white">
                AWS-NATIVE SERVERLESS BLUEPRINT
              </h2>
              <p className="mt-2 font-mono text-sm text-zinc-400 max-w-2xl">
                Built strictly on AWS Serverless infrastructure for true zero-idle cost, microsecond latency, and enterprise-grade data isolation.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 font-mono">
              <div className="border border-zinc-800 bg-[#09090b] p-6">
                <div className="flex items-center gap-2 mb-3 text-white font-bold text-sm">
                  <Cpu className="h-4 w-4 text-zinc-400" />
                  <span>AMAZON BEDROCK</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans mb-4">
                  Meta Llama 3.1 70B Instruct with dual asynchronous pipelines for simultaneous chat response and background context extraction.
                </p>
                <div className="text-[10px] text-zinc-600">Model ID: meta.llama3-1-70b-instruct-v1:0</div>
              </div>

              <div className="border border-zinc-800 bg-[#09090b] p-6">
                <div className="flex items-center gap-2 mb-3 text-white font-bold text-sm">
                  <Database className="h-4 w-4 text-zinc-400" />
                  <span>AMAZON DYNAMODB</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans mb-4">
                  Single-Table design with PK/SK composite keys, sparse GSIs for versioning, and strict sub-tenant partition isolation.
                </p>
                <div className="text-[10px] text-zinc-600">Table: LelantosContextEngine</div>
              </div>

              <div className="border border-zinc-800 bg-[#09090b] p-6">
                <div className="flex items-center gap-2 mb-3 text-white font-bold text-sm">
                  <Zap className="h-4 w-4 text-zinc-400" />
                  <span>AWS LAMBDA</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans mb-4">
                  Serverless function handlers executing the FastAPI ASGI application with zero baseline cost and instant scale.
                </p>
                <div className="text-[10px] text-zinc-600">Runtime: Python 3.12 (ARM64)</div>
              </div>

              <div className="border border-zinc-800 bg-[#09090b] p-6">
                <div className="flex items-center gap-2 mb-3 text-white font-bold text-sm">
                  <Lock className="h-4 w-4 text-zinc-400" />
                  <span>AMAZON COGNITO</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans mb-4">
                  Cryptographically verified JWT auth with local fallback dev tokens for flawless testing and security compliance.
                </p>
                <div className="text-[10px] text-zinc-600">Auth: OAuth2 / Bearer JWT</div>
              </div>

              <div className="border border-zinc-800 bg-[#09090b] p-6">
                <div className="flex items-center gap-2 mb-3 text-white font-bold text-sm">
                  <Activity className="h-4 w-4 text-zinc-400" />
                  <span>API GATEWAY</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans mb-4">
                  REST endpoints routing chat, memory profile, provenance queries, and conflict management with rate-limiting.
                </p>
                <div className="text-[10px] text-zinc-600">Latency: ~28ms Avg</div>
              </div>

              <div className="border border-zinc-800 bg-[#09090b] p-6">
                <div className="flex items-center gap-2 mb-3 text-white font-bold text-sm">
                  <Globe className="h-4 w-4 text-zinc-400" />
                  <span>AWS AMPLIFY</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans mb-4">
                  Edge-optimized SSR frontend deployment with TanStack Router, Vite, and seamless continuous delivery.
                </p>
                <div className="text-[10px] text-zinc-600">Target: Global Edge CDN</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== */}
        {/* LAUNCHPAD CTA */}
        {/* ========================================================== */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-black">
          <div className="mx-auto max-w-4xl text-center relative z-10">
            <LelantosLogo size="lg" className="mx-auto mb-6 shadow-2xl" />

            <h2 className="font-pixel text-3xl sm:text-5xl font-bold text-white mb-4">
              OWN YOUR <PixelC />ONTEXT FOREVER.
            </h2>
            <p className="font-sans text-base text-zinc-400 max-w-xl mx-auto mb-8">
              Never re-explain your stack, goals, or constraints again. Deploy the guardian to your AI workflow in under two minutes.
            </p>

            <div className="flex flex-wrap justify-center gap-4 font-mono text-xs">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 border border-white bg-white px-8 py-3.5 font-bold text-black hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)]"
              >
                <span>CREATE YOUR VAULT</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-6 py-3.5 text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
              >
                <span>SIGN IN TO CONSOLE</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-black py-10 px-4 sm:px-6 lg:px-8 font-mono text-xs">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-zinc-400">
            <span className="font-pixel text-white font-bold">LELANTOS</span>
            <span>//</span>
            <span>ANCIENT GUARDIAN OF AI CONTEXT</span>
          </div>
          <div className="text-[11px] text-zinc-600">
            AWS Bedrock • DynamoDB • Lambda • Cognito • API Gateway
          </div>
        </div>
      </footer>
    </div>
  );
}
