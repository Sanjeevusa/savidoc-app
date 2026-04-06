import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { userId, phone } = await login(email, password);
      navigate('/verify-otp', { state: { userId, phone, purpose: 'login' } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top gradient bar */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, #0d9488, #0369a1, #7c3aed)',
        flexShrink: 0,
      }} />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '40px 20px',
        maxWidth: '400px',
        margin: '0 auto',
        width: '100%',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #0d9488 0%, #0369a1 100%)',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(13,148,136,0.3)',
            marginBottom: '16px',
          }}>
            <span style={{ color: 'white', fontSize: '26px', fontWeight: '800', letterSpacing: '-1px' }}>S</span>
          </div>
          <h1 style={{
            color: 'var(--text-primary)',
            fontSize: '24px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            margin: 0,
          }}>SaviDoc</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Clinical Knowledge & Training
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <h2 style={{
            color: 'var(--text-primary)',
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '4px',
            letterSpacing: '-0.3px',
          }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            Sign in to continue to your workspace
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@hospital.com"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  minHeight: '48px',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: '500', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 48px 12px 16px',
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    minHeight: '48px',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px',
                    color: 'var(--text-muted)', padding: '4px',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'var(--danger-light)',
                border: '1px solid var(--danger)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--danger)',
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'var(--accent-dark)' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '52px',
                fontFamily: 'inherit',
                transition: 'opacity 0.15s, transform 0.1s',
                marginTop: '4px',
              }}
              onMouseDown={e => !loading && ((e.target as HTMLElement).style.transform = 'scale(0.98)')}
              onMouseUp={e => ((e.target as HTMLElement).style.transform = 'scale(1)')}
            >
              {loading ? (
                <>
                  <svg style={{ width: 18, height: 18, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in...
                </>
              ) : 'Sign in →'}
            </button>

          </form>
        </div>

        {/* Register link */}
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>
            Create account
          </Link>
        </p>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '32px' }}>
          Secured with 2FA · Powered by Aurora RAG
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  );
}
