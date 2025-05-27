# Tuesday Quiz Platform

## Deployment Guide

### Environment Variables
Set these in your production environment:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_PASSWORD=your_strong_admin_password
```

### Database Setup
1. Run the SQL files in this order in your Supabase SQL Editor:
   - `venue-branding-update.sql` - Adds branding columns
   - `quiz-archive-system.sql` - Adds archive functionality
   - `add-quiz-numbers-and-delete.sql` - Adds quiz numbering

### Initial Data
Make sure you have venues in your database. Example:
```sql
INSERT INTO venues (name, region) VALUES 
('Bocca', 'Oslo'),
('Café Sara', 'Oslo'),
('Grünerløkka Brygghus', 'Oslo');
```

### Admin Access
- Go to `/admin/login`
- Use the password set in `ADMIN_PASSWORD`
- Manage venue branding and quiz archives

### Weekly Usage
1. Tuesday after quiz: Go to `/admin/archive`
2. Archive current quiz and start new week
3. Set up venue branding as needed

## Development
```bash
npm install
npm run dev
```
