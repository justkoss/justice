'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Document, DocumentFilters } from '@/types';

/**
 * Fetch documents with filters
 */
export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const response = await api.getDocuments(filters);
      return response.data;
    },
  });
}

/**
 * Fetch single document by ID
 */
export function useDocument(id: number | null) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getDocument(id);
      return response.data.document as Document;
    },
    enabled: !!id,
  });
}

/**
 * Fetch document history
 */
export function useDocumentHistory(id: number | null) {
  return useQuery({
    queryKey: ['document-history', id],
    queryFn: async () => {
      if (!id) return [];
      const response = await api.getDocumentHistory(id);
      return response.data.history;
    },
    enabled: !!id,
  });
}

/**
 * Fetch document statistics
 */
export function useDocumentStats() {
  return useQuery({
    queryKey: ['document-stats'],
    queryFn: async () => {
      const response = await api.getDocumentStats();
      return response.data.stats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Start reviewing a document
 */
export function useStartReview() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) => api.startReview(documentId),
    onSuccess: (response, documentId) => {
      toast.success(t('review.reviewStarted'), {
        description: t('review.nowReviewing'),
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    },
    onError: (error: any) => {
      toast.error(t('errors.generic'), {
        description: error.response?.data?.message || error.message,
      });
    },
  });
}

/**
 * Approve a document
 */
export function useApproveDocument() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) => api.approveDocument(documentId),
    onSuccess: (response, documentId) => {
      toast.success(t('review.approveSuccess'), {
        description: t('review.documentApproved'),
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    },
    onError: (error: any) => {
      toast.error(t('errors.generic'), {
        description: error.response?.data?.message || error.message,
      });
    },
  });
}

/**
 * Reject a document
 */
export function useRejectDocument() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      documentId, 
      errorType, 
      message 
    }: { 
      documentId: number; 
      errorType: string; 
      message: string;
    }) => api.rejectDocument(documentId, errorType, message),
    onSuccess: (response, { documentId }) => {
      toast.success(t('review.rejectSuccess'), {
        description: t('review.documentRejected'),
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    },
    onError: (error: any) => {
      toast.error(t('errors.generic'), {
        description: error.response?.data?.message || error.message,
      });
    },
  });
}

/**
 * Fetch document fields
 */
export function useDocumentFields(documentId: number | null) {
  return useQuery({
    queryKey: ['document-fields', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const response = await api.getDocumentFields(documentId);
      return response.data.data;
    },
    enabled: !!documentId,
  });
}

/**
 * Save document fields
 */
export function useSaveDocumentFields() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      fields, 
      submit 
    }: { 
      documentId: number; 
      fields: any[]; 
      submit: boolean;
    }) => {
      return api.saveDocumentFields(documentId, fields, submit);
    },
    onSuccess: (response, { documentId, submit }) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['document-fields', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['tree'] });
    },
    onError: (error: any) => {
      toast.error(t('errors.generic'), {
        description: error.response?.data?.message || error.message,
      });
    },
  });
}

/**
 * Trigger OCR for a document
 */
export function useOcrDocument() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number) => {
      const result = await api.ocrDocument(documentId);
      return result.data; // Return the full response data
    },
    onSuccess: (response, documentId) => {
      toast.success(t('documents.ocrSuccess'), {
        description: t('documents.ocrSuccessDesc'),
      });

      // Invalidate document query to update status
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    },
    onError: (error: any) => {
      console.error('OCR error:', error);
      toast.error(t('errors.generic'), {
        description: error.response?.data?.message || error.message,
      });
    },
  });
}

/**
 * Fetch form schema for document type
 */
export function useFormSchema(documentType: string) {
  return useQuery({
    queryKey: ['form-schema', documentType],
    queryFn: async () => {
      const response = await api.getFormSchema(documentType);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Delete document fields (admin only)
 */
export function useDeleteDocumentFields() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number) => {
      return api.deleteDocumentFields(documentId);
    },
    onSuccess: (response, documentId) => {
      toast.success(t('documents.fieldsDeleted'));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['document-fields', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      toast.error(t('errors.generic'), {
        description: error.response?.data?.message || error.message,
      });
    },
  });
}