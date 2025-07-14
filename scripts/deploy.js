#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Deployment script for JobFlow
console.log('🚀 JobFlow Deployment Script');
console.log('============================');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'server/index.ts',
  'shared/schema.ts',
  'drizzle.config.ts'
];

console.log('📋 Checking required files...');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
}
console.log('✅ All required files present');

// Create production build configuration
function createProductionConfig() {
  console.log('⚙️  Creating production configuration...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Add production scripts if they don't exist
  const productionScripts = {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc server/index.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --skipLibCheck --resolveJsonModule --declaration false",
    "start": "node dist/server/index.js",
    "postbuild": "npm run db:push"
  };
  
  packageJson.scripts = { ...packageJson.scripts, ...productionScripts };
  
  // Add engines
  packageJson.engines = {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  };
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Production configuration created');
}

// Create deployment configurations for different platforms
function createDeploymentConfigs() {
  console.log('📦 Creating deployment configurations...');
  
  // Railway configuration
  const railwayConfig = {
    build: {
      builder: "NIXPACKS"
    },
    deploy: {
      numReplicas: 1,
      sleepingAllowed: true,
      restartPolicyType: "ON_FAILURE"
    }
  };
  
  // Vercel configuration
  const vercelConfig = {
    buildCommand: "npm run build",
    outputDirectory: "dist/public",
    framework: "vite",
    rewrites: [
      { source: "/api/(.*)", destination: "/api/$1" },
      { source: "/(.*)", destination: "/index.html" }
    ],
    functions: {
      "api/**/*.ts": {
        runtime: "nodejs18.x"
      }
    }
  };
  
  // Fly.io configuration
  const flyConfig = `app = "jobflow"

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
  release_command = "npm run db:push"`;

  // Render configuration
  const renderConfig = {
    services: [
      {
        type: "web",
        name: "jobflow",
        env: "node",
        plan: "free",
        buildCommand: "npm run build",
        startCommand: "npm start",
        envVars: [
          { key: "NODE_ENV", value: "production" },
          { key: "DATABASE_URL", fromDatabase: { name: "jobflow-db", property: "connectionString" } },
          { key: "SESSION_SECRET", generateValue: true },
          { key: "SENDGRID_API_KEY", sync: false },
          { key: "OPENAI_API_KEY", sync: false }
        ]
      }
    ],
    databases: [
      { name: "jobflow-db", plan: "free" }
    ]
  };
  
  fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
  fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  fs.writeFileSync('fly.toml', flyConfig);
  fs.writeFileSync('render.yaml', JSON.stringify(renderConfig, null, 2));
  
  console.log('✅ Deployment configurations created');
}

// Create environment template
function createEnvironmentTemplate() {
  console.log('🔧 Creating environment template...');
  
  const envTemplate = `# Production Environment Variables
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
SESSION_SECRET=your-super-secret-session-key
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-production-domain.com

# External Services
SENDGRID_API_KEY=your-sendgrid-api-key
OPENAI_API_KEY=your-openai-api-key

# Application
NODE_ENV=production
PORT=8080
`;
  
  fs.writeFileSync('.env.production', envTemplate);
  console.log('✅ Environment template created');
}

// Create backup/restore utilities
function createBackupUtilities() {
  console.log('💾 Creating backup utilities...');
  
  const backupScript = `#!/usr/bin/env node
const { db } = require('../server/db');
const fs = require('fs');

async function backup() {
  try {
    console.log('📦 Starting backup...');
    
    const users = await db.select().from(users);
    const applications = await db.select().from(jobApplications);
    const emails = await db.select().from(emailTracking);
    const settings = await db.select().from(userSettings);
    const contacts = await db.select().from(contacts);
    const templates = await db.select().from(resumeTemplates);
    
    const backup = {
      users,
      applications,
      emails,
      settings,
      contacts,
      templates,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const filename = \`backup-\${new Date().toISOString().split('T')[0]}.json\`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    
    console.log(\`✅ Backup created: \${filename}\`);
    console.log(\`📊 Records backed up:\`);
    console.log(\`  - Users: \${users.length}\`);
    console.log(\`  - Applications: \${applications.length}\`);
    console.log(\`  - Emails: \${emails.length}\`);
    console.log(\`  - Settings: \${settings.length}\`);
    console.log(\`  - Contacts: \${contacts.length}\`);
    console.log(\`  - Templates: \${templates.length}\`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

backup();
`;
  
  const restoreScript = `#!/usr/bin/env node
const { db } = require('../server/db');
const fs = require('fs');

async function restore(filename) {
  try {
    if (!filename) {
      console.error('❌ Please provide backup filename');
      process.exit(1);
    }
    
    if (!fs.existsSync(filename)) {
      console.error(\`❌ Backup file not found: \${filename}\`);
      process.exit(1);
    }
    
    console.log(\`📦 Starting restore from: \${filename}\`);
    
    const backup = JSON.parse(fs.readFileSync(filename, 'utf8'));
    
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
    
    // Restore emails
    for (const email of backup.emails) {
      await db.insert(emailTracking).values(email).onConflictDoUpdate({
        target: emailTracking.id,
        set: email
      });
    }
    
    // Restore settings
    for (const setting of backup.settings) {
      await db.insert(userSettings).values(setting).onConflictDoUpdate({
        target: userSettings.id,
        set: setting
      });
    }
    
    // Restore contacts
    for (const contact of backup.contacts) {
      await db.insert(contacts).values(contact).onConflictDoUpdate({
        target: contacts.id,
        set: contact
      });
    }
    
    // Restore templates
    for (const template of backup.templates) {
      await db.insert(resumeTemplates).values(template).onConflictDoUpdate({
        target: resumeTemplates.id,
        set: template
      });
    }
    
    console.log('✅ Data restored successfully');
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  }
}

restore(process.argv[2]);
`;
  
  if (!fs.existsSync('scripts')) {
    fs.mkdirSync('scripts', { recursive: true });
  }
  
  fs.writeFileSync('scripts/backup.js', backupScript);
  fs.writeFileSync('scripts/restore.js', restoreScript);
  
  // Make scripts executable
  try {
    execSync('chmod +x scripts/backup.js scripts/restore.js');
  } catch (error) {
    // Ignore on Windows
  }
  
  console.log('✅ Backup utilities created');
}

// Create health check endpoint
function createHealthCheck() {
  console.log('🏥 Creating health check...');
  
  const healthCheckContent = `// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    await db.select().from(users).limit(1);
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});
`;
  
  // Add to server/index.ts if not already present
  const serverPath = 'server/index.ts';
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  if (!serverContent.includes('/health')) {
    const lines = serverContent.split('\n');
    const importIndex = lines.findIndex(line => line.includes('import'));
    lines.splice(importIndex + 1, 0, '// Health check routes added by deployment script');
    lines.splice(importIndex + 2, 0, healthCheckContent);
    fs.writeFileSync(serverPath, lines.join('\n'));
  }
  
  console.log('✅ Health check endpoints added');
}

// Main deployment preparation
function main() {
  try {
    createProductionConfig();
    createDeploymentConfigs();
    createEnvironmentTemplate();
    createBackupUtilities();
    createHealthCheck();
    
    console.log('\n🎉 Deployment preparation complete!');
    console.log('\nNext steps:');
    console.log('1. Choose your deployment platform (Railway, Vercel, Fly.io, or Render)');
    console.log('2. Set up your database (PostgreSQL)');
    console.log('3. Configure environment variables using .env.production as a template');
    console.log('4. Create a backup with: node scripts/backup.js');
    console.log('5. Deploy using your chosen platform');
    console.log('6. Run post-deployment tests');
    console.log('\nRefer to MIGRATION_GUIDE.md for detailed platform-specific instructions.');
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error);
    process.exit(1);
  }
}

main();