import React from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Box, Spinner, Text } from '@chakra-ui/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'editor' | 'viewer';
  requiredPermission?: {
    resource: 'analytics' | 'users' | 'settings';
    action: 'read' | 'write' | 'delete';
  };
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="50vh"
      >
        <Spinner size="xl" />
        <Text ml={4}>Loading...</Text>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box textAlign="center" mt={10}>
        <Text fontSize="xl" color="red.500">
          You must be logged in to access this page.
        </Text>
      </Box>
    );
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = ['viewer', 'editor', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex < requiredRoleIndex) {
      return (
        <Box textAlign="center" mt={10}>
          <Text fontSize="xl" color="red.500">
            You don&apos;t have permission to access this page.
          </Text>
          <Text color="gray.500">
            Required role: {requiredRole}. Your role: {user.role}
          </Text>
        </Box>
      );
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    const { resource, action } = requiredPermission;
    const resourcePermissions = user.permissions[resource];

    // Type guard to ensure we have the right permission structure
    const hasPermission =
      resourcePermissions &&
      typeof resourcePermissions === 'object' &&
      action in resourcePermissions &&
      (resourcePermissions as Record<string, boolean>)[action] === true;

    if (!hasPermission) {
      return (
        <Box textAlign="center" mt={10}>
          <Text fontSize="xl" color="red.500">
            You don&apos;t have permission to perform this action.
          </Text>
          <Text color="gray.500">
            Required permission: {resource}.{action}
          </Text>
        </Box>
      );
    }
  }

  return <>{children}</>;
};
