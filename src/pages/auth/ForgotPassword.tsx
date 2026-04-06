import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/client';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      const data = res.data;
      if (data.data?.userId) {
        navigate('/verify-otp', {
          state: { userId: data.data.userId, phone: '•••• ••••', purpose: 'reset_password' }
        });
      } else {
        setError('No account found with that email address.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Request failed. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #0d9488, #0369a1, #7c3aed)' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 20px', maxWidth: '400px', margin: '0 auto', width: '100%' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #0d9488, #0369a1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(13,148,136,0.25)' }}>
            <span style={{ color: 'white', fontSize: '22px', fontWeight: '800' }}>S</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px 28px', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>

          <div style={{ width: '56px', height: '56px', background: 'var(--accent-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>
            🔑
          </div>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>
            Reset password
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px', lineHeight: '1.5' }}>
            Enter your email and we'll send an OTP to your registered phone number
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
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
                style={{
                  width: '100%', background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                  borderRadius: '12px', padding: '12px 16px', fontSize: '15px', color: 'var(--text-primary)',
                  outline: 'none', boxSizing: 'border-box', minHeight: '48px', fontFamily: 'inherit',
                }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
              />
            </div>

            {error && (
              <div style={{ background: 'var(--danger-light)', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--danger)' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', background: loading ? 'var(--accent-dark)' : 'var(--accent)', color: 'white',
                border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer', minHeight: '52px', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading ? 'Sending...' : 'Send reset code →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/login" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}>
            ← Back to sign in
          </Link>
        </p>
      </div>
      <style>{`input::placeholder { color: var(--text-muted); }`}</style>
    </div>
  );
}
