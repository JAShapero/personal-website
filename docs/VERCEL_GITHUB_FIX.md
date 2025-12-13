# Fix Vercel GitHub Integration

If Vercel isn't detecting new commits, the GitHub webhook isn't set up correctly.

## Steps to Fix:

1. **In Vercel Dashboard:**
   - Go to your project
   - Settings → Git
   - If you see "Disconnect" button, click it
   - Click "Connect Git Repository" or "Configure Git"

2. **Connect Your Repository:**
   - Select GitHub
   - Authorize Vercel if prompted
   - Find and select: `JAShapero/personal-website`
   - Click "Import"

3. **Verify Webhook Created:**
   - After connecting, go to GitHub
   - Go to your repo: https://github.com/JAShapero/personal-website
   - Settings → Webhooks
   - You should see a Vercel webhook listed
   - If you don't see it, the integration isn't working properly

4. **Alternative: Create Webhook Manually (if needed):**
   - In GitHub repo: Settings → Webhooks → "Add webhook"
   - Payload URL: `https://api.vercel.com/v1/integrations/deploy/hook/[your-hook-url]`
   - Content type: `application/json`
   - Which events: "Just the push event"
   - Active: checked
   - Click "Add webhook"

   **Note:** You'll need to get the hook URL from Vercel first.

## After Fixing:

- Push a new commit to trigger auto-deploy
- Vercel should automatically detect new commits
- Check Deployments tab to verify it's using latest commits

