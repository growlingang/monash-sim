# Vercel Deployment Guide

This document explains how to deploy the Monash Sim project to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier works)
2. A GitHub repository with this project pushed to it
3. Node.js installed locally (for testing)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure (if needed)**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your project
   - You'll get a URL like `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # From project root
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? (select your account)
   - Link to existing project? **N**
   - What's your project's name? (default is fine)
   - In which directory is your code? **.**
   - Auto-detected Project Settings (Vite): **Y**

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## Project Configuration

The project includes:

- ✅ `vercel.json` - Vercel configuration with SPA routing
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ Build script in `package.json`
- ✅ TypeScript compilation configured

## Environment Variables

This project doesn't currently use environment variables. If you need to add them later:

1. In Vercel Dashboard → Project Settings → Environment Variables
2. Add your variables (e.g., `VITE_API_KEY`)
3. Redeploy

## Troubleshooting

### Build Fails

- Check that `npm run build` works locally
- Review build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`

### 404 on Routes

- Ensure `vercel.json` has the rewrite rule for SPA routing
- This is already configured in the provided `vercel.json`

### Assets Not Loading

- Check that asset paths start with `/` (absolute paths)
- Example: `/sprites/player.png` not `./sprites/player.png`

### Large Bundle Size

Current build includes large background images (~10MB total). Consider:
- Using WebP format
- Lazy loading images
- CDN hosting for assets

## Post-Deployment

1. **Custom Domain** (optional)
   - Go to Project Settings → Domains
   - Add your custom domain

2. **Preview Deployments**
   - Every git push creates a preview deployment
   - Perfect for testing before production

3. **Monitoring**
   - View analytics in Vercel dashboard
   - Monitor performance and errors

## Automatic Deployments

Once connected to GitHub:
- **Production**: Pushes to `main` branch deploy to production
- **Preview**: Pushes to other branches create preview deployments
- **Pull Requests**: Get automatic preview deployments

## Local Testing Before Deploy

Always test the production build locally:

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

Then visit `http://localhost:4173` to test.

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
