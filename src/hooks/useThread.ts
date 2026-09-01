import { useState, useCallback, useEffect } from 'react';
import { queryClient } from '../api/client';

// =============================================================================
// Types
// =============================================================================

export interface ThreadTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  // Only present on assistant turns:
  source?: string;
  approvedByName?: string | null;
  validatedAt?: string | null;
  confidence?: number | null;
  grounding?: 'strong' | 'moderate' | 'thin' | null;
  caution?: string | null;
  citations?: Array<{ documentId?: string; documentName?: string; relevanceScore?: number }>;
  resolvedQuery?: string;
  queryWasRewritten?: boolean;
  createdAt: string;
}

export interface ThreadSummary {
  id: string;
  title: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface UseThreadOptions {
  userId: string;
  userName?: string;
  userEmail?: string;
  domain?: string;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Manages a single conversation thread for Consult / Diagnostic modes.
 *
 * - threadId tracks the active conversation. null = no thread yet (next send creates one).
 * - turns is the in-memory message list, synced with /chat responses.
 * - send() posts to /chat which auto-creates the thread on first call.
 * - load(threadId) replaces the active thread with persisted messages.
 * - reset() clears state (does NOT delete the thread from DB).
 *
 * The /chat endpoint persists every message server-side, so threads survive
 * page reloads. Use listThreads() to populate a sidebar.
 */
export function useThread(opts: UseThreadOptions) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ThreadTurn[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Send a turn — creates thread on first call, appends otherwise
  // ---------------------------------------------------------------------------
  const send = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);

    // Optimistic user turn — appears immediately
    const userTurn: ThreadTurn = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setTurns(prev => [...prev, userTurn]);

    try {
      const res = await queryClient.post('/api/v1/chat', {
        query: trimmed,
        threadId: threadId || undefined,
        userId: opts.userId,
        userName: opts.userName,
        userEmail: opts.userEmail,
        domain: opts.domain,
      });

      const data = res.data.data;

      // Capture threadId on first turn
      if (!threadId && data.threadId) {
        setThreadId(data.threadId);
      }

      const assistantTurn: ThreadTurn = {
        id: `server-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        source: data.source,
        approvedByName: data.approvedByName,
        validatedAt: data.validatedAt,
        confidence: data.confidence,
        grounding: data.metadata?.grounding,
        caution: data.metadata?.caution,
        citations: data.citations || [],
        resolvedQuery: data.resolvedQuery,
        queryWasRewritten: !!data.metadata?.queryRewritten,
        createdAt: new Date().toISOString(),
      };

      setTurns(prev => [...prev, assistantTurn]);
    } catch (err: any) {
      console.error('Send failed:', err);
      setError(err?.message || 'Failed to send message');
      // Roll back the optimistic user turn on error
      setTurns(prev => prev.filter(t => t.id !== userTurn.id));
    } finally {
      setSending(false);
    }
  }, [threadId, sending, opts.userId, opts.userName, opts.userEmail, opts.domain]);

  // ---------------------------------------------------------------------------
  // Load a persisted thread — replaces current state
  // ---------------------------------------------------------------------------
  const load = useCallback(async (id: string) => {
    setError(null);
    try {
      const res = await queryClient.get(`/api/v1/conversations/${id}`);
      const conv = res.data.data.conversation;
      const messages = res.data.data.messages || [];

      const loadedTurns: ThreadTurn[] = messages.map((m: any) => ({
        id: m.id,
        role: m.sender_type === 'user' ? 'user' : 'assistant',
        content: m.message,
        citations: m.citations || [],
        confidence: m.confidence,
        createdAt: m.created_at,
        // Source/badge info isn't stored per-message currently;
        // historical turns render without source badges. New turns get them.
      }));

      setThreadId(conv.id);
      setTurns(loadedTurns);
    } catch (err: any) {
      console.error('Load failed:', err);
      setError(err?.message || 'Failed to load conversation');
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Reset — clears state, does NOT delete the thread from DB
  // ---------------------------------------------------------------------------
  const reset = useCallback(() => {
    setThreadId(null);
    setTurns([]);
    setError(null);
  }, []);

  return {
    threadId,
    turns,
    sending,
    error,
    send,
    load,
    reset,
  };
}

// =============================================================================
// Thread list — for the drawer
// =============================================================================

/**
 * Lists conversations for the current user. Used by the thread drawer.
 * Refetched on demand (when drawer opens).
 */
export function useThreadList(userId: string | undefined) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await queryClient.get('/api/v1/conversations', {
        params: { user_id: userId, status: 'active', limit: 50 },
      });
      const list: ThreadSummary[] = (res.data.data?.conversations || []).map((c: any) => ({
        id: c.id,
        title: c.title || 'Untitled',
        lastMessage: c.last_message,
        lastMessageAt: c.last_message_at,
        createdAt: c.created_at,
      }));
      setThreads(list);
    } catch (err) {
      console.error('Thread list failed:', err);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) refresh();
  }, [userId, refresh]);

  return { threads, loading, refresh };
}
