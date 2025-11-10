import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface SearchFilters {
  query?: string;
  bureau?: string;
  registre_type?: string;
  year?: string;
  registre_number?: string;
  acte_number?: string;
  status?: string;
  uploaded_by?: number;
  reviewed_by?: number;
  agent_name?: string;
  supervisor_name?: string;
  date_from?: string;
  date_to?: string;
  uploaded_from?: string;
  uploaded_to?: string;
  reviewed_from?: string;
  reviewed_to?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: number;
  original_filename: string;
  bureau: string;
  registre_type: string;
  year: number;
  registre_number: string;
  acte_number: string;
  status: string;
  uploaded_at: string;
  reviewed_at?: string;
  uploaded_by_username: string;
  uploaded_by_name?: string;
  reviewed_by_username?: string;
  reviewed_by_name?: string;
}

export interface SearchResponse {
  success: boolean;
  query: {
    text?: string;
    filters: Record<string, any>;
    sort: string;
  };
  results: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    showing: string;
  };
}

export interface Suggestion {
  value: string | number;
  label: string;
  username?: string;
}

export interface Facet {
  value: string | number;
  count: number;
}

export interface SearchFacets {
  bureaux: Facet[];
  types: Facet[];
  years: Facet[];
  statuses: Facet[];
}

/**
 * Hook for advanced document search
 */
export function useSearch(filters: SearchFilters) {
  return useQuery<SearchResponse>({
    queryKey: ['search', filters],
    queryFn: async () => {
      const response = await api.searchDocuments(filters);
      return response.data;
    },
    enabled: true, // Always enabled, can show empty results
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for search suggestions (autocomplete)
 */
export function useSearchSuggestions(
  type: 'acte_number' | 'registre_number' | 'agent' | 'supervisor',
  query: string,
  limit: number = 10
) {
  return useQuery<Suggestion[]>({
    queryKey: ['search-suggestions', type, query],
    queryFn: async () => {
      const response = await (api as any).get('/search/suggestions', {
        params: { type, query, limit },
      });
      return response.data.suggestions;
    },
    enabled: query.length >= 2, // Only search when query is 2+ chars
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for popular searches
 */
export function usePopularSearches() {
  return useQuery({
    queryKey: ['popular-searches'],
    queryFn: async () => {
      const response = await (api as any).get('/search/popular');
      return response.data.popular;
    },
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Hook for search facets (filter counts)
 */
export function useSearchFacets(query?: string) {
  return useQuery<SearchFacets>({
    queryKey: ['search-facets', query],
    queryFn: async () => {
      const response = await (api as any).get('/search/facets', {
        params: query ? { query } : undefined,
      });
      return response.data.facets;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for saving searches (future enhancement)
 */
export function useSaveSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (search: { name: string; filters: SearchFilters }) => {
      // This would call an API endpoint to save searches
      // For now, just store in localStorage
      const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]');
      saved.push({ ...search, id: Date.now(), created_at: new Date().toISOString() });
      localStorage.setItem('savedSearches', JSON.stringify(saved));
      return search;
    },
    onSuccess: () => {
      toast.success('Recherche sauvegardée');
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
    onError: (error: any) => {
      toast.error('Échec de la sauvegarde de la recherche');
      console.error('Save search error:', error);
    },
  });
}

/**
 * Hook for getting saved searches
 */
export function useSavedSearches() {
  return useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => {
      const saved = localStorage.getItem('savedSearches');
      return saved ? JSON.parse(saved) : [];
    },
  });
}

/**
 * Hook for deleting saved search
 */
export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchId: number) => {
      const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]');
      const filtered = saved.filter((s: any) => s.id !== searchId);
      localStorage.setItem('savedSearches', JSON.stringify(filtered));
      return searchId;
    },
    onSuccess: () => {
      toast.success('Recherche supprimée');
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
    onError: () => {
      toast.error('Échec de la suppression');
    },
  });
}
