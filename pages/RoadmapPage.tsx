import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { RoadmapVisualizer } from '../components/RoadmapVisualizer';
import { fetchRoadmapById, SavedRoadmap } from '../services/roadmapService';
import { Roadmap } from '../types';
import { SEO } from '../components/SEO';
import { Map, ArrowRight } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';

export const RoadmapPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRoadmap = async () => {
      if (!id) return;

      // Check if roadmap was passed via state (temp roadmap)
      if (location.state?.roadmap) {
        if (isMounted) {
          setRoadmap(location.state.roadmap);
          setIsLoading(false);
        }
        return;
      }

      // Fetch from database
      setIsLoading(true);
      const saved = await fetchRoadmapById(id, true);
      
      if (!isMounted) return;
      
      if (saved) {
        const loadedRoadmap: Roadmap = {
          title: saved.title,
          description: saved.description,
          nodes: saved.nodes,
        };
        setRoadmap(loadedRoadmap);
      } else {
        // Roadmap not found, redirect to home
        navigate('/');
      }
      setIsLoading(false);
    };

    loadRoadmap();

    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [id, navigate, location.state]);

  const handleNodeToggle = (nodeId: string) => {
    if (!roadmap) return;
    const newNodes = roadmap.nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          status: node.status === 'completed' ? 'pending' : 'completed'
        } as const;
      }
      return node;
    });
    setRoadmap({ ...roadmap, nodes: newNodes });
  };

  const handleReset = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-400">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return null;
  }

  return (
    <>
      <SEO 
        title={`${roadmap.title} — SkillMap AI`}
        description={roadmap.description || `Learn ${roadmap.title} with this step-by-step learning roadmap.`}
        url={`https://skillmap.neuralarc.in/roadmap/${id}`}
      />
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-dark-700 bg-dark-900">
          <div className="p-6 border-b border-dark-700">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Map size={20} />
              <span className="font-bold text-lg text-white">SkillMap AI</span>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-8">
              <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Overview</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 rounded-md bg-dark-800 text-sm border border-dark-700">
                  <span className="text-dark-400">Total Steps</span>
                  <span className="font-bold text-white">{roadmap.nodes.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-dark-800 text-sm border border-dark-700">
                  <span className="text-dark-400">Est. Time</span>
                  <span className="font-bold text-white">
                    {roadmap.nodes.reduce((acc, n) => acc + n.estimatedHours, 0)}h
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-dark-400">
                  <div className="w-2 h-2 rounded-full bg-dark-400"></div> Concept
                </div>
                <div className="flex items-center gap-2 text-sm text-dark-400">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div> Project
                </div>
                <div className="flex items-center gap-2 text-sm text-dark-400">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div> Milestone
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-dark-700 space-y-4">
            <button 
              onClick={handleReset}
              className="group w-full flex items-center justify-between bg-gradient-to-r from-primary to-orange-400 text-white font-bold py-2 pl-4 pr-2 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5"
            >
              <span className="text-sm">New Search</span>
              <div className="bg-white text-primary rounded-full p-1.5 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <ArrowRight size={16} />
              </div>
            </button>
            <div className="pt-2 flex justify-center border-t border-dark-700 mt-2">
              <UserButton afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9 border border-dark-700"
                  }
                }}
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full bg-dark-950 relative">
          <div className="absolute top-4 right-4 lg:hidden z-30 flex items-center gap-2">
            <UserButton afterSignOutUrl="/" />
            <button 
              onClick={handleReset} 
              className="p-2 bg-dark-800 border border-dark-700 shadow rounded-full text-dark-400"
            >
              <Map size={20} />
            </button>
          </div>
          <RoadmapVisualizer roadmap={roadmap} onNodeToggle={handleNodeToggle} />
        </div>
      </div>
    </>
  );
};
