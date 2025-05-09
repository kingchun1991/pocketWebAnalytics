/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { parseAcceptLanguage } from 'intl-parse-accept-language';
import { userAgent } from 'next/server';

export const runtime = 'edge';

const pb = new PocketBase(
  process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
);

const gif = Buffer.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x01, 0x00,
  0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x0a, 0x00, 0x01,
  0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
  0x4c, 0x01, 0x00, 0x3b,
]);

export async function POST(request: NextRequest) {
  await pb
    .collection('_superusers')
    .authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || '',
      process.env.POCKETBASE_ADMIN_PASSWORD || ''
    );
  const ua = userAgent(request);
  if (ua.isBot) {
    // Treat prefetch or bot-like requests as bots; return early
    return new NextResponse(gif, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        Connection: 'close',
      },
    });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const siteCode = request.headers.get('host')?.split('.')[0] || '';

  try {
    const site = await pb
      .collection('sites')
      .getFirstListItem(`code="${siteCode}"`);
    if (!site) {
      return new NextResponse(gif, {
        status: 400,
        headers: { 'X-PocketWebAnalytics': 'Site not found' },
      });
    }

    for (const ip of site.settings.ignoreIPs || []) {
      const clientIp = request.headers.get('x-forwarded-for') || '';
      if (ip === clientIp) {
        return new NextResponse(gif, {
          status: 202,
          headers: {
            'X-PocketWebAnalytics': `Ignored because ${ip} is in the IP ignore list`,
          },
        });
      }
    }

    let location = '';
    const country = '';
    const region = '';
    const country_name = '';
    const region_name = '';
    const iso_3166_2 = '';

    if (site.settings.collect?.includes('location')) {
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '';

      // Extract geolocation data from headers (if available)
      const country = request.headers.get('x-vercel-ip-country') || '';
      const region = request.headers.get('x-vercel-ip-region') || '';
      const country_name =
        request.headers.get('x-vercel-ip-country-name') || '';
      const region_name = request.headers.get('x-vercel-ip-region-name') || '';

      // iso_3166_2: combine country and region with hyphen if region is present
      const iso_3166_2 = region ? `${country}-${region}` : country;

      // Check if location exists
      let locRecord = null;
      try {
        locRecord = await pb
          .collection('locations')
          .getFirstListItem(`iso_3166_2="${iso_3166_2}"`);
      } catch (e) {
        // Not found, will insert
      }

      if (!locRecord) {
        // Insert new location
        await pb.collection('locations').create({
          iso_3166_2,
          country,
          region,
          country_name,
          region_name,
        });
      }

      location = iso_3166_2;
    }

    let language = '';
    if (site.settings.collect?.includes('language')) {
      const acceptLang = request.headers.get('accept-language') || '';
      const tags = parseAcceptLanguage(acceptLang);
      if (tags.length > 0) {
        language = tags[0].split('-')[0]; // e.g., 'en' from 'en-US'
      }
    }

    const hit = {
      site_id: site.id,
      path: params.p || '/',
      ref: params.r || '',
      title: params.t || '',
      event: params.e === 'true' ? 1 : 0,
      bot: parseInt(params.b || '0'),
      size: params.s ? params.s.split(',').join(',') : '0,0,1',
      location,
      language,
      user_agent_header: request.headers.get('user-agent') || '',
      remote_addr: request.headers.get('x-forwarded-for') || '',
      created_at: new Date().toISOString(),
    };

    if (hit.bot > 0 && hit.bot < 150) {
      return new NextResponse(gif, {
        status: 400,
        headers: { 'X-PocketWebAnalytics': `Wrong value: b=${hit.bot}` },
      });
    }

    if (hit.path.length > 2048) {
      return new NextResponse(gif, {
        status: 414,
        headers: {
          'X-PocketWebAnalytics': `Ignored because path is longer than 2048 bytes (${hit.path.length} bytes)`,
        },
      });
    }

    if (ua.isBot) {
      hit.bot = 100; // Arbitrary bot value for backend detection
    }

    await pb.collection('hits').create(hit);

    return new NextResponse(gif, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        Connection: 'close',
      },
    });
  } catch (err) {
    console.error('Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new NextResponse(gif, {
      status: 400,
      headers: { 'X-PocketWebAnalytics': `Error: ${errorMessage}` },
    });
    {
    }
  }
}
