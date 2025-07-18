/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { parseAcceptLanguage } from 'intl-parse-accept-language';
import { userAgent } from 'next/server';
import {
  parseUserAgent,
  extractUTMParams,
  parseScreenSize,
  categorizeReferrer,
  generateSessionId,
  getOrCreateLookupRecord,
  detectFirstVisit,
  generateUserFingerprint,
  isNewSession,
} from '../../../lib/analytics-utils';

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

// Shared logic for both GET and POST
async function handleCount(
  request: NextRequest,
  params: Record<string, string>
) {
  await pb
    .collection('_superusers')
    .authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || '',
      process.env.POCKETBASE_ADMIN_PASSWORD || ''
    );
  const ua = userAgent(request);
  if (ua.isBot) {
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

  const host = request.headers.get('host') || '';
  const siteCode = host.includes('localhost') ? host : host.split('.')[0];

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

    // Validate path length before processing
    const pathValue = params.p || '/';
    if (pathValue.length > 2048) {
      console.log(`⚠️ Path too long: ${pathValue.length} bytes`);
      return new NextResponse(gif, {
        status: 414,
        headers: {
          'Content-Type': 'image/gif',
          'Access-Control-Allow-Origin': '*',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          'X-PocketWebAnalytics': `Ignored because path is longer than 2048 bytes (${pathValue.length} bytes)`,
        },
      });
    }

    // Enhanced data processing
    console.log('🔄 Processing analytics data with new schema...');

    // 1. Parse user agent for browser and system detection
    const userAgentString = request.headers.get('user-agent') || '';
    const parsedUA = parseUserAgent(userAgentString);
    console.log('Parsed UA:', parsedUA);

    // 2. Process path data
    const pathData = {
      site_id: site.id,
      path: params.p || '/',
      title: params.t || params.p || '/', // Use path as fallback for title
      event: params.e === 'true' || params.e === '1' ? 1 : 0,
    };

    // 3. Process referrer data
    const referrerData = categorizeReferrer(params.r || '');
    console.log('Referrer data:', referrerData);

    // 4. Process screen size data
    const sizeData = parseScreenSize(params.s || '0,0,1');
    console.log('Size data:', sizeData);

    // 5. Extract UTM parameters if present
    const utmData = extractUTMParams(params.q || '');
    console.log('UTM data:', utmData);

    // NEW: Get or create relational records
    console.log('🗄️ Creating relational records...');

    // Get or create browser record
    const browserRecord = await getOrCreateLookupRecord(
      pb,
      'browsers',
      { name: parsedUA.browser.name, version: parsedUA.browser.version },
      ['name', 'version']
    );

    // Get or create system record
    const systemRecord = await getOrCreateLookupRecord(
      pb,
      'systems',
      { name: parsedUA.system.name, version: parsedUA.system.version },
      ['name', 'version']
    );

    // Get or create referrer record
    const refRecord = await getOrCreateLookupRecord(
      pb,
      'refs',
      { ref: referrerData.ref, ref_scheme: referrerData.ref_scheme || '' },
      ['ref', 'ref_scheme']
    );

    // Get or create size record
    const sizeRecord = await getOrCreateLookupRecord(pb, 'sizes', sizeData, [
      'size',
    ]);

    // Get or create path record
    const pathRecord = await getOrCreateLookupRecord(pb, 'paths', pathData, [
      'site_id',
      'path',
    ]);

    console.log('✅ Relational records created:', {
      browser: browserRecord,
      system: systemRecord,
      ref: refRecord,
      size: sizeRecord,
      path: pathRecord,
    });

    // For now, continue with the existing logic while we test the new processing
    let location = '';
    if (site.settings.collect?.includes('location')) {
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '';
      console.log('Client IP:', clientIp);

      if (clientIp) {
        try {
          // Fetch geolocation from ip-api.com
          const response = await fetch(
            `http://ip-api.com/json/${clientIp}?fields=status,countryCode,region,country,regionName,city`
          );
          const data = await response.json();

          if (data.status === 'success') {
            const country = data.countryCode || '';
            const region = data.region || '';
            const country_name = data.country || '';
            const region_name = data.regionName || '';
            const city_name = data.city || '';

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
                city_name, // Optional: ensure your schema supports this
              });
            }

            location = iso_3166_2;
          }
        } catch (err) {
          console.error('Geolocation API error:', err);
          // Fallback to empty location
        }
      }
    }

    let language = '';
    if (site.settings.collect?.includes('language')) {
      const acceptLang = request.headers.get('accept-language') || '';
      const tags = parseAcceptLanguage(acceptLang);
      if (tags.length > 0) {
        language = tags[0].split('-')[0]; // e.g., 'en' from 'en-US'
      }
    }

    // Handle campaign creation if UTM data exists
    let campaignId = null;
    if (utmData && (utmData.source || utmData.campaign)) {
      try {
        campaignId = await getOrCreateLookupRecord(
          pb,
          'campaigns',
          {
            site_id: site.id,
            name: utmData.campaign || utmData.source || 'Unknown',
            source: utmData.source || '',
            medium: utmData.medium || '',
            campaign: utmData.campaign || '',
            term: utmData.term || '',
            content: utmData.content || '',
          },
          ['site_id', 'name']
        );
        console.log('✅ Campaign record created:', campaignId);
      } catch (campaignError) {
        console.error('⚠️ Campaign creation failed:', campaignError);
        // Continue without campaign tracking
      }
    }

    // Implement enhanced first visit detection
    console.log('🔍 Enhanced first visit detection...');

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '';

    // Use client-provided session and visitor ID if available
    const sessionId = params.sid || generateSessionId();
    const visitorId =
      params.vid || generateUserFingerprint(userAgentString, clientIp);
    const clientFirstVisit = params.fv === '1'; // Client-side detection result

    console.log('📋 First visit parameters:', {
      clientFirstVisit,
      sessionId,
      visitorId,
      hasClientData: !!(params.sid && params.vid && params.fv),
    });

    // Enhanced server-side validation
    let serverFirstVisit = false;
    if (clientFirstVisit) {
      // If client says it's first visit, validate server-side
      serverFirstVisit = await detectFirstVisit(
        pb,
        site.id,
        sessionId,
        visitorId,
        clientIp
      );
    } else {
      // If client says not first visit, trust it but also check new session
      const isNewSessionVisit = await isNewSession(
        pb,
        site.id,
        sessionId,
        visitorId
      );
      serverFirstVisit = isNewSessionVisit;
    }

    // Final first visit determination (client + server validation)
    const finalFirstVisit = clientFirstVisit && serverFirstVisit;
    const firstVisitFlag = finalFirstVisit ? 1 : 0;

    console.log('👤 Enhanced first visit result:', {
      clientFirstVisit,
      serverFirstVisit,
      finalFirstVisit,
      firstVisitFlag,
      visitorId,
      sessionId,
    });

    // Compose hit data using relational IDs and enhanced session tracking
    const hit = {
      site_id: site.id,
      path_id: pathRecord,
      ref_id: refRecord,
      browser_id: browserRecord,
      system_id: systemRecord,
      size_id: sizeRecord,
      session: `${visitorId}-${sessionId}`, // Combine visitor ID and session ID for better tracking
      first_visit: firstVisitFlag,
      bot: parseInt(params.b || '0'),
      location,
      language,
      user_agent_header: request.headers.get('user-agent') || '',
      remote_addr: request.headers.get('x-forwarded-for') || '',
      created_at: new Date().toISOString(),
      ...(campaignId && { campaign_id: campaignId }),
    };

    console.log('✅ Hit data with relational IDs:', hit);

    // Check bot detection
    if (hit.bot > 0 && hit.bot < 150) {
      return new NextResponse(gif, {
        status: 400,
        headers: {
          'Content-Type': 'image/gif',
          'Access-Control-Allow-Origin': '*',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          'X-PocketWebAnalytics': `Wrong value: b=${hit.bot}`,
        },
      });
    }

    if (ua.isBot) {
      hit.bot = 100; // Arbitrary bot value for backend detection
    }

    // Create the hit record
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
    console.error('❌ Error in analytics processing:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new NextResponse(gif, {
      status: 400,
      headers: {
        'Content-Type': 'image/gif',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'X-PocketWebAnalytics': `Error: ${errorMessage}`,
      },
    });
  }
}

// Handle GET requests (query params)
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  console.log('GET params:', params);
  return handleCount(request, params);
}

// Handle POST requests (body or query params)
export async function POST(request: NextRequest) {
  let params: Record<string, string> = {};
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      params = await request.json();
    } catch {
      params = {};
    }
  } else {
    params = Object.fromEntries(request.nextUrl.searchParams);
  }
  return handleCount(request, params);
}
