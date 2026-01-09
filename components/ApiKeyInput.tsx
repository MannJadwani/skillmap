import React, { useState } from 'react';
import { Key, ArrowRight, ExternalLink } from 'lucide-react';

interface ApiKeyInputProps {
  onSubmit: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSubmit }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSubmit(key.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen">
      <div className="max-w-md w-full bg-dark-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-dark-700 p-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-dark-700 rounded-full text-primary mb-4 border border-dark-600">
            <Key size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to SkillMap AI</h1>
          <p className="text-dark-400">To generate your personalized learning roadmap, please enter your Google Gemini API key.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1">API Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 rounded-lg border border-dark-700 bg-dark-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-sm placeholder:text-dark-500"
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={!key.trim()}
            className="group w-full flex items-center justify-between bg-gradient-to-r from-primary to-orange-400 text-white font-bold py-2 pl-6 pr-2 rounded-full shadow-lg shadow-primary/40 hover:shadow-xl hover:shadow-primary/50 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="text-lg">Get Started</span>
            <div className="bg-white text-primary rounded-full p-2 shadow-sm group-hover:scale-110 transition-transform duration-200">
              <ArrowRight size={20} />
            </div>
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-dark-700 text-center">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-hover font-medium"
          >
            <span>Get a free API key</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};