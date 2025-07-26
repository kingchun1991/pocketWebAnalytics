# PocketWebAnalytics Data Aggregation Setup

## 🕐 **Critical: Automated Data Processing**

PocketWebAnalytics requires **scheduled data aggregation** to maintain optimal performance and provide accurate dashboard statistics. Without proper automation setup, your dashboard may show incomplete or slow data.

---

## � **Recommended: GitHub Actions (Zero Server Management)**

**The preferred method for all deployments** - works with Vercel, Netlify, and any platform.

### ✨ **Why GitHub Actions?**

- 🎯 **No Server Required** - Runs in GitHub's cloud
- ⚡ **Fast API Calls** - Direct HTTP requests to your `/api/aggregation` endpoint
- 🔍 **Built-in Monitoring** - View logs and status in GitHub Actions tab
- 🆓 **Free Tier Sufficient** - Easily handles analytics aggregation needs
- 🔄 **Automatic Updates** - Workflows update with your code deployments

### 📋 **Setup Steps**

1. **Add GitHub Secrets** (in your repository settings):
   - `SITE_URL` - Your deployed site URL (e.g., `https://yoursite.vercel.app`)
   - `AGGREGATION_API_KEY` - Secret key for API authentication

2. **Workflows Auto-Enabled** - The `.github/workflows/` files are already included

3. **That's it!** - Aggregation runs automatically

### 📅 **Automatic Schedule**

- **Hourly**: Every hour at minute 5 - processes recent data
- **Daily**: Daily at 1:05 AM UTC - generates comprehensive statistics

---

## 🔧 **Alternative: External Cron Services**

For users who prefer external services:

### **Option 1: cron-job.org**

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create new cron job:
   - **URL**: `https://yoursite.com/api/aggregation`
   - **Method**: POST
   - **Headers**: `Authorization: Bearer YOUR_AGGREGATION_API_KEY`
   - **Schedule**: `5 * * * *` (hourly)

### **Option 2: EasyCron**

1. Sign up at [EasyCron](https://www.easycron.com)
2. Create new cron job:
   - **URL**: `https://yoursite.com/api/aggregation`
   - **Method**: POST
   - **Headers**: `Authorization: Bearer YOUR_AGGREGATION_API_KEY`
   - **Schedule**: Every hour at minute 5

---

## 🧪 **Testing & Verification**

### **Manual API Test**

Test your aggregation endpoint directly:

```bash
# Test the aggregation API
curl -X POST "https://yoursite.com/api/aggregation" \
  -H "Authorization: Bearer YOUR_AGGREGATION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "incremental"}'
```

Expected response:

```json
{
  "success": true,
  "type": "incremental",
  "hits_processed": 123,
  "duration": "2.3s"
}
```

### **Check GitHub Actions**

1. Go to your repository's **Actions** tab
2. Look for "📊 PocketWebAnalytics Data Aggregation" workflow
3. Check recent runs for success/failure status
4. View logs for detailed output

---

## 📊 **What Aggregation Does**

### **⏰ Scheduled Jobs Purpose Comparison**

| Job Type               | Frequency            | Primary Purpose                             | Database Tables Affected                                                                                         | Performance Impact                 | GoatCounter Equivalent                                                      |
| ---------------------- | -------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| **Hourly Aggregation** | Every hour at :05    | Process recent hits into optimized counters | `hit_counts`, `ref_counts`                                                                                       | 🚀 Enables < 1s dashboard loads    | `hit_stat.go`, `ref_stat.go`                                                |
| **Daily Statistics**   | Daily at 1:05 AM UTC | Generate comprehensive daily summaries      | `hit_stats`, `browser_stats`, `system_stats`, `location_stats`, `language_stats`, `campaign_stats`, `size_stats` | 📈 Powers trend analysis & reports | `browser_stat.go`, `system_stat.go`, `location_stat.go`, `campaign_stat.go` |

### **🔄 Hourly Processing Details**

**Purpose**: Converts raw `hits` data into pre-aggregated hourly counters for lightning-fast dashboard queries.

**What it does**:

- ✅ Groups recent hits by hour and path
- ✅ Counts total visits and unique sessions per hour
- ✅ Updates `hit_counts` table with aggregated data
- ✅ Processes referrer data into `ref_counts`
- ✅ Maintains rolling 2-hour processing window

**Performance Impact**:

- Without: Dashboard queries raw `hits` table (3-10 seconds)
- With: Dashboard queries pre-aggregated `hit_counts` (< 1 second)

### **📅 Daily Processing Details**

**Purpose**: Creates comprehensive daily statistical summaries across all analytics dimensions.

**What it does**:

- ✅ Aggregates hourly data into daily summaries (`hit_stats`)
- ✅ Breaks down traffic by browser (`browser_stats`)
- ✅ Analyzes operating systems (`system_stats`)
- ✅ Processes geographic data (`location_stats`)
- ✅ Tracks language preferences (`language_stats`)
- ✅ Summarizes campaign performance (`campaign_stats`)
- ✅ Analyzes screen sizes (`size_stats`)

**Performance Impact**:

- Enables trend analysis over weeks/months
- Powers advanced reporting features
- Maintains optimal database performance long-term

---

## 🚨 **Troubleshooting**

### **GitHub Actions Issues**

1. **Workflow Not Running**
   - Check Actions tab is enabled in repository settings
   - Verify secrets are correctly named and set

2. **API Authentication Errors**
   - Ensure `AGGREGATION_API_KEY` matches your environment variable
   - Check `SITE_URL` is correct (no trailing slash)

3. **API Endpoint Errors**
   - Verify your site is deployed and accessible
   - Test the `/api/aggregation` endpoint manually

### **Performance Check**

Test dashboard performance:

- **Without Aggregation**: Dashboard loads in 3-10 seconds
- **With Proper Aggregation**: Dashboard loads in < 1 second

---

## 📈 **Performance Impact**

### **Without Automated Aggregation:**

- ❌ Dashboard loads slowly (3-10 seconds)
- ❌ Real-time queries on raw data
- ❌ Database performance degrades over time
- ❌ Incomplete statistical accuracy

### **With GitHub Actions Aggregation:**

- ✅ Dashboard loads instantly (< 1 second)
- ✅ Pre-processed data for lightning-fast queries
- ✅ Optimal database performance maintained
- ✅ Accurate statistical reporting
- ✅ Zero server management overhead

---

## ✅ **Setup Verification Checklist**

- [ ] GitHub repository has required secrets configured
- [ ] Aggregation workflows are visible in Actions tab
- [ ] Manual API test returns success response
- [ ] Dashboard loads quickly (< 1 second)
- [ ] Analytics data is being processed and updated

---

## 🔗 **Related Documentation**

- `GITHUB_ACTIONS_SETUP.md` - Complete GitHub Actions setup guide
- `src/app/api/aggregation/route.ts` - API endpoint implementation
- `scripts/pocketbaseTableCreation.js` - Database schema with aggregation tables
- `.env.local.example` - Environment configuration template

---

**⚠️ Important**: Automated aggregation setup is **mandatory** for production deployments. GitHub Actions provides the simplest and most reliable solution with zero infrastructure requirements.
