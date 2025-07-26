'use client';

import { Box, Text, HStack, Icon, Spinner } from '@chakra-ui/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FiGlobe } from 'react-icons/fi';
import { useAuth } from '@/lib/auth/AuthContext';
import { canAccessMultipleSites } from '@/lib/site-utils';

interface Site {
  id: string;
  code: string;
  cname?: string;
  link_domain?: string;
  state: 'a' | 'd';
}

interface SiteSelectorProps {
  onSiteChange?: (siteId: string) => void;
  currentSiteId?: string;
}

export function SiteSelector({
  onSiteChange,
  currentSiteId,
}: SiteSelectorProps) {
  const { user, token } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState(currentSiteId || '');
  const hasFetchedRef = useRef(false);

  // Only show site selector for admin/support users
  const canSelectSites = user && canAccessMultipleSites(user.role);

  const fetchSites = useCallback(async () => {
    if (hasFetchedRef.current) return; // Prevent multiple fetches

    try {
      setLoading(true);
      hasFetchedRef.current = true;

      const response = await fetch('/api/sites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }

      const data = await response.json();
      setSites(data.sites || []);

      // Set default selection if not set and no current selection
      if (!currentSiteId && data.sites.length > 0) {
        const defaultSite = data.sites[0].id;
        setSelectedSite(defaultSite);
        onSiteChange?.(defaultSite);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      hasFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoading(false);
    }
  }, [token, onSiteChange, currentSiteId]);

  useEffect(() => {
    if (canSelectSites && token && !hasFetchedRef.current) {
      fetchSites();
    }
  }, [canSelectSites, token, fetchSites]);

  useEffect(() => {
    if (currentSiteId) {
      setSelectedSite(currentSiteId);
    }
  }, [currentSiteId]);

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId);
    onSiteChange?.(siteId);
  };

  // Don't render if user can't access multiple sites
  if (!canSelectSites) {
    return null;
  }

  return (
    <Box
      bg="white"
      p={4}
      borderRadius="lg"
      border="1px"
      borderColor="gray.200"
      boxShadow="sm"
      _dark={{
        bg: 'gray.800',
        borderColor: 'gray.600',
      }}
    >
      <HStack gap={3}>
        <Icon as={FiGlobe} color="blue.500" />
        <Text
          fontSize="sm"
          fontWeight="medium"
          color="gray.700"
          _dark={{ color: 'gray.300' }}
        >
          Site:
        </Text>
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <Box>
            <select
              value={selectedSite}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleSiteChange(e.target.value)
              }
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: 'white',
                minWidth: '200px',
                fontSize: '14px',
              }}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.cname || site.code} {site.state === 'd' && '(Disabled)'}
                </option>
              ))}
            </select>
          </Box>
        )}
        {user?.role && (
          <Text
            fontSize="xs"
            color="gray.500"
            px={2}
            py={1}
            bg="gray.100"
            borderRadius="md"
            _dark={{
              color: 'gray.400',
              bg: 'gray.700',
            }}
          >
            {user.role.toUpperCase()}
          </Text>
        )}
      </HStack>
    </Box>
  );
}
