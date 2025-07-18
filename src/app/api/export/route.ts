import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);

export async function POST(request: NextRequest) {
  try {
    const {
      site_id = 1,
      format = 'csv',
      date_from,
      date_to,
      include_paths = true,
      include_refs = true,
      include_browsers = true,
      include_systems = true,
      include_locations = true,
      include_campaigns = false,
    } = await request.json();

    // Validate format
    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use csv or json.' },
        { status: 400 }
      );
    }

    // Create export record
    const exportRecord = await pb.collection('exports').create({
      site: site_id,
      format,
      status: 'processing',
      created_at: new Date().toISOString(),
      num_rows: 0,
    });

    try {
      // Build query filters
      const filters = [`site = ${site_id}`];
      if (date_from) filters.push(`created >= "${date_from}"`);
      if (date_to) filters.push(`created <= "${date_to}"`);

      const filter = filters.join(' && ');

      // Get hits data with expansions
      const expandFields = [];
      if (include_paths) expandFields.push('path');
      if (include_refs) expandFields.push('ref');
      if (include_browsers) expandFields.push('browser');
      if (include_systems) expandFields.push('system');
      if (include_locations) expandFields.push('location');
      if (include_campaigns) expandFields.push('campaign');

      const hits = await pb.collection('hits').getFullList({
        filter,
        expand: expandFields.join(','),
        sort: '-created',
      });

      // Format data based on requested format
      let exportData;
      let filename;
      let contentType;

      if (format === 'csv') {
        // Generate CSV
        const csvRows = [];

        // Header row
        const headers = [
          'timestamp',
          'path',
          'title',
          'referrer',
          'referrer_scheme',
          'browser',
          'browser_version',
          'system',
          'system_version',
          'size',
          'location',
          'user_agent',
          'session',
          'first_visit',
        ];
        if (include_campaigns)
          headers.push('campaign', 'utm_source', 'utm_medium', 'utm_campaign');
        csvRows.push(headers.join(','));

        // Data rows
        for (const hit of hits) {
          const row = [
            hit.created,
            hit.expand?.path?.path || '',
            hit.expand?.path?.title || '',
            hit.expand?.ref?.ref || '',
            hit.expand?.ref?.ref_scheme || '',
            hit.expand?.browser?.name || '',
            hit.expand?.browser?.version || '',
            hit.expand?.system?.name || '',
            hit.expand?.system?.version || '',
            hit.expand?.size?.size || '',
            hit.expand?.location?.country || '',
            hit.user_agent || '',
            hit.session || '',
            hit.first_visit || false,
          ];

          if (include_campaigns) {
            row.push(
              hit.expand?.campaign?.name || '',
              hit.expand?.campaign?.utm_source || '',
              hit.expand?.campaign?.utm_medium || '',
              hit.expand?.campaign?.utm_campaign || ''
            );
          }

          csvRows.push(
            row
              .map((field) => `"${String(field).replace(/"/g, '""')}"`)
              .join(',')
          );
        }

        exportData = csvRows.join('\n');
        filename = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
        contentType = 'text/csv';
      } else {
        // JSON format
        exportData = JSON.stringify(
          {
            export_info: {
              site_id,
              exported_at: new Date().toISOString(),
              total_rows: hits.length,
              date_range: { from: date_from, to: date_to },
            },
            data: hits.map((hit) => ({
              timestamp: hit.created,
              path: hit.expand?.path?.path || '',
              title: hit.expand?.path?.title || '',
              referrer: hit.expand?.ref?.ref || '',
              referrer_scheme: hit.expand?.ref?.ref_scheme || '',
              browser: hit.expand?.browser?.name || '',
              browser_version: hit.expand?.browser?.version || '',
              system: hit.expand?.system?.name || '',
              system_version: hit.expand?.system?.version || '',
              size: hit.expand?.size?.size || '',
              location: hit.expand?.location?.country || '',
              user_agent: hit.user_agent || '',
              session: hit.session || '',
              first_visit: hit.first_visit || false,
              ...(include_campaigns && hit.expand?.campaign
                ? {
                    campaign: hit.expand.campaign.name,
                    utm_source: hit.expand.campaign.utm_source,
                    utm_medium: hit.expand.campaign.utm_medium,
                    utm_campaign: hit.expand.campaign.utm_campaign,
                  }
                : {}),
            })),
          },
          null,
          2
        );
        filename = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
        contentType = 'application/json';
      }

      // Update export record with completion
      await pb.collection('exports').update(exportRecord.id, {
        status: 'completed',
        finished_at: new Date().toISOString(),
        num_rows: hits.length,
        size: exportData.length,
      });

      // Return file download
      return new NextResponse(exportData, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Export-ID': exportRecord.id,
        },
      });
    } catch (error) {
      // Update export record with error
      await pb.collection('exports').update(exportRecord.id, {
        status: 'error',
        finished_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      {
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const site_id = parseInt(searchParams.get('site_id') || '1');

    // Get recent exports for this site
    const exports = await pb.collection('exports').getFullList({
      filter: `site = ${site_id}`,
      sort: '-created',
      fields: 'id,created,finished_at,status,format,num_rows,size,error',
    });

    return NextResponse.json({
      exports: exports.map((exp) => ({
        id: exp.id,
        created_at: exp.created,
        finished_at: exp.finished_at,
        status: exp.status,
        format: exp.format,
        num_rows: exp.num_rows,
        size: exp.size,
        error: exp.error,
      })),
    });
  } catch (error) {
    console.error('Export list error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get export list',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
