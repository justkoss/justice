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


};

export default apiClient;
