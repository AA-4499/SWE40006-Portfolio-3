# Render Deployment Guide

## Task 3.1 - Pass: Static Site Deployment ✓
This has been completed previously by deploying a static site to Render.

## Task 3.2 - Credit: Node.js Backend with Auto-Deploy

### Files Created/Updated:
- ✓ `prisma/schema.prisma` - Database schema with Score model
- ✓ `lib/db.js` - Database query utilities (getScores, createScore, getScoreStats)
- ✓ `app/api/health/route.js` - Health check endpoint
- ✓ `app/api/scores/route.js` - Leaderboard GET/POST endpoints
- ✓ `app/page.tsx` - Frontend leaderboard UI with score submission form
- ✓ `package.json` - Added Prisma scripts and updated build command
- ✓ `render.yaml` - Infrastructure as Code for Render deployment

### Step 1: Set Up Database (Neon or Supabase)

#### Option A: Neon PostgreSQL (Recommended)
1. Go to https://neon.tech
2. Sign up for free account
3. Create a new project (free tier)
4. Copy the connection string (looks like: `postgresql://user:password@host/database?sslmode=require`)
5. Save this as your `DATABASE_URL`

#### Option B: Supabase PostgreSQL
1. Go to https://supabase.com
2. Sign up for free account
3. Create a new project
4. Go to Settings → Database → Connection string
5. Copy the connection string and replace `[YOUR-PASSWORD]` with your actual password
6. Save as `DATABASE_URL`

### Step 2: Set Up Local Environment
1. Create `.env.local` in the project root with your DATABASE_URL:
   ```
   DATABASE_URL="postgresql://your-connection-string"
   ```

2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Create initial migration (if needed):
   ```bash
   npx prisma migrate dev --name init
   ```
   This will:
   - Create migration files in `prisma/migrations/`
   - Run migrations on your local database
   - Generate Prisma Client

### Step 3: Test Locally
1. Start dev server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000
3. Open browser DevTools Console to check for errors
4. Test endpoints:
   - Health check: `curl http://localhost:3000/api/health`
   - Get scores: `curl http://localhost:3000/api/scores`
   - Submit score:
     ```bash
     curl -X POST http://localhost:3000/api/scores \
       -H "Content-Type: application/json" \
       -d '{"player":"Test Player","score":100}'
     ```

5. Test UI:
   - Submit a score via the form
   - Verify it appears in the leaderboard
   - Check database directly (optional):
     ```bash
     npx prisma studio
     ```

### Step 4: Deploy to Render

#### Method A: Using Render UI (Recommended for Learning)

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub account (easier for auto-deploy)

2. **Connect GitHub Repository**
   - In Render dashboard, click "New +"
   - Select "Web Service"
   - Connect your GitHub account and select the repository
   - Choose branch (e.g., `main`)

3. **Configure Web Service**
   - **Name**: `swe40006-leaderboard` (or any name)
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter if you want better performance)

4. **Add Environment Variables**
   - Click "Advanced"
   - Click "Add Environment Variable"
   - **Key**: `DATABASE_URL`
   - **Value**: Paste your PostgreSQL connection string from Neon/Supabase
   - **Key**: `NODE_ENV`
   - **Value**: `production`

5. **Deploy**
   - Click "Create Web Service"
   - Render will start building automatically
   - Check the build log for any errors
   - Once complete, you'll get a public URL like: `https://swe40006-leaderboard.onrender.com`

#### Method B: Using render.yaml (Infrastructure as Code)

1. Commit render.yaml to your repository
2. Push to GitHub
3. In Render dashboard, click "New +"
4. Select "Create from YAML"
5. Point to your GitHub repository and render.yaml
6. Update the DATABASE_URL environment variable in the blueprint

### Step 5: Verify Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-render-app.onrender.com/api/health
   ```
   Should return: `{"status":"ok","timestamp":"...","environment":"production"}`

2. **Check Leaderboard**
   - Visit: `https://your-render-app.onrender.com`
   - Should load with "No scores yet" message (empty leaderboard)

3. **Submit Test Score**
   - Use the form on the website to submit a score
   - Or use curl:
     ```bash
     curl -X POST https://your-render-app.onrender.com/api/scores \
       -H "Content-Type: application/json" \
       -d '{"player":"Alice","score":250}'
     ```

4. **Verify Data Persists**
   - Refresh the page
   - Score should still appear in the leaderboard
   - Render apps sleep after 15 min of inactivity (free tier), but data persists

### Task 3.2 Credit Completion Checklist:
- [x] Node.js/Express-like backend with API routes
- [x] Environment variables configured (DATABASE_URL, NODE_ENV)
- [x] Build command: `npm run build`
- [x] Start command: `npm start`
- [x] Auto-deploy via Git push (GitHub → Render)
- [x] Health endpoint to verify deployment: `/api/health`
- [x] Leaderboard functionality working on Render

### Task 3.2: Suspend/Delete Service (For Demonstration)
1. In Render dashboard, select your web service
2. Click "Settings"
3. Scroll to "Danger Zone"
4. Click "Suspend" (pauses the service, data remains)
   - Or click "Delete" (permanently removes service)
5. Verify service is down:
   ```bash
   curl https://your-render-app.onrender.com/api/health
   # Should fail with connection error or 503 error page
   ```

---

## Task 3.3 - High Distinction: Full-Stack with Database

The database is already integrated! This deployment already satisfies Task 3.3:
- ✓ Persistent PostgreSQL database (Neon/Supabase)
- ✓ Data-driven app (reads/writes scores to database)
- ✓ Full-stack deployment (web service + database)
- ✓ Live leaderboard with working database functionality

### Verification:
1. Submit multiple scores via the leaderboard UI or API
2. Scores persist across page refreshes
3. Scores are sorted by highest first
4. All data is stored in PostgreSQL

---

## Troubleshooting

### Build Fails with "DATABASE_URL is not set"
- **Solution**: Make sure DATABASE_URL environment variable is added to Render dashboard
- Check Render build logs for the exact error
- Verify your database connection string is valid

### App loads but "Failed to fetch scores"
- **Solution**: 
  1. Check that PostgreSQL instance is running (Neon/Supabase console)
  2. Verify DATABASE_URL is correct in Render settings
  3. Check Render runtime logs for database connection errors
  4. Ensure Prisma migrations ran (should happen automatically in build command)

### "Cannot find module '@prisma/client'"
- **Solution**: 
  1. Ensure `npm install` completed successfully
  2. Verify `@prisma/client` is in package.json dependencies
  3. Try running `npm install` locally and test `npm run build`

### Render free tier is slow/sleeping
- **Solutions**:
  1. Upgrade to "Starter" or "Standard" plan for better performance
  2. Render free tier suspends after 15 min of inactivity
  3. First request after sleep takes ~30s to warm up
  4. Use cron job services (e.g., UptimeRobot) to keep it active

---

## Next Steps

After successful deployment:
1. Celebrate! 🎉
2. Test the live URL with friends/colleagues
3. Monitor Render dashboard for any issues
4. Consider upgrading to paid tier for production use
5. Add authentication if needed (for restricted leaderboards)
6. Add more features (delete scores, filter by date, user accounts, etc.)

---

## Commands Reference

**Local Development:**
```bash
npm install              # Install dependencies
npm run dev              # Start dev server
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Create and run migration
npx prisma studio       # Open database GUI
npm run build            # Build for production
npm start                # Start production server
```

**Testing:**
```bash
# Health check
curl http://localhost:3000/api/health

# Get all scores
curl http://localhost:3000/api/scores

# Get top 5 scores
curl "http://localhost:3000/api/scores?limit=5"

# Submit a score
curl -X POST http://localhost:3000/api/scores \
  -H "Content-Type: application/json" \
  -d '{"player":"YourName","score":100}'
```

---

## File Structure
```
.
├── app/
│   ├── api/
│   │   ├── health/route.js       # Health check
│   │   └── scores/route.js       # Leaderboard API
│   ├── page.tsx                   # Leaderboard UI
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   └── db.js                      # Database utilities
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Auto-generated migrations
├── package.json
├── next.config.ts
├── render.yaml                    # Render deployment config
├── .env.local                     # Local environment (git-ignored)
├── .env.production                # Production environment template
└── .gitignore
```

Good luck with your deployment! 🚀
