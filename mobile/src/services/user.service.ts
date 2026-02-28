/**
 * User Service
 * 
 * Handles user profile management, children lookup for parents,
 * and notification preferences.
 */

import apiClient from './api-client';
import type {
  User,
  Profile,
  Child,
  UpdateProfileRequest,
  NotificationPreferences,
  PaginatedResponse,
  PaginationParams,
  UserRole,
} from '../types/api';

/**
 * Get current user profile with full details
 * @returns Promise with user profile data
 */
export async function getProfile(): Promise<Profile> {
  return apiClient.get<Profile>('/auth/profile');
}

/**
 * Update current user profile
 * @param data - Profile fields to update
 * @returns Promise with updated user data
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return apiClient.put<User>('/users/me', data);
}

/**
 * Get children for the current parent user
 * @returns Promise with array of child user data
 */
export async function getChildren(): Promise<Child[]> {
  // Get current user to get the ID
  const profile = await getProfile();
  
  return apiClient.get<Child[]>(`/users/${profile.id}/children`);
}

/**
 * Get notification preferences for current user
 * @returns Promise with notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiClient.get<NotificationPreferences>('/users/me/notifications');
}

/**
 * Update notification preferences for current user
 * @param prefs - Notification preferences to update
 * @returns Promise with updated preferences
 */
export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  return apiClient.put<NotificationPreferences>('/users/me/notifications', prefs);
}

/**
 * Get all users (admin/teacher only)
 * @param params - Pagination parameters
 * @returns Promise with paginated user list
 */
export async function getUsers(
  params?: PaginationParams
): Promise<PaginatedResponse<User>> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  const query = queryParams.toString();
  return apiClient.get<PaginatedResponse<User>>(
    `/users${query ? `?${query}` : ''}`
  );
}

/**
 * Get users by role (admin/teacher only)
 * @param role - Role to filter by
 * @param params - Pagination parameters
 * @returns Promise with paginated user list
 */
export async function getUsersByRole(
  role: UserRole,
  params?: PaginationParams
): Promise<PaginatedResponse<User>> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  
  const query = queryParams.toString();
  return apiClient.get<PaginatedResponse<User>>(
    `/users/role/${role}${query ? `?${query}` : ''}`
  );
}

/**
 * Get user by ID
 * @param id - User ID
 * @returns Promise with user data
 */
export async function getUserById(id: string): Promise<User> {
  return apiClient.get<User>(`/users/${id}`);
}

// ============================================================
// EXPORT DEFAULT
// ============================================================

export const userService = {
  getProfile,
  updateProfile,
  getChildren,
  getNotificationPreferences,
  updateNotificationPreferences,
  getUsers,
  getUsersByRole,
  getUserById,
};

export default userService;
