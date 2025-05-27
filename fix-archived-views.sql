-- Fix archived views to work with the archive ID filter

DROP VIEW IF EXISTS archived_venue_leaderboard;
DROP VIEW IF EXISTS archived_total_leaderboard;

-- Corrected archived venue leaderboard view
CREATE VIEW archived_venue_leaderboard AS
SELECT 
  at.archive_id,
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
  ROW_NUMBER() OVER (PARTITION BY at.archive_id, at.venue_id ORDER BY at.total_score DESC) as venue_rank
FROM archived_teams at
JOIN venues v ON at.venue_id = v.id
JOIN quiz_archives a ON at.archive_id = a.id
ORDER BY a.quiz_date DESC, v.name, venue_rank;

-- Corrected archived total leaderboard view  
CREATE VIEW archived_total_leaderboard AS
SELECT 
  at.archive_id,
  a.quiz_week,
  a.quiz_year,
  a.quiz_date,
  at.team_name,
  v.name as venue_name,
  v.region,
  at.total_score,
  at.round1_score,
  at.round2_score,
  at.bonus_score,
  ROW_NUMBER() OVER (PARTITION BY at.archive_id ORDER BY at.total_score DESC) as total_rank
FROM archived_teams at
JOIN venues v ON at.venue_id = v.id
JOIN quiz_archives a ON at.archive_id = a.id
ORDER BY a.quiz_date DESC, total_rank;