import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { Sparkles, ArrowRight, BookOpen, Target, BrainCircuit } from 'lucide-react';

interface InputFormProps {
  onSubmit: (prefs: UserPreferences) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserPreferences>({
    targetSkill: '',
    currentLevel: 'Beginner',
    background: '',
    learningStyle: 'balanced'
  });

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

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      
      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-100">
        <div 
          className="h-full bg-brand-500 transition-all duration-500 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-8 md:p-12">
        {/* Step 1: Target */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-brand-100 rounded-lg text-brand-600">
                <Target size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">What do you want to learn?</h2>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-500">Target Skill / Technology</label>
              <input
                type="text"
                value={formData.targetSkill}
                onChange={(e) => handleChange('targetSkill', e.target.value)}
                placeholder="e.g., React Native, Python for Data Science, Kubernetes..."
                className="w-full text-lg p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
                autoFocus
              />
              <p className="text-sm text-slate-400">Be as specific as you like!</p>
            </div>
          </div>
        )}

        {/* Step 2: Context */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                <BrainCircuit size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Current Knowledge</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">How would you rate your current skill level in this area?</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleChange('currentLevel', level)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        formData.currentLevel === level
                          ? 'bg-brand-50 border-brand-500 text-brand-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">What is your background?</label>
                <textarea
                  value={formData.background}
                  onChange={(e) => handleChange('background', e.target.value)}
                  placeholder="e.g., I'm a frontend dev looking to go fullstack, or I know basic Java..."
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none h-32"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Style */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-teal-100 rounded-lg text-teal-600">
                <BookOpen size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Learning Preferences</h2>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-500 mb-2">How do you prefer to learn?</label>
              <div className="space-y-3">
                {[
                  { id: 'theory', title: 'Theory First', desc: 'Deep dive into concepts before coding.' },
                  { id: 'practical', title: 'Project Based', desc: 'Learn by building things immediately.' },
                  { id: 'balanced', title: 'Balanced', desc: 'A mix of concepts and hands-on practice.' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleChange('learningStyle', style.id)}
                    className={`w-full flex items-center p-4 rounded-xl border transition-all text-left ${
                      formData.learningStyle === style.id
                        ? 'bg-teal-50 border-teal-500 shadow-md ring-1 ring-teal-500'
                        : 'bg-white border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div>
                      <div className={`font-semibold ${formData.learningStyle === style.id ? 'text-teal-900' : 'text-slate-700'}`}>
                        {style.title}
                      </div>
                      <div className="text-sm text-slate-500">{style.desc}</div>
                    </div>
                    {formData.learningStyle === style.id && (
                      <div className="ml-auto text-teal-600">
                        <Sparkles size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-slate-500 font-medium hover:text-slate-800 transition-colors"
            >
              Back
            </button>
          ) : (
            <div /> // Spacer
          )}
          
          <button
            onClick={handleNext}
            disabled={!isStepValid() || isLoading}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white transition-all transform active:scale-95 ${
              !isStepValid() || isLoading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-700 shadow-lg hover:shadow-brand-500/30'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>{step === 3 ? 'Generate Roadmap' : 'Next Step'}</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};