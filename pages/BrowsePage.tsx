import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicGallery } from '../components/PublicGallery';
import { SavedRoadmap } from '../services/roadmapService';
import { SEO } from '../components/SEO';

export const BrowsePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectRoadmap = (roadmap: SavedRoadmap) => {
    navigate(`/roadmap/${roadmap.id}`);
  };

  const handleCreateNew = () => {
    navigate('/');
  };

  return (
    <>
      <SEO 
        title="Browse All Learning Roadmaps — SkillMap AI"
        description="Explore hundreds of community-created learning roadmaps. Find the perfect path for React, Python, Machine Learning, and more."
        url="https://skillmap.neuralarc.in/browse"
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-dark-950 relative min-h-screen">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <PublicGallery 
            onSelectRoadmap={handleSelectRoadmap}
            onCreateNew={handleCreateNew}
          />
        </div>
      </div>
    </>
  );
};
