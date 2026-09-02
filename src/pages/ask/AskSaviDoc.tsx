import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { queryApi, userApi, queryClient } from '../../api/client';
import type { QueryResponse, Submission, SavedQuery, FrequentQuery } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// =============================================================================
// Helpers
// =============================================================================

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// =============================================================================
// Styles
// =============================================================================

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
};

const sectionHeader: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border)',
  padding: '11px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  userSelect: 'none',
};

const itemRow: React.CSSProperties = {
  padding: '13px 16px',
  borderBottom: '1px solid var(--border)',
  cursor: 'pointer',
};

const badge = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '2px 10px', borderRadius: '999px',
  fontSize: '11px', fontWeight: '600',
  background: bg, color,
  whiteSpace: 'nowrap',
});

const btn = (accent = true): React.CSSProperties => ({
  flex: 1, padding: '11px 16px',
  background: accent ? 'var(--accent)' : 'transparent',
  color: accent ? 'white' : 'var(--text-secondary)',
  border: accent ? 'none' : '1.5px solid var(--border)',
  borderRadius: '12px', fontSize: '13px', fontWeight: '600',
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  transition: 'opacity 0.15s',
  minHeight: '40px',
});

// =============================================================================
// Source Badge
// =============================================================================

function SourceBadge({ source, approvedByName, validatedAt, confidence }: {
  source: string;
  approvedByName?: string | null;
  validatedAt?: string | null;
  confidence?: number | null;
}) {
  const isValidated = source === 'validated' || source === 'validated_cache';
  const isRAG = source === 'rag' || source === 'knowledge_base';

  const config = isValidated
    ? { label: '✅ Expert Validated', bg: 'var(--success-light)', color: 'var(--success)' }
    : isRAG
    ? { label: '📄 Knowledge Base', bg: 'var(--info-light)', color: 'var(--info)' }
    : { label: '🌐 AI Response', bg: 'var(--warning-light)', color: 'var(--warning)' };

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={badge(config.bg, config.color)}>{config.label}</span>
        {!isValidated && isRAG && confidence && confidence < 0.7 && (
          <span style={badge('var(--warning-light)', 'var(--warning)')}>⚠️ Low confidence</span>
        )}
      </div>
      {isValidated && approvedByName && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Approved by <strong style={{ color: 'var(--text-secondary)' }}>{approvedByName}</strong>
          {validatedAt && ` · ${new Date(validatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Citation Badges
// =============================================================================

function Citations({ citations }: { citations: Array<{ documentId?: string; documentName?: string; relevanceScore?: number }> }) {
  if (!citations?.length) return null;
  const [modalDoc, setModalDoc] = useState<{ id: string; name: string } | null>(null);

  const docGroups = new Map<string, { sourceNums: number[]; maxScore: number; documentId: string }>();
  citations.forEach((c, i) => {
    const name = c.documentName || 'Document';
    if (!docGroups.has(name)) docGroups.set(name, { sourceNums: [], maxScore: 0, documentId: c.documentId || '' });
    const group = docGroups.get(name)!;
    group.sourceNums.push(i + 1);
    group.maxScore = Math.max(group.maxScore, c.relevanceScore || 0);
  });

  const friendlyName = (filename: string) =>
    filename.replace(/[-_]/g, ' ').replace(/\.(pdf|txt|docx|md)$/i, '')
      .replace(/\b\w/g, c => c.toUpperCase()).slice(0, 55);

  return (
    <>
      {modalDoc && (
        <DocumentSummaryModal
          documentId={modalDoc.id}
          documentName={modalDoc.name}
          onClose={() => setModalDoc(null)}
        />
      )}
      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '2px solid var(--border)' }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Referenced Sources
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Array.from(docGroups.entries()).map(([name, { sourceNums, maxScore, documentId }]) => {
            return (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                  {sourceNums.slice(0, 5).map(n => (
                    <span key={n} style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '18px', height: '18px',
                      background: 'var(--accent)', color: 'white',
                      borderRadius: '4px', fontSize: '9px', fontWeight: '800',
                    }}>{n}</span>
                  ))}
                  {sourceNums.length > 5 && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '18px', height: '18px',
                      background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                      borderRadius: '4px', fontSize: '9px', fontWeight: '700',
                    }}>+{sourceNums.length - 5}</span>
                  )}
                </div>
                <button
                  onClick={() => setModalDoc({ id: documentId, name })}
                  style={{
                    fontSize: '12px', fontWeight: '600',
                    color: 'var(--accent)', flex: 1,
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', padding: 0, textDecoration: 'underline',
                    textDecorationColor: 'transparent',
                    transition: 'text-decoration-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.textDecorationColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
                  title="Click to view document summary"
                >
                  📄 {friendlyName(name)}
                </button>
                
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// =============================================================================
// Markdown Answer Renderer
// =============================================================================

const ANSWER_STYLES = `
  .savidoc-answer { font-size: 14px; line-height: 1.75; color: var(--text-primary); }
  .savidoc-answer h1 { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid var(--accent); }
  .savidoc-answer h2 { font-size: 15px; font-weight: 700; color: var(--accent); margin: 20px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid var(--border); }
  .savidoc-answer h3 { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 16px 0 6px 0; }
  .savidoc-answer h4 { font-size: 13px; font-weight: 700; color: var(--text-secondary); margin: 12px 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
  .savidoc-answer p { margin: 0 0 10px 0; }
  .savidoc-answer ul { margin: 6px 0 12px 0; padding-left: 20px; list-style: disc; }
  .savidoc-answer ol { margin: 6px 0 12px 0; padding-left: 20px; }
  .savidoc-answer li { margin: 4px 0; line-height: 1.6; }
  .savidoc-answer li + li { margin-top: 4px; }
  .savidoc-answer strong { font-weight: 700; color: var(--text-primary); }
  .savidoc-answer em { font-style: italic; color: var(--text-secondary); }
  .savidoc-answer hr { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
  .savidoc-answer blockquote { border-left: 3px solid var(--accent); padding: 8px 12px; margin: 12px 0; background: var(--bg-secondary); border-radius: 0 8px 8px 0; color: var(--text-secondary); font-style: italic; }
  .savidoc-answer code { font-family: monospace; font-size: 12px; background: var(--bg-secondary); padding: 1px 5px; border-radius: 4px; }
  .savidoc-answer table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  .savidoc-answer th { background: var(--accent); color: white; padding: 8px 12px; text-align: left; font-weight: 700; }
  .savidoc-answer td { padding: 7px 12px; border-bottom: 1px solid var(--border); }
  .savidoc-answer tr:nth-child(even) td { background: var(--bg-secondary); }
`;

function MarkdownAnswer({ text }: { text: string }) {
  return (
    <>
      <style>{ANSWER_STYLES}</style>
      <div className="savidoc-answer">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </>
  );
}

// =============================================================================
// Document Summary Modal
// =============================================================================

function DocumentSummaryModal({ documentId, documentName, onClose }: {
  documentId: string;
  documentName: string;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    queryClient.get(`/api/v1/documents/${documentId}/summary`)
      .then((res: any) => {
        setSummary(res.data.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load document summary.');
        setLoading(false);
      });
  }, [documentId]);

  const s = summary?.summary;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        width: '100%', maxWidth: '580px',
        maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--accent)', borderRadius: '16px 16px 0 0',
        }}>
          <div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              Document Summary
            </p>
            <p style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: '2px 0 0 0' }}>
              📄 {documentName.length > 45 ? documentName.slice(0, 42) + '…' : documentName}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px',
            color: 'white', fontSize: '18px', cursor: 'pointer',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {loading && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
              Loading summary…
            </p>
          )}
          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>
          )}
          {s && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Purpose */}
              {s.purpose && (
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Purpose</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5' }}>{s.purpose}</p>
                </div>
              )}

              {/* Summary */}
              {s.summary && (
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6', fontStyle: 'italic' }}>{s.summary}</p>
                </div>
              )}

              {/* Meta row */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {s.organisation && (
                  <span style={{ padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: '999px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    🏢 {s.organisation}
                  </span>
                )}
                {s.version && (
                  <span style={{ padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: '999px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    v{s.version}
                  </span>
                )}
                {s.documentType && (
                  <span style={{ padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: '999px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {s.documentType}
                  </span>
                )}
                {summary?.authorityLevel && (
                  <span style={{ padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: '999px', fontSize: '11px', fontWeight: '600', color: 'var(--accent)' }}>
                    Authority Level {summary.authorityLevel}
                  </span>
                )}
              </div>

              {/* Clinical domains */}
              {s.clinicalDomains?.length > 0 && (
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Domains Covered</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {s.clinicalDomains.map((d: string) => (
                      <span key={d} style={{ padding: '3px 8px', background: 'var(--accent)', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key topics */}
              {s.keyTopics?.length > 0 && (
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Key Topics</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {s.keyTopics.map((t: string) => (
                      <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: '700' }}>→</span>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target audience */}
              {s.targetAudience && (
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Target Audience</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{s.targetAudience}</p>
                </div>
              )}

              {/* Coverage notes */}
              {s.coverageNotes && (
                <div style={{ padding: '10px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#92400e', margin: '0 0 4px 0' }}>⚠ Coverage Notes</p>
                  <p style={{ fontSize: '12px', color: '#78350f', margin: 0, lineHeight: '1.5' }}>{s.coverageNotes}</p>
                </div>
              )}

              {/* Extraction quality */}
              {summary?.extractionQuality && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Extraction Quality:</span>
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    color: summary.extractionQuality.rating === 'excellent' ? '#16a34a'
                      : summary.extractionQuality.rating === 'good' ? '#16a34a'
                      : summary.extractionQuality.rating === 'moderate' ? '#ca8a04' : '#ef4444'
                  }}>
                    {summary.extractionQuality.rating?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ({summary.totalChunks} chunks · {summary.totalPages} pages)
                  </span>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Answer Card
// =============================================================================

function AnswerCard({ question, response, onSave, onDismiss, onSendForReview, onTakeForReview, isSMEOrAdmin, isSaving }: {
  question: string;
  response: QueryResponse;
  onSave: () => void;
  onDismiss: () => void;
  onSendForReview: (answer: string, comment?: string) => void;
  onTakeForReview: (answer: string) => void;
  isSMEOrAdmin: boolean;
  isSaving: boolean;
}) {
  const isLLM = response.source === 'multi_llm' || response.source === 'public_llm';
  const isValidated = response.source === 'validated' || response.source === 'validated_cache';
  const isKB = response.source === 'rag' || response.source === 'knowledge_base' || response.source === 'rag_low_confidence';
  const isLowConfidence = isKB && response.metadata?.grounding === 'thin';

  const [composedAnswer, setComposedAnswer] = useState(isLLM ? '' : response.answer || '');
  const [reviewComment, setReviewComment] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  // For KB responses, pre-fill composed answer
  useEffect(() => {
    if (!isLLM) setComposedAnswer(response.answer || '');
  }, [response.answer]);

  return (
    <div style={{ ...card, marginBottom: '12px' }}>
      {/* Question header */}
      <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
          ❓ {question}
        </p>
      </div>

      <div style={{ padding: '16px' }}>
        <SourceBadge
          source={response.source}
          approvedByName={response.approvedByName}
          validatedAt={response.validatedAt}
          grounding={response.metadata?.grounding}
        />

        {/* ── LLM path ─────────────────────────────────── */}
        {isLLM && (
          <>
            {response.responses && response.responses.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  AI Responses — read only
                </p>
                {response.responses.map((r, i) => (
                  <details key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '6px' }}>
                    <summary style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', cursor: 'pointer', fontSize: '13px', listStyle: 'none' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{r.provider}</span>
                      {r.model && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.model}</span>}
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>▼ expand</span>
                    </summary>
                    <MarkdownAnswer text={r.answer} />
                  </details>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                ✏️ Your Answer
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Compose from the AI responses above. Nothing is saved until you submit.
              </p>
              <textarea
                value={composedAnswer}
                onChange={e => setComposedAnswer(e.target.value)}
                rows={5}
                placeholder="Compose your validated answer here..."
                style={{
                  width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
                  borderRadius: '12px', padding: '12px', fontSize: '14px', color: 'var(--text-primary)',
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5',
                  boxSizing: 'border-box', marginBottom: '8px',
                }}
                onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
                onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
              />
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                rows={2}
                placeholder="Add a note for the reviewer... (optional)"
                style={{
                  width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
                  borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)',
                  outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '8px',
                }}
                onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
                onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                {isSMEOrAdmin ? (
                  <button
                    onClick={() => onTakeForReview(composedAnswer)}
                    disabled={!composedAnswer.trim()}
                    style={{
                      ...btn(true), flex: 1,
                      background: composedAnswer.trim() ? 'var(--info)' : 'var(--bg-tertiary)',
                      color: composedAnswer.trim() ? 'white' : 'var(--text-muted)',
                      cursor: composedAnswer.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    📝 Take for Review
                  </button>
                ) : (
                  <button
                    onClick={() => onSendForReview(composedAnswer, reviewComment)}
                    disabled={!composedAnswer.trim()}
                    style={{
                      ...btn(true), flex: 1,
                      background: composedAnswer.trim() ? 'var(--warning)' : 'var(--bg-tertiary)',
                      color: composedAnswer.trim() ? 'white' : 'var(--text-muted)',
                      cursor: composedAnswer.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    📤 Send for Expert Review
                  </button>
                )}
                <button onClick={onDismiss} style={btn(false)}>Dismiss</button>
              </div>
            </div>
          </>
        )}

        {/* ── KB / RAG path ─────────────────────────────── */}
        {isKB && (
          <>
            {response.metadata?.caution && (
              <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px' }}>
                <p style={{ fontSize: '13px', color: 'var(--warning)', margin: 0 }}>
                  ⚠️ {response.metadata.caution}
                  {response.metadata.gapNote && (
                    <span style={{ display: 'block', marginTop: '4px', opacity: 0.85 }}>
                      {response.metadata.gapNote}
                    </span>
                  )}
                </p>
              </div>
            )}

            <MarkdownAnswer text={response.answer} />
            <Citations citations={response.citations} />

            {/* Send/Take for Review flow */}
            {!showCompose ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {isSMEOrAdmin ? (
                  <button
                    onClick={() => onTakeForReview(response.answer)}
                    style={{ ...btn(false), borderColor: 'var(--info)', color: 'var(--info)' }}
                  >
                    📝 Take for Review
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCompose(true)}
                    style={{ ...btn(false), borderColor: 'var(--warning)', color: 'var(--warning)' }}
                  >
                    📤 Send for Review
                  </button>
                )}
                <button onClick={onSave} disabled={isSaving} style={{ ...btn(true), opacity: isSaving ? 0.6 : 1 }}>
                  {isSaving ? '...' : '🔖 Save'}
                </button>
                <button onClick={onDismiss} style={btn(false)}>Dismiss</button>
              </div>
            ) : (
              // Staff: show compose area pre-filled with KB answer
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  ✏️ Edit before submitting (optional)
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  The KB answer is pre-filled. Edit if needed, then submit for expert review.
                </p>
                <textarea
                  value={composedAnswer}
                  onChange={e => setComposedAnswer(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
                    borderRadius: '12px', padding: '12px', fontSize: '14px', color: 'var(--text-primary)',
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5',
                    boxSizing: 'border-box', marginBottom: '8px',
                  }}
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
                  onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
                />
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={2}
                  placeholder="Add a note for the reviewer... (optional)"
                  style={{
                    width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
                    borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)',
                    outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '8px',
                  }}
                  onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
                  onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onSendForReview(composedAnswer, reviewComment)}
                    disabled={!composedAnswer.trim()}
                    style={{
                      ...btn(true), flex: 1,
                      background: 'var(--warning)', color: 'white',
                    }}
                  >
                    📤 Send for Expert Review
                  </button>
                  <button onClick={() => setShowCompose(false)} style={btn(false)}>← Back</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Validated path ────────────────────────────── */}
        {isValidated && (
          <>
            <MarkdownAnswer text={response.answer} />
            <Citations citations={response.citations} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={onSave} disabled={isSaving} style={{ ...btn(true), opacity: isSaving ? 0.6 : 1 }}>
                {isSaving ? '...' : '🔖 Save'}
              </button>
              <button onClick={onDismiss} style={btn(false)}>Dismiss</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// =============================================================================
// Submission Card
// =============================================================================

function SubmissionCard({ item, onWithdraw, onResubmit, currentUser }: {
  item: Submission;
  onWithdraw: (id: string) => void;
  onResubmit: (id: string, answer: string, comment: string) => void;
  currentUser: { id: string; name: string; role: string; roleTitle?: string };
}) {
  const [open, setOpen] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState(item.composedAnswer || '');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Array<{
    id: string; userId: string; userName: string; userRole: string; comment: string; createdAt: string;
  }>>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const isPending = item.status === 'edited';
  const isRejected = item.status === 'rejected';

  useEffect(() => {
    if (open) loadComments();
  }, [open]);

  async function loadComments() {
    setLoadingComments(true);
    try {
      const res = await userApi.getComments(item.id);
      setComments(res.data.data || []);
    } catch { /* ignore */ }
    finally { setLoadingComments(false); }
  }

  function formatCommentTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const roleColor = (role: string) => {
    if (role === 'sme' || role === 'admin') return { bg: 'var(--info-light)', color: 'var(--info)' };
    return { bg: 'var(--accent-light)', color: 'var(--accent-dark)' };
  };

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Header row */}
      <div
        style={{ ...itemRow, borderBottom: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
              {isPending && <span style={badge('var(--warning-light)', 'var(--warning)')}>⏳ Awaiting Review</span>}
              {isRejected && <span style={badge('var(--danger-light)', 'var(--danger)')}>⚠️ Needs Revision</span>}
              {comments.length > 0 && (
                <span style={badge('var(--bg-secondary)', 'var(--text-muted)')}>💬 {comments.length}</span>
              )}
            </div>
            {isRejected && item.rejectionNote && (
              <p style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '4px', fontStyle: 'italic' }}>
                "{item.rejectionNote.slice(0, 70)}{item.rejectionNote.length > 70 ? '…' : ''}"
              </p>
            )}
            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
              {item.question}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{timeAgo(item.createdAt)}</p>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 16px 16px', background: 'var(--bg-secondary)' }}>

          {/* SME Feedback */}
          {isRejected && item.rejectionNote && (
            <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--danger)', marginBottom: '4px' }}>SME Feedback</p>
              <p style={{ fontSize: '13px', color: 'var(--danger)', margin: 0 }}>{item.rejectionNote}</p>
            </div>
          )}

          {/* Composed Answer */}
          <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Composed Answer
          </p>

          {isRejected ? (
            <textarea
              value={editedAnswer}
              onChange={e => setEditedAnswer(e.target.value)}
              rows={5}
              style={{ width: '100%', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
            />
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {item.composedAnswer || '(No answer composed)'}
            </div>
          )}

          {/* ── Comment Thread ─────────────────────────────── */}
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              💬 Discussion Thread
            </p>

            {loadingComments ? (
              <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 16, height: 16, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : comments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {comments.map(c => {
                  const rc = roleColor(c.userRole);
                  const isMe = c.userId === currentUser.id;
                  return (
                    <div key={c.id} style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${isMe ? 'var(--accent-light)' : 'var(--border)'}`,
                      borderRadius: '10px',
                      padding: '10px 12px',
                      borderLeft: `3px solid ${isMe ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {c.userName}
                        </span>
                        <span style={{
                          ...badge(rc.bg, rc.color),
                          fontSize: '10px', padding: '1px 8px',
                        }}>
                          {c.userRole}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          {formatCommentTime(c.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                        {c.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px' }}>
                No messages yet
              </p>
            )}

            {/* Add comment box */}
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              rows={2}
              placeholder="Add a note for the reviewer... (optional)"
              style={{ width: '100%', background: 'var(--bg-card)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '10px' }}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {isPending && (
              <button onClick={() => onWithdraw(item.id)} style={btn(false)}>✕ Withdraw</button>
            )}
            {isRejected && (
              <button
                onClick={() => onResubmit(item.id, editedAnswer, newComment)}
                style={btn(true)}
              >
                📤 Resubmit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// =============================================================================
// KB Card (My Queries + Frequently Asked)
// =============================================================================

function KBCard({ item, canRemove, onRemove, onAskAgain }: {
  item: SavedQuery | FrequentQuery;
  canRemove: boolean;
  onRemove?: (id: string) => void;
  onAskAgain: (question: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const domains = item.domains?.filter(d => d && d !== 'general') || [];

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{ ...itemRow, borderBottom: 'none' }} onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {domains.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                {domains.slice(0, 3).map(d => (
                  <span key={d} style={badge('var(--accent-light)', 'var(--accent-dark)')}>{d}</span>
                ))}
              </div>
            )}
            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', margin: 0, lineHeight: '1.4' }}>
              {item.question}
            </p>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 16px 16px', background: 'var(--bg-secondary)' }}>
          {/* Attribution */}
          {'approvedByName' in item && item.approvedByName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={badge('var(--success-light)', 'var(--success)')}>✅ Expert Validated</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {item.approvedByName}
                {'validatedAt' in item && item.validatedAt
                  ? ` · ${new Date(item.validatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ''}
              </span>
            </div>
          )}
          {'approvedByName' in item && !item.approvedByName && (
            <div style={{ marginBottom: '10px' }}>
              <span style={badge('var(--info-light)', 'var(--info)')}>📄 Knowledge Base</span>
            </div>
          )}

          <MarkdownAnswer text={item.answer} />

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button onClick={() => onAskAgain(item.question)} style={{ ...btn(false), borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              🔁 Ask Again
            </button>
            {canRemove && onRemove && (
              <button onClick={() => onRemove(item.id)} style={{ ...btn(false), flex: '0 0 auto', padding: '11px 14px' }}>
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Section wrapper
// =============================================================================

function Section({ title, icon, badge: badgeCount, open, onToggle, children, loading }: {
  title: string; icon: string; badge?: number;
  open: boolean; onToggle: () => void;
  children: React.ReactNode; loading?: boolean;
}) {
  return (
    <div style={{ ...card, marginBottom: '10px' }}>
      <div style={sectionHeader} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{icon}</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</span>
          {badgeCount !== undefined && badgeCount > 0 && (
            <span style={badge('var(--warning-light)', 'var(--warning)')}>{badgeCount}</span>
          )}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px', transition: 'transform 0.2s', transform: open ? 'none' : 'rotate(-90deg)', display: 'inline-block' }}>▼</span>
      </div>

      {open && (
        <div>
          {loading ? (
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '20px', height: '20px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : children}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Empty state
// =============================================================================

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ padding: '28px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{text}</p>
    </div>
  );
}

// =============================================================================
// Main page
// =============================================================================

export default function AskSaviDoc() {
  const { user } = useAuth();
  const isSMEOrAdmin = user?.role === 'sme' || user?.role === 'admin';

  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [sections, setSections] = useState({ submissions: true, myqueries: true, faq: true });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [frequentQueries, setFrequentQueries] = useState<FrequentQuery[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingMyQueries, setLoadingMyQueries] = useState(false);
  const [loadingFAQ, setLoadingFAQ] = useState(false);
  const [toast, setToast] = useState('');
  const [followups, setFollowups] = useState<string[]>([]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => { if (user) { loadSubmissions(); loadMyQueries(); loadFAQ(); } }, [user]);

  async function loadSubmissions() {
    if (!user?.id) return;
    setLoadingSubmissions(true);
    try { const r = await userApi.getSubmissions(user.id); setSubmissions(r.data.data || []); } catch {}
    finally { setLoadingSubmissions(false); }
  }

  async function loadMyQueries() {
    if (!user?.id) return;
    setLoadingMyQueries(true);
    try { const r = await userApi.getSavedQueries(user.id); setSavedQueries(r.data.data || []); } catch {}
    finally { setLoadingMyQueries(false); }
  }

  async function loadFAQ() {
    setLoadingFAQ(true);
    try { const r = await userApi.getFrequentlyAsked(user?.departmentId); setFrequentQueries(r.data.data || []); } catch {}
    finally { setLoadingFAQ(false); }
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true); setResponse(null); setCurrentQuestion(q);
    try {
      const res = await queryApi.ask(q);
      const data = res.data.data || res.data;
      console.log('response metadata:', data?.metadata);
      setResponse(data);
      // Load followups for KB and validated responses
      if (data.source !== 'multi_llm' && data.source !== 'public_llm') {
        loadFollowups(q, data.answer);
      }
    } catch (err) { console.error('Ask error:', err); }
    finally { setAsking(false); }
  }

  async function handleSave() {
    if (!user?.id || !response) return;
    const queryId = response.metadata?.queryId || response.metadata?.matchedQueryId;
    if (!queryId) return;
    setIsSaving(true);
    try {
      await userApi.saveQuery(user.id, queryId);
      await loadMyQueries();
      setResponse(null); setQuestion('');
    } catch {}
    finally { setIsSaving(false); }
  }

  async function handleSendForReview(answer: string, comment?: string) {
    if (!user || !response) return;
    const queryId = response.metadata?.queryId || response.metadata?.matchedQueryId;
    if (!queryId || !answer.trim()) return;
    try {
      await queryApi.sendForReview(queryId, answer, {
        userId: user.id, name: user.name, role: user.role, departmentId: user.departmentId,
      });
      
      console.log('comment to save:', comment, 'queryId:', queryId, 'userId:', user?.id);

      // Save initial comment if provided
      if (comment?.trim() && user) {
        await userApi.addComment(queryId, {
          userId: user.id,
          userName: user.name,
          userRole: user.roleTitle || user.role,
          comment: comment.trim(),
        });
      }

      await loadSubmissions();
      setResponse(null);
      setQuestion('');
    } catch (err) {
      console.error('Review error:', err);
    }
  }

  function handleDismiss() { setResponse(null); setQuestion(''); setFollowups([]); }

  async function handleWithdraw(id: string) {
    if (!confirm('Withdraw this submission?')) return;
    try { await userApi.withdrawSubmission(id); await loadSubmissions(); } catch {}
  }

  async function loadFollowups(question: string, answer: string) {
    try {
      const res = await queryApi.generateFollowups(question, answer);
      setFollowups(res.data.suggestions || []);
    } catch { setFollowups([]); }
  }

  async function handleResubmit(id: string, answer: string, comment: string) {
    if (!answer.trim()) return;
    try {
      await userApi.resubmit(id, answer);
      // Save comment if provided
      if (comment.trim() && user) {
        await userApi.addComment(id, {
          userId: user.id,
          userName: user.name,
          userRole: user.roleTitle || user.role,
          comment: comment.trim(),
        });
      }
      await loadSubmissions();
    } catch { /* ignore */ }
  }

  async function handleRemove(id: string) {
    if (!user?.id || !confirm('Remove from My Queries?')) return;
    try { await userApi.removeSavedQuery(user.id, id); await loadMyQueries(); } catch {}
  }

  async function handleTakeForReview(answer: string) {
    if (!user || !response) return;
    const queryId = response.metadata?.queryId || response.metadata?.matchedQueryId;
    if (!queryId || !answer.trim()) return;
    try {
      await queryClient.post(`/api/v1/validation/${queryId}/take-for-review`, {
        smeUserId: user.id,
        smeName: user.name,
        smeRole: user.roleTitle || user.role,
        departmentId: user.departmentId,
        existingAnswer: answer,
      });
      setToast('📝 Saved to your Validation Queue');
      setResponse(null);
      setQuestion('');
    } catch (err) {
      console.error('Take for review error:', err);
      setToast('❌ Failed to save. Please try again.');
    }
  }

  function prefillAndAsk(q: string) {
    setQuestion(q); setResponse(null);
    textareaRef.current?.focus();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>

      {/* ── Sticky Ask Bar ─────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px',
        flexShrink: 0,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', maxWidth: '720px', margin: '0 auto' }}>
          <textarea
            ref={textareaRef}
            value={question}
            onChange={e => {
              setQuestion(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
            placeholder="Ask a clinical question..."
            rows={2}
            style={{
              flex: 1, background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
              borderRadius: '14px', padding: '11px 14px', fontSize: '15px', color: 'var(--text-primary)',
              outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5',
              minHeight: '48px', maxHeight: '96px', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'}
            onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
          />
          <button
            onClick={handleAsk}
            disabled={asking || !question.trim()}
            style={{
              background: (asking || !question.trim()) ? 'var(--bg-tertiary)' : 'var(--accent)',
              color: (asking || !question.trim()) ? 'var(--text-muted)' : 'white',
              border: 'none', borderRadius: '14px', padding: '11px 18px',
              fontSize: '14px', fontWeight: '700', cursor: (asking || !question.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              flexShrink: 0, minHeight: '48px', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {asking ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                Thinking...
              </>
            ) : 'Ask →'}
          </button>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', maxWidth: '720px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Loading skeleton */}
        {asking && (
          <div style={{ ...card, padding: '20px', marginBottom: '12px' }}>
            {[0.4, 1, 0.7, 0.9, 0.5].map((w, i) => (
              <div key={i} style={{ height: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '10px', width: `${w * 100}%`, animation: 'shimmer 1.5s infinite', backgroundImage: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%)', backgroundSize: '200% 100%' }} />
            ))}
          </div>
        )}

        {/* Answer */}
        {response && !asking && (
          <>
            <AnswerCard
              question={currentQuestion}
              response={response}
              onSave={handleSave}
              onDismiss={handleDismiss}
              onSendForReview={handleSendForReview}
              onTakeForReview={handleTakeForReview}
              isSMEOrAdmin={isSMEOrAdmin}
              isSaving={isSaving}
            />

            {followups.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  🔍 Follow-up questions
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {followups.map((fq, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuestion(fq);
                        setFollowups([]);
                        setResponse(null);
                        textareaRef.current?.focus();
                      }}
                      style={{
                        textAlign: 'left',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        lineHeight: '1.4',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'}
                    >
                      → {fq}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* My Submissions — hidden for SME/Admin */}
        {!isSMEOrAdmin && (
          <Section icon="📤" title="My Submissions" badge={submissions.length} open={sections.submissions} onToggle={() => setSections(s => ({ ...s, submissions: !s.submissions }))} loading={loadingSubmissions}>
            {submissions.length === 0
              ? <Empty icon="📭" text="No pending submissions" />
              : submissions.map(item => (
                  <SubmissionCard
                    key={item.id}
                    item={item}
                    onWithdraw={handleWithdraw}
                    onResubmit={handleResubmit}
                    currentUser={{ id: user?.id || '', name: user?.name || '', role: user?.role || '', roleTitle: user?.roleTitle }}
                  />
                ))
            }
          </Section>
        )}

        {/* My Queries */}
        <Section icon="🔖" title="My Queries" badge={savedQueries.length} open={sections.myqueries} onToggle={() => setSections(s => ({ ...s, myqueries: !s.myqueries }))} loading={loadingMyQueries}>
          {savedQueries.length === 0
            ? <Empty icon="🔍" text="No saved queries yet — ask a question and save the answer" />
            : savedQueries.map(item => (
                <KBCard key={item.id} item={item} canRemove onRemove={handleRemove} onAskAgain={prefillAndAsk} />
              ))
          }
        </Section>

        {/* Frequently Asked */}
        <Section icon="🔥" title="Frequently Asked" open={sections.faq} onToggle={() => setSections(s => ({ ...s, faq: !s.faq }))} loading={loadingFAQ}>
          {frequentQueries.length === 0
            ? <Empty icon="💬" text="No approved queries in your department yet" />
            : frequentQueries.map(item => (
                <KBCard key={item.id} item={item} canRemove={false} onAskAgain={prefillAndAsk} />
              ))
          }
        </Section>

      </div>
      
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: toast.startsWith('✅') ? 'var(--success)' : 'var(--danger)',
          color: 'white', padding: '12px 20px', borderRadius: '12px',
          fontSize: '13px', fontWeight: '600', zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          maxWidth: '320px', textAlign: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}     


      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        textarea::placeholder { color: var(--text-muted); }
        details summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}
