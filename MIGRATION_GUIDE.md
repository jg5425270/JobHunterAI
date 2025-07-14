# JobFlow Migration Guide: Free Cloud Deployment

## Overview
This guide provides comprehensive instructions for migrating JobFlow from Replit to free cloud services while maintaining data persistence and full functionality.

## Migration Options

### Option 1: Railway (Recommended)
**Free Tier**: 500 hours/month, PostgreSQL included
**Best for**: Production-ready deployment with minimal configuration

### Option 2: Vercel + PlanetScale
**Free Tier**: Unlimited static hosting + 1GB database
**Best for**: Serverless deployment with global CDN

### Option 3: Fly.io + Neon
**Free Tier**: 160 hours/month + 0.5GB database
**Best for**: Container-based deployment with geographic distribution

### Option 4: Render + Supabase
**Free Tier**: 750 hours/month + 500MB database
**Best for**: Simple deployment with built-in auth

## Option 1: Railway Deployment (Recommended)

### Prerequisites
- Railway account (free tier)
- GitHub account
- Domain name (optional)

### Step 1: Prepare Repository
```bash
# Clone your project
git clone <your-repo-url>
cd jobflow

# Create production environment file
cp .env.example .env.production
```

### Step 2: Configure Package.json
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc server/index.ts --outDir dist",
    "start": "node dist/server/index.js",
    "postbuild": "npm run db:push"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Step 3: Create Railway Configuration
Create `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepingAllowed": true,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Step 4: Database Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway create jobflow

# Add PostgreSQL service
railway add postgresql

# Get database URL
railway variables
```

### Step 5: Environment Variables
Set in Railway dashboard:
```bash
DATABASE_URL=<from-railway-postgresql>
SESSION_SECRET=<generate-random-string>
NODE_ENV=production
SENDGRID_API_KEY=<your-sendgrid-key>
OPENAI_API_KEY=<your-openai-key>
REPL_ID=<your-repl-id>
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=<your-railway-domain>
```

### Step 6: Deploy
```bash
# Connect to Railway
railway link

# Deploy
railway up

# Monitor deployment
railway logs
```

### Step 7: Custom Domain (Optional)
```bash
# Add custom domain in Railway dashboard
# Update REPLIT_DOMAINS environment variable
# Configure DNS records
```

## Option 2: Vercel + PlanetScale

### Step 1: Database Setup (PlanetScale)
```bash
# Install PlanetScale CLI
npm install -g @planetscale/cli

# Login
pscale auth login

# Create database
pscale database create jobflow

# Create branch
pscale branch create jobflow main

# Get connection string
pscale password create jobflow main jobflow-password
```

### Step 2: Adapt for Serverless
Create `api/` directory structure:
```
api/
├── auth/
│   ├── callback.ts
│   ├── login.ts
│   └── user.ts
├── applications/
│   ├── index.ts
│   └── [id].ts
├── settings/
│   └── index.ts
└── _middleware.ts
```

### Step 3: Convert Express Routes to Vercel Functions
Example: `api/applications/index.ts`
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db';
import { jobApplications } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const applications = await db.select().from(jobApplications);
    return res.json(applications);
  }
  
  if (req.method === 'POST') {
    const application = await db.insert(jobApplications).values(req.body);
    return res.json(application);
  }
  
  res.status(405).json({ message: 'Method not allowed' });
}
```

### Step 4: Configure Vercel
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "SESSION_SECRET": "@session_secret",
    "SENDGRID_API_KEY": "@sendgrid_api_key",
    "OPENAI_API_KEY": "@openai_api_key"
  }
}
```

### Step 5: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel env add SENDGRID_API_KEY
vercel env add OPENAI_API_KEY
```

## Option 3: Fly.io + Neon

### Step 1: Install Fly CLI
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login
```

### Step 2: Setup Neon Database
```bash
# Create account at neon.tech
# Create database
# Get connection string
```

### Step 3: Create Fly Configuration
Create `fly.toml`:
```toml
app = "jobflow"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[experimental]
  allowed_public_ports = []
  auto_rollback = true

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"

[deploy]
  release_command = "npm run db:push"
```

### Step 4: Deploy to Fly.io
```bash
# Initialize app
fly launch --no-deploy

# Set secrets
fly secrets set DATABASE_URL="<neon-connection-string>"
fly secrets set SESSION_SECRET="<random-string>"
fly secrets set SENDGRID_API_KEY="<your-key>"
fly secrets set OPENAI_API_KEY="<your-key>"

# Deploy
fly deploy
```

## Option 4: Render + Supabase

### Step 1: Setup Supabase
```bash
# Create account at supabase.com
# Create project
# Get connection details
```

### Step 2: Create Render Configuration
Create `render.yaml`:
```yaml
services:
  - type: web
    name: jobflow
    env: node
    plan: free
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: jobflow-db
          property: connectionString
      - key: SESSION_SECRET
        generateValue: true
      - key: SENDGRID_API_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false

databases:
  - name: jobflow-db
    plan: free
```

### Step 3: Deploy to Render
```bash
# Connect GitHub repository
# Configure environment variables
# Deploy automatically
```

## Data Migration Process

### Step 1: Export Data from Replit
```bash
# Create backup script
node -e "
const { db } = require('./server/db');
const fs = require('fs');

async function backup() {
  const users = await db.select().from(users);
  const applications = await db.select().from(jobApplications);
  const emails = await db.select().from(emailTracking);
  const settings = await db.select().from(userSettings);
  
  const backup = {
    users,
    applications,
    emails,
    settings,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync('backup.json', JSON.stringify(backup, null, 2));
  console.log('Backup created: backup.json');
}

backup();
"
```

### Step 2: Import Data to New Database
```bash
# Create restore script
node -e "
const { db } = require('./server/db');
const fs = require('fs');

async function restore() {
  const backup = JSON.parse(fs.readFileSync('backup.json', 'utf8'));
  
  // Restore users
  for (const user of backup.users) {
    await db.insert(users).values(user).onConflictDoUpdate({
      target: users.id,
      set: user
    });
  }
  
  // Restore applications
  for (const app of backup.applications) {
    await db.insert(jobApplications).values(app).onConflictDoUpdate({
      target: jobApplications.id,
      set: app
    });
  }
  
  // Restore other data...
  
  console.log('Data restored successfully');
}

restore();
"
```

## Post-Migration Checklist

### Functionality Testing
- [ ] User authentication works
- [ ] Job applications can be created/edited
- [ ] Email integration functions
- [ ] Auto-apply system operates
- [ ] Dashboard displays correctly
- [ ] Data persistence confirmed

### Performance Optimization
- [ ] Database queries optimized
- [ ] Static assets cached
- [ ] CDN configured (if applicable)
- [ ] Monitoring set up
- [ ] Error tracking enabled

### Security Verification
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API endpoints protected
- [ ] Session management working

### Backup Strategy
- [ ] Automated database backups
- [ ] Code repository backups
- [ ] Configuration backups
- [ ] Recovery procedures tested

## Cost Monitoring

### Free Tier Limits
- **Railway**: 500 hours/month
- **Vercel**: Unlimited static, 100GB bandwidth
- **Fly.io**: 160 hours/month
- **Render**: 750 hours/month

### Usage Optimization
- Enable sleeping for inactive services
- Optimize database queries
- Use caching where appropriate
- Monitor resource usage regularly

## Troubleshooting

### Common Issues
1. **Database Connection Errors**
   - Verify connection string format
   - Check firewall settings
   - Confirm SSL requirements

2. **Build Failures**
   - Update Node.js version
   - Clear package cache
   - Check dependencies

3. **Environment Variables**
   - Verify all required variables set
   - Check variable names/spelling
   - Confirm proper encoding

4. **Authentication Issues**
   - Update OAuth redirect URLs
   - Verify domain configuration
   - Check session storage

### Support Resources
- Platform documentation
- Community forums
- GitHub issues
- Stack Overflow

## Maintenance

### Regular Tasks
- Monitor application health
- Review error logs
- Update dependencies
- Backup verification
- Performance optimization

### Monthly Reviews
- Usage statistics
- Cost analysis
- Security updates
- Feature planning
- User feedback

This migration guide ensures a smooth transition to free cloud services while maintaining data integrity and full functionality of your JobFlow application.