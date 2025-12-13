# API Setup Guide

This guide walks you through setting up the various API integrations for your personal website.

## Required: Claude API (Anthropic)

The chat system requires Claude API to function. This is the only required API integration.

### Setup Steps

1. **Get your API Key**
   - Go to https://console.anthropic.com/
   - Sign up or log in
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key (it starts with `sk-ant-...`)

2. **Add to Vercel Environment Variables**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add a new variable:
     - **Name**: `ANTHROPIC_API_KEY`
     - **Value**: Your API key from step 1
     - **Environment**: Production, Preview, and Development (check all)
   - Click "Save"

3. **Redeploy**
   - After adding the environment variable, redeploy your site
   - The chat system will now use Claude API

### Pricing

- Claude API uses a pay-per-use model
- Check current pricing at: https://www.anthropic.com/pricing
- The free tier may have limits, but it's very generous for personal use

---

## Optional: Spotify API (Music Widget)

The Music Widget can display your real listening data from Spotify.

### Setup Steps

1. **Create a Spotify App**
   - Go to https://developer.spotify.com/dashboard
   - Log in with your Spotify account
   - Click "Create an App"
   - Fill in:
     - **App name**: Personal Website
     - **App description**: Personal website music widget
     - **Redirect URI**: `http://localhost:3000` (for local dev)
     - Check "I understand and agree..."
   - Click "Save"

2. **Get Credentials**
   - You'll see your **Client ID** and **Client Secret**
   - Save these for later

3. **Get Access Token** (Simplified Approach)
   - For personal use, you can get a long-lived access token:
   - Go to: https://developer.spotify.com/console/get-current-user-recently-played/
   - Click "Get Token"
   - Select scopes: `user-read-recently-played`, `user-top-read`
   - Click "Request Token"
   - Copy the access token

4. **Add to Environment Variables**
   - In Vercel: Settings → Environment Variables
   - Add:
     - `SPOTIFY_ACCESS_TOKEN`: Your access token

**Note**: For production, consider implementing OAuth flow for better security. For personal use, the access token method works fine.

---

## Optional: Strava API (Biking Widget)

The Biking Widget can display your real bike ride data from Strava.

### Setup Steps

1. **Create a Strava Application**
   - Go to https://www.strava.com/settings/api
   - Log in with your Strava account
   - Click "Create App"
   - Fill in:
     - **Application Name**: Personal Website
     - **Category**: Website
     - **Club**: (optional)
     - **Website**: Your website URL
     - **Application Description**: Personal website biking widget
     - **Authorization Callback Domain**: `localhost` (for local dev)
   - Click "Create"
   - Accept the API Agreement

2. **Get Credentials**
   - You'll see your **Client ID** and **Client Secret**
   - Save these

3. **Get Access Token**
   - Visit: https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
   - Replace `YOUR_CLIENT_ID` with your actual Client ID
   - Authorize the application
   - You'll be redirected to a URL with a `code` parameter
   - Copy that code
   - Use the Strava OAuth token exchange endpoint to get an access token
   - Or use a tool like Postman to exchange the code for a token

4. **Add to Environment Variables**
   - In Vercel: Settings → Environment Variables
   - Add:
     - `STRAVA_ACCESS_TOKEN`: Your access token

**Note**: Strava access tokens expire. You may need to refresh them periodically or implement token refresh logic.

---

## Optional: Hardcover API (Books Widget)

The Books Widget can display your real reading data from Hardcover.

### Setup Steps

1. **Get API Access**
   - Go to https://hardcover.app
   - Sign up or log in
   - Navigate to API settings (check Hardcover documentation for exact location)
   - Generate an API key

2. **Add to Environment Variables**
   - In Vercel: Settings → Environment Variables
   - Add:
     - `HARDCOVER_API_KEY`: Your API key

**Note**: Hardcover API documentation may vary. Check their official docs for the most current setup process.

---

## Local Development

### Running the Vercel Functions Locally

To test the API functions locally before deploying:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link your project**
   ```bash
   vercel link
   ```

4. **Set up environment variables locally**
   - Create a `.env.local` file in your project root
   - Add your environment variables:
     ```
     ANTHROPIC_API_KEY=your_key_here
     ```
   - Or use: `vercel env pull .env.local`

5. **Run development server**
   ```bash
   vercel dev
   ```
   - This will start both your Vite dev server and Vercel functions
   - Your functions will be available at `http://localhost:3000/api/chat`

### Alternative: Mock Mode

If you don't want to set up APIs during development, the widgets will fall back to mock data automatically. The chat system will show an error message if Claude API is not configured, but you can still test the UI.

---

## Troubleshooting

### Chat API Returns Error

- **Check**: Is `ANTHROPIC_API_KEY` set in Vercel environment variables?
- **Check**: Did you redeploy after adding the environment variable?
- **Check**: Is your API key valid? Test it at https://console.anthropic.com/

### Functions Not Working Locally

- **Check**: Are you running `vercel dev` (not just `npm run dev`)?
- **Check**: Do you have a `.env.local` file with your API keys?
- **Check**: Are you calling the API at `http://localhost:3000/api/chat`?

### Widgets Show Mock Data

- This is expected if you haven't configured the APIs
- Widgets are designed to work with mock data by default
- Check the widget code comments for setup instructions

---

## Security Notes

- **Never commit API keys to git**
- Always use environment variables
- The `.env.example` file is safe to commit (it has placeholder values)
- Rotate your API keys if they're accidentally exposed
- Use different keys for development and production if possible

---

## Cost Considerations

- **Claude API**: Pay-per-use, very reasonable for personal sites
- **Spotify API**: Free for personal use
- **Strava API**: Free for personal use
- **Hardcover API**: Check their pricing (usually free for personal use)

Most personal websites will stay well within free tiers for all APIs.

