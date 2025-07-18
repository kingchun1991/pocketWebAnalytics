#!/usr/bin/env node

/**
 * Scheduled Aggregation Script for PocketWebAnalytics
 * This script should be run as a cron job to keep aggregation tables updated
 *
 * Recommended schedule:
 * - Every hour: 0 * * * * (for hit_counts and ref_counts)
 * - Daily at 1 AM: 0 1 * * * (for hit_stats daily aggregation)
 */

import PocketBase from 'pocketbase';
import { subHours, subDays, startOfHour, startOfDay } from 'date-fns';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Configuration
const CONFIG = {
  // How many hours back to aggregate (for incremental updates)
  HOURLY_LOOKBACK: 2,
  // How many days back to aggregate daily stats
  DAILY_LOOKBACK: 1,
  // Maximum records to process in one batch
  BATCH_SIZE: 1000,
};

// Authenticate with admin credentials
async function authenticate() {
  await pb
    .collection('_superusers')
    .authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || '',
      process.env.POCKETBASE_ADMIN_PASSWORD || ''
    );
}

/**
 * Get or create a lookup record
 */
async function getOrCreateLookupRecord(collection, field, value) {
  if (!value) return null;

  try {
    // Try to find existing record
    const existing = await pb
      .collection(collection)
      .getFirstListItem(`${field}="${value}"`);
    return existing.id;
  } catch (error) {
    try {
      // Create new record if not found
      const newRecord = await pb
        .collection(collection)
        .create({ [field]: value });
      return newRecord.id;
    } catch (createError) {
      console.warn(
        `⚠️ Failed to create ${collection} record for ${value}:`,
        createError.message
      );
      return null;
    }
  }
}

/**
 * Aggregate hit counts for the last few hours (incremental)
 */
async function aggregateIncrementalHitCounts() {
  console.log('⏰ Running incremental hit counts aggregation...');

  try {
    const sites = await pb.collection('sites').getList(1, 100);

    for (const site of sites.items) {
      console.log(
        `📊 Processing incremental hit counts for site: ${site.domain}`
      );

      // Get hits from the last few hours
      const lookbackTime = subHours(new Date(), CONFIG.HOURLY_LOOKBACK);
      const filter = `site_id = "${site.id}" && created_at >= "${lookbackTime.toISOString()}"`;

      const hits = await pb.collection('hits').getList(1, CONFIG.BATCH_SIZE, {
        filter,
        expand: 'path_id',
      });

      console.log(
        `📈 Found ${hits.items.length} recent hits for ${site.domain}`
      );

      // Group hits by hour and path
      const hourlyGroups = new Map();

      for (const hit of hits.items) {
        const hour = startOfHour(new Date(hit.created_at));
        const hourKey = hour.toISOString();
        const pathId = hit.path_id;

        if (!pathId) continue;

        const groupKey = `${hourKey}-${pathId}`;

        if (!hourlyGroups.has(groupKey)) {
          hourlyGroups.set(groupKey, {
            hour: hourKey,
            site_id: site.id,
            path_id: pathId,
            hit_count: 0,
          });
        }

        hourlyGroups.get(groupKey).hit_count++;
      }

      // Create or update hit_counts records
      for (const [groupKey, data] of hourlyGroups) {
        try {
          // Check if record already exists
          const existingFilter = `site_id = "${data.site_id}" && path_id = "${data.path_id}" && hour = "${data.hour}"`;

          try {
            const existing = await pb
              .collection('hit_counts')
              .getFirstListItem(existingFilter);
            // Update existing record
            await pb.collection('hit_counts').update(existing.id, {
              hit_count: existing.hit_count + data.hit_count,
            });
            console.log(`📝 Updated hit_counts record for ${data.hour}`);
          } catch (notFoundError) {
            // Create new record
            await pb.collection('hit_counts').create(data);
            console.log(`✅ Created hit_counts record for ${data.hour}`);
          }
        } catch (error) {
          console.warn(
            `⚠️ Failed to process hit_counts for ${groupKey}:`,
            error.message
          );
        }
      }
    }

    console.log('✅ Incremental hit counts aggregation completed');
  } catch (error) {
    console.error('❌ Incremental hit counts aggregation failed:', error);
    throw error;
  }
}

/**
 * Aggregate daily stats for yesterday
 */
async function aggregateDailyStats() {
  console.log('📅 Running daily stats aggregation...');

  try {
    const sites = await pb.collection('sites').getList(1, 100);

    for (const site of sites.items) {
      console.log(`📊 Processing daily stats for site: ${site.domain}`);

      // Get yesterday's data
      const yesterday = subDays(startOfDay(new Date()), CONFIG.DAILY_LOOKBACK);
      const today = startOfDay(new Date());

      const filter = `site_id = "${site.id}" && created_at >= "${yesterday.toISOString()}" && created_at < "${today.toISOString()}"`;

      const hits = await pb.collection('hits').getList(1, CONFIG.BATCH_SIZE, {
        filter,
        expand: 'path_id',
      });

      console.log(
        `📈 Found ${hits.items.length} hits for ${site.domain} on ${yesterday.toISOString().split('T')[0]}`
      );

      if (hits.items.length === 0) continue;

      // Calculate daily stats
      const uniqueVisitors = new Set();
      const sessions = new Set();
      const pathGroups = new Map();

      for (const hit of hits.items) {
        if (hit.visitor_id) uniqueVisitors.add(hit.visitor_id);
        if (hit.session) sessions.add(hit.session);

        const pathId = hit.path_id;
        if (pathId) {
          if (!pathGroups.has(pathId)) {
            pathGroups.set(pathId, {
              day: yesterday.toISOString(),
              site_id: site.id,
              path_id: pathId,
              total_hits: 0,
              unique_visitors: new Set(),
              sessions: new Set(),
            });
          }

          const group = pathGroups.get(pathId);
          group.total_hits++;
          if (hit.visitor_id) group.unique_visitors.add(hit.visitor_id);
          if (hit.session) group.sessions.add(hit.session);
        }
      }

      // Create hit_stats records for each path
      for (const [pathId, data] of pathGroups) {
        try {
          const statsData = {
            day: data.day,
            site_id: data.site_id,
            path_id: data.path_id,
            total_hits: data.total_hits,
            unique_visitors: data.unique_visitors.size,
            sessions: data.sessions.size,
          };

          // Check if record already exists
          const existingFilter = `site_id = "${statsData.site_id}" && path_id = "${statsData.path_id}" && day = "${statsData.day}"`;

          try {
            const existing = await pb
              .collection('hit_stats')
              .getFirstListItem(existingFilter);
            // Update existing record
            await pb.collection('hit_stats').update(existing.id, statsData);
            console.log(`📝 Updated hit_stats record for ${statsData.day}`);
          } catch (notFoundError) {
            // Create new record
            await pb.collection('hit_stats').create(statsData);
            console.log(`✅ Created hit_stats record for ${statsData.day}`);
          }
        } catch (error) {
          console.warn(
            `⚠️ Failed to process hit_stats for path ${pathId}:`,
            error.message
          );
        }
      }
    }

    console.log('✅ Daily stats aggregation completed');
  } catch (error) {
    console.error('❌ Daily stats aggregation failed:', error);
    throw error;
  }
}

/**
 * Main scheduled aggregation function
 */
async function runScheduledAggregation() {
  const startTime = new Date();
  console.log(
    `🚀 Starting scheduled aggregation at ${startTime.toISOString()}`
  );

  try {
    // Authenticate
    await authenticate();
    console.log('✅ Authenticated with PocketBase');

    // Get command line arguments
    const args = process.argv.slice(2);
    const mode = args[0] || 'incremental';

    switch (mode) {
      case 'incremental':
      case 'hourly':
        await aggregateIncrementalHitCounts();
        break;

      case 'daily':
        await aggregateDailyStats();
        break;

      case 'full':
        await aggregateIncrementalHitCounts();
        await aggregateDailyStats();
        break;

      default:
        console.log(
          'Usage: node scheduledAggregation.js [incremental|daily|full]'
        );
        console.log(
          '  incremental: Aggregate last few hours of hit counts (default)'
        );
        console.log('  daily: Aggregate daily stats for yesterday');
        console.log('  full: Run both incremental and daily aggregation');
        process.exit(1);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(
      `🎉 Scheduled aggregation completed successfully in ${duration}ms`
    );
  } catch (error) {
    console.error('❌ Scheduled aggregation failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('📛 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('📛 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the aggregation
runScheduledAggregation();
