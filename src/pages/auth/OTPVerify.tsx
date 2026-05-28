import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type Purpose = 'verify_phone' | 'verify_email' | 'login' | 'reset_password';

export default function OTPVerify() {
  const { verifyOTP, resendOTP } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    userId: string;
    // Either or both may be present, depending on the originating flow
    email?: string;
    phone?: string;
    purpose: Purpose;
    assignedRole?: string;
  } | null;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!state?.userId) { navigate('/login'); return; }
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && index === 5 && newOtp.every(d => d)) handleVerify(newOtp.join(''));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); handleVerify(pasted); }
  }

  async function handleVerify(code?: string) {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) { setError('Please enter all 6 digits'); return; }
    setError(''); setLoading(true);
    try {
      await verifyOTP(state!.userId, otpCode, state!.purpose);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally { setLoading(false); }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      await resendOTP(state!.userId, state!.purpose);
      setResendCooldown(60); setResendSuccess(true); setError('');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => { setResendSuccess(false); inputRefs.current[0]?.focus(); }, 3000);
    } catch { setError('Failed to resend code. Please try again.'); }
  }

  // -- Channel / copy resolution ---------------------------------------------

  // Did this flow target email or phone? Prefer email when present (matches
  // the registration-via-email and password-reset paths).
  const channel: 'email' | 'phone' = state?.email ? 'email' : 'phone';

  const purposeConfig: Record<Purpose, { title: string; subtitle: string }> = {
    verify_email:   { title: 'Verify your email',    subtitle: 'We sent a 6-digit code to confirm your account' },
    verify_phone:   { title: 'Verify your phone',    subtitle: 'We sent a 6-digit code to confirm your account' },
    login:          { title: '2-step verification',  subtitle: "Enter the code we sent to confirm it's you" },
    reset_password: { title: 'Reset your password',  subtitle: 'Enter the code to proceed with password reset' },
  };

  const config = purposeConfig[state?.purpose || 'login'];

  // Mask the destination — email and phone get masked differently
  const maskedDestination = (() => {
    if (state?.email) {
      // jane.smith@hospital.com -> j••••••••@hospital.com
      const [local, domain] = state.email.split('@');
      if (!local || !domain) return state.email;
      const head = local.slice(0, 1);
      return `${head}${'•'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
    }
    if (state?.phone) {
      return state.phone.slice(0, -4).replace(/\d/g, '•') + state.phone.slice(-4);
    }
    return '';
  })();

  const icon = channel === 'email' ? '✉️' : '📱';
  const resendDestinationLabel = channel === 'email' ? 'your email' : 'your phone';

  const allFilled = otp.every(d => d !== '');

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #0d9488, #0369a1, #7c3aed)', flexShrink: 0 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 20px', maxWidth: '400px', margin: '0 auto', width: '100%' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #0d9488, #0369a1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(13,148,136,0.25)' }}>
            <span style={{ color: 'white', fontSize: '22px', fontWeight: '800' }}>S</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px 28px', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>

          {/* Icon — email or phone depending on channel */}
          <div style={{ width: '56px', height: '56px', background: 'var(--accent-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>
            {icon}
          </div>

          <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.3px' }}>
            {config.title}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '6px' }}>
            {config.subtitle}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', marginBottom: '28px' }}>
            {maskedDestination}
          </p>

          {/* OTP inputs */}
          <div
            style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                style={{
                  width: '46px',
                  height: '56px',
                  textAlign: 'center',
                  fontSize: '22px',
                  fontWeight: '700',
                  border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  background: digit ? 'var(--accent-light)' : 'var(--bg-card)',
                  color: digit ? 'var(--accent-dark)' : 'var(--text-primary)',
                  outline: 'none',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => { if (!digit) e.target.style.borderColor = 'var(--accent)'; }}
                onBlur={e => { if (!digit) e.target.style.borderColor = 'var(--border)'; }}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'var(--danger-light)', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--danger)', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Resend success */}
          {resendSuccess && (
            <div style={{ background: 'var(--success-light)', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--success)', marginBottom: '16px' }}>
              ✅ New code sent to {resendDestinationLabel}
            </div>
          )}

          {/* Verify button */}
          <button
            onClick={() => handleVerify()}
            disabled={!allFilled || loading}
            style={{
              width: '100%', background: (!allFilled || loading) ? 'var(--bg-tertiary)' : 'var(--accent)',
              color: (!allFilled || loading) ? 'var(--text-muted)' : 'white',
              border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '700',
              cursor: (!allFilled || loading) ? 'not-allowed' : 'pointer', minHeight: '52px',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.15s',
            }}
          >
            {loading ? (
              <><svg style={{ width: 18, height: 18, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Verifying...</>
            ) : 'Verify code →'}
          </button>

          {/* Resend */}
          <div style={{ marginTop: '20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              style={{
                background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent)',
                fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>

        {/* Back */}
        <p style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '14px', fontWeight: '500', fontFamily: 'inherit' }}
          >
            ← Back to sign in
          </button>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
