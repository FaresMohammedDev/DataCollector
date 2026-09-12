-- Run this in your Supabase SQL Editor to allow deleting rows

CREATE POLICY "Allow public delete" ON students
  FOR DELETE
  TO public, anon
  USING (true);
