-- SkillMap AI Database Schema
-- Run this in your Supabase SQL Editor

-- Enable the pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_skill TEXT NOT NULL,
  current_level TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]',
  user_id TEXT,
  user_name TEXT DEFAULT 'Anonymous',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_roadmaps_created_at ON roadmaps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);

-- Create GIN index for fuzzy text search on target_skill
CREATE INDEX IF NOT EXISTS idx_roadmaps_target_skill_trgm ON roadmaps USING GIN (target_skill gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_roadmaps_title_trgm ON roadmaps USING GIN (title gin_trgm_ops);

-- Enable Row Level Security (RLS)
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read all roadmaps (public gallery)
CREATE POLICY "Anyone can view roadmaps" ON roadmaps
  FOR SELECT USING (true);

-- Policy: Anyone can insert roadmaps
CREATE POLICY "Anyone can create roadmaps" ON roadmaps
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can update roadmaps
-- NOTE: This is intentionally permissive to support a purely client-side app without
-- Supabase Auth/JWTs. For a secure setup, keep RLS strict and proxy writes through
-- a backend that verifies Clerk auth and uses the Supabase service role key.
CREATE POLICY "Anyone can update roadmaps" ON roadmaps
  FOR UPDATE USING (true) WITH CHECK (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_views(roadmap_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE roadmaps
  SET views = views + 1
  WHERE id = roadmap_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for fuzzy search with similarity scoring
CREATE OR REPLACE FUNCTION search_roadmaps(search_query TEXT, result_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  target_skill TEXT,
  current_level TEXT,
  nodes JSONB,
  user_id TEXT,
  user_name TEXT,
  views INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description,
    r.target_skill,
    r.current_level,
    r.nodes,
    r.user_id,
    r.user_name,
    r.views,
    r.created_at,
    GREATEST(
      similarity(r.target_skill, search_query),
      similarity(r.title, search_query)
    ) AS similarity_score
  FROM roadmaps r
  WHERE 
    r.target_skill ILIKE '%' || search_query || '%'
    OR r.title ILIKE '%' || search_query || '%'
    OR similarity(r.target_skill, search_query) > 0.2
    OR similarity(r.title, search_query) > 0.2
  ORDER BY similarity_score DESC, r.views DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
