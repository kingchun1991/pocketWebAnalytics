import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// Create a PocketBase instance for admin operations
const getAdminPb = async () => {
  const pb = new PocketBase(process.env.POCKETBASE_URL);
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,
    process.env.POCKETBASE_ADMIN_PASSWORD!
  );
  return pb;
};

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'login':
        return await handleLogin(data);
      case 'register':
        return await handleRegister(data);
      case 'logout':
        return await handleLogout();
      case 'verify':
        return await handleVerifyToken(data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleLogin(data: { email: string; password: string }) {
  try {
    const { email, password } = data;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Since analytics_users is a base collection, we need to manually check credentials
    const adminPb = await getAdminPb();

    // Find user by email
    const users = await adminPb.collection('analytics_users').getList(1, 1, {
      filter: `email = "${email}"`,
    });

    if (users.items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users.items[0];

    // For now, we'll do a simple password check (in production, use proper hashing)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await adminPb.collection('analytics_users').update(user.id, {
      login_at: new Date().toISOString(),
    });

    // Create a simple token (in production, use JWT)
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString(
      'base64'
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.access?.role || 'viewer',
        site_id: user.site_id,
        permissions: user.settings?.permissions || {},
        last_login: user.login_at,
      },
      token: sessionToken,
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid credentials' },
      { status: 401 }
    );
  }
}

async function handleRegister(data: {
  email: string;
  password: string;
  passwordConfirm: string;
  site_id: string;
  role?: string;
}) {
  try {
    const { email, password, passwordConfirm, site_id, role = 'viewer' } = data;

    if (!email || !password || !passwordConfirm || !site_id) {
      return NextResponse.json(
        {
          error:
            'Email, password, password confirmation, and site ID are required',
        },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Set default permissions based on role
    const defaultPermissions = {
      admin: {
        analytics: { read: true, write: true, delete: true },
        users: { read: true, write: true, delete: true },
        settings: { read: true, write: true },
      },
      editor: {
        analytics: { read: true, write: true, delete: false },
        users: { read: true, write: false, delete: false },
        settings: { read: true, write: false },
      },
      viewer: {
        analytics: { read: true, write: false, delete: false },
        users: { read: false, write: false, delete: false },
        settings: { read: true, write: false },
      },
    };

    // Create user in PocketBase using admin credentials
    const adminPb = await getAdminPb();

    // Check if user already exists
    const existingUsers = await adminPb
      .collection('analytics_users')
      .getList(1, 1, {
        filter: `email = "${email}"`,
      });

    if (existingUsers.items.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const userData = {
      site_id,
      email,
      email_verified: 1,
      password, // In production, hash this password
      totp_enabled: 1, // Set to 1 as required
      totp_secret: 'default',
      access: { role },
      settings: {
        role,
        permissions:
          defaultPermissions[role as keyof typeof defaultPermissions],
      },
      last_report_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const record = await adminPb.collection('analytics_users').create(userData);

    return NextResponse.json({
      success: true,
      user: {
        id: record.id,
        email: record.email,
        role: record.access?.role || role,
        site_id: record.site_id,
        permissions: record.settings?.permissions || {},
      },
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Registration failed';
    const errorData = (error as { data?: unknown })?.data || null;

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorData,
      },
      { status: 400 }
    );
  }
}

async function handleLogout() {
  try {
    // In a real implementation, you might want to invalidate the token
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: unknown) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Logout failed' },
      { status: 400 }
    );
  }
}

async function handleVerifyToken(data: { token: string }) {
  try {
    const { token } = data;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Decode simple token (in production, use JWT verification)
    let userId, timestamp;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      [userId, timestamp] = decoded.split(':');
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if token is not too old (24 hours)
    if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Get user data
    const adminPb = await getAdminPb();
    const user = await adminPb.collection('analytics_users').getOne(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.access?.role || 'viewer',
        site_id: user.site_id,
        permissions: user.settings?.permissions || {},
        last_login: user.login_at,
      },
    });
  } catch (error: unknown) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Token verification failed',
      },
      { status: 401 }
    );
  }
}
