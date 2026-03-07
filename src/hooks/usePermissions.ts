import { useMemo } from 'react';
import { useAppContext } from '../store';
import { Employee } from '../types';

export function usePermissions(currentUser: Employee | null) {
  const { roles } = useAppContext();

  const userRole = useMemo(() => {
    if (!currentUser) return null;
    return roles.find(r => r.id === currentUser.role) || null;
  }, [currentUser, roles]);

  const hasPermission = (permissionId: string) => {
    if (!userRole) return false;
    // Admin role (level 0) has all permissions by default
    if (userRole.level === 0) return true;
    return userRole.permissions.includes(permissionId);
  };

  const canManageRoleLevel = (level: number) => {
    if (!userRole) return false;
    // User can only manage roles with a strictly greater level (lower privilege)
    // EXCEPT level 0 (Admin) can manage other level 0 if needed, but usually we restrict it.
    // Let's say a user can manage roles with level >= their own level, but cannot change level to be < their own level.
    if (userRole.level === 0) return true;
    return level > userRole.level;
  };

  return {
    userRole,
    hasPermission,
    canManageRoleLevel,
  };
}
