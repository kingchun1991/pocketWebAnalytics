# 🔧 GitHub Actions Cron Setup Guide

## 🎯 **GitHub Actions for Data Aggregation**

Instead of traditional server cron jobs, PocketWebAnalytics can use GitHub Actions to run scheduled data aggregation. This is perfect for:

- **Serverless deployments** (Vercel, Netlify)
- **Projects without server access**
- **Centralized monitoring and logging**
- **Free execution** (within GitHub limits)

---

## 🚀 **Quick Setup (5 Minutes)**

### **1. GitHub Secrets Configuration**

Go to your GitHub repository → **Settings** → **Secrets and Variables** → **Actions** and add:

| Secret Name                 | Value                     | Example                               |
| --------------------------- | ------------------------- | ------------------------------------- |
| `POCKETBASE_URL`            | Your PocketBase cloud URL | `https://your-instance.pocketbase.io` |
| `POCKETBASE_ADMIN_EMAIL`    | Admin email               | `admin@yoursite.com`                  |
| `POCKETBASE_ADMIN_PASSWORD` | Admin password            | `your-secure-password`                |
| `AGGREGATION_API_KEY`       | API key for fallback      | `your-secure-api-key`                 |
| `SITE_URL`                  | Your deployed site URL    | `https://your-analytics.vercel.app`   |

### **2. Verify Workflows Exist**

The workflows should be automatically available:

- `.github/workflows/aggregation.yml` - Main hourly aggregation
- `.github/workflows/daily-stats.yml` - Daily statistics

### **3. Enable GitHub Actions**

1. Go to **Actions** tab in your repository
2. Enable workflows if prompted
3. Workflows will start running automatically

### **4. Test Manual Execution**

1. Go to **Actions** tab
2. Click "📊 PocketWebAnalytics Data Aggregation"
3. Click "Run workflow"
4. Select aggregation type: `incremental`
5. Click "Run workflow"

---

## 📅 **Automatic Schedule**

### **Hourly Aggregation**

- **Schedule**: Every hour at minute 5 (`5 * * * *`)
- **Purpose**: Process recent hits into `hit_counts` table
- **Runtime**: ~30-60 seconds

### **Daily Statistics**

- **Schedule**: Daily at 1:05 AM UTC (`5 1 * * *`)
- **Purpose**: Generate daily summaries in `hit_stats` table
- **Runtime**: ~1-2 minutes

### **Manual Triggers**

- Available through Actions tab
- Options: `incremental`, `daily`, `full`
- Useful for testing or missed runs

### **✨ API-Based Approach Benefits**

The GitHub Actions workflows use your analytics API endpoints (`/api/aggregation`) instead of running scripts directly:

- ✅ **Faster Execution** - No dependency installation or build steps required
- ✅ **More Reliable** - Uses the same API your production site uses
- ✅ **Better Monitoring** - Clear HTTP response codes and JSON error details
- ✅ **Consistent Logic** - Identical aggregation behavior across all environments
- ✅ **Easier Debugging** - Can test aggregation API independently via curl/Postman

---

## 🔍 **Monitoring & Logs**

### **View Execution Logs**

1. Go to **Actions** tab in GitHub
2. Click on any workflow run
3. Expand job steps to see detailed logs
4. Look for:
   - ✅ Success indicators
   - ⚠️ Warnings
   - ❌ Error messages

### **Typical Log Output**

```bash
🚀 Starting incremental aggregation at 2025-07-22T14:05:00.000Z
🔄 Processing analytics data with new schema...
🗄️ Creating relational records...
✅ Relational records created: {...}
✅ Aggregation completed: 156 hits processed
✅ Aggregation completed at 2025-07-22T14:05:34.123Z
```

### **Email Notifications**

GitHub can email you when workflows fail:

1. Go to **Settings** → **Notifications**
2. Enable "Actions" notifications
3. Choose "Only failures and manual runs"

---

## ⚙️ **Advanced Configuration**

### **Adjust Timing**

Edit `.github/workflows/aggregation.yml`:

```yaml
on:
  schedule:
    # Every 30 minutes (high-traffic sites)
    - cron: '*/30 * * * *'

    # Every 2 hours (low-traffic sites)
    # - cron: '0 */2 * * *'
```

### **Add Slack Notifications**

Add to workflow steps:

```yaml
- name: 📢 Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### **Timeout Protection**

```yaml
jobs:
  hourly-aggregation:
    timeout-minutes: 10 # Prevent stuck jobs
```

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **"Secrets not found" Error**

```bash
Error: Process completed with exit code 1
```

**Solution**: Verify all secrets are added in GitHub repository settings

#### **"Authentication failed" Error**

```bash
Authentication failed: 400 Bad Request
```

**Solution**: Check PocketBase URL, email, and password in secrets

#### **"No recent hits to aggregate"**

```bash
No recent hits to aggregate, count: 0
```

**Solution**: Normal for low-traffic sites, not an error

#### **Workflow Not Running**

- Check if Actions are enabled in repository settings
- Verify cron syntax in workflow file
- Check GitHub Actions usage limits

### **Manual Debugging**

Run aggregation locally to test:

```bash
# Set environment variables
export POCKETBASE_URL="https://your-instance.pocketbase.io"
export POCKETBASE_ADMIN_EMAIL="admin@yoursite.com"
export POCKETBASE_ADMIN_PASSWORD="your-password"

# Test aggregation
node scripts/scheduledAggregation.js incremental
```

---

## 📊 **GitHub Actions Limits**

### **Free Tier Limits**

- **2,000 minutes/month** for private repos
- **Unlimited minutes** for public repos
- Each aggregation run: ~1-2 minutes
- **Estimated usage**: ~50-100 minutes/month

### **Usage Optimization**

- Hourly runs: 24 × 30 = 720 runs/month
- Daily runs: 30 runs/month
- Total: ~750 minutes/month (within limits)

### **If You Hit Limits**

1. Reduce frequency (every 2 hours vs hourly)
2. Use API endpoint with external cron service
3. Upgrade to GitHub Pro

---

## 🔄 **Migration from Server Cron**

If moving from server cron jobs:

### **1. Disable Server Cron**

```bash
# Remove existing crontab
crontab -r
```

### **2. Enable GitHub Actions**

- Add secrets to repository
- Push workflows to GitHub
- Verify first successful run

### **3. Monitor Transition**

- Check both systems don't run simultaneously
- Verify aggregation data continuity
- Monitor GitHub Actions logs

---

## ✅ **Verification Checklist**

- [ ] All 5 secrets added to GitHub repository
- [ ] Workflow files exist in `.github/workflows/`
- [ ] Actions enabled in repository settings
- [ ] First manual run successful
- [ ] Hourly schedule running automatically
- [ ] Daily schedule configured
- [ ] Email notifications configured
- [ ] Dashboard performance improved

---

## 🎯 **Expected Results**

After GitHub Actions setup:

- **Automated execution** every hour
- **Centralized logging** in GitHub Actions
- **Email alerts** for failures
- **No server maintenance** required
- **Dashboard performance** < 1 second load times

---

## 📚 **Related Files**

- `.github/workflows/aggregation.yml` - Hourly aggregation workflow
- `.github/workflows/daily-stats.yml` - Daily statistics workflow
- `scripts/scheduledAggregation.js` - Main aggregation script
- `PRODUCTION_SETUP.md` - General production setup

---

**🚀 GitHub Actions provides a reliable, free, and maintenance-free way to run your analytics aggregation system.**
