'use client';

import React from 'react';
import { Box, Text, Button, VStack } from '@chakra-ui/react';
import { useAuth } from '@/lib/auth/AuthContext';

export const AuthDebug: React.FC = () => {
  const { user, token, logout, isLoading, error } = useAuth();

  return (
    <Box
      position="fixed"
      top={4}
      right={4}
      p={4}
      bg="gray.100"
      borderRadius="md"
      shadow="md"
      maxW="300px"
      fontSize="sm"
      zIndex={1000}
    >
      <VStack align="start" gap={2}>
        <Text fontWeight="bold">Auth Debug</Text>
        <Text>Loading: {isLoading ? 'Yes' : 'No'}</Text>
        <Text>Error: {error || 'None'}</Text>
        <Text>Token: {token ? 'Present' : 'None'}</Text>
        <Text>User: {user ? `${user.email} (${user.role})` : 'None'}</Text>
        {user && (
          <Button size="xs" colorScheme="red" onClick={logout}>
            Logout
          </Button>
        )}
      </VStack>
    </Box>
  );
};
