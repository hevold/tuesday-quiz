-- Sjekk teams tabellstruktur
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teams' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Sjekk om det finnes teams i aktiv sesjon
SELECT COUNT(*) as active_teams 
FROM teams t
JOIN quiz_sessions qs ON t.session_id = qs.id 
WHERE qs.is_active = true;

-- Vis alle aktive teams
SELECT t.id, t.team_name, t.venue_id, v.name as venue_name, qs.is_active
FROM teams t
JOIN venues v ON t.venue_id = v.id
JOIN quiz_sessions qs ON t.session_id = qs.id
WHERE qs.is_active = true
ORDER BY v.name, t.team_name;
