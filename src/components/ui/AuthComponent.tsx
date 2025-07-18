'use client';

import React from 'react';
import { Box, Button, VStack, Text } from '@chakra-ui/react';
import { useAuth } from '@/lib/auth/AuthContext';

interface AuthComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthComponent: React.FC<AuthComponentProps> = ({
  children,
  fallback,
}) => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <Box>
        {fallback || (
          <VStack gap={4}>
            <Text>Please log in to access this content</Text>
            <Button
              colorScheme="blue"
              onClick={() => (window.location.href = '/login')}
            >
              Login
            </Button>
          </VStack>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {children}
      <Button
        size="sm"
        variant="ghost"
        onClick={logout}
        position="absolute"
        top={4}
        right={4}
      >
        Logout
      </Button>
    </Box>
  );
};

export default AuthComponent;
