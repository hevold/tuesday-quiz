-- Sjekk om logo_url kolonnen eksisterer
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'venues' 
AND table_schema = 'public';

-- Vis alle venues med branding-data
SELECT id, name, logo_url, primary_color, secondary_color 
FROM venues;
