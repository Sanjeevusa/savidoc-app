import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { metaApi } from '../../api/client';
import type { Department, Domain } from '../../types';

const ROLES = [
  { value: 'trainee',  label: 'Trainee / Resident' },
  { value: 'staff',    label: 'Senior Staff / Nurse' },
  { value: 'sme',      label: 'SME / Specialist' },
  { value: 'admin',    label: 'Administrator' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'trainee',
    departmentId: '',
    allowedDomains: [] as string[],
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    metaApi.getDepartments()
      .then(r => setDepartments(r.data.data?.departments || []))
      .catch(() => {});
    metaApi.getDomains()
      .then(r => setDomains((r.data.data?.domains || []).filter((d: Domain) => d.name !== 'general')))
      .catch(() => {});
  }, []);

  function toggleDomain(domain: string) {
    setForm(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.includes(domain)
        ? prev.allowedDomains.filter(d => d !== domain)
        : [...prev.allowedDomains, domain],
    }));
  }

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!form.phone.startsWith('+')) {
      setError('Phone must include country code e.g. +919xxxxxxxxx');
      return;
    }

    setLoading(true);
    try {
      const { userId, phone, assignedRole } = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        departmentId: form.departmentId || undefined,
        allowedDomains: form.allowedDomains,
      });

      navigate('/verify-otp', {
        state: { userId, phone, purpose: 'verify_phone', assignedRole }
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white px-6 py-10">

      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
          <span className="text-white text-xl font-bold">S</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800">SaviDoc</h1>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 w-full max-w-sm mx-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Create account</h2>
        <p className="text-sm text-gray-500 mb-5">Join your hospital's knowledge platform</p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Dr. Jane Smith"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="you@hospital.com"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile number
              <span className="text-gray-400 font-normal ml-1">(for OTP)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="+919xxxxxxxxx"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="Min 8 characters"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => update('confirmPassword', e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your role</label>
            <select
              value={form.role}
              onChange={e => update('role', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          {departments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={form.departmentId}
                onChange={e => update('departmentId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">Select department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Domain Expertise */}
          {domains.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain expertise
                <span className="text-gray-400 font-normal ml-1">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {domains.map(d => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => toggleDomain(d.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.allowedDomains.includes(d.name)
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, allowedDomains: [] }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.allowedDomains.length === 0
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  No specific expertise
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold text-sm hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-500 font-medium hover:text-brand-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}
