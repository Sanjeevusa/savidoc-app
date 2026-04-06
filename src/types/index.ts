// =============================================================================
// Auth Types
// =============================================================================

export interface User {
  id: string;
  userId?: string;
  tenantId: string;
  name: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role: 'admin' | 'sme' | 'staff' | 'trainee';
  roleTitle?: string;
  departmentId: string | null;
  allowedDomains: string[];
  industryType?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    phone: string;
  };
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    phone: string;
    isFirstUser: boolean;
    assignedRole: string;
  };
}

// =============================================================================
// Query / KB Types
// =============================================================================

export type QuerySource =
  | 'validated'
  | 'validated_cache'
  | 'rag'
  | 'multi_llm'
  | 'public_llm'
  | 'knowledge_base';

export interface Citation {
  documentId: string;
  documentName: string;
  page?: number;
  section?: string;
  relevanceScore?: number;
}

export interface QueryResponse {
  source: QuerySource;
  sourceBadge: string;
  sourceDescription?: string;
  answer: string;
  confidence?: number;
  similarity?: number;
  hitCount?: number;
  validatedAt?: string;
  validatedBy?: string;
  approvedByName?: string;
  citations: Citation[];
  metadata: {
    latencyMs: number;
    domain?: string;
    queryId?: string;
    matchedQueryId?: string;
    matchedQueryText?: string;
    providerUsed?: string;
    modelUsed?: string;
  };
  responses?: Array<{
    provider: string;
    model: string;
    answer: string;
    latencyMs?: number;
  }>;
}

// =============================================================================
// Submission Types
// =============================================================================

export interface Submission {
  id: string;
  question: string;
  composedAnswer: string | null;
  rejectionNote: string | null;
  status: 'edited' | 'rejected';
  domains: string[];
  createdAt: string;
  validatedAt: string | null;
}

export interface SavedQuery {
  id: string;
  question: string;
  answer: string;
  domains: string[];
  hitCount: number;
  savedAt: string;
  approvedByName?: string | null;
  validatedAt?: string | null;
}

export interface FrequentQuery {
  id: string;
  question: string;
  answer: string;
  domains: string[];
  hitCount: number;
  departmentId: string | null;
  approvedByName?: string | null;
  validatedAt?: string | null;
}

// =============================================================================
// Validation Queue Types
// =============================================================================

export interface ValidationItem {
  id: string;
  queryText: string;
  composedAnswer: string;
  expertNotes: string;
  domain: string;
  domains: string[];
  source: string;
  confidence: number | null;
  status: string;
  smeEdit: boolean;
  submittedBy: string;
  submittedByRole: string;
  departmentId: string | null;
  createdAt: string;
  validatedAt: string | null;
  validatedByName: string | null;
}

// =============================================================================
// Department / Domain Types
// =============================================================================

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Domain {
  id: string;
  name: string;
  description?: string;
}

// =============================================================================
// API Response wrapper
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
