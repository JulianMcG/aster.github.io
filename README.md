<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Aster - AI Game Generator

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

An AI-powered game generator built with React, TypeScript, and Google's Gemini API. Generate playable mini-games from simple text prompts.

View your app in AI Studio: https://ai.studio/apps/drive/1n_2PZlK9S1T7JNgJdI1jGxUSEMn0hjbB

## Run Locally

**Prerequisites:** Node.js (v18 or higher)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory:
   ```bash
   VITE_API_KEY=your_gemini_api_key_here
   ```
   Or you can use:
   ```bash
   API_KEY=your_gemini_api_key_here
   ```
   Get your API key from: https://aistudio.google.com/apikey

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

## Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub (see GitHub deployment section below)

2. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account

3. Click "Add New Project" and import your GitHub repository

4. In the "Environment Variables" section, add:
   - **Name:** `VITE_API_KEY` (or `API_KEY`)
   - **Value:** `AIzaSyCPHh4fML7gcGoUisGeZtX8hn7SMGPfwZI` (or your Gemini API key)

5. Click "Deploy"

Vercel will automatically detect the Vite framework and deploy your app.

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. When prompted, add the environment variable:
   - `VITE_API_KEY` (or `API_KEY`) = `AIzaSyCPHh4fML7gcGoUisGeZtX8hn7SMGPfwZI`

## Deploy to GitHub

1. Initialize git repository (if not already initialized):
   ```bash
   git init
   ```

2. Add all files:
   ```bash
   git add .
   ```

3. Commit:
   ```bash
   git commit -m "Initial commit: Aster AI Game Generator"
   ```

4. Create a new repository on GitHub

5. Add the remote and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

**Important:** Never commit your `.env.local` file or API keys to GitHub. The `.gitignore` file is already configured to exclude these files.

## Build for Production

To build the app for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
aster/
├── components/          # React components
│   ├── CodeViewer.tsx   # Code display component
│   └── GamePreview.tsx  # Game preview iframe
├── services/            # API services
│   └── geminiService.ts # Gemini API integration
├── App.tsx              # Main application component
├── index.tsx            # Entry point
├── vite.config.ts       # Vite configuration
└── vercel.json          # Vercel deployment config
```

## Environment Variables

- `VITE_API_KEY` or `API_KEY`: Your Google Gemini API key (required)
  
  The app supports both variable names for flexibility. In Vercel, you can set either one.

## License

MIT
