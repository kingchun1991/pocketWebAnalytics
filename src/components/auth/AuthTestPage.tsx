'use client';

import React from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Heading,
  Container,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const UserInfo: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'editor':
        return 'blue';
      case 'viewer':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="md"
      shadow="md"
      border="1px"
      borderColor="gray.200"
    >
      <VStack gap={4} align="start">
        <Heading size="md">User Information</Heading>

        <Box>
          <Text>
            <strong>Email:</strong> {user.email}
          </Text>
          <Text>
            <strong>ID:</strong> {user.id}
          </Text>
          <Text>
            <strong>Site ID:</strong> {user.site_id}
          </Text>
          <HStack>
            <Text>
              <strong>Role:</strong>
            </Text>
            <Badge colorScheme={getRoleColor(user.role)}>
              {user.role.toUpperCase()}
            </Badge>
          </HStack>
        </Box>

        <Box>
          <Text fontWeight="bold" mb={2}>
            Permissions:
          </Text>
          {Object.entries(user.permissions).map(([resource, perms]) => (
            <Box key={resource} mb={2}>
              <Text fontWeight="medium">{resource}:</Text>
              <HStack>
                {Object.entries(perms).map(([action, allowed]) => (
                  <Badge
                    key={action}
                    colorScheme={allowed ? 'green' : 'red'}
                    variant={allowed ? 'solid' : 'outline'}
                  >
                    {action}: {allowed ? 'Yes' : 'No'}
                  </Badge>
                ))}
              </HStack>
            </Box>
          ))}
        </Box>

        <Button colorScheme="red" onClick={logout}>
          Logout
        </Button>
      </VStack>
    </Box>
  );
};

const AdminSection: React.FC = () => (
  <ProtectedRoute requiredRole="admin">
    <Box p={6} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
      <Heading size="md" color="red.700" mb={4}>
        Admin Section
      </Heading>
      <Text color="red.600">This section is only visible to admin users.</Text>
      <Text mt={2} fontSize="sm" color="red.500">
        You can manage users, settings, and all analytics data here.
      </Text>
    </Box>
  </ProtectedRoute>
);

const EditorSection: React.FC = () => (
  <ProtectedRoute requiredRole="editor">
    <Box
      p={6}
      bg="blue.50"
      borderRadius="md"
      border="1px"
      borderColor="blue.200"
    >
      <Heading size="md" color="blue.700" mb={4}>
        Editor Section
      </Heading>
      <Text color="blue.600">
        This section is visible to editors and admins.
      </Text>
      <Text mt={2} fontSize="sm" color="blue.500">
        You can write and modify analytics data here.
      </Text>
    </Box>
  </ProtectedRoute>
);

const ViewerSection: React.FC = () => (
  <ProtectedRoute requiredRole="viewer">
    <Box
      p={6}
      bg="green.50"
      borderRadius="md"
      border="1px"
      borderColor="green.200"
    >
      <Heading size="md" color="green.700" mb={4}>
        Viewer Section
      </Heading>
      <Text color="green.600">
        This section is visible to all authenticated users.
      </Text>
      <Text mt={2} fontSize="sm" color="green.500">
        You can view analytics data here.
      </Text>
    </Box>
  </ProtectedRoute>
);

const PermissionSection: React.FC = () => (
  <ProtectedRoute
    requiredPermission={{ resource: 'analytics', action: 'write' }}
  >
    <Box
      p={6}
      bg="purple.50"
      borderRadius="md"
      border="1px"
      borderColor="purple.200"
    >
      <Heading size="md" color="purple.700" mb={4}>
        Analytics Write Permission Section
      </Heading>
      <Text color="purple.600">
        This section requires write permission for analytics.
      </Text>
    </Box>
  </ProtectedRoute>
);

export const AuthTestPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Container centerContent py={8}>
        <Text>You must be logged in to view this page.</Text>
        <Button mt={4} onClick={() => (window.location.href = '/login')}>
          Go to Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={6} align="stretch">
        <Heading textAlign="center">Authentication Test Dashboard</Heading>

        <UserInfo />
        <ViewerSection />
        <EditorSection />
        <AdminSection />
        <PermissionSection />
      </VStack>
    </Container>
  );
};
