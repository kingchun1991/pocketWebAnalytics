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
} from '@chakra-ui/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import DashboardMetrics from './DashboardMetrics';
import { SiteSelector } from './SiteSelector';
import { useAuth } from '@/lib/auth/AuthContext';
import { canAccessMultipleSites } from '@/lib/site-utils';

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

export default function DashboardOverview({
  siteId,
}: {
  siteId?: number | string;
}) {
  const { user, token } = useAuth();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('week');
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitializedSiteRef = useRef(false);

  // Initialize selectedSiteId only once when user/siteId is available
  useEffect(() => {
    if (!hasInitializedSiteRef.current && (user || siteId)) {
      const initialSiteId = siteId ? siteId.toString() : user?.site_id || '1';
      setSelectedSiteId(initialSiteId);
      hasInitializedSiteRef.current = true;
    }
  }, [user, siteId]);

  // Check if user can select multiple sites
  const canSelectSites = user ? canAccessMultipleSites(user.role) : false;

  // Handle site selection change
  const handleSiteChange = useCallback((newSiteId: string) => {
    setSelectedSiteId(newSiteId);
  }, []);

  const fetchData = useCallback(
    async (currentSiteId: string) => {
      try {
        // Cancel previous request if it exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
        const newAbortController = new AbortController();
        abortControllerRef.current = newAbortController;

        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          site: currentSiteId,
          period: timeRange,
          realtime: 'true',
          limit: '1000',
        });

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Add authorization header if user is logged in
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/stats?${params}`, {
          headers,
          signal: newAbortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
        abortControllerRef.current = null; // Clear controller on success
      } catch (err: unknown) {
        console.error('Dashboard data fetch error:', err);

        // Don't show error for cancelled requests
        const error = err as Error;
        if (error.name === 'AbortError') {
          console.log('Request was cancelled');
          return;
        }

        setError(
          error instanceof Error ? error.message : 'Failed to load data'
        );
        abortControllerRef.current = null; // Clear controller on error
      } finally {
        setLoading(false);
      }
    },
    [timeRange, token] // Removed abortController from dependencies
  );

  useEffect(() => {
    if (selectedSiteId) {
      fetchData(selectedSiteId);
    }
  }, [selectedSiteId, fetchData]);

  // Cleanup: abort any pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array since we're using ref

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" minH="300px">
          <Spinner size="xl" />
          <Text ml={4}>Loading analytics data...</Text>
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box
          p={6}
          bg="red.50"
          borderRadius="lg"
          border="1px"
          borderColor="red.200"
        >
          <Text color="red.600" fontWeight="medium">
            Error loading dashboard data
          </Text>
          <Text color="red.500" fontSize="sm" mt={1}>
            {error}
          </Text>
          <Button
            mt={4}
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={() => fetchData(selectedSiteId)}
          >
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>No data available</Text>
      </Container>
    );
  }

  // Extract data safely
  const {
    summary = {
      totalHits: 0,
      uniqueVisitors: 0,
      sessions: 0,
      firstVisits: 0,
      bounceRate: '0%',
    },
    topPages = [],
    topReferrers = [],
    topBrowsers = [],
    topSystems = [],
    metadata = {
      period: timeRange,
      dataSource: 'realtime',
      sampleSize: 0,
    },
  } = data;

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header with Site Selector and Controls */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="gray.900"
            _dark={{ color: 'white' }}
          >
            Analytics Dashboard
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Period: {metadata.period} • Data source: {metadata.dataSource}
            {metadata.sampleSize > 0 &&
              ` • Sample: ${metadata.sampleSize} records`}
          </Text>
        </Box>

        {/* Site Selector - only show for admin/support */}
        {canSelectSites && (
          <SiteSelector
            currentSiteId={selectedSiteId}
            onSiteChange={handleSiteChange}
          />
        )}
      </Flex>

      {/* Time Range Controls */}
      <Flex mb={6} gap={2}>
        {['day', 'week', 'month'].map((range) => (
          <Button
            key={range}
            size="sm"
            variant={timeRange === range ? 'solid' : 'outline'}
            colorScheme="blue"
            onClick={() => setTimeRange(range)}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </Button>
        ))}
      </Flex>

      {/* Main Metrics */}
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
                    <Text
                      fontWeight="medium"
                      fontSize="sm"
                      color="gray.900"
                      _dark={{ color: 'white' }}
                      flex={1}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {referrer.referrer || 'Direct'}
                    </Text>
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
