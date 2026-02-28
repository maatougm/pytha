import { useAuth, type UserRole } from '@/providers/AuthProvider';
import { hasPermission, type Permission, FEATURE_PERMISSIONS } from '@/src/utils/permissions';

interface UseRoleReturn {
  /** Current user's role */
  role: UserRole | null;
  /** Current user's role or undefined if not logged in */
  userRole: UserRole | undefined;
  
  // Role checking functions
  /** Check if user has a specific role */
  isRole: (role: UserRole) => boolean;
  /** Check if user is an admin */
  isAdmin: () => boolean;
  /** Check if user is a teacher */
  isTeacher: () => boolean;
  /** Check if user is a parent */
  isParent: () => boolean;
  /** Check if user is a student */
  isStudent: () => boolean;
  
  // Permission checking functions
  /** Check if user has a specific permission */
  hasPermission: (permission: Permission) => boolean;
  /** Check if user can access a feature (using feature name) */
  canAccess: (feature: keyof typeof FEATURE_PERMISSIONS) => boolean;
  /** Check if user can access a feature with a specific permission */
  can: (permission: Permission) => boolean;
  
  // Utility functions
  /** Get role display name */
  getRoleDisplayName: () => string;
  /** Get role color for UI */
  getRoleColor: () => string;
  /** Check if user has any of the given roles */
  hasAnyRole: (roles: UserRole[]) => boolean;
  /** Check if user has all of the given roles (for combined roles) */
  hasAllRoles: (roles: UserRole[]) => boolean;
}

/**
 * useRole Hook
 * 
 * A comprehensive hook for role-based access control and permission checking.
 * Provides convenience methods for checking user roles and permissions.
 * 
 * @example
 * ```tsx
 * const { isAdmin, isTeacher, canAccess, can } = useRole();
 * 
 * // Simple role checks
 * {isAdmin() && <Button>Create User</Button>}
 * 
 * // Permission-based checks
 * {canAccess('GRADE') && <Button>Grade</Button>}
 * {can(PERMISSIONS.GRADE_ASSIGNMENTS) && <GradingInterface />}
 * 
 * // Feature access
 * {canAccess('MANAGE_USERS') && <UserManagement />}
 * ```
 */
export function useRole(): UseRoleReturn {
  const { user } = useAuth();
  
  const role = user?.role || null;
  const userRole = user?.role;

  /**
   * Check if user has a specific role
   */
  const isRole = (checkRole: UserRole): boolean => {
    return role === checkRole;
  };

  /**
   * Check if user is an admin
   */
  const isAdmin = (): boolean => {
    return role === 'admin';
  };

  /**
   * Check if user is a teacher
   */
  const isTeacher = (): boolean => {
    return role === 'teacher';
  };

  /**
   * Check if user is a parent
   */
  const isParent = (): boolean => {
    return role === 'parent';
  };

  /**
   * Check if user is a student
   */
  const isStudent = (): boolean => {
    return role === 'student';
  };

  /**
   * Check if user has a specific permission
   */
  const checkPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  /**
   * Check if user can access a feature (alias for hasPermission)
   */
  const canAccess = (feature: keyof typeof FEATURE_PERMISSIONS): boolean => {
    if (!role) return false;
    const permissions = FEATURE_PERMISSIONS[feature];
    // If it's an array, check if user has any of the permissions
    if (Array.isArray(permissions)) {
      return permissions.some(p => hasPermission(role!, p));
    }
    // Single permission
    return hasPermission(role, permissions as Permission);
  };

  /**
   * Shorthand for hasPermission
   */
  const can = (permission: Permission): boolean => {
    return checkPermission(permission);
  };

  /**
   * Get display name for current role
   */
  const getRoleDisplayName = (): string => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'teacher':
        return 'Teacher';
      case 'parent':
        return 'Parent';
      case 'student':
        return 'Student';
      default:
        return 'Guest';
    }
  };

  /**
   * Get color associated with role for UI
   */
  const getRoleColor = (): string => {
    switch (role) {
      case 'admin':
        return '#2196f3'; // Blue
      case 'teacher':
        return '#f59e0b'; // Amber
      case 'parent':
        return '#9c27b0'; // Purple
      case 'student':
        return '#4caf50'; // Green
      default:
        return '#757575'; // Grey
    }
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  /**
   * Check if user has all specified roles
   * Note: Users typically have only one role, so this is for future flexibility
   */
  const hasAllRoles = (roles: UserRole[]): boolean => {
    if (!role) return false;
    // Since users have one role, they can only "have all" if there's one match
    return roles.length === 1 && roles[0] === role;
  };

  return {
    role,
    userRole,
    isRole,
    isAdmin,
    isTeacher,
    isParent,
    isStudent,
    hasPermission: checkPermission,
    canAccess,
    can,
    getRoleDisplayName,
    getRoleColor,
    hasAnyRole,
    hasAllRoles,
  };
}

export default useRole;
