import { useQuery } from '@tanstack/react-query';
import { courseService } from '@/src/services/course.service';
import { gradingService } from '@/src/services/grading.service';
import { messagingService } from '@/src/services/messaging.service';
import type { ScheduleItem, ActivityItem } from '@/services/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Combine multiple API calls for dashboard stats
      const [classes, channels] = await Promise.all([
        courseService.getMyClasses(),
        messagingService.getChannels(),
      ]);

      return {
        upcomingClasses: classes?.length || 0,
        pendingAssignments: 0, // TODO: needs a proper backend endpoint for pending count
        unreadMessages: channels?.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0) || 0,
      };
    },
  });
}

export function useTodaysSchedule() {
  return useQuery({
    queryKey: ['todays-schedule'],
    queryFn: async (): Promise<ScheduleItem[]> => {
      const classes = await courseService.getMyClasses();

      // Map classes to schedule items
      return classes?.map((cls: any) => ({
        id: cls.id,
        subject: cls.course?.name || 'Class',
        title: cls.course?.name || 'Class',
        teacher: cls.teacher?.name || 'TBD',
        time: cls.schedules?.[0] ? `${cls.schedules[0].startTime} - ${cls.schedules[0].endTime}` : 'TBD',
        room: cls.schedules?.[0]?.room || 'TBD',
        location: cls.schedules?.[0]?.room || 'TBD',
        color: '#1e1e8a',
      })) || [];
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async (): Promise<ActivityItem[]> => {
      // Mock recent activity - in real app, fetch from analytics/activity endpoint
      return [
        { id: '1', type: 'message', title: 'New message from Teacher', timestamp: new Date().toISOString() },
        { id: '2', type: 'assignment', title: 'Assignment due tomorrow', timestamp: new Date().toISOString() },
      ];
    },
  });
}
