-- Oppdater venues tabellen for å støtte branding
ALTER TABLE venues ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#1e40af';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#3b82f6';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS background_gradient_start VARCHAR(7) DEFAULT '#3b82f6';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS background_gradient_end VARCHAR(7) DEFAULT '#8b5cf6';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS text_color VARCHAR(7) DEFAULT '#ffffff';

-- Oppdater eksisterende venues med branding
UPDATE venues SET 
  logo_url = 'https://your-storage.supabase.co/storage/v1/object/public/venue-logos/bocca-logo.png',
  primary_color = '#ff6b35',
  secondary_color = '#ffab00', 
  background_gradient_start = '#ff6b35',
  background_gradient_end = '#ffab00'
WHERE name = 'Bocca';

UPDATE venues SET
  logo_url = 'https://your-storage.supabase.co/storage/v1/object/public/venue-logos/cafe-central-logo.png',
  primary_color = '#2563eb',
  secondary_color = '#1d4ed8',
  background_gradient_start = '#3b82f6', 
  background_gradient_end = '#8b5cf6'
WHERE name = 'Cafe Central Oslo';

-- Oppdater database types
CREATE TYPE venue_branding AS (
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  background_gradient_start VARCHAR(7),
  background_gradient_end VARCHAR(7),
  text_color VARCHAR(7)
);