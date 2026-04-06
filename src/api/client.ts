import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'e95d81e4-788b-40be-b3d2-c78d52f7324e';

// =============================================================================
// Axios instance
// =============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // for httpOnly refresh cookie
});

// Attach JWT access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient, TENANT_ID, API_BASE };

// =============================================================================
// Auth API
// =============================================================================

export const authApi = {
  register: (data: {
    title?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role: string;
    roleTitle: string;
    departmentId?: string;
    allowedDomains?: string[];
    industry?: string;
    industryType?: string;
  }) => apiClient.post('/api/v1/auth/register', { ...data, tenantId: TENANT_ID }),

  verifyOTP: (userId: string, otp: string, purpose: string) =>
    apiClient.post('/api/v1/auth/verify-otp', { userId, otp, purpose }),

  login: (email: string, password: string) =>
    apiClient.post('/api/v1/auth/login', { email, password, tenantId: TENANT_ID }),

  resendOTP: (userId: string, purpose: string) =>
    apiClient.post('/api/v1/auth/resend-otp', { userId, purpose }),

  logout: () => apiClient.post('/api/v1/auth/logout'),

  forgotPassword: (email: string) =>
    apiClient.post('/api/v1/auth/forgot-password', { email, tenantId: TENANT_ID }),

  resetPassword: (userId: string, newPassword: string) =>
    apiClient.post('/api/v1/auth/reset-password', { userId, newPassword }),

  me: () => apiClient.get('/api/v1/auth/me'),

  checkFirstUser: () =>
    axios.get(`${API_BASE}/api/v1/auth/check-first-user?tenantId=${TENANT_ID}`),

  getIndustries: () =>
    axios.get(`${API_BASE}/api/v1/auth/industries`),

  getRoles: () =>
    axios.get(`${API_BASE}/api/v1/tenant/roles?tenantId=${TENANT_ID}`),
};

// =============================================================================
// Query API (uses admin key for now — will use user JWT later)
// =============================================================================

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'sk_admin_98100d8e6eac52325365fcee7824020b73fc79213483149980e7eb649e877d1d';

export const queryClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_KEY}`,
  },
});

export const queryApi = {
  ask: (question: string) =>
    queryClient.post('/api/v1/query', {
      query: question,
      allowPublicLLM: true,
      multiLLM: true,
      domain: '',
    }),

  sendForReview: (queryId: string, composedAnswer: string, user: {
    userId: string;
    name: string;
    role: string;
    departmentId: string | null;
  }) =>
    queryClient.post(`/api/v1/validation/${queryId}`, {
      status: 'edited',
      expertAnswer: composedAnswer,
      saveAsDocument: false,
      submittedBy: user.name,
      submittedByRole: user.role,
      submittedById: user.userId,
      departmentId: user.departmentId,
    }),

  generateFollowups: (question: string, answer: string) =>
    queryClient.post('/api/v1/followups', { question, answer: answer.slice(0, 400) }),
};

// =============================================================================
// User API
// =============================================================================

export const userApi = {
  getSubmissions: (userId: string) =>
    queryClient.get(`/api/v1/user/${userId}/submissions`),

  getSavedQueries: (userId: string) =>
    queryClient.get(`/api/v1/user/${userId}/saved-queries`),

  saveQuery: (userId: string, queryId: string) =>
    queryClient.post(`/api/v1/user/${userId}/saved-queries/${queryId}`, {}),

  removeSavedQuery: (userId: string, queryId: string) =>
    queryClient.delete(`/api/v1/user/${userId}/saved-queries/${queryId}`),

  withdrawSubmission: (queryId: string) =>
    queryClient.post(`/api/v1/validation/${queryId}/withdraw`),

  resubmit: (queryId: string, composedAnswer: string) =>
    queryClient.put(`/api/v1/validation/${queryId}/resubmit`, { composedAnswer }),

  getFrequentlyAsked: (departmentId?: string | null) => {
    const params = new URLSearchParams({ limit: '10' });
    if (departmentId) params.set('departmentId', departmentId);
    return queryClient.get(`/api/v1/tenant/frequently-asked?${params}`);
  },

  getComments: (queryId: string) =>
    queryClient.get(`/api/v1/queries/${queryId}/comments`),

  addComment: (queryId: string, data: {
    userId: string;
    userName: string;
    userRole: string;
    comment: string;
  }) => queryClient.post(`/api/v1/queries/${queryId}/comments`, data),
};

// =============================================================================
// Departments & Domains
// =============================================================================

export const metaApi = {
  getDepartments: () => queryClient.get('/api/v1/departments'),
  getDomains: () => queryClient.get('/api/v1/domains'),
};
