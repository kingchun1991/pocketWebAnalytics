import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pb = new PocketBase(
  process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
);

export async function GET() {
  try {
    // Authenticate with PocketBase
    await pb
      .collection('_superusers')
      .authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || '',
        process.env.POCKETBASE_ADMIN_PASSWORD || ''
      );

    // Get settings from the store collection
    const settings = await pb.collection('store').getList(1, 50);

    return NextResponse.json({
      settings: settings.items,
      total: settings.totalItems,
    });
  } catch (error) {
    console.error('❌ Settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate with PocketBase
    await pb
      .collection('_superusers')
      .authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || '',
        process.env.POCKETBASE_ADMIN_PASSWORD || ''
      );

    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Update or create setting
    try {
      // Try to find existing setting
      const existing = await pb
        .collection('store')
        .getFirstListItem(`key="${key}"`);
      // Update existing
      const updated = await pb
        .collection('store')
        .update(existing.id, { value });
      return NextResponse.json(updated);
    } catch {
      // Create new setting
      const created = await pb.collection('store').create({ key, value });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error('❌ Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
