import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';

export function useDashboardStats(userId: string, role: string) {
  return useQuery({
    queryKey: ['dashboard', 'stats', userId, role],
    queryFn: () => dashboardApi.getStats(userId, role),
  });
}

export function useTodaysSchedule(userId: string, role: string) {
  return useQuery({
    queryKey: ['dashboard', 'schedule', userId],
    queryFn: () => dashboardApi.getTodaysSchedule(userId, role),
  });
}

export function useRecentActivity(userId: string) {
  return useQuery({
    queryKey: ['dashboard', 'activity', userId],
    queryFn: () => dashboardApi.getRecentActivity(userId),
  });
}
