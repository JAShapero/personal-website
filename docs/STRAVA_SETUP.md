# Strava API Setup Guide

This guide walks you through setting up Strava API credentials for the Biking Widget.

## Step 1: Create a Strava Application

1. **Go to Strava API Settings**
   - Visit: https://www.strava.com/settings/api
   - Log in with your Strava account

2. **Create a New Application**
   - Click the **"Create App"** button (or "Create Your App" link)
   - Fill in the application details:
     - **Application Name**: `Personal Website` (or any name you prefer)
     - **Category**: Select `Website`
     - **Club**: Leave blank (optional)
     - **Website**: Your website URL (e.g., `https://yourname.vercel.app`)
     - **Application Description**: `Personal website biking widget`
     - **Authorization Callback Domain**: `localhost` (for local development)
   - Check the box to accept the API Agreement
   - Click **"Create"**

3. **Save Your Credentials**
   - After creating the app, you'll see:
     - **Client ID**: A number (e.g., `12345`)
     - **Client Secret**: A long string (e.g., `abc123def456...`)
   - **Important**: Copy both of these and save them securely - you'll need them in the next steps

## Step 2: Get Authorization Code

1. **Build the Authorization URL**
   - Replace `YOUR_CLIENT_ID` in this URL with your actual Client ID:
   ```
   https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
   ```

2. **Authorize Your Application**
   - Open the URL in your browser
   - You'll be asked to authorize your application
   - Click **"Authorize"**
   - You'll be redirected to a URL that looks like:
     ```
     http://localhost/?code=abc123def456...&scope=read,activity:read_all
     ```

3. **Copy the Authorization Code**
   - From the redirect URL, copy the `code` parameter value
   - It's the long string after `code=` and before `&scope`
   - Example: If the URL is `http://localhost/?code=abc123def456&scope=...`, then `abc123def456` is your code

## Step 3: Exchange Code for Tokens

You need to exchange the authorization code for an access token and refresh token. Here are two methods:

### Method 1: Using cURL (Terminal/Command Line)

Run this command in your terminal, replacing the placeholders:

```bash
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d code=YOUR_AUTHORIZATION_CODE \
  -d grant_type=authorization_code
```

**Example:**
```bash
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=12345 \
  -d client_secret=abc123def456... \
  -d code=xyz789ghi012... \
  -d grant_type=authorization_code
```

**Response:**
You'll get a JSON response like this:
```json
{
  "token_type": "Bearer",
  "expires_at": 1234567890,
  "expires_in": 21600,
  "refresh_token": "refresh_token_here...",
  "access_token": "access_token_here...",
  "athlete": { ... }
}
```

**Save these values:**
- `access_token`: Your access token (expires in 6 hours)
- `refresh_token`: Your refresh token (doesn't expire, use this to get new access tokens)

### Method 2: Using Postman or Similar Tool

1. **Create a POST Request**
   - URL: `https://www.strava.com/oauth/token`
   - Method: `POST`

2. **Set Body Parameters** (x-www-form-urlencoded):
   - `client_id`: Your Client ID
   - `client_secret`: Your Client Secret
   - `code`: Your authorization code
   - `grant_type`: `authorization_code`

3. **Send the Request**
   - You'll receive the same JSON response as above
   - Save the `access_token` and `refresh_token`

## Step 4: Add to Vercel Environment Variables

1. **Go to Your Vercel Project**
   - Navigate to your project dashboard on Vercel
   - Go to **Settings** → **Environment Variables**

2. **Add Environment Variables**

   **Option A: Using Refresh Token (Recommended)**
   
   This allows automatic token refresh. Add these three variables:
   
   - **Name**: `STRAVA_CLIENT_ID`
     - **Value**: Your Client ID (the number)
     - **Environment**: Production, Preview, Development (check all)
   
   - **Name**: `STRAVA_CLIENT_SECRET`
     - **Value**: Your Client Secret (the long string)
     - **Environment**: Production, Preview, Development (check all)
   
   - **Name**: `STRAVA_REFRESH_TOKEN`
     - **Value**: Your refresh token from Step 3
     - **Environment**: Production, Preview, Development (check all)

   **Option B: Using Access Token Only (Simple but Expires)**
   
   This is simpler but tokens expire after 6 hours:
   
   - **Name**: `STRAVA_ACCESS_TOKEN`
     - **Value**: Your access token from Step 3
     - **Environment**: Production, Preview, Development (check all)
     - **Note**: You'll need to update this every 6 hours

3. **Save and Redeploy**
   - Click **"Save"** after adding each variable
   - Go to **Deployments** and redeploy your site (or push a new commit)
   - The widget will now use live Strava data!

## Step 5: Test It Out

1. **Check Your Widget**
   - Visit your website
   - The Biking Widget should now show your latest ride from Strava
   - If it still shows mock data, check:
     - Did you redeploy after adding environment variables?
     - Are the environment variable names exactly correct?
     - Check the browser console for any errors

2. **Verify API is Working**
   - You can test the API endpoint directly:
     - Visit: `https://your-site.vercel.app/api/strava?type=latest`
     - You should see JSON with your latest bike activity

## Troubleshooting

### "Strava not configured" Error
- Check that environment variables are set correctly in Vercel
- Make sure you redeployed after adding variables
- Verify variable names match exactly (case-sensitive)

### "Unauthorized" Error
- Your access token may have expired (if using Option B)
- Use the refresh token method (Option A) instead
- Or get a new access token by repeating Step 2-3

### "No bike activities found"
- Make sure you have at least one bike ride in your Strava account
- The API only returns activities of type "Ride"
- Try going for a bike ride and recording it in Strava first!

### Token Expired
- Access tokens expire after 6 hours
- If using refresh tokens (Option A), the API will automatically refresh
- If using only access token (Option B), you'll need to get a new one every 6 hours

## Security Notes

- **Never commit your tokens to git**
- Keep your Client Secret private
- Refresh tokens don't expire, but you can revoke them in Strava settings
- If a token is exposed, revoke it immediately and generate a new one

## Revoking Access

If you need to revoke access:
1. Go to https://www.strava.com/settings/apps
2. Find your application
3. Click "Revoke Access"
4. You'll need to go through the authorization process again to get new tokens

---

## Quick Reference

**Strava API Settings**: https://www.strava.com/settings/api

**Authorization URL Template**:
```
https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
```

**Token Exchange Endpoint**: `https://www.strava.com/oauth/token`

**Required Scopes**: `activity:read_all` (to read your activity data)

