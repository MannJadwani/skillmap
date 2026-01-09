import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { InputForm } from '../components/InputForm';
import { generateRoadmap } from '../services/geminiService';
import { saveRoadmap } from '../services/roadmapService';
import { UserPreferences, Roadmap } from '../types';
import { SEO } from '../components/SEO';

export const CreatePage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const initialSkill = searchParams.get('skill') || '';

  const handleGenerate = async (prefs: UserPreferences) => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      navigate('/');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await generateRoadmap(prefs, apiKey);
      
      // Save to Supabase
      const saved = await saveRoadmap(
        data,
        prefs,
        user?.id,
        user?.fullName || user?.firstName || 'Anonymous'
      );
      
      if (saved) {
        // Navigate to the saved roadmap
        navigate(`/roadmap/${saved.id}`);
      } else {
        // If save failed, still show the roadmap (just not saved)
        navigate(`/roadmap/temp`, { state: { roadmap: data } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title={`Create ${initialSkill ? `a ${initialSkill} ` : ''}Learning Roadmap — SkillMap AI`}
        description={`Generate a personalized AI-powered learning roadmap${initialSkill ? ` for ${initialSkill}` : ''}. Customize your path based on your current level and learning style.`}
        url={`https://skillmap.neuralarc.in/create${initialSkill ? `?skill=${encodeURIComponent(initialSkill)}` : ''}`}
      />
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-dark-950 relative overflow-hidden min-h-screen">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl w-full text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight leading-none uppercase">
            Customize Your Path
          </h1>
          <div className="font-script text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-primary pb-3 transform -rotate-2 mt-1">
            {initialSkill || 'your roadmap'}
          </div>
        </div>

        <div className="w-full flex justify-center z-10">
          {error && (
            <div className="absolute top-24 mx-auto bg-red-900/20 text-red-400 px-4 py-2 rounded-lg border border-red-900/50 text-sm animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          
          <div className="w-full max-w-3xl">
            <Link
              to="/"
              className="mb-4 text-sm text-dark-400 hover:text-white transition-colors flex items-center gap-1 inline-block"
            >
              ← Back to search
            </Link>
            <InputForm 
              onSubmit={handleGenerate} 
              isLoading={isLoading} 
              initialSkill={initialSkill}
            />
          </div>
        </div>
      </div>
    </>
  );
};
