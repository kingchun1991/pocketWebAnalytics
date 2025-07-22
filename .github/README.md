# 🤖 GitHub Actions Workflows

This directory contains automated workflows for PocketWebAnalytics data aggregation.

## 📁 **Workflow Files**

### `aggregation.yml`

- **Purpose**: Main hourly data aggregation
- **Schedule**: Every hour at minute 5 (`5 * * * *`)
- **Runtime**: ~30-60 seconds
- **Function**: Processes recent hits into hourly statistics

### `daily-stats.yml`

- **Purpose**: Daily statistics generation
- **Schedule**: Daily at 1:05 AM UTC (`5 1 * * *`)
- **Runtime**: ~1-2 minutes
- **Function**: Creates daily summaries and reports

## 🔧 **Required Setup**

Add these secrets to your GitHub repository (**Settings** → **Secrets and Variables** → **Actions**):

| Secret Name           | Description                         | Example                        |
| --------------------- | ----------------------------------- | ------------------------------ |
| `SITE_URL`            | Your deployed analytics site        | `https://analytics.vercel.app` |
| `AGGREGATION_API_KEY` | API key for endpoint authentication | `your-secure-api-key`          |

## 🚀 **Manual Execution**

You can manually trigger workflows:

1. Go to **Actions** tab in GitHub
2. Select a workflow
3. Click "Run workflow"
4. Choose parameters if available

## 📊 **Monitoring**

### **Success Indicators**

- ✅ Green checkmarks in Actions tab
- ✅ "Aggregation completed" in logs
- ✅ Dashboard loads in < 1 second

### **Common Issues**

- ❌ **Secrets not found**: Check `SITE_URL` and `AGGREGATION_API_KEY` are set in repository secrets
- ❌ **Authentication failed**: Verify `AGGREGATION_API_KEY` matches your deployment environment variable
- ❌ **Endpoint not found**: Ensure your site is deployed and `/api/aggregation` endpoint is accessible

## 📈 **Expected Usage**

### **GitHub Actions Minutes**

- **Hourly runs**: 24 × 1 minute = 24 minutes/day
- **Daily runs**: 1 × 2 minutes = 2 minutes/day
- **Total**: ~780 minutes/month (within free tier)

### **Free Tier Limits**

- **Public repos**: Unlimited minutes
- **Private repos**: 2,000 minutes/month
- **Pro accounts**: 3,000 minutes/month

## 🔄 **Alternative Approaches**

If GitHub Actions don't work for you:

1. **External Cron Services**: cron-job.org, EasyCron
2. **Server Cron Jobs**: Traditional crontab setup
3. **Vercel Cron**: Pro plan only
4. **AWS Lambda**: EventBridge scheduling

## 📚 **Documentation**

- `GITHUB_ACTIONS_SETUP.md` - Complete setup guide
- `PRODUCTION_SETUP.md` - General production setup
- `CRON_SETUP.md` - Server-based cron setup

---

**🎯 These workflows ensure your analytics platform maintains optimal performance with automated data processing.**
