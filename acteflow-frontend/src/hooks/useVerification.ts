import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';

// Upload Excel file
export function useUploadVerification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/api/verification/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-batches'] });
    },
  });
}

// Get all batches
export function useVerificationBatches() {
  return useQuery({
    queryKey: ['verification-batches'],
    queryFn: async () => {
      const response = await apiClient.get('/api/verification/batches');
      return response.data;
    },
  });
}

// Get batch records
export function useVerificationBatch(batchId: string | null) {
  return useQuery({
    queryKey: ['verification-batch', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const response = await apiClient.get(`/api/verification/batch/${batchId}`);
      return response.data;
    },
    enabled: !!batchId,
  });
}

// Get comparison data
export function useVerificationComparison(batchId: string | null) {
  return useQuery({
    queryKey: ['verification-comparison', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const response = await apiClient.get(`/api/verification/compare/${batchId}`);
      return response.data;
    },
    enabled: !!batchId,
  });
}

// Delete batch
export function useDeleteVerificationBatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (batchId: string) => {
      const response = await apiClient.delete(`/api/verification/batch/${batchId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-batches'] });
    },
  });
}

// Search acte number (for desktop app)
export function useSearchActeNumber(acteNumber: string) {
  return useQuery({
    queryKey: ['search-acte', acteNumber],
    queryFn: async () => {
      if (!acteNumber || acteNumber.length < 2) return null;
      const response = await apiClient.get(`/api/verification/search-acte/${acteNumber}`);
      return response.data;
    },
    enabled: acteNumber.length >= 2,
    staleTime: 30000, // 30 seconds
  });
}
