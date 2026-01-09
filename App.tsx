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
import { Map, Sparkles, ArrowRight } from 'lucide-react';

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
        <div className="min-h-screen bg-dark-950 text-white font-sans relative overflow-hidden flex flex-col items-center justify-center p-4">
          
          {/* Background Effects */}
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            
            {/* Logo / Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-800/50 border border-dark-700/50 text-primary text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-sm shadow-sm">
              <Sparkles size={12} />
              <span>Unlock Your Potential</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-2 tracking-tight leading-none uppercase">
              Your personalized path to
            </h1>
            <div className="font-script text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-primary pb-4 transform -rotate-2 mt-2">
              Mastering any skill
            </div>

            <p className="text-lg md:text-xl text-dark-400 max-w-2xl mx-auto mb-10 leading-relaxed mt-6">
              Stop guessing what to learn next. Tell us your goal, and our AI will engineer a custom, step-by-step roadmap just for you.
            </p>

            <div className="flex items-center justify-center gap-6">
              <SignInButton mode="modal">
                <button className="group flex items-center gap-3 bg-gradient-to-r from-primary to-orange-400 text-white font-bold py-3 pl-8 pr-3 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5">
                  <span className="text-lg">Sign In</span>
                  <div className="bg-white text-primary rounded-full p-2 shadow-sm group-hover:scale-110 transition-transform duration-200">
                    <ArrowRight size={20} />
                  </div>
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-8 py-4 text-dark-400 font-semibold hover:text-white transition-colors text-lg">
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
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-dark-950 relative overflow-hidden">
                   {/* Background Effects */}
                   <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

                   <div className="max-w-4xl w-full text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-800/50 border border-dark-700/50 text-primary text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-sm shadow-sm">
                        <Sparkles size={12} />
                        <span>Unlock Your Potential</span>
                      </div>
                      
                      <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 tracking-tight leading-none uppercase">
                        Your personalized path to
                      </h1>
                      <div className="font-script text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-primary pb-4 transform -rotate-2 mt-1">
                        Mastering any skill
                      </div>
                      
                      <p className="text-lg md:text-xl text-dark-400 max-w-2xl mx-auto mt-6">
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

                     <div className="p-4 border-t border-dark-700 space-y-4">
                       <button 
                         onClick={handleReset}
                         className="group w-full flex items-center justify-between bg-gradient-to-r from-primary to-orange-400 text-white font-bold py-2 pl-4 pr-2 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5"
                       >
                         <span className="text-sm">New Roadmap</span>
                         <div className="bg-white text-primary rounded-full p-1.5 shadow-sm group-hover:scale-110 transition-transform duration-200">
                           <ArrowRight size={16} />
                         </div>
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
