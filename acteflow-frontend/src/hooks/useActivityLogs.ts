import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface ActivityLogFilters {
  user_id?: number;
  entity_type?: string;
  entity_id?: number;
  action?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityLogEntry {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  created_at: string;
  username: string;
  user_full_name?: string;
  user_role: string;
}

/**
 * Hook to fetch activity logs with filters
 */
export function useActivityLogs(filters: ActivityLogFilters, options?: any) {
  return useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: () => api.getActivityLogs(filters),
    ...options,
  });
}

/**
 * Hook to fetch activity logs for a specific document
 */
export function useDocumentActivityLogs(documentId: number | null) {
  return useQuery({
    queryKey: ['activity-logs', 'document', documentId],
    queryFn: () => api.getDocumentActivityLogs(documentId!),
    enabled: !!documentId,
  });
}

/**
 * Hook to fetch recent activity (admin only)
 */
export function useRecentActivity(limit: number = 20) {
  return useQuery({
    queryKey: ['activity-logs', 'recent', limit],
    queryFn: () => api.getRecentActivity(limit),
  });
}

/**
 * Hook to fetch user activity summary
 */
export function useUserActivitySummary(
  userId: number,
  dateFrom: string,
  dateTo: string
) {
  return useQuery({
    queryKey: ['activity-logs', 'user-summary', userId, dateFrom, dateTo],
    queryFn: () => api.getUserActivitySummary(userId, dateFrom, dateTo),
    enabled: !!userId && !!dateFrom && !!dateTo,
  });
}

/**
 * Hook to fetch activity statistics (admin only)
 */
export function useActivityStatistics(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['activity-logs', 'statistics', dateFrom, dateTo],
    queryFn: () => api.getActivityStatistics(dateFrom, dateTo),
    enabled: !!dateFrom && !!dateTo,
  });
}

/**
 * Hook to log an activity
 */
export function useLogActivity() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (activityData: {
      action: string;
      entity_type: string;
      entity_id?: number;
      details?: string;
      metadata?: Record<string, any>;
    }) => api.logActivity(activityData),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      
      if (variables.entity_type === 'document' && variables.entity_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['activity-logs', 'document', variables.entity_id] 
        });
      }
    },
    onError: (error: any) => {
      console.error('Failed to log activity:', error);
      // Don't show toast for logging errors (silent failure)
    },
  });
}

/**
 * Helper hook to automatically log document actions
 */
export function useLogDocumentAction() {
  const logActivity = useLogActivity();

  return {
    logUpload: (documentId: number, details?: string) => {
      logActivity.mutate({
        action: 'document_uploaded',
        entity_type: 'document',
        entity_id: documentId,
        details,
      });
    },
    logReviewStart: (documentId: number, details?: string) => {
      logActivity.mutate({
        action: 'document_reviewed_started',
        entity_type: 'document',
        entity_id: documentId,
        details,
      });
    },
    logApproval: (documentId: number, details?: string, metadata?: Record<string, any>) => {
      logActivity.mutate({
        action: 'document_approved',
        entity_type: 'document',
        entity_id: documentId,
        details,
        metadata,
      });
    },
    logRejection: (documentId: number, reason: string, metadata?: Record<string, any>) => {
      logActivity.mutate({
        action: 'document_rejected',
        entity_type: 'document',
        entity_id: documentId,
        details: reason,
        metadata,
      });
    },
    logProcessingStart: (documentId: number, details?: string) => {
      logActivity.mutate({
        action: 'document_processing_started',
        entity_type: 'document',
        entity_id: documentId,
        details,
      });
    },
    logProcessingComplete: (documentId: number, details?: string, metadata?: Record<string, any>) => {
      logActivity.mutate({
        action: 'document_processing_completed',
        entity_type: 'document',
        entity_id: documentId,
        details,
        metadata,
      });
    },
    logView: (documentId: number) => {
      logActivity.mutate({
        action: 'document_viewed',
        entity_type: 'document',
        entity_id: documentId,
      });
    },
    logDownload: (documentId: number, details?: string) => {
      logActivity.mutate({
        action: 'document_downloaded',
        entity_type: 'document',
        entity_id: documentId,
        details,
      });
    },
    logUpdate: (documentId: number, details?: string, metadata?: Record<string, any>) => {
      logActivity.mutate({
        action: 'document_updated',
        entity_type: 'document',
        entity_id: documentId,
        details,
        metadata,
      });
    },
    logDelete: (documentId: number, details?: string) => {
      logActivity.mutate({
        action: 'document_deleted',
        entity_type: 'document',
        entity_id: documentId,
        details,
      });
    },
  };
}
