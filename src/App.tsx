import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import AskSaviDoc from './pages/ask/AskSaviDoc';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OTPVerify from './pages/auth/OTPVerify';
import { ThemeProvider } from './contexts/ThemeContext';
import ForgotPassword from './pages/auth/ForgotPassword';
import ValidationQueue from './pages/sme/ValidationQueue';
import ConsultSaviDoc from './pages/ask/ConsultSaviDoc';

// Placeholder pages
function AskPage() {
  const [mode, setMode] = useState<'ask' | 'consult'>('ask');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    fontSize: '14px',
    fontWeight: 600,
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button style={tabStyle(mode === 'ask')} onClick={() => setMode('ask')}>
          Ask
        </button>
        <button style={tabStyle(mode === 'consult')} onClick={() => setMode('consult')}>
          Consult
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {mode === 'ask' ? <AskSaviDoc /> : <ConsultSaviDoc />}
      </div>
    </div>
  );
}
function QuizPage() {
  return <div className="p-6 text-gray-500">Quiz — coming soon</div>;
}
function ProgressPage() {
  return <div className="p-6 text-gray-500">Progress — coming soon</div>;
}
function ValidationPage() {
  return <ValidationQueue />;
}


// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login"    element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/verify-otp" element={<OTPVerify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected routes wrapped in AppLayout */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <AskPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/quiz" element={
        <ProtectedRoute>
          <AppLayout>
            <QuizPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute>
          <AppLayout>
            <ProgressPage />
          </AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/validation" element={
        <ProtectedRoute>
          <AppLayout>
            <ValidationPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}