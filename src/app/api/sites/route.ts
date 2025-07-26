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

// GET /api/sites - Get available sites for user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getCurrentUser(token);

    const userRole = user.access?.role || 'viewer';
    const pb = await getAdminPb();

    // Admin and support can see all sites
    if (userRole === 'admin' || userRole === 'support') {
      const sites = await pb.collection('sites').getFullList({
        sort: 'created_at',
        filter: 'state = "a"', // Only active sites
      });

      return NextResponse.json({
        sites: sites.map((site) => ({
          id: site.id,
          code: site.code,
          cname: site.cname,
          link_domain: site.link_domain,
          settings: site.settings,
          state: site.state,
          created_at: site.created_at,
        })),
      });
    } else {
      // Other users can only see their own site
      const site = await pb.collection('sites').getOne(user.site_id);

      return NextResponse.json({
        sites: [
          {
            id: site.id,
            code: site.code,
            cname: site.cname,
            link_domain: site.link_domain,
            settings: site.settings,
            state: site.state,
            created_at: site.created_at,
          },
        ],
      });
    }
  } catch (error) {
    console.error('Sites API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch sites',
      },
      { status: 500 }
    );
  }
}
