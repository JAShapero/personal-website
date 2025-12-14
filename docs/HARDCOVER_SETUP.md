# Hardcover API Setup Guide

This guide walks you through setting up the Hardcover API integration for your books widget.

## Overview

The Hardcover API allows you to display your currently reading books with real-time progress data. The integration uses GraphQL to fetch your reading data.

## Prerequisites

- A Hardcover account (sign up at https://hardcover.app if you don't have one)
- Your Hardcover account should have at least one book marked as "currently reading"

## Step 1: Get Your Hardcover API Token

1. **Log in to Hardcover**
   - Visit: https://hardcover.app
   - Log in with your account credentials

2. **Navigate to API Settings**
   - Go to your account settings
   - Look for the "API" or "Developer" section
   - If you can't find it, try: https://hardcover.app/settings/api

3. **Generate API Token**
   - Click on "Generate API Token" or "Create Token"
   - Copy the generated token immediately (you may not be able to see it again)
   - The token will look something like: `hc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 2: Add Token to Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Navigate to your project: https://vercel.com/dashboard
   - Select your project

2. **Add Environment Variable**
   - Go to: **Settings** → **Environment Variables**
   - Click **"Add New"**
   - **Name**: `HARDCOVER_API_TOKEN`
   - **Value**: Paste your API token from Step 1
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Save"**

## Step 3: Redeploy Your Site

After adding the environment variable, you need to redeploy:

1. **Option A: Automatic Redeploy**
   - Push a new commit to your repository
   - Vercel will automatically redeploy with the new environment variable

2. **Option B: Manual Redeploy**
   - Go to your project's **Deployments** tab
   - Click the **"..."** menu on the latest deployment
   - Select **"Redeploy"**
   - Make sure **"Use existing Build Cache"** is checked (optional)
   - Click **"Redeploy"**

## Step 4: Verify the Integration

1. **Check the Books Widget**
   - Visit your deployed site
   - Look at the Books widget
   - It should display your currently reading books with:
     - Book covers
     - Titles and authors
     - Reading progress (percentage and pages)

2. **Test the API Endpoint**
   - You can test the API directly by visiting: `https://your-site.vercel.app/api/hardcover`
   - You should see a JSON response with your books data

## Troubleshooting

### Widget Shows "No books currently being read"

**Possible causes:**
- You don't have any books marked as "currently reading" in your Hardcover account
- The API token is invalid or expired

**Solutions:**
1. Go to your Hardcover account and mark at least one book as "currently reading"
2. Verify your API token is correct in Vercel environment variables
3. Check that the book has page information (total pages) for progress to display

### Widget Shows Mock Data

**Possible causes:**
- The `HARDCOVER_API_TOKEN` environment variable is not set
- The API token is invalid
- There's an error connecting to the Hardcover API

**Solutions:**
1. Verify `HARDCOVER_API_TOKEN` is set in Vercel environment variables
2. Check that you've redeployed after adding the environment variable
3. Check the browser console for any error messages
4. Test the API endpoint directly: `/api/hardcover`

### API Returns 401 Unauthorized

**Possible causes:**
- Invalid API token
- Token has been revoked or expired

**Solutions:**
1. Generate a new API token from your Hardcover account settings
2. Update the `HARDCOVER_API_TOKEN` in Vercel environment variables
3. Redeploy your site

### Books Don't Show Progress

**Possible causes:**
- The book doesn't have page count information in Hardcover
- The progress_pages field is not set

**Solutions:**
1. Make sure your books in Hardcover have page count information
2. Update your reading progress in Hardcover
3. The widget will still display the book, but without a progress bar if pages are missing

## API Details

The integration uses the following GraphQL query:

```graphql
query {
  me {
    currently_reading {
      book {
        title
        contributions {
          author {
            name
          }
        }
        image
        pages
      }
      progress_pages
    }
  }
}
```

## Additional Resources

- [Hardcover API Documentation](https://docs.hardcover.app/api/getting-started/)
- [Hardcover Website](https://hardcover.app)
- [Vercel Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API token is valid by testing the endpoint directly
3. Make sure your Hardcover account has books marked as "currently reading"
4. Check that books have page information for progress tracking

