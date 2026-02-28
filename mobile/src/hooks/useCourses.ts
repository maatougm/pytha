import { useQuery } from '@tanstack/react-query';
import { courseService } from '@/src/services/course.service';
import type { Course, Class } from '../types/api';

export function useCourses(filters?: string | { department?: string; search?: string }) {
  let queryFilters: { department?: string; search?: string } | undefined;

  if (typeof filters === 'string') {
    if (filters !== 'all' && filters !== 'my-classes' && filters !== 'enrolled') {
      // It's a department filter string
      queryFilters = { department: filters };
    }
  } else {
    queryFilters = filters;
  }

  return useQuery({
    queryKey: ['courses', filters],
    queryFn: async () => {
      // If it's a specific "my-*" filter, those use different endpoints, 
      // but to keep it simple, we just pass the object filters to getCourses.
      // The component courses.tsx handles 'my-classes' and 'enrolled' filtering on the client for now.
      const response = await courseService.getCourses(queryFilters);
      return response.data || [];
    },
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId),
    enabled: !!courseId,
  });
}

export function useMyClasses() {
  return useQuery({
    queryKey: ['my-classes'],
    queryFn: () => courseService.getMyClasses(),
  });
}

export function useClass(classId: string) {
  return useQuery({
    queryKey: ['class', classId],
    queryFn: () => courseService.getClassById(classId),
    enabled: !!classId,
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => courseService.getMyEnrollments(),
  });
}
