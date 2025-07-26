/**
 * Site detection and management utilities
 */

/**
 * Extract site code from current domain
 * Supports both subdomain (analytics.example.com) and custom domain patterns
 */
export function getCurrentSiteCode(): string {
  if (typeof window === 'undefined') return 'localhost';

  const hostname = window.location.hostname;

  // For localhost development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'localhost';
  }

  // For custom domains (check if it's a known analytics domain pattern)
  // If it's a subdomain pattern like analytics.example.com
  if (hostname.split('.').length > 2) {
    return hostname.split('.')[0]; // Get subdomain
  }

  // For custom domains, use the full domain as site code
  return hostname;
}

/**
 * Check if current user can access multiple sites (admin/support only)
 */
export function canAccessMultipleSites(role: string): boolean {
  return role === 'admin' || role === 'support';
}

/**
 * Get site identification from domain for site lookup
 */
export function getSiteIdentification(): { code?: string; cname?: string } {
  const hostname = getCurrentSiteCode();

  // For localhost development
  if (hostname === 'localhost') {
    return { code: 'localhost' };
  }

  // If it looks like a subdomain (site.domain.com)
  if (window.location.hostname.split('.').length > 2) {
    return { code: hostname };
  }

  // For custom domains
  return { cname: window.location.hostname };
}

/**
 * Validate if user can register for current site based on domain
 */
export function canRegisterForCurrentSite(userSiteId: string): boolean {
  const currentSiteCode = getCurrentSiteCode();

  // Allow registration if the site codes match or it's localhost
  return currentSiteCode === 'localhost' || userSiteId === currentSiteCode;
}
