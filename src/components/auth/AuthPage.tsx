import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Text,
  VStack,
  Heading,
  Container,
} from '@chakra-ui/react';
import { useAuth } from '@/lib/auth/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

interface Site {
  id: string;
  name: string;
}

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const { login, register, isLoading, error, user } = useAuth();
  const router = useRouter();

  // Fetch available sites for registration
  useEffect(() => {
    const fetchSites = async () => {
      try {
        // For now, we'll use a mock site. In a real app, you'd fetch from an API
        setSites([{ id: '7lv4b9y96vd1pb0', name: 'Default Site' }]);
      } catch (err) {
        console.error('Failed to fetch sites:', err);
      }
    };

    if (!isLogin) {
      fetchSites();
    }
  }, [isLogin]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000); // Small delay to show success message
    }
  }, [user, router]);

  // Show success message if user is logged in
  if (user) {
    return (
      <Container centerContent>
        <Box textAlign="center" mt={10}>
          <Heading size="lg" mb={4} color="green.500">
            ✅ Login Successful!
          </Heading>
          <Text color="gray.600" mb={4}>
            Welcome back, {user.email}! You are logged in as a {user.role}.
          </Text>
          <Text color="gray.500" fontSize="sm" mb={4}>
            Redirecting to dashboard...
          </Text>
          <Button colorScheme="blue" onClick={() => router.push('/dashboard')}>
            Go to Dashboard Now
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container centerContent py={8}>
      <VStack gap={8} width="full" maxW="md">
        <Box textAlign="center">
          <Heading size="xl" mb={2}>
            PocketWebAnalytics
          </Heading>
          <Text color="gray.600">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </Text>
        </Box>

        {isLogin ? (
          <LoginForm
            onLogin={login}
            isLoading={isLoading}
            error={error || undefined}
          />
        ) : (
          <RegisterForm
            onRegister={register}
            isLoading={isLoading}
            error={error || undefined}
            sites={sites}
          />
        )}

        <Box textAlign="center">
          <Text color="gray.600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <Button
            variant="ghost"
            colorScheme="blue"
            onClick={() => {
              setIsLogin(!isLogin);
              // Clear any existing errors when switching forms
            }}
            mt={2}
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </Button>
        </Box>
      </VStack>
    </Container>
  );
};
