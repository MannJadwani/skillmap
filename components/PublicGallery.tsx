import React, { useEffect, useState } from 'react';
import { SavedRoadmap, fetchPublicRoadmaps } from '../services/roadmapService';
import { Map, Eye, Clock, User, ChevronRight, Loader2, Plus, ArrowRight } from 'lucide-react';

interface PublicGalleryProps {
  onSelectRoadmap: (roadmap: SavedRoadmap) => void;
  onCreateNew?: () => void;
}

export const PublicGallery: React.FC<PublicGalleryProps> = ({ onSelectRoadmap, onCreateNew }) => {
  const [roadmaps, setRoadmaps] = useState<SavedRoadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRoadmaps = async () => {
      setIsLoading(true);
      const data = await fetchPublicRoadmaps(12);
      setRoadmaps(data);
      setIsLoading(false);
    };
    loadRoadmaps();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (roadmaps.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-dark-800 rounded-full mb-4">
          <Map className="w-8 h-8 text-dark-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No roadmaps yet</h3>
        <p className="text-dark-400 text-sm mb-6">Be the first to create a learning roadmap!</p>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 text-white font-bold py-2 pl-5 pr-2 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all"
          >
            <span>Create Your First Roadmap</span>
            <div className="bg-white text-primary rounded-full p-1.5 shadow-sm group-hover:scale-110 transition-transform duration-200">
              <ArrowRight size={16} />
            </div>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Community Roadmaps</h2>
          <p className="text-dark-400 text-sm">Explore learning paths created by the community</p>
        </div>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="group flex items-center gap-2 bg-gradient-to-r from-primary to-orange-400 text-white font-bold py-2 pl-5 pr-2 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={16} />
            <span>Create New</span>
            <div className="bg-white text-primary rounded-full p-1.5 shadow-sm group-hover:scale-110 transition-transform duration-200">
              <ArrowRight size={14} />
            </div>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roadmaps.map((roadmap) => (
          <button
            key={roadmap.id}
            onClick={() => onSelectRoadmap(roadmap)}
            className="group bg-[#1e1e1e] border border-[#2c2c2c] rounded-xl p-5 text-left hover:border-primary/50 hover:bg-[#252525] transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate group-hover:text-primary transition-colors">
                  {roadmap.target_skill}
                </h3>
                <p className="text-xs text-dark-500 mt-0.5">{roadmap.current_level}</p>
              </div>
              <div className="ml-2 p-2 bg-dark-800 rounded-lg border border-dark-700 group-hover:bg-primary group-hover:border-primary transition-colors">
                <ChevronRight className="w-4 h-4 text-dark-400 group-hover:text-white transition-colors" />
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-dark-400 line-clamp-2 mb-4 min-h-[40px]">
              {roadmap.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-dark-500">
              <div className="flex items-center gap-1">
                <Map className="w-3.5 h-3.5" />
                <span>{roadmap.nodes.length} steps</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{roadmap.views}</span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(roadmap.created_at)}</span>
              </div>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-700">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-dark-400">{roadmap.user_name || 'Anonymous'}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
