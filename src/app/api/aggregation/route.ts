import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export const runtime = 'edge';

const pb = new PocketBase(
  process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
);

async function authenticate() {
  try {
    await pb
      .collection('_superusers')
      .authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || '',
        process.env.POCKETBASE_ADMIN_PASSWORD || ''
      );
    return true;
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
}

async function runHourlyAggregation() {
  // Simple hourly aggregation - aggregate last 2 hours of data
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  // Get recent hits
  const hits = await pb.collection('hits').getList(1, 1000, {
    filter: `created_at >= "${twoHoursAgo.toISOString()}"`,
    sort: '-created_at',
  });

  if (hits.items.length === 0) {
    return { message: 'No recent hits to aggregate', count: 0 };
  }

  // Group hits by hour and path
  const hourlyGroups = new Map();

  hits.items.forEach((hit) => {
    const hour = new Date(hit.created_at);
    hour.setMinutes(0, 0, 0);
    const hourKey = `${hit.site_id}-${hit.path_id}-${hour.toISOString()}`;

    if (!hourlyGroups.has(hourKey)) {
      hourlyGroups.set(hourKey, {
        site_id: hit.site_id,
        path_id: hit.path_id,
        hour: hour.toISOString(),
        count: 0,
        sessions: new Set(),
        events: 0,
      });
    }

    const group = hourlyGroups.get(hourKey);
    group.count += 1;
    group.sessions.add(hit.session);
    if (hit.first_visit) group.events += 1;
  });

  // Update hit_counts table
  let processed = 0;
  for (const [, data] of hourlyGroups) {
    try {
      // Check if record already exists
      let existingRecord = null;
      try {
        existingRecord = await pb
          .collection('hit_counts')
          .getFirstListItem(
            `site_id="${data.site_id}" && path_id="${data.path_id}" && hour="${data.hour}"`
          );
      } catch {
        // Record doesn't exist, will create
      }

      const aggregateData = {
        site_id: data.site_id,
        path_id: data.path_id,
        hour: data.hour,
        count: data.count,
        count_unique: data.sessions.size,
        events: data.events,
      };

      if (existingRecord) {
        // Update existing record
        await pb.collection('hit_counts').update(existingRecord.id, {
          count: existingRecord.count + data.count,
          count_unique: Math.max(
            existingRecord.count_unique,
            data.sessions.size
          ),
          events: existingRecord.events + data.events,
        });
      } else {
        // Create new record
        await pb.collection('hit_counts').create(aggregateData);
      }

      processed += 1;
    } catch (error) {
      console.error('Error updating hit_counts:', error);
    }
  }

  return {
    message: 'Hourly aggregation completed',
    count: processed,
    hits_processed: hits.items.length,
  };
}

export async function GET(request: NextRequest) {
  // Security: Check for authorization
  const authHeader = request.headers.get('authorization');
  const expectedAuth = process.env.AGGREGATION_API_KEY || 'default-key';

  if (!authHeader || authHeader !== `Bearer ${expectedAuth}`) {
    return NextResponse.json(
      {
        error:
          'Unauthorized. Set AGGREGATION_API_KEY environment variable and use Bearer token.',
      },
      { status: 401 }
    );
  }

  try {
    // Authenticate with PocketBase
    const authSuccess = await authenticate();
    if (!authSuccess) {
      return NextResponse.json(
        { error: 'Failed to authenticate with PocketBase' },
        { status: 500 }
      );
    }

    // Run aggregation
    const result = await runHourlyAggregation();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error('Aggregation API error:', error);
    return NextResponse.json(
      {
        error: 'Aggregation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request); // Same logic for POST
}
