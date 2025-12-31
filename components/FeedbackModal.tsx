import React, { useState, useEffect } from 'react';
import { X, Loader2, Send, Mic, MicOff, Image as ImageIcon, Video, Paperclip, User, Trash2 } from 'lucide-react';
import { analyzeFeedbackContent } from '../services/geminiService';
import { Location, Feedback } from '../types';

interface FeedbackModalProps {
  location: Location;
  onClose: () => void;
  onSubmit: (feedback: Feedback) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ location, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Simple browser speech recognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
       // Browser doesn't support speech API
       return;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
        setIsListening(false);
        // Stop logic would normally go here if we kept a ref to the recognition instance
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setContent(prev => prev + (prev ? ' ' : '') + transcript);
        };
        recognition.start();
    } else {
        alert("Speech recognition is not supported in this browser.");
    }
  };

  const toggleAttachment = (type: string) => {
    if (attachments.includes(type)) {
        setAttachments(prev => prev.filter(t => t !== type));
    } else {
        setAttachments(prev => [...prev, type]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsAnalyzing(true);
    
    // Call Gemini API to analyze the text
    const analysis = await analyzeFeedbackContent(content);

    // Generate a simple ID (safer than crypto.randomUUID in some envs)
    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    const newFeedback: Feedback = {
      id: newId,
      location,
      content,
      timestamp: new Date(),
      sentiment: analysis.sentiment,
      category: analysis.category,
      summary: analysis.summary,
      votes: 0,
      authorName: authorName.trim() || 'Anonymous Citizen',
      attachments: attachments as any,
      ecoImpactScore: analysis.ecoImpactScore,
      ecoImpactReasoning: analysis.ecoImpactReasoning
    };

    onSubmit(newFeedback);
    setIsAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Submit Feedback</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center space-x-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
            <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded">
              LAT: {location.y.toFixed(4)}
            </span>
            <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded">
              LNG: {location.x.toFixed(4)}
            </span>
            <span>Pin Location</span>
          </div>

          {/* Identity Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Name <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                </div>
                <input 
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-700"
                    placeholder="Anonymous Citizen"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              What's on your mind?
            </label>
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-slate-700"
                placeholder="Describe an issue, suggest an improvement, or share something you love..."
                required
              />
              <div className="absolute bottom-3 right-3 flex space-x-2">
                 <button 
                    type="button" 
                    onClick={toggleListening}
                    className={`p-2 shadow-sm border rounded-full transition-all ${
                        isListening 
                        ? 'bg-red-500 text-white border-red-600 animate-pulse' 
                        : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-500'
                    }`}
                    title="Dictate Feedback"
                >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
            </div>
            {isListening && <p className="text-xs text-red-500 mt-1 animate-pulse">Listening...</p>}
          </div>
          
          {/* Multimodal Inputs */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Evidence
            </label>
            
            {/* Simulation of Files */}
            <div className="space-y-3">
                {attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                        {attachments.includes('image') && (
                            <div className="relative group bg-slate-100 rounded-lg overflow-hidden border border-slate-200 h-24 flex items-center justify-center">
                                {/* Simulated Thumbnail */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-100"></div>
                                <ImageIcon className="text-indigo-300 relative z-10" size={32} />
                                <button type="button" onClick={() => toggleAttachment('image')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"><X size={12} /></button>
                                <span className="absolute bottom-1 left-2 text-[10px] font-mono text-slate-500 z-10">photo_01.jpg</span>
                            </div>
                        )}
                        {attachments.includes('video') && (
                            <div className="relative group bg-slate-100 rounded-lg overflow-hidden border border-slate-200 h-24 flex items-center justify-center">
                                {/* Simulated Thumbnail */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-100 to-blue-100"></div>
                                <Video className="text-cyan-300 relative z-10" size={32} />
                                <button type="button" onClick={() => toggleAttachment('video')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"><X size={12} /></button>
                                <span className="absolute bottom-1 left-2 text-[10px] font-mono text-slate-500 z-10">video_clip.mp4</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3">
                    {!attachments.includes('image') && (
                        <button 
                            type="button"
                            onClick={() => toggleAttachment('image')}
                            className="flex-1 flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all"
                        >
                            <ImageIcon size={18} className="mr-2" />
                            <span className="text-xs font-medium">Upload Photo</span>
                        </button>
                    )}
                    {!attachments.includes('video') && (
                        <button 
                            type="button"
                            onClick={() => toggleAttachment('video')}
                            className="flex-1 flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all"
                        >
                            <Video size={18} className="mr-2" />
                            <span className="text-xs font-medium">Upload Video</span>
                        </button>
                    )}
                </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isAnalyzing || !content.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Analyzing with Gemini...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
          
          <p className="text-xs text-center text-slate-400">
            AI will analyze text and media for sentiment & safety.
          </p>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;