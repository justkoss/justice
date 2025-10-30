// User types
export type UserRole = 'agent' | 'supervisor' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

// Document types
export type DocumentStatus = 'pending' | 'reviewing' | 'rejected_for_update' | 'stored';

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  
  // Metadata
  bureau: string;
  registre_type: string;
  year: number;
  registre_number: string;
  acte_number: string;
  
  // Status and workflow
  status: DocumentStatus;
  
  // User tracking
  uploaded_by: number;
  uploaded_by_username?: string;
  uploaded_by_name?: string;
  reviewed_by?: number;
  reviewed_by_username?: string;
  reviewed_by_name?: string;
  
  // Timestamps
  uploaded_at: string;
  reviewed_at?: string;
  stored_at?: string;
  
  // Rejection details
  rejection_reason?: string;
  rejection_error_type?: string;
  
  // Virtual tree path
  virtual_path?: string;
  
  // Desktop app compatibility
  desktop_document_id?: string;
  processed_at?: string;
}

// Document history types
export interface DocumentHistory {
  id: number;
  document_id: number;
  action: string;
  performed_by: number;
  username?: string;
  full_name?: string;
  role?: UserRole;
  details: any;
  created_at: string;
}

// Notification types
export interface Notification {
  id: number;
  user_id: number;
  document_id?: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Stats types
export interface DocumentStats {
  total: number;
  pending: number;
  reviewing: number;
  rejected: number;
  stored: number;
}

export interface BureauStats {
  bureau: string;
  count: number;
  pending: number;
  stored: number;
}

export interface AnalyticsData {
  totalDocuments: number;
  pendingDocuments: number;
  reviewingDocuments: number;
  rejectedDocuments: number;
  storedDocuments: number;
  documentsToday: number;
  documentsThisWeek: number;
  documentsThisMonth: number;
  averageProcessingTime: string;
  bureauStatistics: BureauStats[];
  recentActivity: DocumentHistory[];
}

// Tree types
export interface TreeNode {
  bureau: string;
  registre_type: string;
  year: number;
  registre_number: string;
  count: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Form types
export interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserFormData {
  username: string;
  password?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
}

export interface ReviewFormData {
  action: 'approve' | 'reject';
  error_type?: string;
  message?: string;
}

// Filter types
export interface DocumentFilters {
  status?: DocumentStatus | 'all';
  bureau?: string;
  registre_type?: string;
  year?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

// Constants
export const BUREAUX = [
  'ainchock',
  'ainsebaa',
  'alfida',
  'anfa',
  'benmsik',
  'essoukhour',
  'hayhassani',
  'haymohammadi',
  'maarif',
  'merssultan',
  'moulayrachid',
  'sbata',
  'sidibelyout',
  'sidibernoussi',
  'sidimoumen',
  'sidiothman',
] as const;

export const REGISTRE_TYPES = [
  'naissances',
  'deces',
  'jugements',
  'transcriptions',
  'etrangers',
] as const;

export type Bureau = typeof BUREAUX[number];
export type RegistreType = typeof REGISTRE_TYPES[number];
