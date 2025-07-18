'use client';

import {
  Box,
  Container,
  SimpleGrid,
  Flex,
  Text,
  Spinner,
  Badge,
  Button,
  HStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import DashboardMetrics from './DashboardMetrics';

interface BrowserData {
  browser: string;
  hits: number;
  percentage: string;
}

interface SystemData {
  system: string;
  hits: number;
  percentage: string;
}

interface DashboardData {
  summary: {
    totalHits: number;
    uniqueVisitors: number;
    sessions: number;
    firstVisits: number;
    bounceRate: string;
  };
  topPages: Array<{ path: string; hits: number; percentage: string }>;
  topReferrers: Array<{ referrer: string; hits: number; percentage: string }>;
  topBrowsers: Array<{ browser: string; hits: number; percentage: string }>;
  topSystems: Array<{ system: string; hits: number; percentage: string }>;
  chartData: Array<{ date: string; hits: number }>;
  metadata: {
    period: string;
    dataSource: string;
    sampleSize: number;
  };
}

const DataCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Box
    p={6}
    bg="white"
    boxShadow="sm"
    borderRadius="lg"
    border="1px"
    borderColor="gray.200"
    _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
  >
    <Text
      fontSize="lg"
      fontWeight="bold"
      mb={4}
      color="gray.900"
      _dark={{ color: 'white' }}
    >
      {title}
    </Text>
    {children}
  </Box>
);

export default function DashboardOverview({ siteId = 1 }: { siteId?: number }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [useAggregation, setUseAggregation] = useState(true);
  const [isRealtime, setIsRealtime] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          site_id: siteId.toString(),
          period: 'week',
          expand: 'path,ref,browser,system',
          limit: '10',
          useAggregation: useAggregation.toString(),
          realtime: isRealtime.toString(),
        });

        const response = await fetch(`/api/stats?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [siteId, mounted, useAggregation, isRealtime]);

  // Don't render anything until component is mounted on client
  if (!mounted) {
    return (
      <Container maxW="7xl" py={8}>
        <Flex justifyContent="center" alignItems="center" minH="200px">
          <Spinner size="lg" />
          <Text ml={3}>Loading dashboard...</Text>
        </Flex>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxW="7xl" py={8}>
        <Flex justifyContent="center" alignItems="center" minH="200px">
          <Spinner size="lg" />
          <Text ml={3}>Loading dashboard...</Text>
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="7xl" py={8}>
        <Box textAlign="center" color="red.500">
          <Text fontSize="lg" fontWeight="bold">
            Error
          </Text>
          <Text>{error}</Text>
        </Box>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container maxW="7xl" py={8}>
        <Box textAlign="center" color="gray.500">
          <Text fontSize="lg">No data available</Text>
        </Box>
      </Container>
    );
  }

  const { summary } = data;
  const topPages = data.topPages || [];
  const topReferrers = data.topReferrers || [];
  const topBrowsers = data.topBrowsers || [];
  const topSystems = data.topSystems || [];

  return (
    <Container maxW="7xl" py={8}>
      {/* Control Panel */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap">
        <Text fontSize="2xl" fontWeight="bold">
          Analytics Dashboard
        </Text>
        <HStack gap={4}>
          <Button
            size="sm"
            variant={isRealtime ? 'solid' : 'outline'}
            colorScheme="blue"
            onClick={() => setIsRealtime(!isRealtime)}
          >
            {isRealtime ? 'Real-time' : 'Historical'}
          </Button>
          <Button
            size="sm"
            variant={useAggregation ? 'solid' : 'outline'}
            colorScheme="green"
            onClick={() => setUseAggregation(!useAggregation)}
          >
            {useAggregation ? 'Fast Mode' : 'Detailed Mode'}
          </Button>
          <Badge
            colorScheme={
              data?.metadata?.dataSource === 'aggregated' ? 'green' : 'blue'
            }
          >
            {data?.metadata?.dataSource === 'aggregated'
              ? 'Aggregated'
              : 'Real-time'}{' '}
            Data
          </Badge>
        </HStack>
      </Flex>

      {/* Overview Stats */}
      <DashboardMetrics
        summary={{
          totalHits: summary.totalHits || 0,
          uniqueVisitors: summary.uniqueVisitors || 0,
          sessions: summary.sessions || 0,
          bounceRate: summary.bounceRate || '0%',
        }}
      />

      {/* Detailed Stats Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        {/* Top Pages */}
        <DataCard title="Top Pages">
          {topPages.length > 0 ? (
            <Box>
              {topPages.map((page, index) => (
                <Box
                  key={index}
                  py={3}
                  borderBottom={index < topPages.length - 1 ? '1px' : 'none'}
                  borderColor="gray.200"
                  _dark={{ borderColor: 'gray.600' }}
                >
                  <Flex justifyContent="space-between" alignItems="center">
                    <Box flex={1} minW={0}>
                      <Text
                        fontWeight="medium"
                        fontSize="sm"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        color="gray.900"
                        _dark={{ color: 'white' }}
                      >
                        {page.path}
                      </Text>
                    </Box>
                    <Box textAlign="right" ml={4}>
                      <Text fontWeight="bold" fontSize="sm">
                        {page.hits}
                      </Text>
                      <Badge colorScheme="blue" fontSize="xs">
                        {page.percentage}%
                      </Badge>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Box>
          ) : (
            <Text color="gray.500" fontSize="sm">
              No page data available
            </Text>
          )}
        </DataCard>

        {/* Top Referrers */}
        <DataCard title="Top Referrers">
          {topReferrers.length > 0 ? (
            <Box>
              {topReferrers.map((referrer, index) => (
                <Box
                  key={index}
                  py={3}
                  borderBottom={
                    index < topReferrers.length - 1 ? '1px' : 'none'
                  }
                  borderColor="gray.200"
                  _dark={{ borderColor: 'gray.600' }}
                >
                  <Flex justifyContent="space-between" alignItems="center">
                    <Box flex={1} minW={0}>
                      <Text
                        fontWeight="medium"
                        fontSize="sm"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        color="gray.900"
                        _dark={{ color: 'white' }}
                      >
                        {referrer.referrer || 'Direct'}
                      </Text>
                    </Box>
                    <Box textAlign="right" ml={4}>
                      <Text fontWeight="bold" fontSize="sm">
                        {referrer.hits}
                      </Text>
                      <Badge colorScheme="green" fontSize="xs">
                        {referrer.percentage}%
                      </Badge>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Box>
          ) : (
            <Text color="gray.500" fontSize="sm">
              No referrer data available
            </Text>
          )}
        </DataCard>

        {/* Browsers */}
        <DataCard title="Browsers">
          {topBrowsers.length > 0 ? (
            <Box>
              {topBrowsers.map((browser: BrowserData, index: number) => (
                <Box
                  key={index}
                  py={3}
                  borderBottom={index < topBrowsers.length - 1 ? '1px' : 'none'}
                  borderColor="gray.200"
                  _dark={{ borderColor: 'gray.600' }}
                >
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text
                      fontWeight="medium"
                      fontSize="sm"
                      color="gray.900"
                      _dark={{ color: 'white' }}
                    >
                      {browser.browser}
                    </Text>
                    <Box textAlign="right">
                      <Text fontWeight="bold" fontSize="sm">
                        {browser.hits}
                      </Text>
                      <Badge colorScheme="purple" fontSize="xs">
                        {browser.percentage}%
                      </Badge>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Box>
          ) : (
            <Text color="gray.500" fontSize="sm">
              No browser data available
            </Text>
          )}
        </DataCard>

        {/* Operating Systems */}
        <DataCard title="Operating Systems">
          {topSystems.length > 0 ? (
            <Box>
              {topSystems.map((system: SystemData, index: number) => (
                <Box
                  key={index}
                  py={3}
                  borderBottom={index < topSystems.length - 1 ? '1px' : 'none'}
                  borderColor="gray.200"
                  _dark={{ borderColor: 'gray.600' }}
                >
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text
                      fontWeight="medium"
                      fontSize="sm"
                      color="gray.900"
                      _dark={{ color: 'white' }}
                    >
                      {system.system}
                    </Text>
                    <Box textAlign="right">
                      <Text fontWeight="bold" fontSize="sm">
                        {system.hits}
                      </Text>
                      <Badge colorScheme="orange" fontSize="xs">
                        {system.percentage}%
                      </Badge>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Box>
          ) : (
            <Text color="gray.500" fontSize="sm">
              No system data available
            </Text>
          )}
        </DataCard>
      </SimpleGrid>
    </Container>
  );
}
