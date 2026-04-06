import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { queryClient } from '../../api/client';
import type { ValidationItem } from '../../types';

// =============================================================================
// Styles
// =============================================================================

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
  marginBottom: '12px',
};

const badge = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '2px 10px', borderRadius: '999px',
  fontSize: '11px', fontWeight: '600',
  background: bg, color, whiteSpace: 'nowrap',
});

const btn = (variant: 'primary' | 'success' | 'danger' | 'ghost'): React.CSSProperties => {
  const variants = {
    primary: { background: 'var(--accent)', color: 'white', border: 'none' },
    success: { background: 'var(--success)', color: 'white', border: 'none' },
    danger:  { background: 'var(--danger)', color: 'white', border: 'none' },
    ghost:   { background: 'transparent', color: 'var(--text-secondary)', border: '1.5px solid var(--border)' },
  };
  return {
    ...variants[variant],
    padding: '10px 16px', borderRadius: '10px',
    fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: '6px',
    transition: 'opacity 0.15s', minHeight: '40px',
  };
};

// =============================================================================
// Validation Modal
// =============================================================================

function ValidationModal({ item, onClose, onApprove, onReject }: {
  item: ValidationItem;
  onClose: () => void;
  onApprove: (id: string, answer: string, comment?: string) => Promise<void>;
  onReject: (id: string, note: string, comment?: string) => Promise<void>;
}) {
  const [expertAnswer, setExpertAnswer] = useState(item.composedAnswer || '');
  const [mode, setMode] = useState<'review' | 'reject'>('review');
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Array<{
    id: string; userId: string; userName: string; userRole: string; comment: string; createdAt: string;
  }>>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [smeComment, setSmeComment] = useState('');

  useEffect(() => {
    loadComments();
  }, []);

  async function loadComments() {
    setLoadingComments(true);
    try {
      const res = await queryClient.get(`/api/v1/queries/${item.id}/comments`);
      setComments(res.data.data || []);
    } catch { /* ignore */ }
    finally { setLoadingComments(false); }
  }

  async function handleApprove() {
    if (!expertAnswer.trim()) return;
    setLoading(true);
    try {
      await onApprove(item.id, expertAnswer, smeComment);
      onClose();
    } finally { setLoading(false); }
  }

  async function handleReject() {
    if (!smeComment.trim()) return;
    setLoading(true);
    try {
      await onReject(item.id, smeComment, smeComment);
      onClose();
    } finally { setLoading(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-secondary)',
    border: '1.5px solid var(--border)', borderRadius: '10px',
    padding: '10px 12px', fontSize: '14px', color: 'var(--text-primary)',
    outline: 'none', resize: 'vertical', fontFamily: 'inherit',
    lineHeight: '1.5', boxSizing: 'border-box',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg-card)', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              {item.smeEdit ? '✏️ SME Edit' : '📋 Validate Submission'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Submitted by {item.submittedBy} · {item.submittedByRole}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', padding: '4px 8px' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Question */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Question</p>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              {item.queryText}
            </div>
          </div>

          {/* Domain chips */}
          {item.domains && item.domains.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {item.domains.filter(d => d && d !== 'general').map(d => (
                <span key={d} style={badge('var(--accent-light)', 'var(--accent-dark)')}>{d}</span>
              ))}
            </div>
          )}

          {/* Expert Answer */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Expert Answer <span style={{ color: 'var(--text-muted)', fontWeight: '400', textTransform: 'none' }}>(edit if needed before approving)</span>
            </p>
            <textarea
              value={expertAnswer}
              onChange={e => setExpertAnswer(e.target.value)}
              rows={8}
              style={inputStyle}
              placeholder="Enter or edit the validated answer..."
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
            />
                                  
          </div>
          
          {/* Comment Thread */}
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              💬 Discussion Thread
            </p>
            {loadingComments ? (
              <div style={{ padding: '8px 0' }}>
                <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              </div>
            ) : comments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {comments.map(c => (
                  <div key={c.id} style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    borderLeft: `3px solid ${c.userRole === 'trainee' || c.userRole === 'staff' ? 'var(--accent)' : 'var(--info)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{c.userName}</span>
                      <span style={{ fontSize: '10px', padding: '1px 8px', borderRadius: '999px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{c.userRole}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {new Date(c.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>{c.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px' }}>No messages yet</p>
            )}

            {/* SME comment box */}
            <textarea
              value={smeComment}
              onChange={e => setSmeComment(e.target.value)}
              rows={2}
              placeholder="Add a note for the submitter... (optional)"
              style={{ width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
            />
          </div>
         
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ ...btn('ghost'), flex: '0 0 auto' }}>
            Cancel
          </button>
          {!item.smeEdit && smeComment.trim() ? (
            <button
              onClick={handleReject}
              disabled={loading}
              style={{
                ...btn('danger'), flex: 1, justifyContent: 'center',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Sending...' : '↩️ Return with Comments'}
            </button>
          ) : (
            <button
              onClick={handleApprove}
              disabled={loading || !expertAnswer.trim()}
              style={{
                ...btn('success'), flex: 1, justifyContent: 'center',
                opacity: loading || !expertAnswer.trim() ? 0.6 : 1,
                cursor: loading || !expertAnswer.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Publishing...
                </>
              ) : '✅ Approve & Publish'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Queue Item Row
// =============================================================================

function QueueItem({ item, onOpen }: { item: ValidationItem; onOpen: (item: ValidationItem) => void }) {
  const domains = item.domains?.filter(d => d && d !== 'general') || [];
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const h = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (h < 24) return `${h}h ago`;
    return `${days}d ago`;
  };

  return (
    <div
      style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
      onClick={() => onOpen(item)}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
            {item.smeEdit && <span style={badge('var(--info-light)', 'var(--info)')}>✏️ SME Edit</span>}
            {!item.smeEdit && <span style={badge('var(--warning-light)', 'var(--warning)')}>👤 Staff Submission</span>}
            {domains.slice(0, 2).map(d => (
              <span key={d} style={badge('var(--accent-light)', 'var(--accent-dark)')}>{d}</span>
            ))}
          </div>
          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
            {item.queryText}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
            {item.submittedBy} · {item.submittedByRole} · {timeAgo(item.createdAt)}
          </p>
        </div>
        <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: '600', flexShrink: 0, whiteSpace: 'nowrap' }}>
          Review →
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Main page
// =============================================================================

export default function ValidationQueue() {
  const { user } = useAuth();
  const [items, setItems] = useState<ValidationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ValidationItem | null>(null);
  const [toast, setToast] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [progress, setProgress] = useState({ show: false, step: '', done: false });

  useEffect(() => { loadQueue(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await queryClient.get('/api/v1/validation/pending');
      console.log('validation queue response:', res.data);
      const data = res.data.data?.queries || res.data.data || res.data?.queries || [];
      const dataArray = Array.isArray(data) ? data : [];
      setItems(dataArray);

      // Extract unique domains
      const allDomains = new Set<string>();
      data.forEach((item: ValidationItem) => {
        item.domains?.forEach(d => { if (d && d !== 'general') allDomains.add(d); });
      });
      setDomains(Array.from(allDomains));
    } catch (err) {
      console.error('Load queue error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string, expertAnswer: string, comment?: string) {
    setProgress({ show: true, step: '✅ Approving answer...', done: false });
    try {
      setTimeout(() => setProgress(p => ({ ...p, step: '⚙️ Generating semantic variants...' })), 800);
      setTimeout(() => setProgress(p => ({ ...p, step: '📚 Indexing to knowledge base...' })), 2200);

      const res = await queryClient.post(`/api/v1/validation/${id}`, {
        status: 'approved',
        expertAnswer,
        saveAsDocument: false,
        approvedBy: user?.id,
        approvedByName: user?.name,
        validatedByName: user?.name,
      });

      // Save SME comment if provided
      if (comment?.trim() && user) {
        await queryClient.post(`/api/v1/queries/${id}/comments`, {
          userId: user.id,
          userName: user.name,
          userRole: user.roleTitle || user.role,
          comment: comment.trim(),
        });
      }

      const { variantsGenerated } = res.data.data || {};
      setProgress({ show: true, step: `🎉 Published · ${variantsGenerated || 8} variants generated`, done: true });
      setTimeout(() => setProgress({ show: false, step: '', done: false }), 3000);
      await loadQueue();
    } catch (err) {
      console.error('Approve error:', err);
      setProgress({ show: false, step: '', done: false });
      setToast('❌ Failed to approve. Please try again.');
    }
  }

  async function handleReject(id: string, rejectionNote: string, comment?: string) {
    try {
      await queryClient.post(`/api/v1/validation/${id}`, {
        status: 'rejected',
        expertNotes: rejectionNote,
        validatedByName: user?.name,
      });

      // Save SME comment if provided
      if (comment?.trim() && user) {
        await queryClient.post(`/api/v1/queries/${id}/comments`, {
          userId: user.id,
          userName: user.name,
          userRole: user.roleTitle || user.role,
          comment: comment.trim(),
        });
      }

      setToast('↩️ Submission returned for revision');
      await loadQueue();
    } catch (err) {
      console.error('Reject error:', err);
      setToast('❌ Failed to return. Please try again.');
    }
  }

  const filtered = domainFilter
    ? items.filter(item => item.domains?.includes(domainFilter))
    : items;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '800px', margin: '0 auto', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
              ✅ Validation Queue
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {loading ? 'Loading...' : `${filtered.length} pending review`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Domain filter */}
            {domains.length > 0 && (
              <select
                value={domainFilter}
                onChange={e => setDomainFilter(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '8px 12px', fontSize: '13px',
                  color: 'var(--text-primary)', outline: 'none', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <option value="">All domains</option>
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}

            <button
              onClick={loadQueue}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '8px 14px', fontSize: '13px',
                fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div style={{ width: 28, height: 28, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Queue is empty
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              No submissions pending review
            </p>
          </div>
        ) : (
          <div style={{ ...card, padding: 0 }}>
            {/* Stats bar */}
            <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={badge('var(--warning-light)', 'var(--warning)')}>{items.filter(i => !i.smeEdit).length}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Staff submissions</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={badge('var(--info-light)', 'var(--info)')}>{items.filter(i => i.smeEdit).length}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SME edits</span>
              </div>
            </div>

            {filtered.map(item => (
              <QueueItem key={item.id} item={item} onOpen={setSelected} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <ValidationModal
          item={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Progress overlay */}
      {progress.show && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '36px 48px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            minWidth: '300px',
          }}>
            {!progress.done ? (
              <div style={{
                width: 44, height: 44,
                border: '3px solid var(--accent)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 20px',
              }} />
            ) : (
              <div style={{ fontSize: '44px', marginBottom: '16px' }}>🎉</div>
            )}
            <p style={{
              fontSize: '15px', fontWeight: '700',
              color: 'var(--text-primary)', margin: 0,
            }}>
              {progress.step}
            </p>
          </div>
        </div>
      )}

      
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.startsWith('✅') || toast.startsWith('↩️') ? 'var(--success)' : 'var(--danger)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600',
          zIndex: 200,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}
