import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Authenticate with admin credentials
async function authenticateAdmin() {
  await pb
    .collection('_superusers')
    .authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL || '',
      process.env.POCKETBASE_ADMIN_PASSWORD || ''
    );
}

// Site management endpoints
export async function GET(request: NextRequest) {
  try {
    await authenticateAdmin();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'sites':
        // Get all sites
        const sites = await pb.collection('sites').getFullList({
          sort: 'created',
        });
        return NextResponse.json({ sites });

      case 'users':
        // Get all analytics users
        const users = await pb.collection('analytics_users').getFullList({
          sort: 'created',
          fields: 'id,email,access,site,created,updated',
        });
        return NextResponse.json({ users });

      case 'tokens':
        // Get API tokens
        const site_id = parseInt(searchParams.get('site_id') || '1');
        const tokens = await pb.collection('api_tokens').getFullList({
          filter: `site = ${site_id}`,
          sort: '-created',
          fields: 'id,name,permissions,created,last_used',
        });
        return NextResponse.json({ tokens });

      case 'stats':
        // Get overall site statistics
        const siteId = parseInt(searchParams.get('site_id') || '1');

        // Get basic stats
        const totalHits = await pb.collection('hits').getFullList({
          filter: `site = ${siteId}`,
          fields: 'id',
        });

        const uniqueVisitors = await pb.collection('hits').getFullList({
          filter: `site = ${siteId} && first_visit = true`,
          fields: 'id',
        });

        const today = new Date().toISOString().split('T')[0];
        const todayHits = await pb.collection('hits').getFullList({
          filter: `site = ${siteId} && created >= "${today}"`,
          fields: 'id',
        });

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const weeklyHits = await pb.collection('hits').getFullList({
          filter: `site = ${siteId} && created >= "${lastWeek.toISOString()}"`,
          fields: 'id',
        });

        return NextResponse.json({
          stats: {
            total_hits: totalHits.length,
            unique_visitors: uniqueVisitors.length,
            today_hits: todayHits.length,
            weekly_hits: weeklyHits.length,
          },
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch admin data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await authenticateAdmin();

    const { action, ...data } = await request.json();

    switch (action) {
      case 'create_site':
        // Create new site
        const { name: siteName, cname, link_domain, settings } = data;
        const site = await pb.collection('sites').create({
          name: siteName,
          cname: cname || '',
          link_domain: link_domain || '',
          settings: settings || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return NextResponse.json({ site });

      case 'create_user':
        // Create new analytics user
        const { email, access, site_id: userSiteId } = data;
        const user = await pb.collection('analytics_users').create({
          email,
          access: access || 'read',
          site: userSiteId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return NextResponse.json({ user });

      case 'create_token':
        // Create new API token
        const { name: tokenName, permissions, site_id: tokenSiteId } = data;
        const token = await pb.collection('api_tokens').create({
          name: tokenName,
          permissions: permissions || {},
          site: tokenSiteId,
          token: generateApiToken(),
          created_at: new Date().toISOString(),
        });
        return NextResponse.json({ token });

      case 'update_site_settings':
        // Update site settings
        const { site_id: settingsSiteId, settings: newSettings } = data;
        const updatedSite = await pb
          .collection('sites')
          .update(settingsSiteId, {
            settings: newSettings,
            updated_at: new Date().toISOString(),
          });
        return NextResponse.json({ site: updatedSite });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process admin action',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { action, id, ...data } = await request.json();

    switch (action) {
      case 'update_site':
        const updatedSite = await pb.collection('sites').update(id, {
          ...data,
          updated_at: new Date().toISOString(),
        });
        return NextResponse.json({ site: updatedSite });

      case 'update_user':
        const updatedUser = await pb.collection('analytics_users').update(id, {
          ...data,
          updated_at: new Date().toISOString(),
        });
        return NextResponse.json({ user: updatedUser });

      case 'revoke_token':
        await pb.collection('api_tokens').delete(id);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin PUT error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update admin data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID required for deletion' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'delete_site':
        // Note: This should also handle cascading deletes of related data
        await pb.collection('sites').delete(id);
        return NextResponse.json({ success: true });

      case 'delete_user':
        await pb.collection('analytics_users').delete(id);
        return NextResponse.json({ success: true });

      case 'delete_token':
        await pb.collection('api_tokens').delete(id);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete admin data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Utility function to generate API tokens
function generateApiToken(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
