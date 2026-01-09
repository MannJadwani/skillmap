import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { SearchFirst } from '../components/SearchFirst';
import { SavedRoadmap } from '../services/roadmapService';
import { SEO } from '../components/SEO';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const handleSelectRoadmap = (roadmap: SavedRoadmap) => {
    navigate(`/roadmap/${roadmap.id}`);
  };

  const handleGenerateNew = (skill: string) => {
    // Navigate to create page - it will handle auth check
    navigate(`/create?skill=${encodeURIComponent(skill)}`);
  };

  const handleBrowseAll = () => {
    navigate('/browse');
  };

  return (
    <>
      <SEO 
        title="SkillMap AI — Find or Create Your Learning Path"
        description="Search for existing learning roadmaps or create a personalized AI-powered roadmap for any skill. Join thousands learning with SkillMap AI."
        url="https://skillmap.neuralarc.in/"
      />
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-dark-950 relative overflow-hidden min-h-screen">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl w-full text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-800/50 border border-dark-700/50 text-primary text-xs font-bold uppercase tracking-wider mb-6 backdrop-blur-sm shadow-sm">
            <span>Unlock Your Potential</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight leading-none uppercase">
            Find or Create Your Path
          </h1>
          <div className="font-script text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-primary pb-3 transform -rotate-2 mt-1">
            to any skill
          </div>
        </div>

        <div className="w-full flex justify-center z-10">
          <SearchFirst 
            onSelectRoadmap={handleSelectRoadmap}
            onGenerateNew={handleGenerateNew}
            onBrowseAll={handleBrowseAll}
          />
        </div>
      </div>
    </>
  );
};
