# Spotify Token Setup Guide

This guide walks you through getting a Spotify access token or refresh token for your music widget.

## Option 1: Quick Setup (Access Token Only) ⚡

**Best for:** Quick testing, expires in 1 hour

### Steps:

1. **Go to Spotify Web Console**
   - Visit: https://developer.spotify.com/console/get-current-user-recently-played/
   - You'll see a page with a "Get Token" button

2. **Click "Get Token"**
   - A popup will appear asking you to select scopes

3. **Select Required Scopes**
   - Check these boxes:
     - ✅ `user-read-recently-played`
     - ✅ `user-top-read`
     - ✅ `user-read-currently-playing` (optional but useful)

4. **Click "Request Token"**
   - You'll be redirected to Spotify to authorize the app
   - Click "Agree" to authorize

5. **Copy Your Access Token**
   - After authorization, you'll be redirected back
   - You'll see a long token that starts with something like `BQC...`
   - **Copy this entire token** - it's your access token

6. **Add to Vercel Environment Variables**
   - Go to your Vercel project dashboard
   - Navigate to: Settings → Environment Variables
   - Click "Add New"
   - **Name**: `SPOTIFY_ACCESS_TOKEN`
   - **Value**: Paste your access token
   - **Environment**: Select all (Production, Preview, Development)
   - Click "Save"

7. **Redeploy Your Site**
   - The token will work for 1 hour
   - After it expires, you'll need to repeat these steps

---

## Option 2: OAuth Setup (Refresh Token) 🔄 **RECOMMENDED**

**Best for:** Long-term use, automatic token renewal

### Step 1: Get Authorization Code

1. **Build Your Authorization URL**
   - Replace `YOUR_CLIENT_ID` with your actual Client ID from Spotify dashboard
   - Your URL should look like:
     ```
     https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://127.0.0.1:3000&scope=user-read-recently-played%20user-top-read&show_dialog=true
     ```

2. **Open the URL in Your Browser**
   - Paste the complete URL into your browser's address bar
   - Press Enter

3. **Authorize the App**
   - You'll see Spotify's authorization page
   - Click "Agree" to authorize your app

4. **Copy the Authorization Code**
   - After clicking "Agree", you'll be redirected to:
     ```
     http://127.0.0.1:3000/?code=YOUR_AUTHORIZATION_CODE&state=...
     ```
   - **Copy the `code` value** from the URL (the part after `code=`)
   - It will look something like: `AQBx...` or `AQCx...`
   - **Important**: The code expires in 10 minutes, so work quickly!

### Step 2: Exchange Code for Tokens

You need to exchange the authorization code for an access token and refresh token.

#### Method A: Using curl (Terminal)

1. **Open Terminal** (or Command Prompt on Windows)

2. **Create Base64 Encoded Credentials**
   - You need to encode `CLIENT_ID:CLIENT_SECRET` in Base64
   - Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with your actual values
   
   **On Mac/Linux:**
   ```bash
   echo -n "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" | base64
   ```
   
   **On Windows (PowerShell):**
   ```powershell
   [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("YOUR_CLIENT_ID:YOUR_CLIENT_SECRET"))
   ```
   
   - Copy the output (it will be a long string)

3. **Run the Token Exchange Command**
   - Replace these values:
     - `BASE64_ENCODED_CREDENTIALS` - The output from step 2
     - `YOUR_AUTHORIZATION_CODE` - The code you copied from the redirect URL
   
   ```bash
   curl -X POST "https://accounts.spotify.com/api/token" \
        -H "Authorization: Basic BASE64_ENCODED_CREDENTIALS" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=authorization_code" \
        -d "code=YOUR_AUTHORIZATION_CODE" \
        -d "redirect_uri=http://127.0.0.1:3000"
   ```

4. **Save the Response**
   - You'll get a JSON response like:
     ```json
     {
       "access_token": "BQC...",
       "token_type": "Bearer",
       "expires_in": 3600,
       "refresh_token": "AQC...",
       "scope": "user-read-recently-played user-top-read"
     }
     ```
   - **Save both tokens!**

#### Method B: Using Postman or Similar Tool

1. **Create a POST Request**
   - URL: `https://accounts.spotify.com/api/token`
   - Method: `POST`

2. **Set Headers**
   - `Authorization`: `Basic BASE64_ENCODED_CREDENTIALS`
     - (Use the Base64 encoded credentials from Method A, step 2)
   - `Content-Type`: `application/x-www-form-urlencoded`

3. **Set Body (x-www-form-urlencoded)**
   - `grant_type`: `authorization_code`
   - `code`: `YOUR_AUTHORIZATION_CODE` (from Step 1)
   - `redirect_uri`: `http://127.0.0.1:3000`

4. **Send Request**
   - You'll get the same JSON response with both tokens

#### Method C: Using a Simple HTML Page (Easiest!)

1. **Create a file called `spotify-token.html`** with this content:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Spotify Token Exchange</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        input, textarea { width: 100%; padding: 10px; margin: 10px 0; }
        button { padding: 10px 20px; background: #1DB954; color: white; border: none; cursor: pointer; }
        button:hover { background: #1ed760; }
        #result { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Spotify Token Exchange</h1>
    <input type="text" id="clientId" placeholder="Client ID" />
    <input type="text" id="clientSecret" placeholder="Client Secret" />
    <input type="text" id="authCode" placeholder="Authorization Code (from redirect URL)" />
    <button onclick="exchangeToken()">Get Tokens</button>
    <div id="result"></div>

    <script>
        async function exchangeToken() {
            const clientId = document.getElementById('clientId').value;
            const clientSecret = document.getElementById('clientSecret').value;
            const authCode = document.getElementById('authCode').value;
            const resultDiv = document.getElementById('result');

            if (!clientId || !clientSecret || !authCode) {
                resultDiv.innerHTML = '<p style="color: red;">Please fill in all fields</p>';
                return;
            }

            // Create Base64 encoded credentials
            const credentials = btoa(`${clientId}:${clientSecret}`);

            try {
                const response = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        code: authCode,
                        redirect_uri: 'http://127.0.0.1:3000'
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    resultDiv.innerHTML = `
                        <h3>✅ Success! Copy these values:</h3>
                        <p><strong>Access Token:</strong><br>
                        <textarea readonly style="height: 60px;">${data.access_token}</textarea></p>
                        <p><strong>Refresh Token:</strong><br>
                        <textarea readonly style="height: 60px;">${data.refresh_token}</textarea></p>
                    `;
                } else {
                    resultDiv.innerHTML = `<p style="color: red;">Error: ${data.error_description || data.error}</p>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        }
    </script>
</body>
</html>
```

2. **Open the HTML file in your browser**
3. **Fill in the form** with your Client ID, Client Secret, and Authorization Code
4. **Click "Get Tokens"**
5. **Copy both tokens** from the result

### Step 3: Add Tokens to Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to: Settings → Environment Variables

2. **Add Environment Variables**
   - Click "Add New" for each:
   
   **Variable 1:**
   - **Name**: `SPOTIFY_CLIENT_ID`
   - **Value**: Your Client ID
   - **Environment**: All
   
   **Variable 2:**
   - **Name**: `SPOTIFY_CLIENT_SECRET`
   - **Value**: Your Client Secret
   - **Environment**: All
   
   **Variable 3:**
   - **Name**: `SPOTIFY_REFRESH_TOKEN`
   - **Value**: Your refresh token (from Step 2)
   - **Environment**: All

3. **Save and Redeploy**
   - Click "Save" for each variable
   - Redeploy your site
   - The refresh token will automatically renew your access token when it expires!

---

## Which Option Should You Choose?

- **Option 1 (Quick)**: Use if you just want to test quickly. Token expires in 1 hour.
- **Option 2 (OAuth)**: Use for production. Tokens automatically refresh, so you never need to update them manually.

## Troubleshooting

### "Invalid redirect URI" error
- Make sure the redirect URI in your authorization URL matches exactly what you added in Spotify dashboard
- Use `http://127.0.0.1:3000` (not `localhost`)

### "Invalid authorization code" error
- Authorization codes expire in 10 minutes
- Make sure you're using the code from the most recent authorization
- The code can only be used once

### "Invalid client" error
- Double-check your Client ID and Client Secret
- Make sure there are no extra spaces when copying

### Token exchange returns 400 error
- Verify your Base64 encoding is correct
- Make sure the redirect_uri matches exactly (including `http://` not `https://` for local)

