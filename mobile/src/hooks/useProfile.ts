import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/src/services/user.service';
import type { User, Child } from '@/services/api';
import type { UpdateProfileRequest } from '@/src/types/api';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useChildren() {
  return useQuery({
    queryKey: ['children'],
    queryFn: () => userService.getChildren(),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => userService.getNotificationPreferences(),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (prefs: any) => userService.updateNotificationPreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}
