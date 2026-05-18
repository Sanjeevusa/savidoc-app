import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useThread, useThreadList, type ThreadTurn } from '../../hooks/useThread';
import ConversationTurn from '../../components/ConversationTurn';

// =============================================================================
// Helpers
// =============================================================================

function timeAgo(dateString?: string): string {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// =============================================================================
// Thread drawer (slide-in from left)
// =============================================================================

function ThreadDrawer({ open, onClose, threads, loading, activeThreadId, onSelect, onNew }: {
  open: boolean;
  onClose: () => void;
  threads: Array<{ id: string; title: string; lastMessage?: string; lastMessageAt?: string; createdAt: string }>;
  loading: boolean;
  activeThreadId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease',
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: '85%', maxWidth: '320px',
        background: 'var(--bg-card)',
        zIndex: 100,
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
        }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Conversations
          </p>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              fontSize: '20px', cursor: 'pointer',
              color: 'var(--text-muted)',
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '6px',
            }}
          >×</button>
        </div>

        {/* New conversation button */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => { onNew(); onClose(); }}
            style={{
              width: '100%', padding: '10px',
              background: 'var(--accent)', color: 'white',
              border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            ➕ New Conversation
          </button>
        </div>

        {/* Thread list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {loading ? (
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 20, height: 20,
                border: '2px solid var(--accent)', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          ) : threads.length === 0 ? (
            <p style={{
              padding: '32px 20px', textAlign: 'center',
              fontSize: '13px', color: 'var(--text-muted)', margin: 0,
            }}>
              No conversations yet. Start a new one above.
            </p>
          ) : (
            threads.map(t => {
              const isActive = t.id === activeThreadId;
              return (
                <div
                  key={t.id}
                  onClick={() => { onSelect(t.id); onClose(); }}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                    background: isActive ? 'var(--accent-light)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <p style={{
                    fontSize: '13px', fontWeight: 600,
                    color: 'var(--text-primary)', margin: '0 0 3px 0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {t.title}
                  </p>
                  {t.lastMessage && (
                    <p style={{
                      fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 3px 0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {t.lastMessage}
                    </p>
                  )}
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
                    {timeAgo(t.lastMessageAt || t.createdAt)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// =============================================================================
// Main page
// =============================================================================

export default function ConsultSaviDoc() {
  const { user } = useAuth();
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { threadId, turns, sending, error, send, load, reset } = useThread({
    userId: user?.id || 'anonymous',
    userName: user?.name,
    userEmail: user?.email,
  });

  const { threads, loading: threadsLoading, refresh: refreshThreads } = useThreadList(user?.id);

  // Auto-scroll to bottom when new turn arrives
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [turns.length]);

  // Refresh thread list after a successful send (titles/last_message update)
  useEffect(() => {
    if (!sending && turns.length > 0) {
      refreshThreads();
    }
  }, [sending]);

  async function handleSend() {
    const message = draft.trim();
    if (!message || sending) return;
    setDraft('');
    // Reset textarea height
    if (composerRef.current) composerRef.current.style.height = 'auto';
    await send(message);
  }

  function handleNew() {
    reset();
    setDraft('');
    composerRef.current?.focus();
  }

  async function handleSelect(id: string) {
    await load(id);
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 50);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>

      {/* ── Header bar (drawer toggle + new conversation) ─────────── */}
      <div style={{
        flexShrink: 0,
        padding: '10px 14px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: 'inherit',
            color: 'var(--text-secondary)',
          }}
          aria-label="Open conversations"
        >
          ☰
        </button>
        <p style={{
          flex: 1, fontSize: '14px', fontWeight: 600,
          color: 'var(--text-primary)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {threadId
            ? threads.find((t: { id: string; title: string }) => t.id === threadId)?.title || 'Conversation'
            : 'New Conversation'}
        </p>
        {turns.length > 0 && (
          <button
            onClick={handleNew}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontFamily: 'inherit',
            }}
            title="Start a new conversation"
          >
            ✚ New
          </button>
        )}
      </div>

      {/* ── Conversation area (scrollable) ─────────────────────────── */}
      <div
        ref={scrollAreaRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 14px 16px',
          maxWidth: '760px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {turns.length === 0 && !sending && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '60px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Start a clinical consultation
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '320px', lineHeight: 1.5 }}>
              Ask about a case, follow up on details, and the assistant will keep the context across your questions.
            </p>
          </div>
        )}

        {turns.map((turn: ThreadTurn, i: number) => (
          <ConversationTurn
            key={turn.id}
            turn={turn}
            mode="consult"
            isLatest={i === turns.length - 1}
          />
        ))}

        {sending && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', marginBottom: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '4px 16px 16px 16px',
            maxWidth: 'fit-content',
          }}>
            <div style={{
              width: 14, height: 14,
              border: '2px solid var(--accent)', borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Thinking...</span>
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--danger-light)', color: 'var(--danger)',
            padding: '10px 14px', borderRadius: '10px',
            fontSize: '13px', marginBottom: '14px',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Composer (sticky bottom) ──────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        padding: '10px 12px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex', gap: '8px', alignItems: 'flex-end',
          maxWidth: '760px', margin: '0 auto',
        }}>
          <textarea
            ref={composerRef}
            value={draft}
            onChange={e => {
              setDraft(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={turns.length === 0
              ? "Describe the case or ask a question..."
              : "Continue the conversation..."}
            rows={1}
            style={{
              flex: 1, background: 'var(--bg-secondary)',
              border: '1.5px solid var(--border)',
              borderRadius: '14px',
              padding: '10px 14px',
              fontSize: '15px',
              color: 'var(--text-primary)',
              outline: 'none', resize: 'none',
              fontFamily: 'inherit', lineHeight: 1.5,
              minHeight: '44px', maxHeight: '120px',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
            onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
          />
          <button
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            style={{
              background: (sending || !draft.trim()) ? 'var(--bg-tertiary)' : 'var(--accent)',
              color: (sending || !draft.trim()) ? 'var(--text-muted)' : 'white',
              border: 'none',
              borderRadius: '14px',
              padding: '0 18px',
              fontSize: '14px', fontWeight: 700,
              cursor: (sending || !draft.trim()) ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              fontFamily: 'inherit',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>

      {/* ── Drawer ──────────────────────────────────────────────── */}
      <ThreadDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        threads={threads}
        loading={threadsLoading}
        activeThreadId={threadId}
        onSelect={handleSelect}
        onNew={handleNew}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        textarea::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
