/**
 * Permissions System
 * 
 * Defines a comprehensive permission matrix for the School Hub application.
 * Each role has specific permissions that control what actions they can perform.
 */

import type { UserRole } from '@/providers/AuthProvider';
export type { UserRole };

// Permission constants - granular permissions for fine-grained access control
export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: 'manage:users',
  CREATE_USERS: 'create:users',
  EDIT_USERS: 'edit:users',
  DELETE_USERS: 'delete:users',
  VIEW_USERS: 'view:users',
  
  // Course Management
  MANAGE_COURSES: 'manage:courses',
  CREATE_COURSES: 'create:courses',
  EDIT_COURSES: 'edit:courses',
  DELETE_COURSES: 'delete:courses',
  VIEW_COURSES: 'view:courses',
  
  // Class Management
  MANAGE_CLASSES: 'manage:classes',
  CREATE_CLASSES: 'create:classes',
  EDIT_CLASSES: 'edit:classes',
  DELETE_CLASSES: 'delete:classes',
  VIEW_CLASSES: 'view:classes',
  
  // Assignment Management
  MANAGE_ASSIGNMENTS: 'manage:assignments',
  CREATE_ASSIGNMENTS: 'create:assignments',
  EDIT_ASSIGNMENTS: 'edit:assignments',
  DELETE_ASSIGNMENTS: 'delete:assignments',
  VIEW_ASSIGNMENTS: 'view:assignments',
  SUBMIT_ASSIGNMENTS: 'submit:assignments',
  
  // Grading
  GRADE: 'grade',
  GRADE_ASSIGNMENTS: 'grade:assignments',
  VIEW_GRADES: 'view:grades',
  VIEW_OWN_GRADES: 'view:own_grades',
  EDIT_GRADES: 'edit:grades',
  
  // Attendance
  MANAGE_ATTENDANCE: 'manage:attendance',
  MARK_ATTENDANCE: 'mark:attendance',
  VIEW_ATTENDANCE: 'view:attendance',
  VIEW_OWN_ATTENDANCE: 'view:own_attendance',
  
  // Messaging
  MANAGE_MESSAGES: 'manage:messages',
  SEND_MESSAGES: 'send:messages',
  CREATE_CHANNELS: 'create:channels',
  DELETE_CHANNELS: 'delete:channels',
  BROADCAST_MESSAGES: 'broadcast:messages',
  VIEW_MESSAGES: 'view:messages',
  
  // Parent-specific
  VIEW_CHILD_PROGRESS: 'view:child_progress',
  VIEW_CHILD_GRADES: 'view:child_grades',
  MESSAGE_TEACHERS: 'message:teachers',
  
  // Student-specific
  PARTICIPATE_CHANNELS: 'participate:channels',
  SUBMIT_WORK: 'submit:work',
  
  // Moderation
  MODERATE_CONTENT: 'moderate:content',
  DELETE_MESSAGES: 'delete:messages',
  MUTE_USERS: 'mute:users',
  BAN_USERS: 'ban:users',
  VIEW_AUDIT_LOG: 'view:audit_log',
  
  // System
  MANAGE_SYSTEM: 'manage:system',
  VIEW_ANALYTICS: 'view:analytics',
  MANAGE_SETTINGS: 'manage:settings',
} as const;

// Type for all permission strings
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Role-Based Permission Matrix
 * 
 * Defines which permissions each role has.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Admin: Can do everything
  admin: [
    // User Management
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.VIEW_USERS,
    
    // Course Management
    PERMISSIONS.MANAGE_COURSES,
    PERMISSIONS.CREATE_COURSES,
    PERMISSIONS.EDIT_COURSES,
    PERMISSIONS.DELETE_COURSES,
    PERMISSIONS.VIEW_COURSES,
    
    // Class Management
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.CREATE_CLASSES,
    PERMISSIONS.EDIT_CLASSES,
    PERMISSIONS.DELETE_CLASSES,
    PERMISSIONS.VIEW_CLASSES,
    
    // Assignment Management
    PERMISSIONS.MANAGE_ASSIGNMENTS,
    PERMISSIONS.CREATE_ASSIGNMENTS,
    PERMISSIONS.EDIT_ASSIGNMENTS,
    PERMISSIONS.DELETE_ASSIGNMENTS,
    PERMISSIONS.VIEW_ASSIGNMENTS,
    
    // Grading
    PERMISSIONS.GRADE,
    PERMISSIONS.GRADE_ASSIGNMENTS,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.EDIT_GRADES,
    
    // Attendance
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    
    // Messaging
    PERMISSIONS.MANAGE_MESSAGES,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.CREATE_CHANNELS,
    PERMISSIONS.DELETE_CHANNELS,
    PERMISSIONS.BROADCAST_MESSAGES,
    PERMISSIONS.VIEW_MESSAGES,
    
    // Moderation
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.DELETE_MESSAGES,
    PERMISSIONS.MUTE_USERS,
    PERMISSIONS.BAN_USERS,
    PERMISSIONS.VIEW_AUDIT_LOG,
    
    // System
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],
  
  // Teacher: Can manage classes, grade, mark attendance
  teacher: [
    // Course Management (view only)
    PERMISSIONS.VIEW_COURSES,
    
    // Class Management (their own classes)
    PERMISSIONS.MANAGE_CLASSES,
    PERMISSIONS.VIEW_CLASSES,
    
    // Assignment Management
    PERMISSIONS.MANAGE_ASSIGNMENTS,
    PERMISSIONS.CREATE_ASSIGNMENTS,
    PERMISSIONS.EDIT_ASSIGNMENTS,
    PERMISSIONS.DELETE_ASSIGNMENTS,
    PERMISSIONS.VIEW_ASSIGNMENTS,
    
    // Grading
    PERMISSIONS.GRADE,
    PERMISSIONS.GRADE_ASSIGNMENTS,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.EDIT_GRADES,
    
    // Attendance
    PERMISSIONS.MANAGE_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    
    // Messaging
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.CREATE_CHANNELS,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.MESSAGE_TEACHERS,
  ],
  
  // Parent: Can view child progress, message teachers
  parent: [
    // Course/Class Viewing
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_CLASSES,
    
    // Assignment Viewing (child's assignments)
    PERMISSIONS.VIEW_ASSIGNMENTS,
    
    // Grades (child's grades only)
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.VIEW_CHILD_GRADES,
    
    // Attendance (child's attendance)
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_CHILD_PROGRESS,
    
    // Messaging
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.MESSAGE_TEACHERS,
    PERMISSIONS.CREATE_CHANNELS,
  ],
  
  // Student: Can submit assignments, participate in channels
  student: [
    // Course/Class Viewing (enrolled only)
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_CLASSES,
    
    // Assignments
    PERMISSIONS.VIEW_ASSIGNMENTS,
    PERMISSIONS.SUBMIT_ASSIGNMENTS,
    PERMISSIONS.SUBMIT_WORK,
    
    // Grades (own grades only)
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.VIEW_OWN_GRADES,
    
    // Attendance (own attendance)
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_OWN_ATTENDANCE,
    
    // Messaging
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_MESSAGES,
    PERMISSIONS.CREATE_CHANNELS,
    PERMISSIONS.PARTICIPATE_CHANNELS,
  ],
};

/**
 * Feature-Based Permission Mapping
 * 
 * Maps high-level features to the permissions required to access them.
 * Used for the canAccess() function in useRole hook.
 */
export const FEATURE_PERMISSIONS = {
  // User Management
  MANAGE_USERS: PERMISSIONS.MANAGE_USERS,
  CREATE_USER: PERMISSIONS.CREATE_USERS,
  EDIT_USER: PERMISSIONS.EDIT_USERS,
  DELETE_USER: PERMISSIONS.DELETE_USERS,
  
  // Course Management
  MANAGE_COURSES: PERMISSIONS.MANAGE_COURSES,
  CREATE_COURSE: PERMISSIONS.CREATE_COURSES,
  EDIT_COURSE: PERMISSIONS.EDIT_COURSES,
  DELETE_COURSE: PERMISSIONS.DELETE_COURSES,
  
  // Class Management
  MANAGE_CLASSES: PERMISSIONS.MANAGE_CLASSES,
  CREATE_CLASS: PERMISSIONS.CREATE_CLASSES,
  EDIT_CLASS: PERMISSIONS.EDIT_CLASSES,
  
  // Assignment Management
  MANAGE_ASSIGNMENTS: PERMISSIONS.MANAGE_ASSIGNMENTS,
  CREATE_ASSIGNMENT: PERMISSIONS.CREATE_ASSIGNMENTS,
  EDIT_ASSIGNMENT: PERMISSIONS.EDIT_ASSIGNMENTS,
  DELETE_ASSIGNMENT: PERMISSIONS.DELETE_ASSIGNMENTS,
  SUBMIT_ASSIGNMENT: PERMISSIONS.SUBMIT_ASSIGNMENTS,
  
  // Grading
  GRADE: [PERMISSIONS.GRADE, PERMISSIONS.GRADE_ASSIGNMENTS],
  VIEW_ALL_GRADES: PERMISSIONS.VIEW_GRADES,
  VIEW_OWN_GRADES: PERMISSIONS.VIEW_OWN_GRADES,
  
  // Attendance
  MARK_ATTENDANCE: PERMISSIONS.MARK_ATTENDANCE,
  VIEW_ALL_ATTENDANCE: PERMISSIONS.VIEW_ATTENDANCE,
  VIEW_OWN_ATTENDANCE: PERMISSIONS.VIEW_OWN_ATTENDANCE,
  
  // Messaging
  CREATE_CHANNEL: PERMISSIONS.CREATE_CHANNELS,
  DELETE_CHANNEL: PERMISSIONS.DELETE_CHANNELS,
  BROADCAST: PERMISSIONS.BROADCAST_MESSAGES,
  MODERATE: [PERMISSIONS.MODERATE_CONTENT, PERMISSIONS.DELETE_MESSAGES],
  
  // Parent Features
  VIEW_CHILD_PROGRESS: PERMISSIONS.VIEW_CHILD_PROGRESS,
  VIEW_CHILD_GRADES: PERMISSIONS.VIEW_CHILD_GRADES,
  MESSAGE_TEACHER: PERMISSIONS.MESSAGE_TEACHERS,
  
  // System
  VIEW_ANALYTICS: PERMISSIONS.VIEW_ANALYTICS,
  MANAGE_SETTINGS: PERMISSIONS.MANAGE_SETTINGS,
  MODERATION_QUEUE: [PERMISSIONS.MODERATE_CONTENT, PERMISSIONS.VIEW_AUDIT_LOG],
};

/**
 * Check if a role has a specific permission
 * 
 * @param role - The user's role
 * @param permission - The permission to check
 * @returns boolean indicating if the role has the permission
 * 
 * @example
 * ```ts
 * if (hasPermission('teacher', PERMISSIONS.GRADE)) {
 *   // Allow grading
 * }
 * ```
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 * 
 * @param role - The user's role
 * @param permissions - Array of permissions to check
 * @returns boolean indicating if the role has any of the permissions
 * 
 * @example
 * ```ts
 * if (hasAnyPermission('teacher', [PERMISSIONS.GRADE, PERMISSIONS.MANAGE_COURSES])) {
 *   // Allow action
 * }
 * ```
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return permissions.some(permission => rolePermissions.includes(permission));
}

/**
 * Check if a role has all of the specified permissions
 * 
 * @param role - The user's role
 * @param permissions - Array of permissions to check
 * @returns boolean indicating if the role has all of the permissions
 * 
 * @example
 * ```ts
 * if (hasAllPermissions('admin', [PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_COURSES])) {
 *   // Allow super admin action
 * }
 * ```
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return permissions.every(permission => rolePermissions.includes(permission));
}

/**
 * Get all permissions for a role
 * 
 * @param role - The user's role
 * @returns Array of permissions the role has
 * 
 * @example
 * ```ts
 * const teacherPermissions = getRolePermissions('teacher');
 * console.log(teacherPermissions); // ['view:courses', 'create:assignments', ...]
 * ```
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Get role display metadata
 * 
 * @param role - The user's role
 * @returns Object with display name, color, and description
 */
export function getRoleMetadata(role: UserRole) {
  const metadata: Record<UserRole, { name: string; color: string; description: string }> = {
    admin: {
      name: 'Administrator',
      color: '#2196f3',
      description: 'Full system access and management',
    },
    teacher: {
      name: 'Teacher',
      color: '#f59e0b',
      description: 'Manage classes, grade assignments, and communicate',
    },
    parent: {
      name: 'Parent',
      color: '#9c27b0',
      description: 'View child progress and communicate with teachers',
    },
    student: {
      name: 'Student',
      color: '#4caf50',
      description: 'Submit assignments and participate in learning',
    },
  };
  
  return metadata[role];
}

export default {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  FEATURE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  getRoleMetadata,
};
