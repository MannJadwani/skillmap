export enum NodeType {
  CONCEPT = 'CONCEPT',
  PROJECT = 'PROJECT',
  MILESTONE = 'MILESTONE',
  RESOURCE = 'RESOURCE'
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  type: NodeType;
  difficulty: Difficulty;
  estimatedHours: number;
  topics: string[];
  dependencies: string[]; // List of IDs that are prerequisites
  status?: 'pending' | 'in-progress' | 'completed'; // For UI state
}

export interface Roadmap {
  title: string;
  description: string;
  nodes: RoadmapNode[];
}

export interface UserPreferences {
  targetSkill: string;
  currentLevel: string;
  background: string;
  learningStyle: 'theory' | 'practical' | 'balanced';
}