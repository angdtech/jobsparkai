# JobSpark AI Setup Guide

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **GitHub Account**: Access to the angdtech GitHub account
3. **Node.js**: Version 18 or higher

## Supabase Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com) and create a new project
- Note down your project URL and anon key

### 2. Run Database Schema
Execute the SQL in `supabase-schema.sql` in your Supabase SQL Editor:
- Go to your Supabase dashboard
- Navigate to "SQL Editor"
- Copy and paste the contents of `supabase-schema.sql`
- Click "Run"

### 3. Configure Authentication
- In Supabase dashboard, go to "Authentication" > "Settings"
- Configure your authentication providers (Email/Password is enabled by default)
- Set up email templates if needed

## Environment Configuration

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## GitHub Integration Setup

### 1. Create GitHub Personal Access Token
- Go to GitHub Settings > Developer settings > Personal access tokens
- Create a new token with repository permissions
- Add it to your `.env.local`:

```env
NEXT_PUBLIC_GITHUB_TOKEN=your-github-personal-access-token
GITHUB_OWNER=angdtech
GITHUB_REPO=your-repository-name
```

### 2. Repository Setup
- Create a repository under the angdtech account
- Update the repository name in your environment variables

## Installation and Running

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Tables Created

The schema creates the following tables:

### `profiles`
- Extends auth.users with additional profile information
- Automatically created when users sign up
- Fields: id, email, full_name, avatar_url, created_at, updated_at

### `user_sessions`
- Tracks active user sessions
- Fields: id, user_id, session_token, created_at, expires_at, ip_address, user_agent

## Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Automatic profile creation on user signup
- Secure GitHub token handling

## API Integration

The GitHub integration allows you to:
- Push updates to the angdtech repository
- Create commits programmatically
- Track deployment status

## Testing Authentication

1. Navigate to your local site
2. Click "Sign Up" to create a new account
3. Check your email for verification (if email confirmation is enabled)
4. Sign in with your credentials
5. Test the GitHub integration button

## Production Deployment

1. Deploy to your preferred platform (Vercel, Netlify, etc.)
2. Add environment variables to your deployment platform
3. Update Supabase auth settings with your production domain
4. Test all functionality in production

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your Supabase configuration
3. Ensure your GitHub token has the correct permissions
4. Check that your environment variables are properly set