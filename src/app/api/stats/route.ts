import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(
  process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
);

interface StatsQuery {
  startDate?: string;
  endDate?: string;
  site?: string;
  path?: string;
  campaign?: string;
  limit?: string; // For controlling sample size
  realtime?: string; // For real-time vs historical data
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate with PocketBase
    await pb
      .collection('_superusers')
      .authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || '',
        process.env.POCKETBASE_ADMIN_PASSWORD || ''
      );

    const { searchParams } = new URL(request.url);
    const query: StatsQuery = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      site: searchParams.get('site') || undefined,
      path: searchParams.get('path') || undefined,
      campaign: searchParams.get('campaign') || undefined,
      limit: searchParams.get('limit') || undefined,
      realtime: searchParams.get('realtime') || undefined,
    };

    // Check if we should use aggregation tables for better performance
    const useAggregation = searchParams.get('useAggregation') !== 'false';
    const isRealtime = query.realtime === 'true';

    console.log('📊 Dashboard API request:', {
      ...query,
      useAggregation,
      isRealtime,
    });

    // Determine sample size and time range based on query type
    const customLimit = query.limit ? parseInt(query.limit) : null;
    const defaultLimit = isRealtime ? 20 : 50; // Smaller for real-time
    const sampleSize = customLimit || defaultLimit;

    // Get current time range (default to last 7 days for faster queries)
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    console.log('📅 Time range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      useAggregation,
      sampleSize,
    });

    // If using aggregation and time range is more than 1 hour old, try aggregated data
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const canUseAggregation =
      useAggregation && !isRealtime && endDate < oneHourAgo;

    if (canUseAggregation) {
      console.log('🚀 Using aggregation tables for better performance');
      return await getAggregatedStats(query, startDate, endDate, sampleSize);
    } else {
      console.log('📊 Using real-time data from hits table');
      return await getRealTimeStats(query, startDate, endDate, sampleSize);
    }
  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Function to get aggregated stats for better performance
async function getAggregatedStats(
  query: StatsQuery,
  startDate: Date,
  endDate: Date,
  sampleSize: number
) {
  console.log('🚀 Fetching aggregated stats...');

  // Build base filters
  const dateFilter = `hour >= "${startDate.toISOString()}" && hour <= "${endDate.toISOString()}"`;
  let siteFilter = '';

  if (query.site) {
    siteFilter = ` && site_id = "${query.site}"`;
  }

  try {
    // Get aggregated hit counts (path stats)
    const hitCounts = await pb.collection('hit_counts').getList(1, sampleSize, {
      filter: dateFilter + siteFilter,
      expand: 'site_id,path_id',
      sort: '-hit_count',
    });

    // Get aggregated ref counts (referrer stats)
    const refCounts = await pb.collection('ref_counts').getList(1, sampleSize, {
      filter: dateFilter + siteFilter,
      expand: 'site_id,ref_id',
      sort: '-hit_count',
    });

    // Get daily hit stats
    const dailyFilter = `day >= "${startDate.toISOString().split('T')[0]}" && day <= "${endDate.toISOString().split('T')[0]}"`;
    const hitStats = await pb.collection('hit_stats').getList(1, sampleSize, {
      filter: dailyFilter + siteFilter,
      expand: 'site_id',
      sort: '-day',
    });

    // Process aggregated data
    const pathsMap = new Map();
    const referrersMap = new Map();
    const dailyHitsMap = new Map();
    let totalHits = 0;
    let totalUnique = 0;
    let totalSessions = 0;

    // Process hit counts for path statistics
    hitCounts.items.forEach((record) => {
      const path = record.expand?.path_id?.path || 'Unknown';
      const hits = record.hit_count || 0;
      pathsMap.set(path, (pathsMap.get(path) || 0) + hits);
      totalHits += hits;
    });

    // Process ref counts for referrer statistics
    refCounts.items.forEach((record) => {
      const ref = record.expand?.ref_id?.ref || 'Direct';
      const hits = record.hit_count || 0;
      referrersMap.set(ref, (referrersMap.get(ref) || 0) + hits);
    });

    // Process daily stats
    hitStats.items.forEach((record) => {
      const day =
        record.day?.split('T')[0] || new Date().toISOString().split('T')[0];
      const hits = record.total_hits || 0;
      dailyHitsMap.set(day, (dailyHitsMap.get(day) || 0) + hits);
      totalUnique += record.unique_visitors || 0;
      totalSessions += record.sessions || 0;
    });

    // Convert to arrays and calculate percentages
    const topPages = Array.from(pathsMap.entries())
      .map(([path, count]) => ({
        path,
        hits: count,
        percentage:
          totalHits > 0 ? ((count / totalHits) * 100).toFixed(1) : '0.0',
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    const topReferrers = Array.from(referrersMap.entries())
      .map(([ref, count]) => ({
        referrer: ref,
        hits: count,
        percentage:
          totalHits > 0 ? ((count / totalHits) * 100).toFixed(1) : '0.0',
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    const chartData = Array.from(dailyHitsMap.entries())
      .map(([date, hits]) => ({ date, hits }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const response = {
      summary: {
        totalHits,
        uniqueVisitors: Math.round(
          totalUnique / Math.max(hitStats.items.length, 1)
        ),
        sessions: Math.round(
          totalSessions / Math.max(hitStats.items.length, 1)
        ),
        firstVisits: 0, // Not available in aggregation
        bounceRate: '0%', // Not available in aggregation
      },
      topPages,
      topReferrers,
      topBrowsers: [], // Not available in current aggregation
      topSystems: [], // Not available in current aggregation
      chartData,
      metadata: {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        dataSource: 'aggregated',
        sampleSize:
          hitCounts.items.length +
          refCounts.items.length +
          hitStats.items.length,
      },
    };

    console.log('✅ Aggregated stats fetched successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error fetching aggregated stats:', error);
    // Fallback to real-time stats
    console.log('🔄 Falling back to real-time stats...');
    return await getRealTimeStats(query, startDate, endDate, sampleSize);
  }
}

// Function to get real-time stats from the hits table
async function getRealTimeStats(
  query: StatsQuery,
  startDate: Date,
  endDate: Date,
  sampleSize: number
) {
  console.log('📊 Fetching real-time stats...');

  // Build filter for date range
  const dateFilter = `created_at >= "${startDate.toISOString()}" && created_at <= "${endDate.toISOString()}"`;
  let filter = dateFilter;

  // Add site filter if specified
  if (query.site) {
    filter += ` && site_id = "${query.site}"`;
  }

  // Add path filter if specified
  if (query.path) {
    try {
      const pathRecord = await pb
        .collection('paths')
        .getFirstListItem(`path="${query.path}"`);
      filter += ` && path_id = "${pathRecord.id}"`;
    } catch {
      console.warn('⚠️ Path not found for filter:', query.path);
    }
  }

  // Add campaign filter if specified
  if (query.campaign) {
    filter += ` && campaign = "${query.campaign}"`;
  }

  console.log('🔍 Query filter:', filter);

  // Fetch hits with expand for related data
  const recentHits = await pb.collection('hits').getList(1, sampleSize, {
    filter,
    expand: 'site_id,path_id,ref_id,browser_id,system_id,size_id,campaign_id',
    sort: '-created_at',
  });

  console.log(`📈 Found ${recentHits.items.length} hits in range`);

  // Process the data
  const sessions = new Set();
  const paths = new Map();
  const referrers = new Map();
  const browsers = new Map();
  const systems = new Map();
  const dailyHits = new Map();
  let firstVisits = 0;

  recentHits.items.forEach((hit) => {
    // Count unique sessions
    if (hit.session) {
      sessions.add(hit.session);
    }

    // Count first visits
    if (hit.first_visit === 1) {
      firstVisits++;
    }

    // Count paths
    if (hit.expand?.path_id?.path) {
      const path = hit.expand.path_id.path;
      paths.set(path, (paths.get(path) || 0) + 1);
    }

    // Count referrers
    if (hit.expand?.ref_id?.ref) {
      const ref = hit.expand.ref_id.ref;
      referrers.set(ref, (referrers.get(ref) || 0) + 1);
    }

    // Count browsers
    if (hit.expand?.browser_id?.name) {
      const browser = hit.expand.browser_id.name;
      browsers.set(browser, (browsers.get(browser) || 0) + 1);
    }

    // Count systems
    if (hit.expand?.system_id?.name) {
      const system = hit.expand.system_id.name;
      systems.set(system, (systems.get(system) || 0) + 1);
    }

    // Count daily hits
    const date = new Date(hit.created_at).toISOString().split('T')[0];
    dailyHits.set(date, (dailyHits.get(date) || 0) + 1);
  });

  // Convert maps to sorted arrays
  const topPages = Array.from(paths.entries())
    .map(([path, count]) => ({
      path,
      hits: count,
      percentage: ((count / recentHits.items.length) * 100).toFixed(1),
    }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 10);

  const topReferrers = Array.from(referrers.entries())
    .map(([referrer, count]) => ({
      referrer,
      hits: count,
      percentage: ((count / recentHits.items.length) * 100).toFixed(1),
    }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 10);

  const topBrowsers = Array.from(browsers.entries())
    .map(([browser, count]) => ({
      browser,
      hits: count,
      percentage: ((count / recentHits.items.length) * 100).toFixed(1),
    }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 5);

  const topSystems = Array.from(systems.entries())
    .map(([system, count]) => ({
      system,
      hits: count,
      percentage: ((count / recentHits.items.length) * 100).toFixed(1),
    }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 5);

  const chartData = Array.from(dailyHits.entries())
    .map(([date, hits]) => ({ date, hits }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate bounce rate (simplified - sessions with only 1 hit)
  const bounceRate =
    sessions.size > 0 ? Math.round((firstVisits / sessions.size) * 100) : 0;

  const response = {
    summary: {
      totalHits: recentHits.items.length,
      uniqueVisitors: sessions.size,
      sessions: sessions.size,
      firstVisits,
      bounceRate: `${bounceRate}%`,
    },
    topPages,
    topReferrers,
    topBrowsers,
    topSystems,
    chartData,
    metadata: {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      dataSource: 'realtime',
      sampleSize: recentHits.items.length,
    },
  };

  console.log('✅ Real-time stats processed successfully');
  return NextResponse.json(response);
}
