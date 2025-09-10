# JobSpark AI - Digital Ocean Deployment Guide

## Prerequisites

1. **Digital Ocean Droplet** with Node.js and Python installed
2. **GitHub Repository** with the latest code
3. **Environment Variables** set up on Digital Ocean

## Environment Variables Required

Create a `.env.local` file with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ettmusfpujpwdnajqqku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Payment Integration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Base URL for production
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Python Environment
PYTHON_PATH=python3

# OpenAI API Key (for CV analysis)
OPENAI_API_KEY=your_openai_api_key
```

## Deployment Steps

### 1. Clone Repository
```bash
git clone https://github.com/your-username/jobspark-app.git
cd jobspark-app
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Install Python Dependencies
```bash
cd python
pip3 install -r requirements.txt
cd ..
```

### 4. Set Environment Variables
```bash
# Copy and edit environment file
cp .env.example .env.local
# Edit .env.local with your actual values
nano .env.local
```

### 5. Build Application
```bash
npm run build
```

### 6. Start Production Server
```bash
npm start
```

## Database Setup

The database tables should already exist in your Supabase instance. If not, run:

```sql
-- Execute the contents of supabase-schema.sql in your Supabase SQL editor
```

## Key Features Working

✅ **Homepage Upload Flow** - Anonymous users can upload CVs
✅ **Dashboard Management** - Authenticated users can manage multiple CVs
✅ **Analysis Persistence** - Results saved to database and reloadable
✅ **File Processing** - Python-based CV parsing and analysis
✅ **Payment Integration** - Stripe checkout for premium features

## Troubleshooting

### Python Path Issues
If CV analysis fails, check Python path:
```bash
which python3
# Update PYTHON_PATH in .env.local if needed
```

### Database Connection Issues
- Verify Supabase credentials
- Check that SUPABASE_SERVICE_ROLE_KEY is set (required for anonymous sessions)
- Ensure tables exist by running supabase-schema.sql

### File Upload Issues
- Ensure `public/uploads/cvs/` directory exists and is writable
- Check disk space on server

## Port Configuration

The app runs on port 3000 by default. To change:
```bash
PORT=8080 npm start
```

## SSL/HTTPS

For production, use a reverse proxy like Nginx to handle SSL:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```