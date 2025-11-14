import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import  apiClient  from '@/lib/api';

// Fetch all marginal mentions for a document
export function useMarginalMentions(documentId: number | null) {
  return useQuery({
    queryKey: ['marginal-mentions', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const response = await apiClient.get(`/documents/${documentId}/marginal-mentions`);
      return response.data;
    },
    enabled: !!documentId,
  });
}

// Create a new marginal mention
export function useCreateMarginalMention() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, data }: { documentId: number; data: any }) => {
      const response = await apiClient.post(`/documents/${documentId}/marginal-mentions`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marginal-mentions', variables.documentId] });
    },
  });
}

// Update a marginal mention
export function useUpdateMarginalMention() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ mentionId, documentId, data }: { mentionId: number; documentId: number; data: any }) => {
      const response = await apiClient.put(`/marginal-mentions/${mentionId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marginal-mentions', variables.documentId] });
    },
  });
}

// Delete a marginal mention
export function useDeleteMarginalMention() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ mentionId, documentId }: { mentionId: number; documentId: number }) => {
      const response = await apiClient.delete(`/marginal-mentions/${mentionId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['marginal-mentions', variables.documentId] });
    },
  });
}
