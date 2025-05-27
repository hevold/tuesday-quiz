# 🚀 DEPLOYMENT CHECKLIST

## Pre-deployment
- [ ] Test all functionality locally
- [ ] Run `npm run build` successfully  
- [ ] Check that all environment variables are set
- [ ] Database tables are properly set up in Supabase
- [ ] Archive system tested and working
- [ ] Admin login working with secure password

## Vercel Deployment Steps

### 1. GitHub Setup
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Vercel Configuration
1. Connect to GitHub repository
2. Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
   - `ADMIN_PASSWORD`
3. Deploy

### 3. Post-deployment Testing
- [ ] Homepage loads correctly
- [ ] Can select venue and reach quiz page
- [ ] Team registration works
- [ ] Score submission works
- [ ] Results page displays correctly
- [ ] Admin login works
- [ ] Archive functionality works
- [ ] Venue branding works

## Production URLs
- **Main app**: `https://your-app.vercel.app`
- **Admin**: `https://your-app.vercel.app/admin`
- **Results**: `https://your-app.vercel.app/results`

## Security Notes
- Change default admin password
- Supabase RLS policies are disabled for simplicity - consider enabling for high-security needs
- HTTPS is automatically enabled by Vercel

## Weekly Maintenance
Every Tuesday after quiz:
1. Go to `/admin/archive`
2. Archive current quiz
3. New week automatically starts

## Backup Strategy
- Supabase automatically backs up data
- Export important data monthly via Supabase dashboard
- Quiz archives are permanently stored

## Troubleshooting
- Check Vercel deployment logs if errors occur
- Verify environment variables are set correctly
- Test Supabase connection via Supabase dashboard
