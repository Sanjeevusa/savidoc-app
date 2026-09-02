import ReactMarkdown from 'react-markdown';
import type { ThreadTurn } from '../hooks/useThread';
import remarkGfm from 'remark-gfm';

// =============================================================================
// Types
// =============================================================================

export type ConversationMode = 'consult' | 'diagnostic';

interface Props {
  turn: ThreadTurn;
  mode: ConversationMode;
  isLatest: boolean;
}

// =============================================================================
// Inline styles (matches AskSaviDoc.tsx pattern — CSS vars from app theme)
// =============================================================================

const badge = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '2px 10px', borderRadius: '999px',
  fontSize: '11px', fontWeight: 600,
  background: bg, color,
  whiteSpace: 'nowrap',
});

// =============================================================================
// Source badge — reused from AskSaviDoc pattern
// =============================================================================

function SourceBadge({ turn }: { turn: ThreadTurn }) {
  if (!turn.source) return null;

  const isValidated = turn.source === 'validated' || turn.source === 'validated_cache';
  const isRAG = turn.source === 'rag' || turn.source === 'knowledge_base';

  const config = isValidated
    ? { label: '✅ Expert Validated', bg: 'var(--success-light)', color: 'var(--success)' }
    : isRAG
    ? { label: '📄 Knowledge Base', bg: 'var(--info-light)', color: 'var(--info)' }
    : { label: '🌐 AI Response', bg: 'var(--warning-light)', color: 'var(--warning)' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
      <span style={badge(config.bg, config.color)}>{config.label}</span>
      {isValidated && turn.approvedByName && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {turn.approvedByName}
          {turn.validatedAt && ` · ${new Date(turn.validatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </span>
      )}
      {!isValidated && isRAG && turn.grounding === 'thin' && (
        <span style={badge('var(--warning-light)', 'var(--warning)')}>⚠️ Limited sources</span>
      )}
    </div>
  );
}

// =============================================================================
// Citations — compact form for mobile
// =============================================================================

function CompactCitations({ citations }: { citations: ThreadTurn['citations'] }) {
  if (!citations?.length) return null;

  // Group by document, keep source numbers
  const docGroups = new Map<string, { sourceNums: number[]; maxScore: number }>();
  citations.forEach((c, i) => {
    const name = c.documentName || 'Document';
    if (!docGroups.has(name)) docGroups.set(name, { sourceNums: [], maxScore: 0 });
    const g = docGroups.get(name)!;
    g.sourceNums.push(i + 1);
    g.maxScore = Math.max(g.maxScore, c.relevanceScore || 0);
  });

  const friendlyName = (filename: string) =>
    filename.replace(/[-_]/g, ' ').replace(/\.(pdf|txt|docx|md)$/i, '')
      .replace(/\b\w/g, c => c.toUpperCase()).slice(0, 50);

  return (
    <details style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
      <summary style={{
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        cursor: 'pointer',
        listStyle: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span>▶</span> Sources ({docGroups.size})
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '8px' }}>
        {Array.from(docGroups.entries()).map(([name, { sourceNums, maxScore }]) => {
          
          return (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 10px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              fontSize: '11px',
            }}>
              <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                {sourceNums.slice(0, 3).map(n => (
                  <span key={n} style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '16px', height: '16px',
                    background: 'var(--accent)', color: 'white',
                    borderRadius: '3px', fontSize: '9px', fontWeight: 800,
                  }}>{n}</span>
                ))}
                {sourceNums.length > 3 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '16px', height: '16px',
                    background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                    borderRadius: '3px', fontSize: '9px', fontWeight: 700,
                  }}>+{sourceNums.length - 3}</span>
                )}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📄 {friendlyName(name)}
              </span>
            </div>
          );
        })}
      </div>
    </details>
  );
}

// =============================================================================
// Markdown styles — scoped for conversation turns (lighter than AskSaviDoc)
// =============================================================================

const TURN_MARKDOWN_STYLES = `
  .conv-md { font-size: 14px; line-height: 1.65; color: var(--text-primary); }
  .conv-md p { margin: 0 0 8px 0; }
  .conv-md p:last-child { margin-bottom: 0; }
  .conv-md h1, .conv-md h2 { font-size: 15px; font-weight: 700; color: var(--accent); margin: 12px 0 6px 0; }
  .conv-md h3 { font-size: 14px; font-weight: 700; margin: 10px 0 4px 0; }
  .conv-md ul, .conv-md ol { margin: 4px 0 8px 0; padding-left: 20px; }
  .conv-md li { margin: 3px 0; line-height: 1.55; }
  .conv-md strong { font-weight: 700; }
  .conv-md em { font-style: italic; color: var(--text-secondary); }
  .conv-md code { font-family: monospace; font-size: 12px; background: var(--bg-secondary); padding: 1px 5px; border-radius: 3px; }
  .conv-md hr { border: none; border-top: 1px solid var(--border); margin: 10px 0; }
  .conv-md table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
  .conv-md th { background: var(--accent); color: white; padding: 6px 8px; text-align: left; font-weight: 700; }
  .conv-md td { padding: 5px 8px; border-bottom: 1px solid var(--border); }
`;

// =============================================================================
// User turn — right-aligned bubble
// =============================================================================

function UserTurn({ turn }: { turn: ThreadTurn }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: '10px',
      paddingLeft: '20%',
    }}>
      <div style={{
        background: 'var(--accent)',
        color: 'white',
        padding: '10px 14px',
        borderRadius: '16px 16px 4px 16px',
        fontSize: '14px',
        lineHeight: 1.5,
        maxWidth: '100%',
        wordBreak: 'break-word',
      }}>
        {turn.content}
      </div>
    </div>
  );
}

// =============================================================================
// Assistant turn — left-aligned card
// =============================================================================

function AssistantTurn({ turn }: { turn: ThreadTurn; mode: ConversationMode; isLatest: boolean }) {
  const showRewriteHint = turn.queryWasRewritten && turn.resolvedQuery;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '14px',
      paddingRight: '15%',
    }}>
      {showRewriteHint && (
        <div style={{
          fontSize: '11px',
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          marginBottom: '6px',
          paddingLeft: '4px',
        }}>
          ↳ Searched as: {turn.resolvedQuery}
        </div>
      )}

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '4px 16px 16px 16px',
        padding: '12px 14px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <SourceBadge turn={turn} />
        <div className="conv-md">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.content}</ReactMarkdown>
        </div>
        <CompactCitations citations={turn.citations} />
      </div>
    </div>
  );
}

// =============================================================================
// Main export — one turn (either user or assistant)
// =============================================================================

export default function ConversationTurn({ turn, mode, isLatest }: Props) {
  return (
    <>
      <style>{TURN_MARKDOWN_STYLES}</style>
      {turn.role === 'user'
        ? <UserTurn turn={turn} />
        : <AssistantTurn turn={turn} mode={mode} isLatest={isLatest} />}
    </>
  );
}
