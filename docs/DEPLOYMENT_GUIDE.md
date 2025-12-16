# Complete Deployment Guide

This guide walks you through getting your personal website hosted publicly with a custom domain.

## Overview

Your website is already configured for Vercel deployment. Here's what we'll cover:
1. **Getting a Domain** - Where to buy and what to look for
2. **Deploying to Vercel** - Getting your code live
3. **Connecting Your Domain** - Linking your domain to Vercel
4. **Setting Up Environment Variables** - Configuring your APIs
5. **Final Verification** - Making sure everything works

---

## Step 1: Get a Domain Name

### Option A: Popular Domain Registrars (Recommended)

**Best Options:**
- **Namecheap** (https://www.namecheap.com/) - Great prices, easy to use
- **Google Domains** (https://domains.google/) - Simple interface, good integration
- **Cloudflare Registrar** (https://www.cloudflare.com/products/registrar/) - At-cost pricing, excellent DNS
- **Porkbun** (https://porkbun.com/) - Competitive prices, good service

**What to Look For:**
- **Price**: Usually $10-15/year for `.com` domains
- **Privacy Protection**: Free WHOIS privacy is a plus
- **DNS Management**: Easy DNS settings (you'll need this)
- **Transfer Policy**: Easy to transfer if needed later

### Option B: Vercel Domain (Simplest)

Vercel offers domain registration directly:
- Go to your Vercel dashboard → Domains
- Search for available domains
- Purchase directly through Vercel
- Automatically configured - no DNS setup needed!

**Note**: Vercel domains are slightly more expensive but much easier to set up.

### Domain Name Tips

- Keep it short and memorable
- Use `.com` if possible (most trusted)
- Consider `.dev`, `.io`, or `.app` for tech projects
- Check availability before settling on a name

---

## Step 2: Deploy to Vercel

### Prerequisites

1. **GitHub Account** - Your code needs to be on GitHub
2. **Vercel Account** - Sign up at https://vercel.com (free tier is perfect)

### Deployment Steps

#### 2.1 Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

#### 2.2 Import Project to Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Sign up or log in (you can use GitHub to sign in)

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Vercel should auto-detect "Vite"
   - **Root Directory**: Leave as `./` (default)
   - **Build Command**: Should be `npm run build` (auto-detected)
   - **Output Directory**: Should be `dist` (auto-detected)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables** (Important!)
   - Before deploying, add your environment variables:
   - Click "Environment Variables"
   - Add the following (at minimum):
     ```
     ANTHROPIC_API_KEY=your_claude_api_key_here
     ```
   - **Select environments**: Production, Preview, Development (check all)
   - Click "Save"

   **See [API_SETUP.md](./API_SETUP.md) for detailed API setup instructions**

5. **Deploy!**
   - Click "Deploy"
   - Wait 1-2 minutes for the build to complete
   - Your site will be live at: `https://your-project-name.vercel.app`

### Verify Deployment

- Visit your Vercel URL
- Check that the site loads correctly
- Test the chat functionality (if you added the API key)
- Check the browser console for any errors

---

## Step 3: Connect Your Custom Domain

### Option A: Domain from Vercel (Easiest)

If you bought your domain through Vercel:
1. Go to your project → Settings → Domains
2. Your domain should already be listed
3. Click "Add" if not already added
4. That's it! DNS is automatically configured.

### Option B: External Domain (Most Common)

If you bought your domain elsewhere (Namecheap, Google, etc.):

#### 3.1 Add Domain in Vercel

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Click "Add Domain"
   - Enter your domain (e.g., `yourname.com` or `www.yourname.com`)
   - Click "Add"

2. **Vercel will show you DNS records to add:**
   - You'll see something like:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

#### 3.2 Configure DNS at Your Registrar

**For Namecheap:**
1. Log in to Namecheap
2. Go to "Domain List" → Click "Manage" next to your domain
3. Go to "Advanced DNS" tab
4. Add the DNS records Vercel provided:
   - Click "Add New Record"
   - Select record type (A or CNAME)
   - Enter the values from Vercel
   - Save

**For Google Domains:**
1. Go to https://domains.google
2. Click on your domain
3. Go to "DNS" section
4. Add the records Vercel provided

**For Cloudflare:**
1. Add your domain to Cloudflare
2. Update nameservers at your registrar to Cloudflare's
3. In Cloudflare DNS, add the records Vercel provided

**For Other Registrars:**
- Look for "DNS Settings", "DNS Management", or "Advanced DNS"
- Add the A and CNAME records Vercel provided

#### 3.3 Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours
- Usually takes 10-30 minutes
- Vercel will show "Valid Configuration" when ready
- You can check status at: https://www.whatsmydns.net

#### 3.4 Verify Domain Connection

1. **In Vercel:**
   - Go to Settings → Domains
   - You should see a green checkmark when configured correctly

2. **Test Your Site:**
   - Visit `http://yourdomain.com` (should redirect to HTTPS)
   - Visit `https://yourdomain.com` (should load your site)
   - Visit `https://www.yourdomain.com` (should also work)

---

## Step 4: Set Up SSL/HTTPS

**Good News**: Vercel automatically provides free SSL certificates!

- Once your domain is connected, Vercel automatically issues an SSL certificate
- This usually takes 1-5 minutes after DNS is configured
- Your site will automatically redirect HTTP → HTTPS
- No additional configuration needed!

**Verify SSL:**
- Visit your site - you should see a padlock icon in the browser
- The URL should start with `https://`

---

## Step 5: Configure Environment Variables

Your site needs API keys to function properly. Add them in Vercel:

1. **Go to Vercel Dashboard**
   - Your project → Settings → Environment Variables

2. **Required Variables:**
   ```
   ANTHROPIC_API_KEY=sk-ant-... (Required for chat)
   ```

3. **Optional Variables:**
   ```
   SPOTIFY_ACCESS_TOKEN=... (For music widget)
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   SPOTIFY_REFRESH_TOKEN=...
   
   STRAVA_CLIENT_ID=... (For biking widget)
   STRAVA_CLIENT_SECRET=...
   STRAVA_REFRESH_TOKEN=...
   
   HARDCOVER_API_KEY=... (For books widget)
   ```

4. **After Adding Variables:**
   - Click "Save"
   - **Redeploy your project** (Deployments → ... → Redeploy)
   - This ensures the new environment variables are available

**📖 See [API_SETUP.md](./API_SETUP.md) for detailed setup instructions for each API**

---

## Step 6: Final Verification Checklist

Run through this checklist to ensure everything is working:

- [ ] Site loads at your custom domain
- [ ] HTTPS is working (padlock icon in browser)
- [ ] Both `yourdomain.com` and `www.yourdomain.com` work
- [ ] Chat system works (if you added Claude API key)
- [ ] Widgets load correctly
- [ ] No console errors in browser DevTools
- [ ] Mobile view looks good
- [ ] All API integrations work (if configured)

---

## Troubleshooting

### Domain Not Connecting

**Problem**: Domain shows "Invalid Configuration" in Vercel

**Solutions:**
- Double-check DNS records match exactly what Vercel provided
- Wait longer (DNS can take up to 48 hours)
- Verify you're editing DNS at your registrar (not Vercel)
- Check for typos in DNS records
- Try using Vercel's nameservers instead (see below)

### Using Vercel Nameservers (Alternative)

If DNS records aren't working, you can use Vercel's nameservers:

1. In Vercel: Settings → Domains → Your domain
2. Click "Nameservers" tab
3. Copy the nameservers (e.g., `ns1.vercel-dns.com`)
4. At your registrar, change nameservers to Vercel's
5. Wait for propagation (can take up to 48 hours)

### Site Not Loading

**Problem**: Site loads but shows errors

**Solutions:**
- Check browser console for errors
- Verify environment variables are set correctly
- Check Vercel deployment logs (Deployments → Click deployment → View Function Logs)
- Ensure API keys are valid
- Try redeploying

### SSL Certificate Issues

**Problem**: SSL certificate not issued

**Solutions:**
- Wait longer (can take up to 24 hours)
- Ensure DNS is correctly configured
- Check that both `@` and `www` records are set
- Contact Vercel support if still not working after 24 hours

### API Functions Not Working

**Problem**: Chat or other API features don't work

**Solutions:**
- Verify environment variables are set in Vercel
- Check that variables are enabled for "Production" environment
- Redeploy after adding environment variables
- Check Vercel function logs for errors
- Verify API keys are valid and not expired

---

## Cost Breakdown

### Free Tier (Perfect for Personal Sites)

**Vercel:**
- Free hosting
- Free SSL certificates
- Free custom domains
- 100GB bandwidth/month
- Serverless functions included

**Domain:**
- $10-15/year for `.com`
- $5-10/year for other TLDs

**APIs:**
- Claude API: Pay-per-use (very cheap for personal use)
- Spotify: Free
- Strava: Free
- Hardcover: Usually free

**Total**: ~$10-15/year (just the domain!)

---

## Next Steps

Once your site is live:

1. **Share it!** - Your site is now publicly accessible
2. **Monitor Usage** - Check Vercel dashboard for traffic
3. **Set Up Analytics** (Optional) - Add Google Analytics or Vercel Analytics
4. **Customize** - Continue improving your widgets and content
5. **Backup** - Your code is on GitHub, but consider backing up data files

---

## Quick Reference

**Vercel Dashboard**: https://vercel.com/dashboard
**Domain Settings**: Project → Settings → Domains
**Environment Variables**: Project → Settings → Environment Variables
**Deployment Logs**: Project → Deployments → Click deployment

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Check your deployment logs for specific errors

---

Last updated: Complete deployment guide


