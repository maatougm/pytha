import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '@/services/api';

export function useAssignments(filter?: string) {
  return useQuery({
    queryKey: ['assignments', filter],
    queryFn: () => assignmentsApi.getAssignments('', filter),
  });
}
