import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Roadmap, RoadmapNode, UserPreferences } from '../types';

export interface SavedRoadmap {
  id: string;
  title: string;
  description: string;
  target_skill: string;
  current_level: string;
  nodes: RoadmapNode[];
  user_id: string | null;
  user_name: string | null;
  created_at: string;
  views: number;
  similarity_score?: number;
}

// Save a new roadmap to the database
export const saveRoadmap = async (
  roadmap: Roadmap,
  preferences: UserPreferences,
  userId?: string,
  userName?: string
): Promise<SavedRoadmap | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping save');
    return null;
  }

  const { data, error } = await supabase
    .from('roadmaps')
    .insert({
      title: roadmap.title,
      description: roadmap.description,
      target_skill: preferences.targetSkill,
      current_level: preferences.currentLevel,
      nodes: roadmap.nodes,
      user_id: userId || null,
      user_name: userName || 'Anonymous',
      views: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving roadmap:', error);
    return null;
  }

  return data as SavedRoadmap;
};

// Fetch all public roadmaps
export const fetchPublicRoadmaps = async (limit = 20): Promise<SavedRoadmap[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching roadmaps:', error);
    return [];
  }

  return data as SavedRoadmap[];
};

// Track viewed roadmaps in this session to prevent double counting
const viewedRoadmaps = new Set<string>();

// Fetch a single roadmap by ID
export const fetchRoadmapById = async (id: string, incrementViews = true): Promise<SavedRoadmap | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  // Only increment views once per session per roadmap
  if (incrementViews && !viewedRoadmaps.has(id)) {
    viewedRoadmaps.add(id);
    // Use a try-catch to prevent errors from blocking the fetch
    try {
      await supabase.rpc('increment_views', { roadmap_id: id });
    } catch (error) {
      console.warn('Error incrementing views:', error);
      // Continue even if increment fails
    }
  }

  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching roadmap:', error);
    return null;
  }

  return data as SavedRoadmap;
};

// Fetch roadmaps by user
export const fetchUserRoadmaps = async (userId: string): Promise<SavedRoadmap[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user roadmaps:', error);
    return [];
  }

  return data as SavedRoadmap[];
};

// Fuzzy search roadmaps by skill/title
export const searchRoadmaps = async (query: string, limit = 10): Promise<SavedRoadmap[]> => {
  if (!isSupabaseConfigured() || !query.trim()) {
    return [];
  }

  // Try the RPC function first (uses pg_trgm for better fuzzy matching)
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('search_roadmaps', { search_query: query.trim(), result_limit: limit });

  if (!rpcError && rpcData && rpcData.length > 0) {
    return rpcData as SavedRoadmap[];
  }

  // Fallback to simple ILIKE search if RPC fails (e.g., function not created yet)
  const { data, error } = await supabase
    .from('roadmaps')
    .select('*')
    .or(`target_skill.ilike.%${query}%,title.ilike.%${query}%`)
    .order('views', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching roadmaps:', error);
    return [];
  }

  return data as SavedRoadmap[];
};

// Update an existing roadmap (only by creator)
export const updateRoadmap = async (
  roadmapId: string,
  roadmap: Roadmap,
  preferences: UserPreferences,
  userId: string
): Promise<SavedRoadmap | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping update');
    return null;
  }

  // First verify the user owns this roadmap
  const { data: existing, error: fetchError } = await supabase
    .from('roadmaps')
    .select('user_id')
    .eq('id', roadmapId)
    .single();

  if (fetchError || !existing) {
    console.error('Error fetching roadmap for update:', fetchError);
    return null;
  }

  if (existing.user_id !== userId) {
    console.error('User does not own this roadmap');
    return null;
  }

  // Update the roadmap
  const { data, error } = await supabase
    .from('roadmaps')
    .update({
      title: roadmap.title,
      description: roadmap.description,
      target_skill: preferences.targetSkill,
      current_level: preferences.currentLevel,
      nodes: roadmap.nodes,
    })
    .eq('id', roadmapId)
    .eq('user_id', userId) // Extra security check
    .select()
    .single();

  if (error) {
    console.error('Error updating roadmap:', error);
    return null;
  }

  return data as SavedRoadmap;
};
