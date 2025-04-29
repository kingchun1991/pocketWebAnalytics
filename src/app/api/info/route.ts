import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Extract client IP from headers
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '';

    // Extract geolocation data (if available)
    const country = request.headers.get('x-vercel-ip-country') || '';
    const region = request.headers.get('x-vercel-ip-region') || '';
    const country_name = request.headers.get('x-vercel-ip-country-name') || ''; // Not standard, depends on provider
    const region_name = request.headers.get('x-vercel-ip-region-name') || ''; // Not standard, depends on provider

    // Optionally, parse the POST body (if the client sends data)
    const body = await request.json(); // Assumes the POST request sends JSON data

    // Log or process the extracted data
    console.log({
      clientIp,
      country,
      region,
      country_name,
      region_name,
      body, // Data sent in the POST request
    });

    // Return a response
    return NextResponse.json({
      message: 'POST request processed',
      data: { clientIp, country, region, country_name, region_name, body },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
