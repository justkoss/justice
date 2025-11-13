import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadInventory,
  getInventoryBatches,
  getInventoryByBatch,
  deleteInventoryBatch,
  compareInventory,
  getTreeComparison,
  InventoryRecord,
} from '@/lib/api';

// Upload inventory
export const useUploadInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (records: InventoryRecord[]) => uploadInventory(records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
    },
  });
};

// Get all inventory batches
export const useInventoryBatches = () => {
  return useQuery({
    queryKey: ['inventory-batches'],
    queryFn: getInventoryBatches,
    staleTime: 30000, // 30 seconds
  });
};

// Get inventory by batch ID
export const useInventoryByBatch = (batchId: string | null) => {
  return useQuery({
    queryKey: ['inventory-batch', batchId],
    queryFn: () => getInventoryByBatch(batchId!),
    enabled: !!batchId,
    staleTime: 60000, // 1 minute
  });
};

// Delete inventory batch
export const useDeleteInventoryBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (batchId: string) => deleteInventoryBatch(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
    },
  });
};

// Compare inventory with documents
export const useCompareInventory = (
  batchId: string | null,
  filters?: { bureau?: string; registreType?: string; year?: number }
) => {
  return useQuery({
    queryKey: ['inventory-compare', batchId, filters],
    queryFn: () => compareInventory(batchId!, filters),
    enabled: !!batchId,
    staleTime: 60000, // 1 minute
  });
};

// Get tree comparison
export const useTreeComparison = (batchId: string | null) => {
  return useQuery({
    queryKey: ['inventory-tree', batchId],
    queryFn: () => getTreeComparison(batchId!),
    enabled: !!batchId,
    staleTime: 60000, // 1 minute
  });
};
