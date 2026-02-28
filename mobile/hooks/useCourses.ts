import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/services/api';

export function useCourses(filter?: string) {
  return useQuery({
    queryKey: ['courses', filter],
    queryFn: () => coursesApi.getCourses('', filter),
  });
}

export function useSearchCourses(query: string) {
  return useQuery({
    queryKey: ['courses', 'search', query],
    queryFn: () => coursesApi.searchCourses(query),
    enabled: query.length > 0,
  });
}
