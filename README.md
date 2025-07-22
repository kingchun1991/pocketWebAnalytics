# PocketWebAnalytics

<div align="center">
  <h1>🚀 PocketWebAnalytics</h1>
  <p>A modern, production-ready web analytics platform built with Next.js 15, TypeScript, and Chakra UI v3</p>
  
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkingchun1991%2FpocketWebAnalytics" target="_blank"><img src="https://vercel.com/button" alt="Deploy with Vercel" /></a> 
  <a href="https://app.netlify.com/start/deploy?repository=https://github.com/kingchun1991/pocketWebAnalytics" target="_blank"><img src="https://www.netlify.com/img/deploy/button.svg" alt="Deploy to Netlify" /></a>
</div>

## 🎯 Features

- **📊 Real-Time Analytics**: Live visitor tracking and dashboard updates
- **🔐 Authentication System**: Role-based access control (Admin, Editor, Viewer)
- **📱 Mobile-First Design**: Responsive dashboard for all devices
- **⚡ High Performance**: Sub-50ms API response times
- **☁️ Cloud-First**: PocketBase Cloud database with auto-scaling
- **🎨 Modern UI**: Professional interface with Chakra UI v3
- **🛡️ Security**: Protected routes and secure API endpoints
- **📈 Advanced Analytics**: Page views, referrers, browsers, locations, and more

## 🏗️ Built With

- **🚀 Next.js 15** - Latest React framework with App Router
- **⛓️ TypeScript** - Full type safety throughout application
- **🎨 Chakra UI v3** - Modern component library with professional design
- **☁️ PocketBase Cloud** - Hosted database with auto-scaling
- **🔒 JWT Authentication** - Secure session management
- **📊 Real-Time APIs** - Live data collection and dashboard updates

## 📋 Prerequisites

1. [Node.js](https://nodejs.org/en/) 18.0 or higher
2. `pnpm` package manager installed
3. [PocketBase Cloud](https://pocketbase.io/cloud) account

## 🚨 **CRITICAL: Production Requires Cron Jobs**

**⚠️ MANDATORY: PocketWebAnalytics requires scheduled data aggregation for production use.**

Unlike GoatCounter which has built-in aggregation workers, PocketWebAnalytics uses external cron jobs for optimal performance and scalability.

### **📊 Performance Comparison:**

| Setup                 | Dashboard Load Time | Database Performance  | Production Ready |
| --------------------- | ------------------- | --------------------- | ---------------- |
| **Without Cron Jobs** | ❌ 3-10 seconds     | ❌ Degrades over time | ❌ No            |
| **With Cron Jobs**    | ✅ < 1 second       | ✅ Optimal            | ✅ Yes           |

### **� Cron Setup Options:**

#### **Option 1: GitHub Actions (Recommended) 🌟**

Perfect for Vercel, Netlify, and any deployment:

```bash
# 1. Add 2 secrets to GitHub repository:
#    - SITE_URL (your deployed site)
#    - AGGREGATION_API_KEY (for authentication)
# 2. Push workflows to GitHub (already included)
# 3. Done! Workflows call your /api/aggregation endpoint automatically
```

**✨ Benefits:** Fast API calls, no dependencies, built-in monitoring  
**📋 See `GITHUB_ACTIONS_SETUP.md` for complete setup**

#### **Option 2: Server Cron Jobs**

For VPS and dedicated servers:

```bash
# 1. Test aggregation
node scripts/scheduledAggregation.js incremental

# 2. Install cron jobs
crontab crontab.example
```

**📋 See `PRODUCTION_SETUP.md` and `CRON_SETUP.md` for server setup**

---

## 🚀 Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/kingchun1991/pocketWebAnalytics.git
cd pocketWebAnalytics
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

4. **Configure your PocketBase Cloud credentials in `.env.local`**

```env
# PocketBase Cloud Configuration
POCKETBASE_URL=https://your-instance.pocketbase.io
POCKETBASE_ADMIN_EMAIL=your-admin@email.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password

# Optional: Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

5. **Set up the database schema**

```bash
node scripts/pocketbaseTableCreation.js
```

6. **⚠️ CRITICAL: Set up data aggregation cron jobs**

**Choose your preferred method:**

**GitHub Actions (Recommended):**

```bash
# 1. Add secrets to your GitHub repository:
#    POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD
# 2. Push code to GitHub (workflows are included)
# 3. Enable Actions in repository settings
```

**Server Cron Jobs:**

```bash
# Create logs directory
mkdir -p logs

# Test aggregation manually first
node scripts/scheduledAggregation.js incremental

# Install cron jobs (see CRON_SETUP.md for detailed instructions)
crontab crontab.example
```

**📋 See `GITHUB_ACTIONS_SETUP.md` or `CRON_SETUP.md` for complete instructions**

6. **Start the development server**

```bash
pnpm dev
```

7. **Access the application**

- **Main App**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard

## ⚙️ PocketBase Cloud Setup

### 1. Create PocketBase Cloud Instance

1. Visit [PocketBase Cloud](https://pocketbase.io/cloud)
2. Create a new project instance
3. Note your instance URL (e.g., `https://your-instance.pocketbase.io`)
4. Set up admin credentials

### 2. Database Schema

The system uses the following collections (tables) as defined in `scripts/pocketbaseTableCreation.js`:

#### Core Collections

- **`sites`** - Website configurations and settings
- **`analytics_users`** - User accounts with role-based access
- **`hits`** - Real-time page view tracking data
- **`paths`** - Website pages and routes
- **`browsers`** - Browser information
- **`systems`** - Operating system data
- **`refs`** - Referrer sources
- **`sizes`** - Screen resolution data
- **`locations`** - Geographic location data
- **`campaigns`** - UTM campaign tracking

#### Stats Collections (for aggregated data)

- **`hit_counts`** - Hourly page view aggregations
- **`hit_stats`** - Daily analytics summaries
- **`browser_stats`** - Browser usage statistics
- **`system_stats`** - OS usage statistics
- **`location_stats`** - Geographic analytics
- **`language_stats`** - Language preferences

### 3. Auto-Setup Database

Run the database creation script:

```bash
node scripts/pocketbaseTableCreation.js
```

This will:

- Create all required collections
- Set up proper relationships and indexes
- Insert initial seed data
- Configure collection access rules

## 📊 Usage

### Adding Analytics to Your Website

1. **Include the tracking script** in your website's HTML:

```html
<script src="https://your-analytics-domain.com/pocketWebAnalytics.js"></script>
<script>
  pocketWebAnalytics.init({
    url: 'https://your-analytics-domain.com/api/count',
    site: 'your-site-code',
  });
</script>
```

2. **Page views are tracked automatically**. For SPAs, manually trigger on route changes:

```javascript
pocketWebAnalytics.track('/new-page');
```

### Dashboard Access

1. **Create Admin User** (first time setup):

```bash
# The setup script will create default admin user
# Or create manually through PocketBase admin interface
```

2. **Login** at `/login` with your credentials
3. **View analytics** at `/dashboard`

### User Roles

- **👑 Admin**: Full access to all features and user management
- **✏️ Editor**: Analytics write access and limited settings
- **👀 Viewer**: Read-only access to analytics data

## 🔌 API Reference

### Analytics Tracking

```http
POST /api/count
Content-Type: application/json

{
  "url": "https://example.com/page",
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0...",
  "screen_width": 1920,
  "screen_height": 1080
}
```

### Dashboard Data

```http
GET /api/stats?site_id=1&period=week&limit=10
```

**Response:**

```json
{
  "summary": {
    "totalHits": 1250,
    "uniqueVisitors": 834,
    "sessions": 756,
    "bounceRate": 42.5
  },
  "topPages": [
    {
      "path": "/",
      "title": "Home Page",
      "hits": 450,
      "percentage": "36.0"
    }
  ],
  "browsers": [
    {
      "name": "Chrome",
      "hits": 678,
      "percentage": "54.2"
    }
  ]
}
```

### Authentication

```http
POST /api/auth
Content-Type: application/json

{
  "action": "login",
  "email": "user@example.com",
  "password": "secure-password"
}
```

## 🗄️ Database Schema Details

Based on `scripts/pocketbaseTableCreation.js`, the main collections are:

### Sites Collection

```javascript
{
  name: 'sites',
  fields: [
    { name: 'code', type: 'text', required: true }, // Site identifier
    { name: 'settings', type: 'json', required: true },
    { name: 'user_defaults', type: 'json', required: true },
    { name: 'state', type: 'select', values: ['a', 'd'] }, // active/disabled
    { name: 'created_at', type: 'date', required: true }
  ]
}
```

### Analytics Users Collection

```javascript
{
  name: 'analytics_users',
  fields: [
    { name: 'site_id', type: 'relation', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'password', type: 'text' },
    { name: 'access', type: 'json', required: true }, // Role permissions
    { name: 'login_at', type: 'date' }
  ]
}
```

### Hits Collection (Main Analytics Data)

```javascript
{
  name: 'hits',
  fields: [
    { name: 'site_id', type: 'relation', required: true },
    { name: 'path_id', type: 'relation', required: true },
    { name: 'ref_id', type: 'relation', required: true },
    { name: 'session', type: 'text' },
    { name: 'first_visit', type: 'number' },
    { name: 'bot', type: 'number' },
    { name: 'browser_id', type: 'relation', required: true },
    { name: 'system_id', type: 'relation', required: true },
    { name: 'location', type: 'text', required: true },
    { name: 'created_at', type: 'date', required: true }
  ]
}
```

## 🚀 Deployment

### ⚠️ **CRITICAL: Production Cron Setup Required**

**All deployment platforms require cron job setup for data aggregation.**

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard:
   - `POCKETBASE_URL`
   - `POCKETBASE_ADMIN_EMAIL`
   - `POCKETBASE_ADMIN_PASSWORD`
3. **Deploy** - automatic deployment on git push
4. **✅ Set up GitHub Actions cron** (Recommended):
   - Add the same environment variables as **GitHub Secrets**
   - GitHub Actions will handle aggregation automatically
   - See `GITHUB_ACTIONS_SETUP.md` for detailed instructions

**Alternative**: External cron service

- Use cron-job.org, EasyCron, or similar
- Call `/api/aggregation` endpoint hourly
- Requires `AGGREGATION_API_KEY` environment variable

### VPS/Dedicated Server

```bash
# 1. Deploy your application
git clone [repository]
cd pocketWebAnalytics
npm install
npm run build

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 3. CRITICAL: Set up cron jobs
mkdir -p logs
crontab crontab.example

# 4. Start application
npm start
```

### Environment Variables

```env
# Required
POCKETBASE_URL=https://your-instance.pocketbase.io
POCKETBASE_ADMIN_EMAIL=your-admin@email.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password

# Optional
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_ANALYTICS_ID=your-site-id
```

### Manual Deployment

1. **Build the application**:

```bash
pnpm build
```

2. **⚠️ Set up cron jobs** (See `CRON_SETUP.md`):

```bash
# Test aggregation
node scripts/scheduledAggregation.js incremental

# Install cron jobs
crontab crontab.example
```

3. **Start the production server**:

```bash
pnpm start
```

## 🛠️ Development

### Project Structure

```
pocketWebAnalytics/
├── src/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   │   ├── count/     # Analytics tracking
│   │   │   ├── stats/     # Dashboard data
│   │   │   └── auth/      # Authentication
│   │   ├── dashboard/     # Analytics dashboard
│   │   ├── login/         # Authentication UI
│   │   └── layout.tsx     # Root layout with AuthProvider
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   └── ui/            # Dashboard UI components
│   ├── lib/
│   │   ├── auth/          # Authentication utilities
│   │   └── pocketbase.ts  # Database integration
│   └── styles/
├── public/
│   └── pocketWebAnalytics.js  # Client tracking script
├── scripts/
│   ├── pocketbaseTableCreation.js  # Database setup
│   └── aggregationSystem.js       # Data processing
└── README.md
```

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server

# Database
node scripts/pocketbaseTableCreation.js  # Setup database
```

### Key Features Implementation

- **🔒 Authentication**: Complete user management with JWT tokens
- **📊 Real-Time Analytics**: Live tracking using `/api/count` endpoint
- **🎨 Modern UI**: Chakra UI v3 components with responsive design
- **⚡ Performance**: Optimized API routes with edge runtime
- **🛡️ Security**: Protected routes with role-based access control

## 🔗 API Documentation

Based on PocketBase [API Rules and Filters](https://pocketbase.io/docs/api-rules-and-filters/):

### Collection Access Rules

- **Public Collections**: `hits`, `paths`, `browsers`, `systems` (for analytics)
- **Protected Collections**: `analytics_users`, `sites` (admin only)
- **API Authentication**: JWT tokens for dashboard access

### Query Examples

```javascript
// Get recent hits
pb.collection('hits').getList(1, 20, {
  sort: '-created_at',
  filter: 'site_id = "your-site-id"',
});

// Get browser stats
pb.collection('browser_stats').getList(1, 10, {
  sort: '-count',
  expand: 'browser_id',
});
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Support

- **Documentation**: Check this README and [Migration Plan](MIGRATION_PLAN.md)
- **Issues**: Open an issue on GitHub
- **PocketBase Docs**: [PocketBase Documentation](https://pocketbase.io/docs/)
- **Chakra UI**: [Chakra UI Documentation](https://chakra-ui.com/)

---

**PocketWebAnalytics** - Professional web analytics made simple. Built with ❤️ using Next.js 15, TypeScript, and Chakra UI v3.
