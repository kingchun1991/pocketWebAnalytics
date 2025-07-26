# PocketWebAnalytics AI Development Guide

## 🏗️ Architecture Overview

**PocketWebAnalytics** is a modern web analytics platform that follows GoatCounter's approach with Next.js 15 and PocketBase Cloud. The system has two main data flows:

1. **Real-time tracking**: Client script → `/api/count` → PocketBase → Dashboard
2. **Aggregated analytics**: Cron jobs → Aggregation tables → Fast dashboard queries

### Core Components

- **Analytics Tracking**: `/api/count` endpoint processes page views using normalized relational data
- **Dashboard API**: `/api/stats` serves analytics with dual-mode (real-time vs aggregated)
- **Authentication**: Role-based system (admin/editor/viewer) with JWT tokens
- **Client Script**: `public/pocketWebAnalytics.js` - GoatCounter-compatible tracking

## 📊 Database Architecture (PocketBase)

### Normalized Schema Pattern

The system uses **lookup tables** for performance. Key collections:

```typescript
// Core tracking data
hits: {
  (site_id, path_id, ref_id, browser_id, system_id, session, first_visit);
}

// Lookup tables (normalized)
paths: {
  (site_id, path, title);
}
browsers: {
  (name, version);
}
systems: {
  (name, version);
}
refs: {
  (ref, ref_scheme);
}
```

### Data Flow Pattern

```typescript
// Always use getOrCreateLookupRecord() for normalization
const browserRecord = await getOrCreateLookupRecord(
  pb,
  'browsers',
  { name: parsedUA.browser.name, version: parsedUA.browser.version },
  ['name', 'version']
);
```

## 🚀 Development Workflows

### Database Setup

```bash
# CRITICAL: Always run this first for new environments
node scripts/pocketbaseTableCreation.js
```

### Analytics Processing

```bash
# Test data aggregation locally
node scripts/scheduledAggregation.js incremental

# Generate site metadata
pnpm generate-json  # Runs before dev/build automatically
```

### Environment Configuration

```env
# Required for ALL functionality
POCKETBASE_URL=https://your-instance.pocketbase.io
POCKETBASE_ADMIN_EMAIL=your-admin@email.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password
```

## 🔧 API Patterns

### Edge Runtime Usage

```typescript
export const runtime = 'edge'; // Used in: /count, /aggregation, /info
```

### PocketBase Authentication Pattern

```typescript
// Always create fresh instances to avoid I/O reuse issues
const pb = new PocketBase(process.env.POCKETBASE_URL);
await pb
  .collection('_superusers')
  .authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
```

### Analytics Data Processing

Key utilities in `src/lib/analytics-utils.ts`:

- `parseUserAgent()` - Extract browser/OS from user agent
- `getOrCreateLookupRecord()` - Normalize data into lookup tables
- `categorizeReferrer()` - Process referrer URLs
- `detectFirstVisit()` - Enhanced first-visit detection

## 🎨 UI Component Patterns

### Chakra UI v3 + Next.js 15

- Use `'use client'` only for interactive components
- Prefer named exports: `export function Component() {}`
- Dashboard components in `src/components/ui/`
- Authentication components in `src/components/auth/`

### Authentication Flow

```typescript
// Role-based protection pattern
<ProtectedRoute requiredRole="admin" requiredPermission={{
  resource: 'analytics', action: 'read'
}}>
  <DashboardContent />
</ProtectedRoute>
```

## ⚡ Performance Considerations

### Dual-Mode Analytics

- **Real-time**: Direct queries to `hits` table (development/small datasets)
- **Aggregated**: Pre-computed stats tables (production/large datasets)

### Cron Job Requirements

```bash
# CRITICAL: Production requires these cron jobs
# Hourly aggregation
5 * * * * node scripts/scheduledAggregation.js incremental

# Daily statistics
5 1 * * * node scripts/scheduledAggregation.js daily
```

## 🚨 Common Gotchas

1. **Path Length Validation**: Reject paths > 2048 bytes in `/api/count`
2. **Session Tracking**: Combine `visitorId-sessionId` for unique sessions
3. **Bot Detection**: Multiple layers (client-side, server-side, user-agent)
4. **Fresh PocketBase Instances**: Create new instance per request to avoid connection reuse issues

## 🔍 Testing Patterns

### Analytics Testing

```javascript
// Test tracking integration
<script src="/pocketWebAnalytics.js"></script>
<script>
  // Automatic tracking (no manual calls needed)
  // For SPAs: pocketWebAnalytics.count({ path: '/new-route' })
</script>
```

### Data Validation

```bash
# Check aggregation system
node scripts/scheduledAggregation.js incremental --dry-run
```

## 📁 Key File Locations

- **Analytics Core**: `src/app/api/count/route.ts` (tracking endpoint)
- **Dashboard API**: `src/app/api/stats/route.ts` (analytics data)
- **Client Script**: `public/pocketWebAnalytics.js` (tracking script)
- **Database Setup**: `scripts/pocketbaseTableCreation.js`
- **Data Processing**: `scripts/scheduledAggregation.js`
- **Utils**: `src/lib/analytics-utils.ts` (data processing functions)

Focus on these patterns when making changes - the system is production-ready but requires proper cron job setup for optimal performance.
