'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DocumentFilters } from '@/types';

/**
 * Tree node structure from backend
 */
export interface TreeNodeData {
  bureau: string;
  registre_type: string;
  year: number;
  registre_number: string;
  count: number;
}

/**
 * Hierarchical tree structure for UI
 */
export interface TreeHierarchy {
  bureaux: {
    [bureau: string]: {
      name: string;
      count: number;
      registreTypes: {
        [type: string]: {
          name: string;
          count: number;
          years: {
            [year: number]: {
              year: number;
              count: number;
              registres: {
                [registre: string]: {
                  registre: string;
                  count: number;
                };
              };
            };
          };
        };
      };
    };
  };
  totalCount: number;
}

/**
 * Transform flat tree data into hierarchical structure
 */
function buildTreeHierarchy(nodes: TreeNodeData[]): TreeHierarchy {
  const hierarchy: TreeHierarchy = {
    bureaux: {},
    totalCount: 0,
  };

  nodes.forEach((node) => {
    // Initialize bureau if not exists
    if (!hierarchy.bureaux[node.bureau]) {
      hierarchy.bureaux[node.bureau] = {
        name: node.bureau,
        count: 0,
        registreTypes: {},
      };
    }

    const bureau = hierarchy.bureaux[node.bureau];
    bureau.count += node.count;

    // Initialize registre type if not exists
    if (!bureau.registreTypes[node.registre_type]) {
      bureau.registreTypes[node.registre_type] = {
        name: node.registre_type,
        count: 0,
        years: {},
      };
    }

    const registreType = bureau.registreTypes[node.registre_type];
    registreType.count += node.count;

    // Initialize year if not exists
    if (!registreType.years[node.year]) {
      registreType.years[node.year] = {
        year: node.year,
        count: 0,
        registres: {},
      };
    }

    const year = registreType.years[node.year];
    year.count += node.count;

    // Add registre
    year.registres[node.registre_number] = {
      registre: node.registre_number,
      count: node.count,
    };

    hierarchy.totalCount += node.count;
  });

  return hierarchy;
}

/**
 * Fetch document tree data
 */
export function useTree(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ['tree', filters],
    queryFn: async () => {
      try {
        const response = await api.getDocumentTree(filters);
        const nodes = response.data.data as TreeNodeData[];

        // console.log('Fetched tree nodes:', nodes);
        return buildTreeHierarchy(nodes);
      } catch (error) {
        console.error('Error fetching tree data:', error);
      }
      
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Get documents for a specific path in the tree
 */
export function useTreeDocuments(path: {
  bureau?: string;
  registreType?: string;
  year?: number;
  registreNumber?: string;
}) {
  const filters: DocumentFilters = {
    status: 'stored', // Only stored documents in tree
    bureau: path.bureau,
    registre_type: path.registreType,
    year: path.year,
    limit: 100,
  };

  return useQuery({
    queryKey: ['tree-documents', path],
    queryFn: async () => {
      const response = await api.getDocuments(filters);
      const documents = response.data.documents;
      
      // Filter by registre number if specified
      if (path.registreNumber) {
        return documents.filter((doc: any) => doc.registre_number === path.registreNumber);
      }
      
      return documents;
    },
    enabled: !!path.bureau, // Only fetch if at least bureau is specified
  });
}
