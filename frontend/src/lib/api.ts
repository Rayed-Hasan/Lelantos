/**
 * Lelantos API Client — All fetch calls to the backend.
 * Handles auth token injection, error handling, and typed responses.
 */

import type {
  ChatResponse,
  Memory,
  MemoryProfile,
  MemoryDetailResponse,
  TimelineEvent,
  Conversation,
  Message,
} from "./types";
import { getCognitoIdToken } from "./auth-context";
const API_BASE = "https://cpu895hqal.execute-api.us-east-1.amazonaws.com";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getCognitoIdToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  message: string,
  conversationId?: string,
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });
}

// ─── Memory ───────────────────────────────────────────────────────────────────

export async function getMemoryProfile(): Promise<MemoryProfile> {
  return apiFetch<MemoryProfile>("/memory/profile");
}

export async function getMemoryTimeline(): Promise<{ events: TimelineEvent[] }> {
  return apiFetch<{ events: TimelineEvent[] }>("/memory/timeline");
}

export async function getMemoryDetail(
  memoryId: string,
): Promise<MemoryDetailResponse> {
  return apiFetch<MemoryDetailResponse>(`/memory/${memoryId}`);
}

export async function queryMemories(
  query: string,
): Promise<{
  context: {
    type: string;
    key: string;
    value: string;
    confidence: number;
    memory_id: string;
  }[];
}> {
  return apiFetch("/memory/query", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export async function createMemory(data: {
  type: string;
  key: string;
  value: string;
  confidence?: number;
}): Promise<{ status: string; memory: Memory }> {
  return apiFetch("/memory", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMemory(
  memoryId: string,
  data: { value?: string; status?: string; confidence?: number },
): Promise<{ status: string; memory: Memory }> {
  return apiFetch(`/memory/${memoryId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMemory(
  memoryId: string,
): Promise<{ status: string }> {
  return apiFetch(`/memory/${memoryId}`, {
    method: "DELETE",
  });
}

export async function deleteAllMemories(): Promise<{
  status: string;
  count: number;
}> {
  return apiFetch("/memory", {
    method: "DELETE",
  });
}

export async function extractMemories(
  text: string,
): Promise<{
  extracted: {
    type: string;
    key: string;
    value: string;
    confidence: number;
    conflict: boolean;
  }[];
}> {
  return apiFetch("/memory/extract", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function listConversations(): Promise<{
  conversations: Conversation[];
}> {
  return apiFetch("/conversations");
}

export async function getConversation(
  conversationId: string,
): Promise<{
  conversation: Conversation;
  messages: Message[];
}> {
  return apiFetch(`/conversations/${conversationId}`);
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function healthCheck(): Promise<{
  status: string;
  service: string;
  version: string;
}> {
  return apiFetch("/health");
}
