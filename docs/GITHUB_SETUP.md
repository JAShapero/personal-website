# GitHub Setup Guide

Follow these steps to push your code to GitHub and connect it to Vercel.

## Step 1: Create a New Repository on GitHub

1. Go to https://github.com/new
2. Log in to your GitHub account (or create one if needed)
3. Fill in the repository details:
   - **Repository name**: `personal-website` (or any name you prefer)
   - **Description**: "Personal website with interactive widgets and AI chat"
   - **Visibility**: Choose **Private** (recommended) or **Public**
   - **DO NOT** check "Initialize this repository with a README" (you already have one)
4. Click **"Create repository"**

## Step 2: Push Your Code to GitHub

After creating the repository, GitHub will show you instructions. Use these commands:

```bash
# Add the GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/personal-website.git

# Rename your branch to 'main' if it's not already (most repos use 'main')
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## Step 3: Verify

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/personal-website`
2. You should see all your files there!

## Next: Connect to Vercel

Once your code is on GitHub, follow the Vercel setup steps in `docs/QUICK_START.md`.

