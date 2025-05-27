-- Quiz Archive System
-- Lag arkiv-tabell for gamle quiz-økter
CREATE TABLE quiz_archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_session_id UUID NOT NULL,
  quiz_date DATE NOT NULL,
  quiz_week INTEGER NOT NULL, -- Uke-nummer
  quiz_year INTEGER NOT NULL,
  total_teams INTEGER DEFAULT 0,
  total_venues INTEGER DEFAULT 0,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Arkiverte lag (kopi av teams-tabellen)
CREATE TABLE archived_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  archive_id UUID REFERENCES quiz_archives(id) ON DELETE CASCADE,
  original_team_id UUID NOT NULL,
  session_id UUID NOT NULL, -- Original session ID
  venue_id UUID REFERENCES venues(id),
  team_name VARCHAR(100) NOT NULL,
  entry_answer INTEGER,
  round1_score INTEGER DEFAULT 0,
  round2_score INTEGER DEFAULT 0,
  bonus_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  quiz_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE
);

-- Views for arkiverte resultater
CREATE VIEW archived_venue_leaderboard AS
SELECT 
  a.quiz_week,
  a.quiz_year,
  a.quiz_date,
  v.name as venue_name,
  v.region,
  at.team_name,
  at.total_score,
  at.round1_score,
  at.round2_score,
  at.bonus_score,
  ROW_NUMBER() OVER (PARTITION BY at.venue_id, a.id ORDER BY at.total_score DESC) as venue_rank
FROM archived_teams at
JOIN venues v ON at.venue_id = v.id
JOIN quiz_archives a ON at.archive_id = a.id
ORDER BY a.quiz_date DESC, v.name, venue_rank;

CREATE VIEW archived_total_leaderboard AS
SELECT 
  a.quiz_week,
  a.quiz_year,
  a.quiz_date,
  at.team_name,
  v.name as venue_name,
  v.region,
  at.total_score,
  ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY at.total_score DESC) as total_rank
FROM archived_teams at
JOIN venues v ON at.venue_id = v.id
JOIN quiz_archives a ON at.archive_id = a.id
ORDER BY a.quiz_date DESC, total_rank;

-- Funksjon for å arkivere gjeldende quiz og starte ny
CREATE OR REPLACE FUNCTION archive_current_quiz_and_start_new()
RETURNS JSON AS $$
DECLARE
  current_session quiz_sessions%ROWTYPE;
  archive_record quiz_archives%ROWTYPE;
  team_count INTEGER;
  venue_count INTEGER;
  week_num INTEGER;
  year_num INTEGER;
BEGIN
  -- Finn aktiv sesjon
  SELECT * INTO current_session 
  FROM quiz_sessions 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF current_session.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Ingen aktiv quiz-sesjon funnet');
  END IF;
  
  -- Tell lag og venues i gjeldende sesjon
  SELECT COUNT(*) INTO team_count FROM teams WHERE session_id = current_session.id;
  SELECT COUNT(DISTINCT venue_id) INTO venue_count FROM teams WHERE session_id = current_session.id;
  
  -- Få uke og år
  SELECT EXTRACT(WEEK FROM current_session.quiz_date) INTO week_num;
  SELECT EXTRACT(YEAR FROM current_session.quiz_date) INTO year_num;
  
  -- Opprett arkiv-record
  INSERT INTO quiz_archives (
    original_session_id, 
    quiz_date, 
    quiz_week, 
    quiz_year, 
    total_teams, 
    total_venues
  ) VALUES (
    current_session.id,
    current_session.quiz_date,
    week_num,
    year_num,
    team_count,
    venue_count
  ) RETURNING * INTO archive_record;
  
  -- Kopier alle lag til arkiv
  INSERT INTO archived_teams (
    archive_id,
    original_team_id,
    session_id,
    venue_id,
    team_name,
    entry_answer,
    round1_score,
    round2_score,
    bonus_score,
    total_score,
    quiz_date,
    created_at
  )
  SELECT 
    archive_record.id,
    t.id,
    t.session_id,
    t.venue_id,
    t.team_name,
    t.entry_answer,
    t.round1_score,
    t.round2_score,
    t.bonus_score,
    t.total_score,
    current_session.quiz_date,
    t.created_at
  FROM teams t
  WHERE t.session_id = current_session.id;
  
  -- Deaktiver gammel sesjon
  UPDATE quiz_sessions 
  SET is_active = false 
  WHERE id = current_session.id;
  
  -- Slett alle lag fra aktiv tabell
  DELETE FROM teams WHERE session_id = current_session.id;
  
  -- Opprett ny aktiv sesjon
  INSERT INTO quiz_sessions (quiz_date, is_active)
  VALUES (CURRENT_DATE, true);
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Quiz arkivert og ny quiz startet',
    'archived_teams', team_count,
    'archived_venues', venue_count,
    'archive_id', archive_record.id,
    'week', week_num,
    'year', year_num
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Feil: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Funksjon for å få arkiv-oversikt
CREATE OR REPLACE FUNCTION get_quiz_archives()
RETURNS TABLE (
  archive_id UUID,
  quiz_date DATE,
  quiz_week INTEGER,
  quiz_year INTEGER,
  total_teams INTEGER,
  total_venues INTEGER,
  winner_team VARCHAR(100),
  winner_venue VARCHAR(100),
  winner_score INTEGER,
  archived_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qa.id,
    qa.quiz_date,
    qa.quiz_week,
    qa.quiz_year,
    qa.total_teams,
    qa.total_venues,
    winner.team_name,
    winner.venue_name,
    winner.total_score,
    qa.archived_at
  FROM quiz_archives qa
  LEFT JOIN (
    SELECT DISTINCT ON (a.id)
      a.id as archive_id,
      at.team_name,
      v.name as venue_name,
      at.total_score
    FROM quiz_archives a
    JOIN archived_teams at ON a.id = at.archive_id
    JOIN venues v ON at.venue_id = v.id
    ORDER BY a.id, at.total_score DESC
  ) winner ON qa.id = winner.archive_id
  ORDER BY qa.quiz_date DESC;
END;
$$ LANGUAGE plpgsql;