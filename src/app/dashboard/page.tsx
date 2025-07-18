'use client';

import DashboardOverview from '@/components/ui/dashboard-overview';
import ClientOnly from '@/components/ui/ClientOnly';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Badge,
  Spinner,
} from '@chakra-ui/react';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
        {/* Header */}
        <Box
          bg="white"
          borderBottom="1px"
          borderColor="gray.200"
          _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
        >
          <Container maxW="7xl" py={6}>
            <Flex justifyContent="space-between" alignItems="center">
              <Box>
                <Heading size="lg" color="gray.900" _dark={{ color: 'white' }}>
                  Analytics Dashboard
                </Heading>
                <Text color="gray.600" _dark={{ color: 'gray.400' }} mt={1}>
                  Real-time insights for your website performance
                </Text>
              </Box>
              <Badge colorScheme="green" variant="solid" px={3} py={1}>
                Live
              </Badge>
            </Flex>
          </Container>
        </Box>

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
            <DashboardOverview siteId={1} />
          </ClientOnly>
        </ErrorBoundary>
      </Box>
    </ProtectedRoute>
  );
}
