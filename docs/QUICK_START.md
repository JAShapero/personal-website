# Quick Start Guide

## ✅ What's Been Set Up

The Vercel serverless function integration for Claude API has been implemented! Here's what's ready:

1. **Vercel Serverless Function** (`api/chat.ts`)
   - Handles Claude API calls securely
   - Implements tool system for all widgets
   - Reads data files (about-me.md, photos.md, snowboarding.csv)

2. **Updated ChatPanel**
   - Now calls the real API instead of mock responses
   - Falls back gracefully if API isn't configured
   - Maintains conversation history

3. **Dependencies Installed**
   - `@anthropic-ai/sdk` - Anthropic's official SDK
   - `@vercel/node` - Vercel serverless function types

4. **Documentation**
   - API setup guide (`docs/API_SETUP.md`)
   - Updated README with deployment instructions

## 🚀 Next Steps

### 1. Get Your Claude API Key (Required)

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

### 2. Deploy to Vercel

**Option A: First Time Setup**
1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will auto-detect settings

**Option B: Using Vercel CLI**
```bash
npm install -g vercel
vercel
```

### 3. Add Environment Variable

1. In Vercel dashboard, go to your project
2. Settings → Environment Variables
3. Add:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your API key from step 1
   - **Environment**: Check all (Production, Preview, Development)
4. Click "Save"

### 4. Redeploy

After adding the environment variable:
- Go to Deployments tab
- Click the "..." menu on the latest deployment
- Click "Redeploy"

Or just push a new commit to trigger auto-deployment.

### 5. Test It!

1. Visit your deployed site
2. Click on any widget
3. Start chatting - it should use Claude API now!

## 🧪 Local Development

To test locally with full API functionality:

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run with functions
vercel dev
```

This will:
- Start your Vite frontend
- Start Vercel serverless functions
- Make API available at `http://localhost:3000/api/chat`

## 📝 Optional: Set Up Other APIs

The chat system works with just Claude API, but you can enhance widgets:

- **Spotify API** - For real music data in Music Widget
- **Strava API** - For real bike ride data in Biking Widget  
- **Hardcover API** - For real reading data in Books Widget

See `docs/API_SETUP.md` for detailed instructions.

## ❓ Troubleshooting

### Chat says "ANTHROPIC_API_KEY not configured"
- Did you add the environment variable in Vercel?
- Did you redeploy after adding it?
- Is the key correct? (should start with `sk-ant-`)

### Functions not working locally
- Are you running `vercel dev` (not just `npm run dev`)?
- Do you have `.env.local` file with `ANTHROPIC_API_KEY`?

### Still seeing mock responses
- Check browser console for errors
- Verify the API endpoint is being called (`/api/chat`)
- Check Vercel function logs in dashboard

## 🎉 You're All Set!

Once deployed with the API key, your chat system will:
- Use Claude AI for intelligent responses
- Access data from your markdown/CSV files
- Switch context based on active widget
- Provide accurate information about you!

Need help? Check `docs/API_SETUP.md` for more details.


