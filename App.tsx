import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useAuth,
} from '@clerk/clerk-react';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from './components/Layout';
import { ApiKeyInput } from './components/ApiKeyInput';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { CreatePage } from './pages/CreatePage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SEO } from './components/SEO';
import { Sparkles, ArrowRight, Map } from 'lucide-react';

// Component to show login prompt
const RequireAuth: React.FC = () => (
  <div className="min-h-screen bg-dark-950 text-white font-sans relative overflow-hidden flex flex-col items-center justify-center p-4">
    <SEO 
      title="Sign In to Create Roadmaps — SkillMap AI"
      description="Sign in to create personalized AI-powered learning roadmaps. Join SkillMap AI to start your learning journey."
      url="https://skillmap.neuralarc.in/create"
    />
    
    <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

    <div className="relative z-10 text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 border border-primary/20">
        <Map className="w-10 h-10 text-primary" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
        Sign In to Create
      </h1>
      <p className="text-lg text-dark-400 mb-8">
        Create personalized learning roadmaps with AI. Sign in to get started.
      </p>

      <div className="flex items-center justify-center gap-4">
        <SignInButton mode="modal">
          <button className="group flex items-center gap-3 bg-gradient-to-r from-primary to-orange-400 text-white font-bold py-3 pl-6 pr-3 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5">
            <span className="text-lg">Sign In</span>
            <div className="bg-white text-primary rounded-full p-2 shadow-sm group-hover:scale-110 transition-transform duration-200">
              <ArrowRight size={18} />
            </div>
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="px-6 py-3 text-dark-400 font-semibold hover:text-white transition-colors">
            Sign Up
          </button>
        </SignUpButton>
      </div>

      <button
        onClick={() => window.history.back()}
        className="mt-6 text-sm text-dark-500 hover:text-white transition-colors"
      >
        ← Go back
      </button>
    </div>
  </div>
);

// Protected Create Route - requires auth and API key
const ProtectedCreateRoute: React.FC = () => {
  const { isSignedIn } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSetKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  if (!isSignedIn) {
    return <RequireAuth />;
  }

  if (!apiKey) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen bg-dark-950 text-white font-sans bg-dot-pattern">
          <header className="fixed top-0 w-full bg-dark-900/80 backdrop-blur-md border-b border-dark-700 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <div className="p-2 bg-dark-800 rounded-lg border border-dark-700">
                  <Map size={20} className="text-primary" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">SkillMap AI</span>
              </div>
            </div>
          </header>
          <div className="pt-16">
            <ApiKeyInput onSubmit={handleSetKey} />
          </div>
        </div>
      </Layout>
    );
  }

  return <CreatePage />;
};

const App: React.FC = () => {
  return (
    <>
      <Analytics />
      <Routes>
        {/* Public routes - accessible to everyone */}
        <Route path="/" element={
          <Layout>
            <HomePage />
          </Layout>
        } />
        
        <Route path="/browse" element={
          <Layout>
            <BrowsePage />
          </Layout>
        } />
        
        <Route path="/roadmap/:id" element={
          <Layout>
            <RoadmapPage />
          </Layout>
        } />
        
        {/* Create route - requires authentication */}
        <Route path="/create" element={<ProtectedCreateRoute />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
