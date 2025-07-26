import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const getAdminPb = async () => {
  const pb = new PocketBase(process.env.POCKETBASE_URL);
  await pb
    .collection('_superusers')
    .authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || '',
      process.env.POCKETBASE_ADMIN_PASSWORD || ''
    );
  return pb;
};

// Helper function to decode token and get user info
async function getCurrentUser(token: string) {
  try {
    const pb = await getAdminPb();

    // In production, properly validate JWT token
    // For now, decode the simple base64 token
    const [userId] = Buffer.from(token, 'base64').toString().split(':');

    const user = await pb.collection('analytics_users').getOne(userId, {
      expand: 'site_id',
    });

    return user;
  } catch {
    throw new Error('Invalid token');
  }
}

// GET /api/sites/[siteId] - Get specific site info
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getCurrentUser(token);
    const { siteId } = params;

    const userRole = user.access?.role || 'viewer';
    const pb = await getAdminPb();

    // Check if user can access this site
    if (
      userRole !== 'admin' &&
      userRole !== 'support' &&
      user.site_id !== siteId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const site = await pb.collection('sites').getOne(siteId);

    return NextResponse.json({
      id: site.id,
      code: site.code,
      cname: site.cname,
      link_domain: site.link_domain,
      settings: site.settings,
      state: site.state,
      created_at: site.created_at,
    });
  } catch (error) {
    console.error('Site by ID API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch site',
      },
      { status: 500 }
    );
  }
}
