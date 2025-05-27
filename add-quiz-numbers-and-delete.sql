-- Legg til quiz-nummer og forbedret dato-håndtering
ALTER TABLE quiz_archives ADD COLUMN IF NOT EXISTS quiz_number INTEGER;
ALTER TABLE quiz_archives ADD COLUMN IF NOT EXISTS quiz_title VARCHAR(200);

-- Opprett funksjon for å generere neste quiz-nummer
CREATE OR REPLACE FUNCTION get_next_quiz_number()
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(quiz_number), 0) + 1 INTO next_num FROM quiz_archives;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Oppdater arkiv-funksjonen til å inkludere quiz-nummer
CREATE OR REPLACE FUNCTION archive_current_quiz_and_start_new()
RETURNS JSON AS $$
DECLARE
  current_session quiz_sessions%ROWTYPE;
  archive_record quiz_archives%ROWTYPE;
  team_count INTEGER;
  venue_count INTEGER;
  week_num INTEGER;
  year_num INTEGER;
  next_quiz_num INTEGER;
  quiz_title_text VARCHAR(200);
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
  
  -- Få neste quiz-nummer
  SELECT get_next_quiz_number() INTO next_quiz_num;
  
  -- Lag quiz-tittel
  quiz_title_text := 'Quiz #' || next_quiz_num || ' - Uke ' || week_num || ', ' || year_num;
  
  -- Opprett arkiv-record
  INSERT INTO quiz_archives (
    original_session_id, 
    quiz_date, 
    quiz_week, 
    quiz_year, 
    quiz_number,
    quiz_title,
    total_teams, 
    total_venues
  ) VALUES (
    current_session.id,
    current_session.quiz_date,
    week_num,
    year_num,
    next_quiz_num,
    quiz_title_text,
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
    'quiz_number', next_quiz_num,
    'quiz_title', quiz_title_text,
    'week', week_num,
    'year', year_num
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Feil: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Oppdater get_quiz_archives-funksjonen
CREATE OR REPLACE FUNCTION get_quiz_archives()
RETURNS TABLE (
  archive_id UUID,
  quiz_date DATE,
  quiz_week INTEGER,
  quiz_year INTEGER,
  quiz_number INTEGER,
  quiz_title VARCHAR(200),
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
    qa.quiz_number,
    qa.quiz_title,
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
  ORDER BY qa.quiz_number DESC;
END;
$$ LANGUAGE plpgsql;

-- Funksjon for å slette arkiv
CREATE OR REPLACE FUNCTION delete_quiz_archive(archive_uuid UUID)
RETURNS JSON AS $$
DECLARE
  archive_record quiz_archives%ROWTYPE;
  deleted_teams INTEGER;
BEGIN
  -- Finn arkivet
  SELECT * INTO archive_record FROM quiz_archives WHERE id = archive_uuid;
  
  IF archive_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Arkiv ikke funnet');
  END IF;
  
  -- Tell antall lag som blir slettet
  SELECT COUNT(*) INTO deleted_teams FROM archived_teams WHERE archive_id = archive_uuid;
  
  -- Slett arkiverte lag (CASCADE vil slette automatisk, men vi gjør det eksplisitt)
  DELETE FROM archived_teams WHERE archive_id = archive_uuid;
  
  -- Slett arkiv-record
  DELETE FROM quiz_archives WHERE id = archive_uuid;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Arkiv slettet',
    'deleted_archive', archive_record.quiz_title,
    'deleted_teams', deleted_teams
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', 'Feil ved sletting: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;