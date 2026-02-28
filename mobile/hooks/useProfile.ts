import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/services/api';

export function useChildren(parentId: string) {
  return useQuery({
    queryKey: ['children', parentId],
    queryFn: () => profileApi.getChildren(parentId),
  });
}
