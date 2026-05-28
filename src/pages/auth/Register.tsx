import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authApi, metaApi } from '../../api/client';
import type { Department, Domain } from '../../types';

// =============================================================================
// Constants
// =============================================================================

const TITLES = ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.', 'Nurse', 'None'];

// =============================================================================
// Styles
// =============================================================================

const inputStyle: React.CSSProperties = {
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
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '6px',
};

const hintStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  marginTop: '4px',
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={inputStyle}
      onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'}
      onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
    />
  );
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center',
      }}
      onFocus={e => (e.target as HTMLSelectElement).style.borderColor = 'var(--accent)'}
      onBlur={e => (e.target as HTMLSelectElement).style.borderColor = 'var(--border)'}
    />
  );
}

function ErrorBox({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--danger)' }}>
      ⚠️ {error}
    </div>
  );
}

function PrimaryButton({ onClick, disabled, loading, children, type = 'button' }: {
  onClick?: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode; type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%', background: (disabled || loading) ? 'var(--bg-tertiary)' : 'var(--accent)',
        color: (disabled || loading) ? 'var(--text-muted)' : 'white',
        border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: '700',
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer', minHeight: '52px',
        fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        transition: 'all 0.15s',
      }}
    >
      {loading ? (
        <><svg style={{ width: 18, height: 18, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg> {typeof children === 'string' ? 'Please wait...' : children}</>
      ) : children}
    </button>
  );
}

// =============================================================================
// Main component
// =============================================================================

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Step management
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [industryType, setIndustryType] = useState('generic');
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);

  // Form data
  const [form, setForm] = useState({
    title: 'Dr.',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    industry: '',
    industryType: 'generic',
    role: '',
    roleTitle: '',
    departmentId: '',
    allowedDomains: [] as string[],
  });

  // Data from API
  const [industries, setIndustries] = useState<string[]>([]);
  const [roles, setRoles] = useState<Array<{ name: string; systemRole: string }>>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // On mount — check if first user + load industries
  useEffect(() => {
    async function init() {
      try {
        const [firstRes, indRes] = await Promise.all([
          authApi.checkFirstUser(),
          authApi.getIndustries(),
        ]);
        const first = firstRes.data.data.isFirstUser;
        setIsFirstUser(first);
        setIndustries(indRes.data.data.industries || []);

        if (!first) {
          // Not first user — load roles based on existing tenant industry
          const industryT = firstRes.data.data.industryType || 'generic';
          setIndustryType(industryT);
          await loadRolesAndDepts(industryT);
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setCheckingFirstUser(false);
      }
    }
    init();
  }, []);

  async function loadRolesAndDepts(indType: string) {
    try {
      const [rolesRes, deptsRes, domsRes] = await Promise.all([
        authApi.getRoles(),
        metaApi.getDepartments(),
        metaApi.getDomains(),
      ]);
      setRoles(rolesRes.data.data.roles || []);
      setDepartments(deptsRes.data.data?.departments || []);
      console.log('departments loaded:', deptsRes.data.data?.departments?.length, deptsRes.data);
      setDomains((domsRes.data.data?.domains || []).filter((d: Domain) => d.name !== 'general'));
    } catch (err) {
      console.error('Load roles/depts error:', err);
    }
  }

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleDomain(domain: string) {
    setForm(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.includes(domain)
        ? prev.allowedDomains.filter(d => d !== domain)
        : [...prev.allowedDomains, domain],
    }));
  }

  // Validate step 1
  function validateStep1(): string {
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.lastName.trim()) return 'Last name is required';
    if (!form.email.includes('@')) return 'Valid email required';
    if (!form.phone.startsWith('+')) return 'Phone must include country code e.g. +44xxxxxxxxxx';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  }

  // Validate step 2 (industry — first user only)
  function validateStep2(): string {
    if (!form.industry) return 'Please select your industry';
    return '';
  }

  // Validate step 3 (role/dept)
  function validateStep3(): string {
    if (!form.role) return 'Please select your role';
    if (!isFirstUser && !form.departmentId) return 'Please select your department';
    return '';
  }

  function handleStep1Next() {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    if (isFirstUser) {
      setStep(2);
    } else {
      setStep(3);
    }
  }

  async function handleStep2Next() {
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError('');
    // Determine industry type
    const healthcareIndustries = ['Healthcare', 'Pharmaceuticals', 'Life Sciences'];
    const indType = healthcareIndustries.includes(form.industry) ? 'healthcare' : 'generic';
    setIndustryType(indType);
    setForm(prev => ({ ...prev, industryType: indType }));
    await loadRolesAndDepts(indType);
    setStep(3);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // For first user, auto-set admin role
    if (isFirstUser) {
      setForm(prev => ({ ...prev, role: 'admin', roleTitle: 'Administrator' }));
    }
    const err = isFirstUser ? '' : validateStep3();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const { userId, phone, assignedRole } = await register({
        title: form.title !== 'None' ? form.title : undefined,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: isFirstUser ? 'admin' : form.role,
        roleTitle: isFirstUser ? 'Administrator' : form.roleTitle,
        departmentId: form.departmentId || undefined,
        allowedDomains: form.allowedDomains,
        industry: form.industry || undefined,
        industryType: form.industryType || undefined,
      });
      navigate('/verify-otp', { state: { userId, email: form.email, purpose: 'verify_email', assignedRole } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = isFirstUser ? 3 : 2;
  const currentStep = isFirstUser ? step : step === 1 ? 1 : 2;

  if (checkingFirstUser) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '28px',
    boxShadow: 'var(--shadow-md)',
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #0d9488, #0369a1, #7c3aed)', flexShrink: 0 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 20px', maxWidth: '440px', margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #0d9488, #0369a1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(13,148,136,0.3)', flexShrink: 0 }}>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '16px' }}>S</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>SaviDoc</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isFirstUser ? 'Setting up your organisation' : 'Create your account'}
            </div>
          </div>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{ width: '22px', height: '4px', borderRadius: '2px', background: i < currentStep ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        {/* ── STEP 1 — Personal Details ──────────────────────── */}
        {step === 1 && (
          <div style={cardStyle}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
              Personal details
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '22px' }}>
              Step 1 of {totalSteps} — Your account information
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Title + First Name row */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '90px', flexShrink: 0 }}>
                  <label style={labelStyle}>Title</label>
                  <StyledSelect value={form.title} onChange={e => update('title', e.target.value)}>
                    {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </StyledSelect>
                </div>
                <Field label="First name" style={{ flex: 1 } as any}>
                  <StyledInput
                    type="text" value={form.firstName}
                    onChange={e => update('firstName', e.target.value)}
                    placeholder="Jane" autoComplete="given-name"
                  />
                </Field>
              </div>

              {/* Last name */}
              <Field label="Last name">
                <StyledInput
                  type="text" value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                  placeholder="Smith" autoComplete="family-name"
                />
              </Field>

              {/* Email */}
              <Field label="Email address">
                <StyledInput
                  type="email" value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="jane.smith@hospital.com"
                  autoComplete="email" autoCapitalize="none"
                />
              </Field>

              {/* Phone */}
              <Field label="Mobile number" hint="Include country code · Used for 2-step verification">
                <StyledInput
                  type="tel" value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="+44 7xxx xxxxxx"
                  autoComplete="tel"
                />
              </Field>

              {/* Password */}
              <Field label="Password">
                <StyledInput
                  type="password" value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
              </Field>

              {/* Confirm */}
              <Field label="Confirm password">
                <StyledInput
                  type="password" value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ErrorBox error={error} />
              <PrimaryButton onClick={handleStep1Next}>Continue →</PrimaryButton>
            </div>
          </div>
        )}

        {/* ── STEP 2 — Industry (first user only) ────────────── */}
        {step === 2 && isFirstUser && (
          <div style={cardStyle}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
              Your organisation
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>
              Step 2 of {totalSteps} — This sets up roles and terminology for your team
            </p>

            {/* First user notice */}
            <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--accent-dark)', margin: 0 }}>
                🎉 You're the first person from your organisation — you'll be set up as the Administrator.
              </p>
            </div>

            <Field label="Industry">
              <StyledSelect value={form.industry} onChange={e => update('industry', e.target.value)}>
                <option value="">Select your industry...</option>
                {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </StyledSelect>
            </Field>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ErrorBox error={error} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  style={{ padding: '14px 18px', background: 'transparent', border: '1.5px solid var(--border)', borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                >
                  ← Back
                </button>
                <div style={{ flex: 1 }}>
                  <PrimaryButton onClick={handleStep2Next}>Continue →</PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3 — Role & Department ──────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <div style={cardStyle}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                {isFirstUser ? 'Your role' : 'Professional profile'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                Step {isFirstUser ? '3' : '2'} of {totalSteps} — {isFirstUser ? 'Confirm your administrator role' : 'Tell us about your position'}
              </p>

              {/* Role selector */}
              {isFirstUser ? (
                // First user — admin role is fixed
                <div style={{ background: 'var(--accent-light)', border: '2px solid var(--accent)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>⚙️</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Administrator</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Full system access · Can manage all users and settings</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontWeight: '700' }}>✓</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {roles.map(r => (
                    <button
                      key={r.name}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, role: r.systemRole, roleTitle: r.name }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                        borderRadius: '12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                        border: `2px solid ${form.roleTitle === r.name ? 'var(--accent)' : 'var(--border)'}`,
                        background: form.roleTitle === r.name ? 'var(--accent-light)' : 'var(--bg-card)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{r.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          System role: {r.systemRole}
                        </div>
                      </div>
                      {form.roleTitle === r.name && <span style={{ color: 'var(--accent)', fontWeight: '700', flexShrink: 0 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Department — required for non-first users */}
              {!isFirstUser && departments.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>
                    Department <span style={{ color: 'var(--danger)', marginLeft: '2px' }}>*</span>
                  </label>
                  <StyledSelect
                    value={form.departmentId}
                    onChange={e => update('departmentId', e.target.value)}
                  >
                    <option value="">Select your department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </StyledSelect>
                  <p style={hintStyle}>Contact your Admin if your department is not listed</p>
                </div>
              )}

              {/* Department not configured yet */}
              {!isFirstUser && departments.length === 0 && (
                <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--warning)', margin: 0 }}>
                    ⚠️ No departments set up yet. Contact your Administrator to add departments before registering.
                  </p>
                </div>
              )}

              {/* Clinical specialisation (optional) */}
              {!isFirstUser && domains.length > 0 && (
                <div>
                  <label style={labelStyle}>
                    Specialisation <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>(optional)</span>
                  </label>
                  <p style={{ ...hintStyle, marginBottom: '10px', marginTop: '-2px' }}>Select all areas relevant to your practice</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {domains.map(d => (
                      <button
                        key={d.name}
                        type="button"
                        onClick={() => toggleDomain(d.name)}
                        style={{
                          padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '600',
                          border: `2px solid ${form.allowedDomains.includes(d.name) ? 'var(--accent)' : 'var(--border)'}`,
                          background: form.allowedDomains.includes(d.name) ? 'var(--accent)' : 'transparent',
                          color: form.allowedDomains.includes(d.name) ? 'white' : 'var(--text-secondary)',
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        }}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ErrorBox error={error} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setStep(isFirstUser ? 2 : 1); setError(''); }}
                  style={{ padding: '14px 18px', background: 'transparent', border: '1.5px solid var(--border)', borderRadius: '14px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                >
                  ← Back
                </button>
                <div style={{ flex: 1 }}>
                  <PrimaryButton
                    type="submit"
                    loading={loading}
                    disabled={!isFirstUser && (!form.role || !form.departmentId)}
                  >
                    Create account →
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: var(--text-muted); }
        select option { background: var(--bg-card); color: var(--text-primary); }
      `}</style>
    </div>
  );
}
