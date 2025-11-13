'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { 
  DashboardOverview, 
  UserPerformanceReport,
  HourlyDistribution,
  DailyActivity,
  WeeklyComparison,
  TopPerformer,
  UserPerformanceData
} from '@/types';

/**
 * Log work session (login/logout)
 */
export function useLogWorkSession() {
  return useMutation({
    mutationFn: (sessionType: 'login' | 'logout') => 
      api.logWorkSession(sessionType),
  });
}

/**
 * Get user performance report
 */
export function useUserPerformance(userId: number | null, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['user-performance', userId, startDate, endDate],
    queryFn: async () => {
      if (!userId) return null;
      const response = await api.getUserPerformance(userId, startDate, endDate);
      return response.data;
    },
    enabled: !!userId && !!startDate && !!endDate,
  });
}

/**
 * Get hourly activity distribution
 */
export function useHourlyDistribution(userId: number | null, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['hourly-distribution', userId, startDate, endDate],
    queryFn: async () => {
      if (!userId) return null;
      const response = await api.getHourlyDistribution(userId, startDate, endDate);
      return response.data.data as HourlyDistribution[];
    },
    enabled: !!userId && !!startDate && !!endDate,
  });
}

/**
 * Get daily activity
 */
export function useDailyActivity(userId: number | null, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['daily-activity', userId, startDate, endDate],
    queryFn: async () => {
      if (!userId) return null;
      const response = await api.getDailyActivity(userId, startDate, endDate);
      return response.data.data as DailyActivity[];
    },
    enabled: !!userId && !!startDate && !!endDate,
  });
}

/**
 * Get work hours for a user
 */
export function useWorkHours(userId: number | null, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['work-hours', userId, startDate, endDate],
    queryFn: async () => {
      if (!userId) return null;
      const response = await api.getWorkHours(userId, startDate, endDate);
      return response.data.data;
    },
    enabled: !!userId && !!startDate && !!endDate,
  });
}

/**
 * Get performance dashboard overview (Admin only)
 */
export function useDashboardOverview(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['performance-dashboard', startDate, endDate],
    queryFn: async () => {
      const response = await api.getPerformanceDashboard(startDate, endDate);
      return response.data.data as DashboardOverview;
    },
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Get weekly performance comparison (Admin only)
 */
export function useWeeklyComparison(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['weekly-comparison', startDate, endDate],
    queryFn: async () => {
      const response = await api.getWeeklyComparison(startDate, endDate);
      return response.data.data as WeeklyComparison[];
    },
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Get monthly performance (Admin only)
 */
export function useMonthlyPerformance(year: number, month: number) {
  return useQuery({
    queryKey: ['monthly-performance', year, month],
    queryFn: async () => {
      const response = await api.getMonthlyPerformance(year, month);
      return response.data.data;
    },
    enabled: !!year && !!month,
  });
}

/**
 * Get top performers (Admin only)
 */
export function useTopPerformers(startDate: string, endDate: string, limit: number = 10) {
  return useQuery({
    queryKey: ['top-performers', startDate, endDate, limit],
    queryFn: async () => {
      const response = await api.getTopPerformers(startDate, endDate, limit);
      return response.data.data as TopPerformer[];
    },
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Get all users performance data (Admin only)
 */
export function useAllUsersPerformance(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['all-users-performance', startDate, endDate],
    queryFn: async () => {
      const response = await api.getAllUsersPerformance(startDate, endDate);
      return response.data.data as UserPerformanceData[];
    },
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Export performance data to CSV
 */
export function useExportPerformanceCSV() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      const response = await api.exportPerformanceCSV(startDate, endDate);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance_report_${startDate}_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('performance.exportSuccess') || 'Export réussi');
    },
    onError: (error: any) => {
      toast.error(t('errors.generic') || 'Erreur', {
        description: error.response?.data?.error || error.message,
      });
    },
  });
}
