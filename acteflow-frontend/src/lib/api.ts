import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      
      if (status === 401) {
        // Unauthorized - Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      if (status === 403) {
        // Forbidden - Not enough permissions
        console.error('Access forbidden');
      }
      
      if (status >= 500) {
        // Server error
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response
      console.error('Network error - no response received');
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const api = {
    // Performance - Session Tracking
  logWorkSession: (sessionType: 'login' | 'logout') =>
    apiClient.post('/api/performance/session', { session_type: sessionType }),

  // Performance - User Reports
  getUserPerformance: (userId: number, startDate: string, endDate: string) =>
    apiClient.get(`/api/performance/user/${userId}`, {
      params: { start_date: startDate, end_date: endDate }
    }),

  getHourlyDistribution: (userId: number, startDate: string, endDate: string) =>
    apiClient.get(`/api/performance/user/${userId}/hourly`, {
      params: { start_date: startDate, end_date: endDate }
    }),

  getDailyActivity: (userId: number, startDate: string, endDate: string) =>
    apiClient.get(`/api/performance/user/${userId}/daily`, {
      params: { start_date: startDate, end_date: endDate }
    }),

  getWorkHours: (userId: number, startDate: string, endDate: string) =>
    apiClient.get(`/api/performance/user/${userId}/work-hours`, {
      params: { start_date: startDate, end_date: endDate }
    }),

  // Performance - Admin Analytics
  getPerformanceDashboard: (startDate: string, endDate: string) =>
    apiClient.get('/api/performance/dashboard', {
      params: { start_date: startDate, end_date: endDate }
    }),

  getWeeklyComparison: (startDate: string, endDate: string) =>
    apiClient.get('/api/performance/weekly', {
      params: { start_date: startDate, end_date: endDate }
    }),

  getMonthlyPerformance: (year: number, month: number) =>
    apiClient.get('/api/performance/monthly', {
      params: { year, month }
    }),

  getTopPerformers: (startDate: string, endDate: string, limit: number = 10) =>
    apiClient.get('/api/performance/top-performers', {
      params: { start_date: startDate, end_date: endDate, limit }
    }),

  getAllUsersPerformance: (startDate: string, endDate: string) =>
    apiClient.get('/api/performance/all-users', {
      params: { start_date: startDate, end_date: endDate }
    }),

  exportPerformanceCSV: (startDate: string, endDate: string) =>
    apiClient.get('/api/performance/export/csv', {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob'
    }),

  // Auth
  login: (username: string, password: string) =>
    apiClient.post('/api/auth/login', { username, password }),
  
  logout: () =>
    apiClient.post('/api/auth/logout'),
  
  getCurrentUser: () =>
    apiClient.get('/api/auth/me'),
  
  verifyUser: (username: string) =>
    apiClient.post('/api/auth/verify', { username }),
  
  refreshToken: (refreshToken: string) =>
    apiClient.post('/api/auth/refresh', { refreshToken }),
  
  // Documents
  getDocuments: (params?: any) =>
    apiClient.get('/api/documents', { params }),
  
  getDocument: (id: number) =>
    apiClient.get(`/api/documents/${id}`),
  
  syncDocument: (formData: FormData) =>
    apiClient.post('/api/sync', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  startReview: (id: number) =>
    apiClient.put(`/api/documents/${id}/review`),
  
  approveDocument: (id: number) =>
    apiClient.post(`/api/documents/${id}/approve`),
  
  rejectDocument: (id: number, errorType: string, message: string) =>
    apiClient.post(`/api/documents/${id}/reject`, { error_type: errorType, message }),
  
  getDocumentHistory: (id: number) =>
    apiClient.get(`/api/documents/${id}/history`),
  
  getDocumentStats: () =>
    apiClient.get('/api/documents/stats'),
  
  // Users (Admin only)
  getUsers: (params?: any) =>
    apiClient.get('/api/users', { params }),
  
  getUser: (id: number) =>
    apiClient.get(`/api/users/${id}`),
  
  createUser: (data: any) =>
    apiClient.post('/api/users', data),
  
  updateUser: (id: number, data: any) =>
    apiClient.put(`/api/users/${id}`, data),
  
  deleteUser: (id: number) =>
    apiClient.delete(`/api/users/${id}`),
  
  assignBureaus: (id: number, bureaux: string[]) =>
    apiClient.post(`/api/users/${id}/bureaus`, { bureaux }),
  
  // Analytics (Admin only)
  getAnalytics: (params?: any) =>
    apiClient.get('/api/analytics', { params }),
  
  // Tree
  getDocumentTree: (params?: any) =>
    apiClient.get('/api/tree', { params }),
  
  // Health check
  healthCheck: () =>
    apiClient.get('/api/health'),

  // Document Fields
  getDocumentFields: (documentId: number) =>
    apiClient.get(`/api/documents/${documentId}/fields`),

  saveDocumentFields: (documentId: number, fields: any[], submit: boolean = false) =>
    apiClient.post(`/api/documents/${documentId}/fields`, { fields, submit }),

  deleteDocumentFields: (documentId: number) =>
    apiClient.delete(`/api/documents/${documentId}/fields`),

  // OCR
  ocrDocument: (documentId: number) =>
    apiClient.post(`/api/documents/${documentId}/ocr`),

  // Form Schemas
  getFormSchema: (documentType: string) =>
    apiClient.get(`/api/documents/forms/schema/${documentType}`),

  // User Stats
  getUserStats: (id: number) =>
    apiClient.get(`/api/users/${id}/stats`),

  searchDocuments: (params?: any) =>
    apiClient.get('/api/search', { params }),

  getSearchSuggestions: (type: string, query: string, limit?: number) =>
    apiClient.get('/api/search/suggestions', { params: { type, query, limit } }),

  getPopularSearches: () =>
    apiClient.get('/api/search/popular'),

  getSearchFacets: (query?: string) =>
    apiClient.get('/api/search/facets', { params: query ? { query } : undefined }),
  
  // Activity Logs
  logActivity: (activityData: {
    action: string;
    entity_type: string;
    entity_id?: number;
    details?: string;
    metadata?: Record<string, any>;
  }) =>
    apiClient.post('/api/activity-logs', activityData),

  getActivityLogs: (filters?: {
    user_id?: number;
    entity_type?: string;
    entity_id?: number;
    action?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiClient.get('/api/activity-logs', { params: filters }),

  getDocumentActivityLogs: (documentId: number) =>
    apiClient.get(`/api/activity-logs/document/${documentId}`),

  getRecentActivity: (limit?: number) =>
    apiClient.get('/api/activity-logs/recent', { params: { limit } }),

  getUserActivitySummary: (userId: number, date_from: string, date_to: string) =>
    apiClient.get(`/api/activity-logs/user/${userId}/summary`, {
      params: { date_from, date_to }
    }),

  getActivityStatistics: (date_from: string, date_to: string) =>
    apiClient.get('/api/activity-logs/statistics', {
      params: { date_from, date_to }
    }),


};
export interface InventoryRecord {
  id?: number;
  bureau: string;
  registreType: string;
  year: number;
  registreNumber: string;
  acteNumber: string;
  uploadBatchId?: string;
  uploadedBy?: number;
  uploadedAt?: string;
  notes?: string;
}

export interface InventoryBatch {
  upload_batch_id: string;
  record_count: number;
  uploaded_at: string;
  uploaded_by: number;
  uploaded_by_username: string;
}

export interface ComparisonSummary {
  totalInventory: number;
  totalDocuments: number;
  matched: number;
  missing: number;
  extra: number;
  matchRate: string;
}

export interface ComparisonResult {
  summary: ComparisonSummary;
  matched: any[];
  missing: any[];
  extra: any[];
}

export interface TreeStats {
  inventory: number;
  actual: number;
  matched: number;
  missing: number;
  extra: number;
  matchRate: string;
}

export interface TreeNode {
  name: string;
  stats: TreeStats;
  types?: { [key: string]: TreeNode };
  years?: { [key: string]: TreeNode };
  registres?: { [key: string]: TreeNode };
}

// Upload inventory from Excel
export const uploadInventory = async (records: InventoryRecord[]) => {
  const response = await apiClient.post('/api/inventory/upload', { records });
  return response.data;
};

// Get all inventory batches
export const getInventoryBatches = async (): Promise<InventoryBatch[]> => {
  const response = await apiClient.get('/api/inventory/batches');
  return response.data.data;
};

// Get inventory by batch ID
export const getInventoryByBatch = async (batchId: string): Promise<InventoryRecord[]> => {
  const response = await apiClient.get(`/api/inventory/batches/${batchId}`);
  return response.data.data;
};

// Delete inventory batch
export const deleteInventoryBatch = async (batchId: string) => {
  const response = await apiClient.delete(`/api/inventory/batches/${batchId}`);
  return response.data;
};

// Compare inventory with actual documents
export const compareInventory = async (
  batchId: string,
  filters?: { bureau?: string; registreType?: string; year?: number }
): Promise<ComparisonResult> => {
  const params = new URLSearchParams();
  if (filters?.bureau) params.append('bureau', filters.bureau);
  if (filters?.registreType) params.append('registreType', filters.registreType);
  if (filters?.year) params.append('year', filters.year.toString());

  const response = await apiClient.get(
    `/api/inventory/compare/${batchId}?${params.toString()}`
  );
  return response.data.data;
};

// Get tree comparison statistics
export const getTreeComparison = async (batchId: string): Promise<{ [key: string]: TreeNode }> => {
  const response = await apiClient.get(`/api/inventory/tree/${batchId}`);
  return response.data.data;
};

// Performance API Methods
// Add these to your existing api object in src/lib/api.ts




export default apiClient;
