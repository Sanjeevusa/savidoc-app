import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// =============================================================================
// Nav config
// =============================================================================

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/',           label: 'Ask',       icon: '💬', roles: ['admin', 'sme', 'staff', 'trainee'] },
  { path: '/quiz',       label: 'Quiz',       icon: '📝', roles: ['admin', 'sme', 'staff', 'trainee'] },
  { path: '/progress',   label: 'Progress',   icon: '📈', roles: ['admin', 'sme', 'staff', 'trainee'] },
  { path: '/validation', label: 'Validate',   icon: '✅', roles: ['admin', 'sme'] },
  { path: '/quiz-builder', label: 'Builder',  icon: '🎯', roles: ['admin', 'sme'] },
];

// =============================================================================
// Avatar
// =============================================================================

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(n => n.length > 1 && !['dr.', 'mr.', 'mrs.', 'ms.', 'prof.'].includes(n.toLowerCase()))
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '??';

  return (
    <div style={{
      width: size, height: size,
      background: 'linear-gradient(135deg, #0d9488, #0369a1)',
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white',
      fontSize: size * 0.35,
      fontWeight: '700',
      flexShrink: 0,
      letterSpacing: '-0.5px',
    }}>
      {initials}
    </div>
  );
}

// =============================================================================
// Theme toggle
// =============================================================================

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      style={{
        width: '36px', height: '36px',
        borderRadius: '10px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '16px',
        transition: 'background 0.15s',
        flexShrink: 0,
      }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

// =============================================================================
// AppLayout
// =============================================================================

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const roleLabel: Record<string, string> = {
    admin:   'Hospital Admin',
    sme:     'SME / Specialist',
    staff:   'Senior Staff',
    trainee: 'Trainee / Resident',
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: '220px',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }} className="hidden-mobile">

        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #0d9488, #0369a1)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
            flexShrink: 0,
          }}>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '16px' }}>S</span>
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>SaviDoc</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Clinical Knowledge</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: isActive ? '700' : '500',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: '17px' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User profile */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ThemeToggle />
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px', cursor: 'pointer', position: 'relative' }}
            onClick={() => setProfileOpen(o => !o)}
          >
            <Avatar name={user?.name || ''} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {roleLabel[user?.role || ''] || user?.role}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); handleLogout(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)', fontSize: '14px', borderRadius: '6px', flexShrink: 0 }}
              title="Sign out"
            >
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Mobile header */}
        <header style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }} className="show-mobile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #0d9488, #0369a1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: '800', fontSize: '13px' }}>S</span>
            </div>
            <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>SaviDoc</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle />
            <Avatar name={user?.name || ''} size={30} />
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>

        {/* ── Mobile Bottom Nav ──────────────────────────────────── */}
        <nav style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '4px 8px',
          paddingBottom: 'calc(4px + env(safe-area-inset-bottom))',
          flexShrink: 0,
        }} className="show-mobile">
          {visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 10px',
                borderRadius: '10px',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                textDecoration: 'none',
                minWidth: '52px',
                transition: 'color 0.15s',
              })}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.2px' }}>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '6px 10px', borderRadius: '10px', minWidth: '52px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: '20px' }}>👤</span>
            <span style={{ fontSize: '10px', fontWeight: '600' }}>Sign out</span>
          </button>
        </nav>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile   { display: none !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
        a:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}
