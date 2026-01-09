import React, { useState, useEffect } from 'react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react';
import { Analytics } from '@vercel/analytics/react';
import { InputForm } from './components/InputForm';
import { RoadmapVisualizer } from './components/RoadmapVisualizer';
import { ApiKeyInput } from './components/ApiKeyInput';
import { generateRoadmap } from './services/geminiService';
import { Roadmap, UserPreferences } from './types';
import { Map, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleClearKey = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    setRoadmap(null);
  };

  const handleGenerate = async (prefs: UserPreferences) => {
    if (!apiKey) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateRoadmap(prefs, apiKey);
      setRoadmap(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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
    setRoadmap(null);
    setError(null);
  };

  return (
    <>
      <Analytics />
      {/* Signed Out State - Show Sign In / Sign Up */}
      <SignedOut>
        <div className="min-h-screen bg-dark-950 text-white font-sans bg-dot-pattern flex flex-col items-center justify-center p-4">
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-center gap-2 text-primary mb-6">
              <div className="p-3 bg-dark-800 rounded-xl border border-dark-700">
                <Map size={32} className="text-primary" />
              </div>
              <span className="font-bold text-3xl tracking-tight text-white">SkillMap AI</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Your personalized path to <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">mastering any skill</span>
            </h1>
            <p className="text-lg text-dark-400 max-w-xl mx-auto mb-8">
              Sign in to create AI-powered learning roadmaps tailored to your goals.
            </p>
            <div className="flex items-center justify-center gap-4">
              <SignInButton mode="modal">
                <button className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/25">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-xl transition-colors border border-dark-700 shadow-sm">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </SignedOut>

      {/* Signed In State - Show Main App */}
      <SignedIn>
        {!apiKey ? (
          <div className="min-h-screen bg-dark-950 text-white font-sans bg-dot-pattern">
            <header className="fixed top-0 w-full bg-dark-900/80 backdrop-blur-md border-b border-dark-700 z-50">
              <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <div className="p-2 bg-dark-800 rounded-lg border border-dark-700">
                    <Map size={20} className="text-primary" />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-white">SkillMap AI</span>
                </div>
                <UserButton afterSignOutUrl="/" 
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-9 h-9 border border-dark-700"
                    }
                  }}
                />
              </div>
            </header>
            <div className="pt-16">
              <ApiKeyInput onSubmit={handleSetKey} />
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-dark-950 text-white font-sans selection:bg-primary/30 selection:text-primary">
            
            {/* Navbar (Only show when not in dashboard mode) */}
            {!roadmap && (
              <header className="fixed top-0 w-full bg-dark-900/80 backdrop-blur-md border-b border-dark-700 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <div className="p-2 bg-dark-800 rounded-lg border border-dark-700">
                      <Map size={20} className="text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">SkillMap AI</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleClearKey}
                      className="text-sm font-medium text-dark-400 hover:text-white transition-colors"
                    >
                      Change API Key
                    </button>
                    <UserButton afterSignOutUrl="/" 
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "w-9 h-9 border border-dark-700"
                        }
                      }}
                    />
                  </div>
                </div>
              </header>
            )}

            {/* Main Content Area */}
            <main className={`h-screen flex flex-col ${!roadmap ? 'pt-16' : ''}`}>
              
              {!roadmap ? (
                // Landing / Input State
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-dot-pattern">
                   <div className="max-w-3xl w-full text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-800 border border-dark-700 text-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
                        <Sparkles size={12} />
                        <span>Powered by Gemini 2.0 Flash</span>
                      </div>
                      <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                        Your personalized path to <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">mastering any skill</span>
                      </h1>
                      <p className="text-lg md:text-xl text-dark-400 max-w-2xl mx-auto">
                        Stop guessing what to learn next. Tell us your goal and background, and our AI will engineer a custom step-by-step roadmap for you.
                      </p>
                   </div>

                   <div className="w-full flex justify-center z-10">
                     {error && (
                       <div className="absolute top-24 mx-auto bg-red-900/20 text-red-400 px-4 py-2 rounded-lg border border-red-900/50 text-sm animate-in fade-in slide-in-from-top-2">
                         {error}
                       </div>
                     )}
                     <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
                   </div>
                </div>
              ) : (
                // Roadmap Dashboard State
                <div className="flex h-full overflow-hidden">
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

                     <div className="p-4 border-t border-dark-700 space-y-2">
                       <button 
                         onClick={handleReset}
                         className="w-full py-2 px-4 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-sm font-medium transition-colors border border-dark-700"
                       >
                         Create New Roadmap
                       </button>
                       <button 
                         onClick={handleClearKey}
                         className="w-full py-2 px-4 text-dark-400 hover:text-white text-sm font-medium transition-colors"
                       >
                         Change API Key
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
              )}
            </main>
          </div>
        )}
      </SignedIn>
    </>
  );
};

export default App;
