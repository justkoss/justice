'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { User } from '@/types';

/**
 * Fetch all users with filters
 */
export function useUsers(filters?: any) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await api.getUsers(filters);
      return response.data;
    },
  });
}

/**
 * Fetch single user by ID
 */
export function useUser(id: number | null) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getUser(id);
      return response.data.user;
    },
    enabled: !!id,
  });
}

/**
 * Create new user
 */
export function useCreateUser() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: any) => api.createUser(userData),
    onSuccess: () => {
      toast.success(t('users.userCreated'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(t('errors.generic'), {
        description: error.response?.data?.error || error.message,
      });
    },
  });
}

/**
 * Update user
 */
export function useUpdateUser() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      api.updateUser(id, data),
    onSuccess: (response, { id }) => {
      toast.success(t('users.userUpdated'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
    onError: (error: any) => {
      toast.error(t('errors.generic'), {
        description: error.response?.data?.error || error.message,
      });
    },
  });
}

/**
 * Delete user
 */
export function useDeleteUser() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      toast.success(t('users.userDeleted'));
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(t('errors.generic'), {
        description: error.response?.data?.error || error.message,
      });
    },
  });
}

/**
 * Assign bureaux to supervisor
 */
export function useAssignBureaux() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, bureaux }: { id: number; bureaux: string[] }) =>
      api.assignBureaus(id, bureaux),
    onSuccess: (response, { id }) => {
      toast.success(t('success.saved'));
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(t('errors.generic'), {
        description: error.response?.data?.error || error.message,
      });
    },
  });
}

/**
 * Get user statistics
 */
export function useUserStats(id: number | null) {
  return useQuery({
    queryKey: ['user-stats', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getUserStats(id);
      return response.data.stats;
    },
    enabled: !!id,
  });
}
