# Vercel Deployment Guide

## Fix Build Error

The build is failing because `sqlite3` requires native bindings. Follow these steps:

### Step 1: Set Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Key**: `ENABLE_BUILD_SCRIPTS`
   - **Value**: `1`
   - **Environment**: Select all (Production, Preview, Development)
4. Save and redeploy

### Step 2: Alternative - Use pnpm approve-builds

If the environment variable doesn't work, you can also:

1. In Vercel dashboard → Settings → General
2. Look for "Build & Development Settings"
3. Or run `pnpm approve-builds` command (if available in Vercel CLI)

## ⚠️ CRITICAL: SQLite Won't Work on Vercel

Even if the build succeeds, **SQLite will NOT work** on Vercel because:

1. **Read-only filesystem**: Vercel's filesystem is read-only except `/tmp`
2. **No persistence**: Database files are deleted after each deployment
3. **Stateless functions**: Each serverless function invocation is isolated

## Solution: Migrate to Cloud Database

You **MUST** migrate to a cloud database for production. Options:

### Option 1: Vercel Postgres (Recommended)
- Native integration with Vercel
- Easy migration path
- Free tier available
- [Documentation](https://vercel.com/docs/storage/vercel-postgres)

### Option 2: Turso
- SQLite-compatible
- Minimal code changes
- [Documentation](https://docs.turso.tech/)

### Option 3: Cloudflare D1
- SQLite-compatible
- Free tier
- [Documentation](https://developers.cloudflare.com/d1/)

### Option 4: Supabase
- PostgreSQL
- Free tier
- [Documentation](https://supabase.com/docs)

### Option 5: PlanetScale
- MySQL
- Free tier
- [Documentation](https://planetscale.com/docs)

## Migration Steps

1. Choose a database provider
2. Create database instance
3. Update `lib/db.ts` to use the new database client
4. Update connection strings in environment variables
5. Run database migrations
6. Test thoroughly before deploying

