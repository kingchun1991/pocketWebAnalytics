import { UAParser } from 'ua-parser-js';
import { v4 as uuidv4 } from 'uuid';
import PocketBase from 'pocketbase';

/**
 * Utility functions for analytics data processing
 */

/**
 * Parse user agent string to extract browser and system information
 */
export function parseUserAgent(userAgentString: string) {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  return {
    browser: {
      name: result.browser.name || 'Unknown',
      version: result.browser.version || '',
    },
    system: {
      name: result.os.name || 'Unknown',
      version: result.os.version || '',
    },
    device: {
      type: result.device.type || 'desktop',
      model: result.device.model || '',
      vendor: result.device.vendor || '',
    },
  };
}

/**
 * Extract UTM parameters from URL search params
 */
export function extractUTMParams(searchParams: string) {
  const params = new URLSearchParams(searchParams);

  const utmParams = {
    source: params.get('utm_source') || '',
    medium: params.get('utm_medium') || '',
    campaign: params.get('utm_campaign') || '',
    term: params.get('utm_term') || '',
    content: params.get('utm_content') || '',
  };

  // Return null if no UTM parameters found
  if (!utmParams.source && !utmParams.medium && !utmParams.campaign) {
    return null;
  }

  return utmParams;
}

/**
 * Parse screen size string (e.g., "1920,1080,1") into components
 */
export function parseScreenSize(sizeString: string) {
  const parts = sizeString.split(',');
  return {
    width: parseInt(parts[0]) || 0,
    height: parseInt(parts[1]) || 0,
    scale: parseFloat(parts[2]) || 1,
    size: sizeString,
  };
}

/**
 * Generate a session UUID
 */
export function generateSessionId(): string {
  return uuidv4();
}

/**
 * Categorize referrer URL
 */
export function categorizeReferrer(referrerUrl: string) {
  if (!referrerUrl || referrerUrl.trim() === '') {
    return {
      ref: 'direct',
      ref_scheme: null,
      category: 'direct',
    };
  }

  try {
    const url = new URL(referrerUrl);
    const hostname = url.hostname.toLowerCase();

    // Search engines
    const searchEngines = [
      'google.com',
      'bing.com',
      'yahoo.com',
      'duckduckgo.com',
      'baidu.com',
      'yandex.com',
      'ask.com',
    ];

    // Social media
    const socialMedia = [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com',
      'youtube.com',
      'tiktok.com',
      'reddit.com',
      'pinterest.com',
    ];

    let category = 'referral';
    if (searchEngines.some((engine) => hostname.includes(engine))) {
      category = 'search';
    } else if (socialMedia.some((social) => hostname.includes(social))) {
      category = 'social';
    }

    return {
      ref: referrerUrl,
      ref_scheme: url.protocol.replace(':', ''),
      category,
    };
  } catch {
    return {
      ref: referrerUrl,
      ref_scheme: null,
      category: 'unknown',
    };
  }
}

/**
 * Get or create a record in a lookup table (browsers, systems, etc.)
 */
export async function getOrCreateLookupRecord<
  T extends Record<string, string | number>,
>(
  pb: PocketBase,
  collection: string,
  data: T,
  uniqueFields: string[]
): Promise<string> {
  try {
    // Build filter query for unique fields
    const filters = uniqueFields
      .map((field) => `${field}="${data[field]}"`)
      .join(' && ');

    // Try to find existing record
    const existingRecord = await pb
      .collection(collection)
      .getFirstListItem(filters);
    return existingRecord.id;
  } catch {
    // Record doesn't exist, create it
    try {
      const newRecord = await pb.collection(collection).create(data);
      return newRecord.id;
    } catch (createError) {
      console.error(`Failed to create ${collection} record:`, createError);
      throw createError;
    }
  }
}

/**
 * Check if this is a first visit based on session and user fingerprint
 * Enhanced logic using multiple detection methods
 */
export async function detectFirstVisit(
  pb: PocketBase,
  siteId: string,
  sessionId: string,
  userFingerprint: string,
  remoteAddr?: string
): Promise<boolean> {
  try {
    console.log('🔍 Enhanced first visit detection started:', {
      siteId,
      sessionId,
      userFingerprint,
      remoteAddr,
    });

    // Method 1: Check by user fingerprint (most reliable)
    const fingerprintHits = await pb.collection('hits').getList(1, 1, {
      filter: `site_id="${siteId}" && session~"${userFingerprint}"`,
      sort: '-created_at',
    });

    if (fingerprintHits.totalItems > 0) {
      console.log(
        '👤 Found existing fingerprint hits:',
        fingerprintHits.totalItems
      );
      return false; // Not a first visit
    }

    // Method 2: Check by IP address (if available) within last 24 hours
    if (remoteAddr) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const ipHits = await pb.collection('hits').getList(1, 1, {
        filter: `site_id="${siteId}" && remote_addr="${remoteAddr}" && created_at>="${yesterday.toISOString()}"`,
        sort: '-created_at',
      });

      if (ipHits.totalItems > 0) {
        console.log('🌐 Found recent IP hits within 24h:', ipHits.totalItems);
        return false; // Not a first visit
      }
    }

    // Method 3: Check for any recent activity (fallback)
    // Look for any hits within last 7 days for this site
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentHits = await pb.collection('hits').getList(1, 1, {
      filter: `site_id="${siteId}" && created_at>="${weekAgo.toISOString()}"`,
      sort: '-created_at',
    });

    const isFirstVisit = recentHits.totalItems === 0;

    console.log('✅ Enhanced first visit detection result:', {
      method: isFirstVisit ? 'no_recent_activity' : 'found_recent_activity',
      isFirstVisit,
      recentHitsCount: recentHits.totalItems,
      fingerprintCheck: fingerprintHits.totalItems === 0,
      ipCheck: remoteAddr ? 'checked' : 'skipped',
    });

    return isFirstVisit;
  } catch (error) {
    console.error('❌ Error in enhanced first visit detection:', error);
    // Default to false if we can't determine (safer assumption)
    return false;
  }
}

/**
 * Generate a simple user fingerprint based on user agent and IP
 */
export function generateUserFingerprint(userAgent: string, ip: string): string {
  // Create a simple hash-like fingerprint from user agent and IP
  const combined = `${userAgent}-${ip}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if this is a new session (for session-based first visit detection)
 * Enhanced logic with proper session tracking
 */
export async function isNewSession(
  pb: PocketBase,
  siteId: string,
  sessionId: string,
  userFingerprint: string,
  sessionTimeout: number = 30 * 60 * 1000 // 30 minutes default
): Promise<boolean> {
  try {
    console.log('🔍 Enhanced session check started:', {
      siteId,
      sessionId,
      userFingerprint,
      sessionTimeoutMinutes: sessionTimeout / 60000,
    });

    // Check for existing session activity within timeout period
    const timeoutDate = new Date(Date.now() - sessionTimeout);

    // Method 1: Check by exact session ID
    const sessionHits = await pb.collection('hits').getList(1, 1, {
      filter: `site_id="${siteId}" && session="${sessionId}" && created_at>="${timeoutDate.toISOString()}"`,
      sort: '-created_at',
    });

    if (sessionHits.totalItems > 0) {
      console.log(
        '🎯 Found active session with same ID:',
        sessionHits.totalItems
      );
      return false; // Existing session
    }

    // Method 2: Check by user fingerprint for recent activity
    const fingerprintHits = await pb.collection('hits').getList(1, 1, {
      filter: `site_id="${siteId}" && session~"${userFingerprint}" && created_at>="${timeoutDate.toISOString()}"`,
      sort: '-created_at',
    });

    const isNewSession = fingerprintHits.totalItems === 0;

    console.log('✅ Enhanced session check result:', {
      isNewSession,
      sessionHitsCount: sessionHits.totalItems,
      fingerprintHitsCount: fingerprintHits.totalItems,
      timeoutDate: timeoutDate.toISOString(),
    });

    return isNewSession;
  } catch (error) {
    console.error('❌ Error in enhanced session check:', error);
    // Default to true (new session) if we can't determine
    return true;
  }
}
