'use client';

import DashboardOverview from '@/components/ui/dashboard-overview';
import ClientOnly from '@/components/ui/ClientOnly';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthContext';

import { Box, Container, Text, Flex, Spinner } from '@chakra-ui/react';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
        {/* Dashboard Content */}
        <ErrorBoundary>
          <ClientOnly
            fallback={
              <Container maxW="7xl" py={8}>
                <Flex justifyContent="center" alignItems="center" minH="400px">
                  <Spinner size="lg" />
                  <Text ml={3}>Loading dashboard...</Text>
                </Flex>
              </Container>
            }
          >
            <DashboardOverview siteId={user?.site_id} />
          </ClientOnly>
        </ErrorBoundary>
      </Box>
    </ProtectedRoute>
  );
}
