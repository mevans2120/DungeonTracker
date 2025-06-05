# Deploying DungeonTracker to Vercel

This guide will help you deploy your DungeonTracker application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com)
2. A PostgreSQL database (Neon Database recommended)
3. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Database

1. Make sure your Neon Database is set up and accessible
2. Note down your DATABASE_URL connection string
3. Run database migrations if needed:
   ```bash
   npm run db:push
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy your project:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Link to existing project or create new one
   - Choose your Git repository
   - Accept the default settings

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-detect the framework settings
5. Click "Deploy"

## Step 3: Configure Environment Variables

After deployment, you need to set up environment variables:

1. Go to your project in the Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `DATABASE_URL`: Your PostgreSQL/Neon database connection string
   - `NODE_ENV`: Set to `production`

## Step 4: Redeploy

After adding environment variables, trigger a redeploy:
- Go to Deployments tab
- Click "Redeploy" on the latest deployment

## Project Structure

Your project has been configured with:

- `vercel.json`: Vercel configuration for full-stack deployment
- `api/index.ts`: Serverless API entry point for Vercel
- Frontend served as static files from `dist/public`
- API routes accessible at `/api/*`

## Features Supported

✅ React frontend with Vite  
✅ Express.js API routes  
✅ PostgreSQL database with Drizzle ORM  
✅ TypeScript support  
✅ Static file serving  

## Important Notes

1. **Database**: Make sure your database allows connections from Vercel's IP ranges
2. **Environment Variables**: All environment variables must be set in Vercel dashboard
3. **Build Process**: The build process compiles both frontend and API for serverless deployment
4. **Sessions**: Note that serverless functions are stateless, so session storage may need adjustment for production

## Troubleshooting

### Build Errors
- Check that all dependencies are listed in `package.json`
- Verify TypeScript configuration is correct
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify DATABASE_URL is correctly set
- Check that your database accepts connections from Vercel
- Test database connection locally first

### API Routes Not Working
- Verify API routes are accessible at `/api/*`
- Check function logs in Vercel dashboard
- Ensure serverless function timeout is sufficient

For more help, check the [Vercel documentation](https://vercel.com/docs) or open an issue in your repository. 