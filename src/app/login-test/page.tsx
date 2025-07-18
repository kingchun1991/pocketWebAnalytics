'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  Container,
} from '@chakra-ui/react';

export default function LoginTestPage() {
  const [email, setEmail] = useState('viewer@example.com');
  const [password, setPassword] = useState('viewerpassword123');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{
    success: boolean;
    user?: { email: string; role: string };
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      console.log('Attempting login with:', { email, password });

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      const data = await res.json();
      console.log('Login response:', data);

      setResponse(data);

      if (res.ok && data.success) {
        // Store token and redirect
        localStorage.setItem('auth_token', data.token);
        console.log('Login successful, redirecting...');

        // Use a timeout to show success message
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container centerContent py={8}>
      <VStack gap={6} width="full" maxW="md">
        <Heading size="lg">Login Test Page</Heading>

        <Box width="full">
          <Text mb={2}>Email:</Text>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
        </Box>

        <Box width="full">
          <Text mb={2}>Password:</Text>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </Box>

        <Button
          colorScheme="blue"
          size="lg"
          width="full"
          loading={isLoading}
          onClick={handleLogin}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>

        {error && (
          <Box
            p={4}
            bg="red.50"
            border="1px"
            borderColor="red.200"
            borderRadius="md"
            width="full"
          >
            <Text color="red.700" fontWeight="bold">
              Error!
            </Text>
            <Text color="red.600">{error}</Text>
          </Box>
        )}

        {response && response.success && (
          <Box
            p={4}
            bg="green.50"
            border="1px"
            borderColor="green.200"
            borderRadius="md"
            width="full"
          >
            <Text color="green.700" fontWeight="bold">
              Success!
            </Text>
            <Text color="green.600">
              Logged in as {response.user?.email} ({response.user?.role})
              <br />
              Redirecting to dashboard in 2 seconds...
            </Text>
          </Box>
        )}

        {response && (
          <Box
            p={4}
            bg="gray.100"
            borderRadius="md"
            width="full"
            fontSize="sm"
            maxH="200px"
            overflowY="auto"
          >
            <Text fontWeight="bold" mb={2}>
              API Response:
            </Text>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </Box>
        )}

        <Box textAlign="center">
          <Text fontSize="sm" color="gray.600">
            Test credentials:
            <br />
            viewer@example.com / viewerpassword123
            <br />
            admin@example.com / adminpassword123
            <br />
            editor@example.com / editorpassword123
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}
