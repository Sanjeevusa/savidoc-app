import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import AskSaviDoc from './pages/ask/AskSaviDoc';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OTPVerify from './pages/auth/OTPVerify';
import { ThemeProvider } from './contexts/ThemeContext';
import ForgotPassword from './pages/auth/ForgotPassword';
import ValidationQueue from './pages/sme/ValidationQueue';

// Placeholder pages
function AskPage() {
  return <AskSaviDoc />;
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