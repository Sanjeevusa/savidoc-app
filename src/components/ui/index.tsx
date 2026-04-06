import { forwardRef } from 'react';

// =============================================================================
// Button
// =============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  const base = 'btn';
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'btn-danger',
    warning:   'bg-amber-500 hover:bg-amber-600 text-white border-none',
  };
  const sizes = {
    sm: 'text-xs px-3 py-2 min-h-[36px] rounded-[8px]',
    md: '',
    lg: 'text-base px-6 py-3.5 min-h-[52px]',
  };

  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Spinner size={size === 'sm' ? 14 : 16} className="text-current" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

// =============================================================================
// Spinner
// =============================================================================

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 18, className = '' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// =============================================================================
// Card
// =============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', hover = false, onClick, padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm:   'p-3',
    md:   'p-4',
    lg:   'p-6',
  };
  return (
    <div
      className={`card ${hover ? 'card-hover cursor-pointer' : ''} ${paddings[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Badge
// =============================================================================

type BadgeVariant = 'teal' | 'green' | 'amber' | 'red' | 'blue' | 'muted' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({ children, variant = 'muted', size = 'md', dot = false }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    teal:   'badge-teal',
    green:  'badge-green',
    amber:  'badge-amber',
    red:    'badge-red',
    blue:   'badge-blue',
    muted:  'badge-muted',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };
  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: '',
  };

  return (
    <span className={`badge ${variants[variant]} ${sizes[size]}`}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
      )}
      {children}
    </span>
  );
}

// =============================================================================
// Input
// =============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-600 mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`input ${leftIcon ? 'pl-11' : ''} ${error ? 'border-red-400 focus:ring-red-100' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500 font-500">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

// =============================================================================
// Textarea
// =============================================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-600 mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`input resize-y min-h-[100px] ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// =============================================================================
// Select
// =============================================================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-600 mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <select
        className={`input appearance-none cursor-pointer ${className}`}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// =============================================================================
// Modal
// =============================================================================

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!open) return null;

  const sizes = {
    sm:  'max-w-sm',
    md:  'max-w-md',
    lg:  'max-w-lg',
    xl:  'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`card w-full ${sizes[size]} animate-slide-up max-h-[90vh] flex flex-col overflow-hidden`}
        style={{ padding: 0 }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-base font-700" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t flex gap-3" style={{ borderColor: 'var(--border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm font-600 mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      {description && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{description}</p>
      )}
      {action}
    </div>
  );
}

// =============================================================================
// Section (accordion)
// =============================================================================

interface SectionProps {
  title: string;
  subtitle?: string;
  badge?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  loading?: boolean;
  icon?: string;
}

export function Section({ title, subtitle, badge, open, onToggle, children, loading, icon }: SectionProps) {
  return (
    <div className="card overflow-hidden mb-3 animate-fade-in" style={{ padding: 0 }}>
      <button
        onClick={onToggle}
        className="section-header w-full text-left"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-base">{icon}</span>}
          <div>
            <span className="text-sm font-700" style={{ color: 'var(--text-primary)' }}>{title}</span>
            {subtitle && (
              <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{subtitle}</span>
            )}
          </div>
          {badge !== undefined && badge > 0 && (
            <Badge variant="amber">{badge}</Badge>
          )}
        </div>
        <span
          className="text-xs transition-transform duration-200"
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div style={{ background: 'var(--bg-card)' }}>
          {loading ? (
            <div className="p-4 space-y-3">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-4 w-5/6" />
            </div>
          ) : children}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Source Badge (for query responses)
// =============================================================================

interface SourceBadgeProps {
  source: string;
  approvedByName?: string | null;
  validatedAt?: string | null;
  confidence?: number | null;
}

export function SourceBadge({ source, approvedByName, validatedAt, confidence }: SourceBadgeProps) {
  const isValidated = source === 'validated' || source === 'validated_cache';
  const isRAG = source === 'rag' || source === 'knowledge_base';
  const isLLM = source === 'multi_llm' || source === 'public_llm';

  const config = isValidated
    ? { label: '✅ Expert Validated', variant: 'green' as const }
    : isRAG
    ? { label: '📄 Knowledge Base', variant: 'blue' as const }
    : { label: '🌐 AI Response', variant: 'purple' as const };

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={config.variant}>{config.label}</Badge>
        {!isValidated && !isLLM && confidence && confidence < 0.7 && (
          <Badge variant="amber">⚠️ Low confidence</Badge>
        )}
      </div>
      {isValidated && approvedByName && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Approved by <span style={{ color: 'var(--text-secondary)' }} className="font-500">{approvedByName}</span>
          {validatedAt && ` · ${new Date(validatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Dark mode toggle button
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
      }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

// =============================================================================
// Avatar
// =============================================================================

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(n => n.length > 1 && !['dr.','mr.','mrs.','ms.','prof.'].includes(n.toLowerCase()))
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  const sizes = {
    sm:  'w-7 h-7 text-xs',
    md:  'w-9 h-9 text-sm',
    lg:  'w-11 h-11 text-base',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-700 flex-shrink-0 ${className}`}
      style={{ background: 'linear-gradient(135deg, #0d9488, #0369a1)', color: 'white' }}
    >
      {initials}
    </div>
  );
}

// =============================================================================
// Citation badges
// =============================================================================

interface CitationBadgesProps {
  citations: Array<{ documentName?: string; documentTitle?: string; source?: string; page?: number }>;
}

export function CitationBadges({ citations }: CitationBadgesProps) {
  if (!citations || citations.length === 0) return null;

  const docMap = new Map<string, Set<number>>();
  citations.forEach(c => {
    const name = c.documentName || c.documentTitle || c.source || 'Document';
    if (!docMap.has(name)) docMap.set(name, new Set());
    if (c.page) docMap.get(name)!.add(c.page);
  });

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
      <p className="text-xs mb-2 font-500" style={{ color: 'var(--text-muted)' }}>📚 Sources</p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from(docMap.entries()).map(([name, pages]) => {
          const sortedPages = Array.from(pages).sort((a, b) => a - b);
          const pageStr = sortedPages.length > 0 ? ` · pp. ${sortedPages.join(', ')}` : '';
          const short = name.length > 35 ? name.slice(0, 32) + '…' : name;
          return (
            <span
              key={name}
              className="badge badge-muted text-xs"
              title={name + pageStr}
            >
              📄 {short}{pageStr}
            </span>
          );
        })}
      </div>
    </div>
  );
}
