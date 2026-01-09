import React, { useState, useEffect, useCallback } from 'react';
import { SavedRoadmap, searchRoadmaps } from '../services/roadmapService';
import { Search, ArrowRight, Map, Eye, Clock, User, Loader2, Zap, LayoutGrid } from 'lucide-react';

interface SearchFirstProps {
  onSelectRoadmap: (roadmap: SavedRoadmap) => void;
  onGenerateNew: (skill: string) => void;
  onBrowseAll?: () => void;
}

export const SearchFirst: React.FC<SearchFirstProps> = ({ onSelectRoadmap, onGenerateNew, onBrowseAll }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SavedRoadmap[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const data = await searchRoadmaps(query, 6);
      setResults(data);
      setIsSearching(false);
      setHasSearched(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleGenerate = () => {
    if (query.trim()) {
      onGenerateNew(query.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-dark-500" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What skill do you want to learn? (e.g., React, Python, Machine Learning)"
          className="w-full bg-[#1e1e1e] text-white text-lg py-4 pl-14 pr-4 rounded-2xl border border-[#2c2c2c] focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-dark-600"
          autoFocus
        />
      </div>

      {/* Results Section */}
      {query.trim() && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Generate New Option - Always show when there's a query */}
          <button
            onClick={handleGenerate}
            className="w-full group bg-gradient-to-r from-primary/10 to-orange-400/10 hover:from-primary/20 hover:to-orange-400/20 border border-primary/30 hover:border-primary/50 rounded-xl p-4 text-left transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary to-orange-400 rounded-xl shadow-lg shadow-primary/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Generate New Roadmap</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">AI</span>
                </div>
                <p className="text-sm text-dark-400 mt-0.5">
                  Create a personalized learning path for "{query}"
                </p>
              </div>
              <div className="bg-primary text-white rounded-full p-2 group-hover:scale-110 transition-transform">
                <ArrowRight size={18} />
              </div>
            </div>
          </button>

          {/* Existing Roadmaps */}
          {hasSearched && (
            <div className="space-y-3">
              {results.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-dark-500 uppercase tracking-wider font-medium">
                      Existing Roadmaps
                    </span>
                    <div className="flex-1 h-px bg-dark-800"></div>
                    <span className="text-xs text-dark-600">{results.length} found</span>
                  </div>
                  
                  <div className="grid gap-3">
                    {results.map((roadmap) => (
                      <button
                        key={roadmap.id}
                        onClick={() => onSelectRoadmap(roadmap)}
                        className="group bg-[#1e1e1e] border border-[#2c2c2c] hover:border-[#3e3e3e] rounded-xl p-4 text-left transition-all hover:bg-[#252525]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-dark-800 rounded-lg border border-dark-700 mt-0.5">
                            <Map className="w-4 h-4 text-dark-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate group-hover:text-primary transition-colors">
                              {roadmap.target_skill}
                            </h3>
                            <p className="text-sm text-dark-500 line-clamp-1 mt-0.5">
                              {roadmap.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-dark-600">
                              <span className="flex items-center gap-1">
                                <Map className="w-3 h-3" />
                                {roadmap.nodes.length} steps
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {roadmap.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {roadmap.user_name}
                              </span>
                              <span className="flex items-center gap-1 ml-auto">
                                <Clock className="w-3 h-3" />
                                {formatDate(roadmap.created_at)}
                              </span>
                            </div>
                          </div>
                          <div className="p-1.5 bg-dark-800 rounded-full border border-dark-700 group-hover:bg-primary group-hover:border-primary transition-colors">
                            <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 bg-[#1e1e1e] rounded-xl border border-[#2c2c2c]">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-dark-800 rounded-full mb-3">
                    <Search className="w-5 h-5 text-dark-500" />
                  </div>
                  <p className="text-dark-400 text-sm">
                    No existing roadmaps found for "{query}"
                  </p>
                  <p className="text-dark-600 text-xs mt-1">
                    Generate a new one with AI above!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State - No Query */}
      {!query.trim() && (
        <div className="text-center py-8">
          <p className="text-dark-500 text-sm mb-4">
            Start typing to search existing roadmaps or generate a new one
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['React', 'Python', 'Machine Learning', 'TypeScript', 'Docker'].map((skill) => (
              <button
                key={skill}
                onClick={() => setQuery(skill)}
                className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-dark-400 hover:text-white text-sm rounded-lg border border-dark-700 transition-colors"
              >
                {skill}
              </button>
            ))}
          </div>
          
          {onBrowseAll && (
            <div className="pt-4 border-t border-dark-800">
              <button
                onClick={onBrowseAll}
                className="inline-flex items-center gap-2 text-dark-400 hover:text-primary transition-colors text-sm"
              >
                <LayoutGrid size={16} />
                <span>Or browse all community roadmaps</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
