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
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 p-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-brand-100 rounded-full text-brand-600 mb-4">
            <Key size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to SkillMap AI</h1>
          <p className="text-slate-500">To generate your personalized learning roadmap, please enter your Google Gemini API key.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-mono text-sm"
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={!key.trim()}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Get Started</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            <span>Get a free API key</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};