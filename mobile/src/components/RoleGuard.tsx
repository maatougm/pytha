import React from 'react';
import { useAuth, type UserRole } from '@/providers/AuthProvider';

interface RoleGuardProps {
  /** Array of roles that are allowed to see the children */
  allowedRoles: UserRole[];
  /** Content to render if user has allowed role */
  children: React.ReactNode;
  /** Optional fallback content to render if user doesn't have allowed role */
  fallback?: React.ReactNode;
}

/**
 * RoleGuard Component
 * 
 * A role-based access control component that conditionally renders children
 * based on the user's role. Shows fallback (or null) if user is not authorized.
 * 
 * @example
 * ```tsx
 * <RoleGuard allowedRoles={['admin', 'teacher']}>
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * <RoleGuard allowedRoles={['admin']} fallback={<UnauthorizedMessage />}>
 *   <SuperSecretSettings />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  // If no user is logged in, show fallback
  if (!user) {
    return <>{fallback}</>;
  }

  // Check if user's role is in the allowed roles list
  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component version of RoleGuard for wrapping entire components
 * 
 * @example
 * ```tsx
 * const AdminOnlyComponent = withRoleGuard(['admin'], () => <div>Admin Only</div>);
 * ```
 */
export function withRoleGuard<P extends object>(
  allowedRoles: UserRole[],
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WithRoleGuardWrapper(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles} fallback={fallback}>
        <WrappedComponent {...props} />
      </RoleGuard>
    );
  };
}

export default RoleGuard;
