/**
 * Data Aggregation System for PocketWebAnalytics
 * Populates aggregation tables for improved dashboard performance
 */

import PocketBase from 'pocketbase';
import { subHours, subDays, startOfHour, startOfDay } from 'date-fns';
import 'dotenv/config';

const pb = new PocketBase(
  process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
);

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
 * Aggregate hit counts by hour for a specific site and date range
 */
async function aggregateHitCounts(siteId, fromDate, toDate) {
  console.log(
    `📊 Aggregating hit counts for site ${siteId} from ${fromDate.toISOString()} to ${toDate.toISOString()}`
  );

  try {
    // Get all hits within the date range
    const hits = await pb.collection('hits').getFullList({
      filter: `site_id="${siteId}" && created_at>="${fromDate.toISOString()}" && created_at<="${toDate.toISOString()}"`,
      sort: 'created_at',
      expand: 'path_id',
    });

    console.log(`📈 Found ${hits.length} hits to aggregate`);

    // Group hits by hour and path
    const hourlyData = {};

    hits.forEach((hit) => {
      const hourKey = startOfHour(new Date(hit.created_at)).toISOString();
      const pathId = hit.path_id;

      const key = `${hourKey}-${pathId}`;

      if (!hourlyData[key]) {
        hourlyData[key] = {
          site_id: siteId,
          path_id: pathId,
          hour: hourKey,
          total: 0,
        };
      }

      hourlyData[key].total += 1;
    });

    // Insert or update hit_counts records
    let processed = 0;
    for (const [key, data] of Object.entries(hourlyData)) {
      try {
        // Check if record already exists
        const existing = await pb
          .collection('hit_counts')
          .getFirstListItem(
            `site_id="${data.site_id}" && path_id="${data.path_id}" && hour="${data.hour}"`
          )
          .catch(() => null);

        if (existing) {
          // Update existing record
          await pb
            .collection('hit_counts')
            .update(existing.id, { total: data.total });
          console.log(`🔄 Updated hit_counts record for ${data.hour}`);
        } else {
          // Create new record
          await pb.collection('hit_counts').create(data);
          console.log(`✅ Created hit_counts record for ${data.hour}`);
        }
        processed++;
      } catch (error) {
        console.error(`❌ Error processing hit_counts for ${key}:`, error);
      }
    }

    console.log(`✅ Processed ${processed} hit_counts records`);
    return processed;
  } catch (error) {
    console.error('❌ Error in aggregateHitCounts:', error);
    throw error;
  }
}

/**
 * Aggregate referrer counts by hour
 */
async function aggregateRefCounts(siteId, fromDate, toDate) {
  console.log(`📊 Aggregating ref counts for site ${siteId}`);

  try {
    const hits = await pb.collection('hits').getFullList({
      filter: `site_id="${siteId}" && created_at>="${fromDate.toISOString()}" && created_at<="${toDate.toISOString()}"`,
      sort: 'created_at',
      expand: 'path_id,ref_id',
    });

    console.log(`📈 Found ${hits.length} hits for ref aggregation`);

    // Group by hour, path, and ref
    const hourlyRefData = {};

    hits.forEach((hit) => {
      const hourKey = startOfHour(new Date(hit.created_at)).toISOString();
      const pathId = hit.path_id;
      const refId = hit.ref_id;

      const key = `${hourKey}-${pathId}-${refId}`;

      if (!hourlyRefData[key]) {
        hourlyRefData[key] = {
          site_id: siteId,
          path_id: pathId,
          ref_id: refId,
          hour: hourKey,
          total: 0,
        };
      }

      hourlyRefData[key].total += 1;
    });

    // Insert or update ref_counts records
    let processed = 0;
    for (const [key, data] of Object.entries(hourlyRefData)) {
      try {
        const existing = await pb
          .collection('ref_counts')
          .getFirstListItem(
            `site_id="${data.site_id}" && path_id="${data.path_id}" && ref_id="${data.ref_id}" && hour="${data.hour}"`
          )
          .catch(() => null);

        if (existing) {
          await pb
            .collection('ref_counts')
            .update(existing.id, { total: data.total });
        } else {
          await pb.collection('ref_counts').create(data);
        }
        processed++;
      } catch (error) {
        console.error(`❌ Error processing ref_counts for ${key}:`, error);
      }
    }

    console.log(`✅ Processed ${processed} ref_counts records`);
    return processed;
  } catch (error) {
    console.error('❌ Error in aggregateRefCounts:', error);
    throw error;
  }
}

/**
 * Aggregate daily hit statistics
 */
async function aggregateHitStats(siteId, fromDate, toDate) {
  console.log(`📊 Aggregating daily hit stats for site ${siteId}`);

  try {
    const hits = await pb.collection('hits').getFullList({
      filter: `site_id="${siteId}" && created_at>="${fromDate.toISOString()}" && created_at<="${toDate.toISOString()}"`,
      sort: 'created_at',
      expand: 'path_id',
    });

    console.log(`📈 Found ${hits.length} hits for daily stats`);

    // Group by day and path
    const dailyData = {};

    hits.forEach((hit) => {
      const dayKey = startOfDay(new Date(hit.created_at)).toISOString();
      const pathId = hit.path_id;

      const key = `${dayKey}-${pathId}`;

      if (!dailyData[key]) {
        dailyData[key] = {
          site_id: siteId,
          path_id: pathId,
          day: dayKey,
          stats: {
            total_hits: 0,
            unique_visitors: new Set(),
            first_visits: 0,
            returning_visits: 0,
          },
        };
      }

      const stats = dailyData[key].stats;
      stats.total_hits += 1;

      // Track unique visitors by session
      if (hit.session) {
        stats.unique_visitors.add(hit.session);
      }

      if (hit.first_visit === 1) {
        stats.first_visits += 1;
      } else {
        stats.returning_visits += 1;
      }
    });

    // Convert unique visitors Set to count and create records
    let processed = 0;
    for (const [key, data] of Object.entries(dailyData)) {
      try {
        const statsJson = {
          total_hits: data.stats.total_hits,
          unique_visitors: data.stats.unique_visitors.size,
          first_visits: data.stats.first_visits,
          returning_visits: data.stats.returning_visits,
        };

        const existing = await pb
          .collection('hit_stats')
          .getFirstListItem(
            `site_id="${data.site_id}" && path_id="${data.path_id}" && day="${data.day}"`
          )
          .catch(() => null);

        if (existing) {
          await pb.collection('hit_stats').update(existing.id, {
            stats: JSON.stringify(statsJson),
          });
        } else {
          await pb.collection('hit_stats').create({
            site_id: data.site_id,
            path_id: data.path_id,
            day: data.day,
            stats: JSON.stringify(statsJson),
          });
        }
        processed++;
      } catch (error) {
        console.error(`❌ Error processing hit_stats for ${key}:`, error);
      }
    }

    console.log(`✅ Processed ${processed} hit_stats records`);
    return processed;
  } catch (error) {
    console.error('❌ Error in aggregateHitStats:', error);
    throw error;
  }
}

/**
 * Run aggregation for a specific site
 */
async function runAggregationForSite(siteId, hoursBack = 24) {
  console.log(
    `🚀 Starting aggregation for site ${siteId} (last ${hoursBack} hours)`
  );

  const toDate = new Date();
  const fromDate = subHours(toDate, hoursBack);

  try {
    // Run all aggregations in sequence
    const hitCountsProcessed = await aggregateHitCounts(
      siteId,
      fromDate,
      toDate
    );
    const refCountsProcessed = await aggregateRefCounts(
      siteId,
      fromDate,
      toDate
    );
    const hitStatsProcessed = await aggregateHitStats(siteId, fromDate, toDate);

    console.log(`✅ Aggregation completed for site ${siteId}:`);
    console.log(`   - Hit counts: ${hitCountsProcessed} records`);
    console.log(`   - Ref counts: ${refCountsProcessed} records`);
    console.log(`   - Hit stats: ${hitStatsProcessed} records`);

    return {
      hitCounts: hitCountsProcessed,
      refCounts: refCountsProcessed,
      hitStats: hitStatsProcessed,
    };
  } catch (error) {
    console.error(`❌ Aggregation failed for site ${siteId}:`, error);
    throw error;
  }
}

/**
 * Run aggregation for all sites
 */
async function runFullAggregation(hoursBack = 24) {
  console.log(
    `🌍 Starting full aggregation for all sites (last ${hoursBack} hours)`
  );

  try {
    await authenticate();

    // Get all sites
    const sites = await pb.collection('sites').getFullList();
    console.log(`📋 Found ${sites.length} sites to process`);

    const results = {};

    for (const site of sites) {
      console.log(`\n🔄 Processing site: ${site.code} (${site.id})`);
      try {
        results[site.id] = await runAggregationForSite(site.id, hoursBack);
      } catch (error) {
        console.error(`❌ Failed to process site ${site.code}:`, error);
        results[site.id] = { error: error.message };
      }
    }

    console.log('\n🎉 Full aggregation completed!');
    console.log('📊 Results summary:', results);

    return results;
  } catch (error) {
    console.error('❌ Full aggregation failed:', error);
    throw error;
  }
}

// Export functions for use in other scripts
export {
  authenticate,
  aggregateHitCounts,
  aggregateRefCounts,
  aggregateHitStats,
  runAggregationForSite,
  runFullAggregation,
};

// If running directly, execute full aggregation
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullAggregation()
    .then(() => {
      console.log('✅ Aggregation script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Aggregation script failed:', error);
      process.exit(1);
    });
}
