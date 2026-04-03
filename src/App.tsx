import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OTPVerify from './pages/auth/OTPVerify';

// Placeholder pages — will be built next
function AskPage() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h1 className="text-lg font-bold text-gray-800 mb-1">Welcome, {user?.name}</h1>
          <p className="text-sm text-gray-500 mb-1">Role: {user?.role}</p>
          <p className="text-sm text-gray-500 mb-4">Tenant: {user?.tenantId}</p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm"
          >
            Logout
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Ask SaviDoc workspace coming next...
        </p>
      </div>
    </div>
  );
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
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/verify-otp" element={<OTPVerify />} />
      <Route path="/" element={<ProtectedRoute><AskPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
