-- Create the students table
CREATE TABLE students (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    is_checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anyone can submit the form)
CREATE POLICY "Allow public insert" ON students
    FOR INSERT TO public, anon
    WITH CHECK (true);

-- Allow public reading (needed to show the list)
CREATE POLICY "Allow public select" ON students
    FOR SELECT TO public, anon
    USING (true);

-- Allow public updates (needed for the 'Check' button)
CREATE POLICY "Allow public update" ON students
    FOR UPDATE TO public, anon
    USING (true);
