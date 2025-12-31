import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Wand2, MapPin, Building2, Layers } from 'lucide-react';
import { generateSurveyQuestions } from '../services/geminiService';
import { AccountSetup, Location } from '../types';
import MapArea from './MapArea';

interface WizardProps {
  onComplete: (config: AccountSetup) => void;
  onCancel: () => void;
}

const Wizard: React.FC<WizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AccountSetup>({
    organizationName: '',
    regionCode: '',
    focusArea: 'Urban Development',
    center: { x: 50, y: 50 },
    questions: []
  });

  const handleNext = async () => {
    if (step === 2) {
      setIsLoading(true);
      const questions = await generateSurveyQuestions(formData.organizationName, formData.focusArea);
      setFormData(prev => ({ ...prev, questions }));
      setIsLoading(false);
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Organization Name</label>
        <input
          type="text"
          value={formData.organizationName}
          onChange={e => setFormData({ ...formData, organizationName: e.target.value })}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="e.g. City of Springfield"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Region Code (Prefix)</label>
        <input
          type="text"
          value={formData.regionCode}
          onChange={e => setFormData({ ...formData, regionCode: e.target.value.toUpperCase().slice(0, 4) })}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
          placeholder="e.g. SPFD"
          maxLength={4}
        />
        <p className="text-xs text-slate-500">Used for database table prefixes (e.g. SPFD_users)</p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Focus Area</label>
        <select
          value={formData.focusArea}
          onChange={e => setFormData({ ...formData, focusArea: e.target.value })}
          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
      <p className="text-sm text-slate-600">Click on the map to define the center of your engagement zone.</p>
      <div className="flex-1 relative rounded-lg overflow-hidden border border-slate-300">
        <MapArea
          feedbackList={[]}
          onMapClick={(loc) => setFormData({ ...formData, center: loc })}
        />
        {/* Simulating the polygon overlay */}
        <div 
            className="absolute border-4 border-indigo-500/30 bg-indigo-500/10 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{ 
                left: `${formData.center.x}%`, 
                top: `${formData.center.y}%`,
                width: '30%',
                height: '40%'
            }}
        />
        <div 
            className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{ left: `${formData.center.x}%`, top: `${formData.center.y}%` }}
        >
            <MapPin className="text-indigo-600 drop-shadow-md" size={40} fill="currentColor" />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">AI Suggested Questions</h3>
        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center">
            <Wand2 size={12} className="mr-1" /> Gemini Powered
        </span>
      </div>
      
      {isLoading ? (
        <div className="py-12 flex flex-col items-center text-slate-400 space-y-3">
             <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
             <p>Generating tailored questions...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {formData.questions.map((q, i) => (
                <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg flex items-start space-x-3 shadow-sm">
                    <div className="mt-1 min-w-[20px] h-5 flex items-center justify-center bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
                        {i + 1}
                    </div>
                    <p className="text-slate-700 text-sm">{q}</p>
                </div>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Setup Wizard</h2>
            <p className="text-slate-400 text-sm">Provision your EchoSphere tenant</p>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>1</span>
            <div className="w-8 h-0.5 bg-slate-700"></div>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>2</span>
            <div className="w-8 h-0.5 bg-slate-700"></div>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>3</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between">
            {step > 1 ? (
                <button onClick={handleBack} className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>
            ) : (
                <button onClick={onCancel} className="px-4 py-2 text-slate-500 hover:text-red-500 transition-colors">
                    Cancel
                </button>
            )}

            {step < 3 ? (
                <button 
                    onClick={handleNext} 
                    disabled={step === 1 && (!formData.organizationName || !formData.regionCode)}
                    className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200"
                >
                    <span>Next Step</span>
                    <ArrowRight size={18} />
                </button>
            ) : (
                <button 
                    onClick={() => onComplete(formData)} 
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                >
                    <span>Provision Tenant</span>
                    <Check size={18} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Wizard;