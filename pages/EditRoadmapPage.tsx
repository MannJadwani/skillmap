import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { fetchRoadmapById, updateRoadmap, SavedRoadmap } from '../services/roadmapService';
import { generateRoadmap } from '../services/geminiService';
import { UserPreferences, Roadmap } from '../types';
import { SEO } from '../components/SEO';
import { Loader2, ArrowRight } from 'lucide-react';

export const EditRoadmapPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const [savedRoadmap, setSavedRoadmap] = useState<SavedRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const loadRoadmap = async () => {
      if (!id || !user?.id) {
        setUnauthorized(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const saved = await fetchRoadmapById(id, false); // Don't increment views on edit page
      
      if (!saved) {
        setError('Roadmap not found');
        setIsLoading(false);
        return;
      }

      // Check if user owns this roadmap
      if (saved.user_id !== user.id) {
        setUnauthorized(true);
        setIsLoading(false);
        return;
      }

      setSavedRoadmap(saved);
      setIsLoading(false);
    };

    loadRoadmap();
  }, [id, user?.id]);

  const handleUpdate = async (prefs: UserPreferences) => {
    if (!id || !user?.id || !savedRoadmap) return;

    setIsSaving(true);
    setError(null);

    try {
      // Re-generate the roadmap with new preferences
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
        setError('API key not found');
        setIsSaving(false);
        return;
      }

      const updatedRoadmap = await generateRoadmap(prefs, apiKey);

      // Update in database
      const updated = await updateRoadmap(id, updatedRoadmap, prefs, user.id);

      if (updated) {
        // Navigate back to the roadmap view
        navigate(`/roadmap/${id}`);
      } else {
        setError('Failed to update roadmap');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/20 rounded-full mb-4 border border-red-900/30">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-dark-400 mb-6">
            You can only edit roadmaps that you created.
          </p>
          <Link
            to={id ? `/roadmap/${id}` : '/'}
            className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors inline-block"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  if (!savedRoadmap) {
    return null;
  }

  // Pre-fill form with existing data
  const initialPreferences: UserPreferences = {
    targetSkill: savedRoadmap.target_skill,
    currentLevel: savedRoadmap.current_level,
    background: '', // We don't store this, so leave empty
    learningStyle: 'balanced', // Default
  };

  return (
    <>
      <SEO 
        title={`Edit ${savedRoadmap.title} — SkillMap AI`}
        description={`Edit your learning roadmap for ${savedRoadmap.target_skill}. Update your preferences and regenerate the path.`}
        url={`https://skillmap.neuralarc.in/edit/${id}`}
      />
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-dark-950 relative overflow-hidden min-h-screen">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl w-full text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight leading-none uppercase">
            Edit Your Roadmap
          </h1>
          <div className="font-script text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-primary pb-3 transform -rotate-2 mt-1">
            {savedRoadmap.target_skill}
          </div>
          <p className="text-dark-400 mt-4">
            Update your preferences to regenerate the learning path
          </p>
        </div>

        <div className="w-full flex justify-center z-10">
          {error && (
            <div className="absolute top-24 mx-auto bg-red-900/20 text-red-400 px-4 py-2 rounded-lg border border-red-900/50 text-sm animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          
          <div className="w-full max-w-3xl">
            <Link
              to={id ? `/roadmap/${id}` : '/'}
              className="mb-4 text-sm text-dark-400 hover:text-white transition-colors flex items-center gap-1 inline-block"
            >
              ← Back to roadmap
            </Link>
            <EditForm 
              onSubmit={handleUpdate} 
              isLoading={isSaving} 
              initialPreferences={initialPreferences}
            />
          </div>
        </div>
      </div>
    </>
  );
};

// Wrapper component that pre-fills the form
interface EditFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isLoading: boolean;
  initialPreferences: UserPreferences;
}

const EditForm: React.FC<EditFormProps> = ({ onSubmit, isLoading, initialPreferences }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserPreferences>(initialPreferences);

  useEffect(() => {
    // Update form data when initialPreferences change
    setFormData(initialPreferences);
  }, [initialPreferences]);

  const handleChange = (field: keyof UserPreferences, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onSubmit(formData);
  };

  const isStepValid = () => {
    if (step === 1) return formData.targetSkill.trim().length > 1;
    if (step === 2) return formData.background.trim().length > 1;
    return true;
  };

  // Use the same InputForm component but with pre-filled data
  return (
    <div className="w-full max-w-3xl mx-auto bg-[#1e1e1e] rounded-xl shadow-2xl border border-[#2c2c2c] overflow-hidden">
      <div className="bg-[#252525] px-6 py-4 border-b border-[#2c2c2c] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-white font-semibold text-lg tracking-tight">
            {step === 1 && "Update Target Skill"}
            {step === 2 && "Update Context"}
            {step === 3 && "Update Learning Style"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 bg-[#333] rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <span className="text-xs text-dark-400 font-mono">{step}/3</span>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Step 1: Target */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-dark-400 uppercase tracking-wider text-xs">Target Skill</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={formData.targetSkill}
                    onChange={(e) => handleChange('targetSkill', e.target.value)}
                    placeholder="e.g. React Native, Python, Kubernetes..."
                    className="w-full bg-[#121212] text-white text-lg py-3 px-4 rounded-lg border border-[#333] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none placeholder:text-dark-500"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-dark-500">Update the skill you want to learn</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Context */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-400 uppercase tracking-wider text-xs">Current Level</label>
                <div className="flex p-1 bg-[#121212] rounded-lg border border-[#333] w-full">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleChange('currentLevel', level)}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        formData.currentLevel === level
                          ? 'bg-[#2c2c2c] text-white shadow-sm border border-[#3e3e3e]'
                          : 'text-dark-500 hover:text-dark-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-dark-400 uppercase tracking-wider text-xs">Background Context</label>
                <textarea
                  value={formData.background}
                  onChange={(e) => handleChange('background', e.target.value)}
                  placeholder="Describe your current background and experience..."
                  className="w-full bg-[#121212] text-white text-sm py-3 px-4 rounded-lg border border-[#333] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none resize-none h-24 placeholder:text-dark-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Style */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <label className="text-sm font-medium text-dark-400 uppercase tracking-wider text-xs">Learning Style</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'theory', title: 'Theory First', desc: 'Deep Concepts' },
                  { id: 'practical', title: 'Project Based', desc: 'Build & Learn' },
                  { id: 'balanced', title: 'Balanced', desc: 'Mix of Both' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleChange('learningStyle', style.id)}
                    className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                      formData.learningStyle === style.id
                        ? 'bg-[#252525] border-primary/50 ring-1 ring-primary/20'
                        : 'bg-[#121212] border-[#333] hover:border-[#444]'
                    }`}
                  >
                    <div className={`font-medium text-sm ${formData.learningStyle === style.id ? 'text-white' : 'text-dark-300'}`}>
                      {style.title}
                    </div>
                    <div className="text-xs text-dark-500 mt-1">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer / Actions */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-[#2c2c2c]">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-dark-400 text-sm font-medium hover:text-white transition-colors px-2"
            >
              Back
            </button>
          ) : (
            <div /> 
          )}
          
          <button
            onClick={handleNext}
            disabled={!isStepValid() || isLoading}
            className={`group flex items-center gap-2 pl-5 pr-1.5 py-1.5 rounded-full font-bold text-white transition-all transform hover:-translate-y-0.5 shadow-lg ${
              !isStepValid() || isLoading
                ? 'bg-[#2c2c2c] text-dark-500 cursor-not-allowed shadow-none transform-none'
                : 'bg-gradient-to-r from-primary to-orange-400 shadow-primary/20 hover:shadow-primary/40'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-3 pr-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Updating...</span>
              </div>
            ) : (
              <>
                <span className="text-sm">{step === 3 ? 'Update Roadmap' : 'Next'}</span>
                <div className={`bg-white text-primary rounded-full p-1.5 shadow-sm ${(!isStepValid() || isLoading) ? 'opacity-50' : 'group-hover:scale-110 transition-transform duration-200'}`}>
                  <ArrowRight size={16} />
                </div>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
