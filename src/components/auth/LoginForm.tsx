import React, { useState } from 'react';
import { Box, Button, Input, VStack, Text, Heading } from '@chakra-ui/react';

interface LoginFormProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  isLoading,
  error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await onLogin({ email, password });
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8}>
      <Box
        bg="white"
        p={8}
        borderRadius="md"
        shadow="lg"
        border="1px"
        borderColor="gray.200"
        _dark={{
          bg: 'gray.800',
          borderColor: 'gray.600',
        }}
      >
        <Heading size="lg" textAlign="center" mb={6}>
          Sign In
        </Heading>

        <form onSubmit={handleSubmit}>
          <VStack gap={4}>
            {error && (
              <Box
                p={3}
                bg="red.50"
                border="1px"
                borderColor="red.200"
                borderRadius="md"
                width="full"
                _dark={{
                  bg: 'red.900',
                  borderColor: 'red.700',
                }}
              >
                <Text color="red.700" _dark={{ color: 'red.200' }}>
                  {error}
                </Text>
              </Box>
            )}

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Email
              </Text>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </Box>

            <Box width="full">
              <Text mb={2} fontWeight="medium">
                Password
              </Text>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </Box>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              width="full"
              loading={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
};
