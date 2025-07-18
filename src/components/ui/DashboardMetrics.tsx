import React from 'react';
import { Box, Flex, Text, Icon, SimpleGrid } from '@chakra-ui/react';
import { FiEye, FiUsers, FiClock, FiTrendingUp } from 'react-icons/fi';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  changeType?: 'increase' | 'decrease';
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  icon,
  changeType,
}) => {
  return (
    <Box
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
      borderColor="gray.200"
      borderWidth="1px"
      borderRadius="lg"
      p={6}
      shadow="sm"
    >
      <Flex alignItems="center" justifyContent="space-between">
        <Box>
          <Text fontSize="sm" color="gray.500" mb={1}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" mb={1}>
            {value}
          </Text>
          {change && (
            <Text
              fontSize="sm"
              color={changeType === 'increase' ? 'green.500' : 'red.500'}
            >
              {changeType === 'increase' ? '↗' : '↘'} {change}
            </Text>
          )}
        </Box>
        <Box>
          <Icon
            as={icon}
            w={8}
            h={8}
            color={changeType === 'increase' ? 'green.500' : 'blue.500'}
          />
        </Box>
      </Flex>
    </Box>
  );
};

interface DashboardMetricsProps {
  summary: {
    totalHits: number;
    uniqueVisitors: number;
    sessions: number;
    bounceRate: string;
  };
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ summary }) => {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
      <MetricCard
        label="Total Page Views"
        value={summary.totalHits.toLocaleString()}
        change="12% from last week"
        changeType="increase"
        icon={FiEye}
      />
      <MetricCard
        label="Unique Visitors"
        value={summary.uniqueVisitors.toLocaleString()}
        change="8% from last week"
        changeType="increase"
        icon={FiUsers}
      />
      <MetricCard
        label="Sessions"
        value={summary.sessions.toLocaleString()}
        change="5% from last week"
        changeType="increase"
        icon={FiClock}
      />
      <MetricCard
        label="Bounce Rate"
        value={summary.bounceRate}
        change="3% from last week"
        changeType="decrease"
        icon={FiTrendingUp}
      />
    </SimpleGrid>
  );
};

export default DashboardMetrics;
