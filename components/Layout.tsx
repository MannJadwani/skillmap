import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton, useAuth } from '@clerk/clerk-react';
import { Map, Search, LayoutGrid } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showNav = true }) => {
  const location = useLocation();
  const { isSignedIn } = useAuth();
  const apiKey = localStorage.getItem('gemini_api_key');

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    window.location.href = '/';
  };

  if (!showNav) {
    return <>{children}</>;
  }

  // Don't show nav on roadmap page (it has its own sidebar)
  if (location.pathname.startsWith('/roadmap/')) {
    return <>{children}</>;
  }

  const isSearch = location.pathname === '/' || location.pathname === '/create';
  const isBrowse = location.pathname === '/browse';

  return (
    <div className="min-h-screen bg-dark-950 text-white font-sans">
      <header className="fixed top-0 w-full bg-dark-900/80 backdrop-blur-md border-b border-dark-700 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            to="/"
            className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
          >
            <div className="p-2 bg-dark-800 rounded-lg border border-dark-700">
              <Map size={20} className="text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">SkillMap AI</span>
          </Link>
          
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-dark-800 p-1 rounded-lg border border-dark-700">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isSearch
                  ? 'bg-primary text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <Search size={14} />
              <span className="hidden sm:inline">Search</span>
            </Link>
            <Link
              to="/browse"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isBrowse
                  ? 'bg-primary text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Browse All</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {isSignedIn && apiKey && (
              <button 
                onClick={handleClearKey}
                className="text-sm font-medium text-dark-400 hover:text-white transition-colors hidden sm:block"
              >
                Change API Key
              </button>
            )}
            {isSignedIn && (
              <UserButton afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9 border border-dark-700"
                  }
                }}
              />
            )}
          </div>
        </div>
      </header>
      <main className={showNav ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  );
};
