import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Wand2, MapPin, Building2, Layers, Loader2, AlertCircle } from 'lucide-react';
import { generateSurveyQuestions } from '../services/geminiService';
import { AccountSetup, Location } from '../types';
import { dataService } from '../services/dataService';
import MapArea from './MapArea';

interface WizardProps {
  onComplete: (config: AccountSetup) => void;
  onCancel: () => void;
}

const Wizard: React.FC<WizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccountSetup>({
    organizationName: '',
    regionCode: '',
    focusArea: 'Urban Development',
    center: { x: -74.0060, y: 40.7128 }, 
    questions: []
  });

  const handleNext = async () => {
    setError(null);
    if (step === 2) {
      setIsLoading(true);
      const questions = await generateSurveyQuestions(formData.organizationName, formData.focusArea);
      setFormData(prev => ({ ...prev, questions }));
      setIsLoading(false);
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleLaunch = async () => {
    setIsSaving(true);
    setError(null);
    
    // Create actual DB entry for tenant
    const result = await dataService.createOrganization(formData);
    
    setIsSaving(false);
    
    if (result) {
        onComplete(formData);
    } else {
        // If result is null, it means cloud provisioning failed (check console)
        if (dataService.isProduction()) {
            setError("Failed to create organization in database. Check your connection or API keys.");
        } else {
            // Local mode always succeeds
            onComplete(formData);
        }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <label className="block text-xs font-bold text-zinc-500 uppercase">Organization Name</label>
        <input
          type="text"
          value={formData.organizationName}
          onChange={e => setFormData({ ...formData, organizationName: e.target.value })}
          className="w-full p-3 bg-black border border-zinc-800 rounded focus:border-orange-500 outline-none text-zinc-200"
          placeholder="e.g. Metro City or Community Group"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-bold text-zinc-500 uppercase">Region ID (Short Code)</label>
        <input
          type="text"
          value={formData.regionCode}
          onChange={e => setFormData({ ...formData, regionCode: e.target.value.toUpperCase().slice(0, 4) })}
          className="w-full p-3 bg-black border border-zinc-800 rounded focus:border-orange-500 outline-none text-zinc-200 font-mono"
          placeholder="MCTY"
          maxLength={4}
        />
        <p className="text-[10px] text-zinc-600">Used for internal identifiers (Max 4 chars)</p>
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-bold text-zinc-500 uppercase">Focus Area</label>
        <select
          value={formData.focusArea}
          onChange={e => setFormData({ ...formData, focusArea: e.target.value })}
          className="w-full p-3 bg-black border border-zinc-800 rounded focus:border-orange-500 outline-none text-zinc-200"
        >
          <option>Urban Development</option>
          <option>Parks & Recreation</option>
          <option>Public Safety</option>
          <option>Transportation</option>
          <option>Sustainability</option>
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 animate-fade-in-up h-[400px] flex flex-col">
      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-400">Select default map location</p>
        <div className="text-[10px] font-mono text-orange-500">
            {formData.center.y.toFixed(4)}, {formData.center.x.toFixed(4)}
        </div>
      </div>
      <div className="flex-1 relative rounded border border-zinc-800 overflow-hidden">
        <MapArea
          feedbackList={[]}
          onMapClick={(loc) => setFormData({ ...formData, center: loc })}
          center={formData.center}
          showSelectionMarker={true}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white font-display">Survey Questions</h3>
        <span className="text-[10px] px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full border border-purple-500/30 flex items-center">
            <Wand2 size={10} className="mr-1" /> AI Generated
        </span>
      </div>
      
      {isLoading ? (
        <div className="py-12 flex flex-col items-center text-zinc-500 space-y-4">
             <div className="w-10 h-10 border-2 border-zinc-800 border-t-orange-500 rounded-full animate-spin"></div>
             <p className="text-xs font-medium animate-pulse">Generating questions based on your focus area...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {formData.questions.map((q, i) => (
                <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded flex items-start space-x-3">
                    <div className="mt-0.5 min-w-[20px] h-5 flex items-center justify-center bg-orange-500/10 text-orange-500 text-[10px] font-bold rounded-full border border-orange-500/20">
                        {i + 1}
                    </div>
                    <p className="text-zinc-300 text-sm">{q}</p>
                </div>
            ))}
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded flex items-start space-x-3 text-red-400">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-950 w-full max-w-2xl rounded-lg shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-zinc-900 p-6 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Create Workspace</h2>
            <p className="text-zinc-500 text-xs">Set up your organization details</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-600'}`}>1</span>
            <div className="w-6 h-[1px] bg-zinc-800"></div>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-600'}`}>2</span>
            <div className="w-6 h-[1px] bg-zinc-800"></div>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-orange-600 text-black' : 'bg-zinc-800 text-zinc-600'}`}>3</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex justify-between">
            {step > 1 ? (
                <button onClick={handleBack} disabled={isSaving} className="flex items-center space-x-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors text-xs uppercase font-bold">
                    <ArrowLeft size={14} />
                    <span>Back</span>
                </button>
            ) : (
                <button onClick={onCancel} disabled={isSaving} className="px-4 py-2 text-zinc-500 hover:text-red-400 transition-colors text-xs uppercase font-bold">
                    Cancel
                </button>
            )}

            {step < 3 ? (
                <button 
                    onClick={handleNext} 
                    disabled={step === 1 && (!formData.organizationName || !formData.regionCode)}
                    className="flex items-center space-x-2 px-6 py-2 bg-orange-600 text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition-all"
                >
                    <span>Next</span>
                    <ArrowRight size={14} />
                </button>
            ) : (
                <button 
                    onClick={handleLaunch}
                    disabled={isSaving} 
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-green-500 transition-all shadow-lg disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{isSaving ? 'Launching...' : 'Launch'}</span>
                </button>
            )}
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #18181b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default Wizard;