# 🚨 **CRITICAL PRODUCTION SETUP GUIDE**

## **⚠️ PocketWebAnalytics Requires Cron Jobs for Production**

Unlike GoatCounter which has built-in aggregation, PocketWebAnalytics uses external cron jobs for data processing. **This is mandatory for production deployments.**

---

## 🔍 **Why Cron Jobs Are Required**

### **GoatCounter vs PocketWebAnalytics:**

**GoatCounter (Built-in):**

- Has internal background workers
- Automatic data aggregation
- No external setup needed

**PocketWebAnalytics (External):**

- Uses cron jobs for aggregation
- More flexible deployment options
- Requires manual setup

### **Without Cron Jobs:**

- ❌ Dashboard loads in 3-10 seconds
- ❌ Database performance degrades
- ❌ Real-time queries on raw data
- ❌ No statistics aggregation

### **With Cron Jobs:**

- ✅ Dashboard loads in < 1 second
- ✅ Optimal performance
- ✅ Pre-aggregated statistics
- ✅ Scalable architecture

---

## 🚀 **MANDATORY Setup Steps**

### **1. Environment Configuration**

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit with your PocketBase credentials
nano .env.local
```

Required variables:

```env
POCKETBASE_URL=https://your-instance.pocketbase.io
POCKETBASE_ADMIN_EMAIL=admin@yoursite.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password
```

### **2. Database Setup**

```bash
# Create all tables including aggregation tables
node scripts/pocketbaseTableCreation.js
```

This creates critical tables:

- `hits` - Raw analytics data
- `hit_counts` - Hourly aggregations
- `hit_stats` - Daily statistics
- `browser_stats`, `system_stats`, `location_stats` - Device analytics

### **3. Test Aggregation Manually**

```bash
# Create logs directory
mkdir -p logs

# Test incremental aggregation
node scripts/scheduledAggregation.js incremental

# Test daily aggregation
node scripts/scheduledAggregation.js daily
```

### **4. Install Production Cron Jobs**

```bash
# Install cron jobs
crontab crontab.example

# Verify installation
crontab -l
```

**Required cron schedule:**

```cron
# Hourly aggregation (CRITICAL)
5 * * * * cd /path/to/pocketWebAnalytics && node scripts/scheduledAggregation.js incremental >> logs/aggregation.log 2>&1

# Daily aggregation (CRITICAL)
5 1 * * * cd /path/to/pocketWebAnalytics && node scripts/scheduledAggregation.js daily >> logs/aggregation.log 2>&1

# Weekly cleanup (RECOMMENDED)
5 2 * * 0 cd /path/to/pocketWebAnalytics && node scripts/scheduledAggregation.js full >> logs/aggregation.log 2>&1
```

### **5. Verify Setup**

```bash
# Run verification script
node scripts/verifyCronSetup.js
```

---

## 🔧 **Platform-Specific Instructions**

### **VPS/Dedicated Server**

```bash
# Standard cron setup
crontab -e
# Add the cron jobs above

# Check cron service
systemctl status cron
```

### **Shared Hosting**

1. Access your hosting control panel
2. Find "Cron Jobs" section
3. Add hourly job: `node /path/to/pocketWebAnalytics/scripts/scheduledAggregation.js incremental`
4. Add daily job: `node /path/to/pocketWebAnalytics/scripts/scheduledAggregation.js daily`

### **Vercel/Netlify (Serverless)**

⚠️ **Serverless platforms don't support cron jobs directly**

**Solutions:**

1. **External Cron Service** (Recommended):
   - Use cron-job.org, EasyCron, or Uptime Robot
   - Schedule HTTP calls to `/api/aggregation` endpoint
2. **GitHub Actions**:

   ```yaml
   name: Data Aggregation
   on:
     schedule:
       - cron: '5 * * * *' # Every hour at minute 5
   jobs:
     aggregate:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Run aggregation
           run: |
             npm install
             node scripts/scheduledAggregation.js incremental
   ```

3. **Vercel Cron** (Pro):
   - Use Vercel's cron functions (requires Pro plan)
   - Create `/api/cron/aggregate.js` endpoint

### **Docker Deployment**

Add to your `Dockerfile`:

```dockerfile
# Install cron
RUN apt-get update && apt-get install -y cron

# Copy crontab
COPY crontab.example /etc/cron.d/pocketwebanalytics
RUN chmod 0644 /etc/cron.d/pocketwebanalytics
RUN crontab /etc/cron.d/pocketwebanalytics

# Start cron with app
CMD cron && npm start
```

---

## 📊 **Monitoring & Maintenance**

### **Check Cron Status**

```bash
# View recent logs
tail -f logs/aggregation.log

# Check for errors
grep -i error logs/aggregation.log

# View system cron logs
sudo tail -f /var/log/cron.log  # Ubuntu/Debian
sudo tail -f /var/log/cron      # CentOS/RHEL
```

### **Performance Monitoring**

```bash
# Check aggregation performance
node scripts/verifyCronSetup.js

# Monitor database size
# Check PocketBase admin interface for collection sizes
```

### **Troubleshooting**

**Common Issues:**

1. **"node: command not found"**

   ```bash
   # Use full path
   /usr/bin/node scripts/scheduledAggregation.js incremental
   ```

2. **Permission denied**

   ```bash
   chmod +x scripts/scheduledAggregation.js
   ```

3. **Database connection failed**

   ```bash
   # Check environment variables
   cat .env.local | grep POCKETBASE
   ```

4. **Cron jobs not running**
   ```bash
   sudo systemctl restart cron
   ```

---

## ✅ **Deployment Checklist**

- [ ] Environment variables configured
- [ ] Database tables created
- [ ] Manual aggregation tested successfully
- [ ] Cron jobs installed and verified
- [ ] Logs directory created and writable
- [ ] Cron service running
- [ ] Verification script passes
- [ ] Dashboard loads quickly (< 1 second)

---

## 🎯 **Expected Results**

After proper cron setup:

- **Dashboard Performance**: < 1 second load times
- **Data Accuracy**: Real-time statistics
- **Scalability**: Handles high traffic
- **Reliability**: Consistent performance

**Without cron setup, PocketWebAnalytics will not perform adequately in production.**

---

## 📚 **Related Documentation**

- `CRON_SETUP.md` - Detailed cron configuration
- `crontab.example` - Example cron jobs
- `scripts/scheduledAggregation.js` - Aggregation script
- `scripts/verifyCronSetup.js` - Verification tool

---

**🚨 CRITICAL: Do not deploy to production without setting up cron jobs. This is not optional.**
