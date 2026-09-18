/**
 * Lelantos TypeScript Types — Matching backend models.
 * Master Plan sections 7, 8, 14, 21.
 */

// ─── Memory Types ─────────────────────────────────────────────────────────────

export type MemoryType =
  | "IDENTITY"
  | "PREFERENCE"
  | "CONSTRAINT"
  | "PROJECT"
  | "GOAL"
  | "DECISION"
  | "FACT"
  | "RELATIONSHIP"
  | "TEMPORARY";

export type MemoryStatus =
  | "ACTIVE"
  | "REPLACED"
  | "EXPIRED"
  | "DELETED"
  | "PENDING";

export interface MemorySource {
  conversation_id?: string;
  message_id?: string;
  text?: string;
  extractor?: string;
  created_at?: string;
}

export interface Memory {
  memory_id: string;
  user_id: string;
  type: MemoryType;
  key: string;
  value: string;
  confidence: number;
  status: MemoryStatus;
  source?: MemorySource;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  version: number;
}

export interface MemoryCandidate {
  type: MemoryType;
  key: string;
  value: string;
  confidence: number;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export interface Conversation {
  conversation_id: string;
  user_id: string;
  model: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  message_id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export interface TimelineEvent {
  event_id: string;
  user_id: string;
  event_type:
    | "memory_created"
    | "memory_updated"
    | "memory_conflict"
    | "memory_deleted";
  memory_id?: string;
  description: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ChatResponse {
  response: string;
  conversation_id: string;
  message_id: string;
  memories_used: { type: string; key: string; value: string }[];
  memories_extracted: {
    type: string;
    key: string;
    value: string;
    confidence: number;
    memory_id?: string;
  }[];
  conflicts_detected: {
    has_conflict: boolean;
    candidate: MemoryCandidate;
    previous_value?: string;
  }[];
}

export interface MemoryProfile {
  user_id: string;
  total_memories: number;
  active_memories: number;
  type_counts: Record<string, number>;
  context_summary: {
    type: string;
    key: string;
    value: string;
    confidence: number;
  }[];
  recent_memories: Memory[];
}

export interface MemoryDetailResponse {
  memory: Memory;
  history: Memory[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  user_id: string;
  email: string;
  name: string;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  IDENTITY: "Identity",
  PREFERENCE: "Preference",
  CONSTRAINT: "Constraint",
  PROJECT: "Project",
  GOAL: "Goal",
  DECISION: "Decision",
  FACT: "Fact",
  RELATIONSHIP: "Relationship",
  TEMPORARY: "Temporary",
};

export const MEMORY_TYPE_COLORS: Record<MemoryType, string> = {
  IDENTITY: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  PREFERENCE: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  CONSTRAINT: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  PROJECT: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  GOAL: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  DECISION: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  FACT: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
  RELATIONSHIP: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  TEMPORARY: "text-orange-400 bg-orange-500/10 border-orange-500/30",
};

export const MEMORY_STATUS_COLORS: Record<MemoryStatus, string> = {
  ACTIVE: "text-emerald-400 bg-emerald-500/10",
  REPLACED: "text-zinc-500 bg-zinc-500/10",
  EXPIRED: "text-amber-500 bg-amber-500/10",
  DELETED: "text-red-500 bg-red-500/10",
  PENDING: "text-blue-500 bg-blue-500/10",
};
