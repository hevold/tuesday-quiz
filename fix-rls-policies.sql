-- Fix Row Level Security for archive function
-- Disable RLS temporarily for the archive function to work
ALTER TABLE quiz_sessions DISABLE ROW LEVEL SECURITY;

-- Or create a proper policy that allows the function to work
-- Re-enable RLS with proper policies
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations on quiz_sessions (you can make this more restrictive later)
DROP POLICY IF EXISTS "Allow all on quiz_sessions" ON quiz_sessions;
CREATE POLICY "Allow all on quiz_sessions" ON quiz_sessions FOR ALL USING (true);

-- Make sure teams table has proper policies too
DROP POLICY IF EXISTS "Allow all on teams" ON teams;
CREATE POLICY "Allow all on teams" ON teams FOR ALL USING (true);

-- Test the archive function manually
SELECT archive_current_quiz_and_start_new();