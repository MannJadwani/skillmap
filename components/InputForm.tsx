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
    <div className="w-full max-w-3xl mx-auto bg-[#1e1e1e] rounded-xl shadow-2xl border border-[#2c2c2c] overflow-hidden">
      
      {/* Header / Progress Bar */}
      <div className="bg-[#252525] px-6 py-4 border-b border-[#2c2c2c] flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="text-white font-semibold text-lg tracking-tight">
              {step === 1 && "Start a New Path"}
              {step === 2 && "Refine Context"}
              {step === 3 && "Customize Style"}
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
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-500 group-focus-within:text-primary transition-colors">
                      <Target size={18} />
                    </div>
                    <input
                      type="text"
                      value={formData.targetSkill}
                      onChange={(e) => handleChange('targetSkill', e.target.value)}
                      placeholder="e.g. React Native, Python, Kubernetes..."
                      className="w-full bg-[#121212] text-white text-lg py-3 pl-11 pr-4 rounded-lg border border-[#333] focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none placeholder:text-dark-600"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-dark-500">Be specific! The more details, the better the roadmap.</p>
               </div>
            </div>
          </div>
        )}

        {/* Step 2: Context */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-6">
              
              {/* Toolbar-like Toggle Group */}
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
                <div className="relative group">
                   <div className="absolute top-3 left-4 text-dark-500 group-focus-within:text-purple-400 transition-colors">
                      <BrainCircuit size={18} />
                   </div>
                   <textarea
                    value={formData.background}
                    onChange={(e) => handleChange('background', e.target.value)}
                    placeholder="Briefly describe your background (e.g. 'I know JS, want to learn Python')"
                    className="w-full bg-[#121212] text-white text-sm py-3 pl-11 pr-4 rounded-lg border border-[#333] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none resize-none h-24 placeholder:text-dark-600"
                  />
                </div>
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
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">Generating...</span>
              </div>
            ) : (
              <>
                <span className="text-sm">{step === 3 ? 'Generate' : 'Next'}</span>
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