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
    <div className="w-full max-w-2xl mx-auto bg-dark-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-dark-700 overflow-hidden">
      
      {/* Progress Bar */}
      <div className="h-1 w-full bg-dark-700">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-8 md:p-12">
        {/* Step 1: Target */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-dark-700 rounded-lg text-primary border border-dark-600">
                <Target size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">What do you want to learn?</h2>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-dark-400">Target Skill / Technology</label>
              <input
                type="text"
                value={formData.targetSkill}
                onChange={(e) => handleChange('targetSkill', e.target.value)}
                placeholder="e.g., React Native, Python for Data Science, Kubernetes..."
                className="w-full text-lg p-4 rounded-xl border border-dark-700 bg-dark-900 text-white placeholder:text-dark-500 focus:bg-dark-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                autoFocus
              />
              <p className="text-sm text-dark-500">Be as specific as you like!</p>
            </div>
          </div>
        )}

        {/* Step 2: Context */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-900/20 rounded-lg text-purple-400 border border-purple-900/30">
                <BrainCircuit size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">Current Knowledge</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">How would you rate your current skill level in this area?</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleChange('currentLevel', level)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        formData.currentLevel === level
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-dark-900 border-dark-700 text-dark-400 hover:bg-dark-800 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">What is your background?</label>
                <textarea
                  value={formData.background}
                  onChange={(e) => handleChange('background', e.target.value)}
                  placeholder="e.g., I'm a frontend dev looking to go fullstack, or I know basic Java..."
                  className="w-full p-4 rounded-xl border border-dark-700 bg-dark-900 text-white placeholder:text-dark-500 focus:bg-dark-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none h-32"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Style */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-teal-900/20 rounded-lg text-teal-400 border border-teal-900/30">
                <BookOpen size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">Learning Preferences</h2>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-dark-400 mb-2">How do you prefer to learn?</label>
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
                        ? 'bg-primary/10 border-primary shadow-md ring-1 ring-primary'
                        : 'bg-dark-900 border-dark-700 hover:border-primary/50 text-dark-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className={`font-semibold ${formData.learningStyle === style.id ? 'text-primary' : 'text-white'}`}>
                        {style.title}
                      </div>
                      <div className="text-sm text-dark-500">{style.desc}</div>
                    </div>
                    {formData.learningStyle === style.id && (
                      <div className="ml-auto text-primary">
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
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-dark-700">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-dark-400 font-medium hover:text-white transition-colors"
            >
              Back
            </button>
          ) : (
            <div /> // Spacer
          )}
          
          <button
            onClick={handleNext}
            disabled={!isStepValid() || isLoading}
            className={`group flex items-center gap-3 pl-6 pr-2 py-2 rounded-full font-bold text-white transition-all transform hover:-translate-y-0.5 shadow-lg ${
              !isStepValid() || isLoading
                ? 'bg-dark-700 text-dark-500 cursor-not-allowed shadow-none transform-none'
                : 'bg-gradient-to-r from-primary to-orange-400 shadow-primary/40 hover:shadow-xl hover:shadow-primary/50'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
                <span className="mr-4">Generating...</span>
              </>
            ) : (
              <>
                <span className="text-lg">{step === 3 ? 'Generate Roadmap' : 'Next Step'}</span>
                <div className={`bg-white text-primary rounded-full p-2 shadow-sm ${(!isStepValid() || isLoading) ? 'opacity-50' : 'group-hover:scale-110 transition-transform duration-200'}`}>
                  <ArrowRight size={20} />
                </div>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};