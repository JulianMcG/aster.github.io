# Quick Deployment Guide

## GitHub Setup

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Create a new repository (public or private)
   - Don't initialize with README (you already have one)

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Vercel Deployment

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. **Add Environment Variable**:
   - Key: `VITE_API_KEY` (or `API_KEY`)
   - Value: `AIzaSyCPHh4fML7gcGoUisGeZtX8hn7SMGPfwZI`
5. Click "Deploy"

### Method 2: Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
# When prompted, add VITE_API_KEY (or API_KEY) environment variable
```

## Environment Variables

**For Local Development:**
Create `.env.local` file:
```
VITE_API_KEY=AIzaSyCPHh4fML7gcGoUisGeZtX8hn7SMGPfwZI
```
Or:
```
API_KEY=AIzaSyCPHh4fML7gcGoUisGeZtX8hn7SMGPfwZI
```

**For Vercel:**
Add in Vercel Dashboard → Project Settings → Environment Variables:
- `VITE_API_KEY` = `AIzaSyCPHh4fML7gcGoUisGeZtX8hn7SMGPfwZI`
Or:
- `API_KEY` = `AIzaSyCPHh4fML7gcGoUisGeZtX8hn7SMGPfwZI`

## Important Notes

- ⚠️ **Never commit `.env.local` or API keys to GitHub**
- ✅ The `.gitignore` file already excludes `.env.local`
- ✅ Vercel will automatically build and deploy on every push to main branch
- ✅ Your API key will be embedded in the client bundle (this is expected for this setup)

