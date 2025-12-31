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
      ecoImpactReasoning: analysis.ecoImpactReasoning,
      riskScore: analysis.riskScore
    };

    onSubmit(newFeedback);
    setIsAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-zinc-800">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-200">New_Entry</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Location Badge */}
          <div className="flex items-center space-x-2 text-xs text-zinc-500 bg-black/50 p-2 rounded border border-zinc-800 font-mono">
            <span className="text-orange-500">LOC::</span>
            <span>{location.y.toFixed(4)}, {location.x.toFixed(4)}</span>
          </div>

          {/* Identity Field */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-widest">
                Identifier (Optional)
            </label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-orange-500 transition-colors">
                    <User size={14} />
                </div>
                <input 
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full pl-9 p-2.5 bg-black border border-zinc-800 rounded focus:border-orange-500 outline-none text-sm text-zinc-300 placeholder-zinc-700 transition-colors font-mono"
                    placeholder="ANONYMOUS_USER"
                />
            </div>
          </div>

          {/* Content Field */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-widest">
              Observation Data
            </label>
            <div className="relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 p-3 bg-black border border-zinc-800 rounded focus:border-orange-500 outline-none resize-none text-sm text-zinc-300 placeholder-zinc-700 transition-colors leading-relaxed"
                placeholder="Enter field report details..."
                required
              />
              <div className="absolute bottom-2 right-2 flex space-x-2">
                 <button 
                    type="button" 
                    onClick={toggleListening}
                    className={`p-1.5 rounded transition-all ${
                        isListening 
                        ? 'bg-red-500/20 text-red-500 border border-red-500 animate-pulse' 
                        : 'bg-zinc-900 border border-zinc-700 text-zinc-500 hover:text-white'
                    }`}
                    title="Dictate"
                >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Multimodal Inputs */}
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 mb-2 uppercase tracking-widest">
                Media Attachments
            </label>
            
            <div className="space-y-3">
                {attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                        {attachments.includes('image') && (
                            <div className="relative group bg-zinc-900 rounded border border-zinc-800 h-20 flex items-center justify-center">
                                <ImageIcon className="text-zinc-600" size={24} />
                                <button type="button" onClick={() => toggleAttachment('image')} className="absolute top-1 right-1 text-zinc-600 hover:text-red-500"><X size={12} /></button>
                                <span className="absolute bottom-1 left-2 text-[8px] font-mono text-zinc-600">IMG_001.JPG</span>
                            </div>
                        )}
                        {attachments.includes('video') && (
                            <div className="relative group bg-zinc-900 rounded border border-zinc-800 h-20 flex items-center justify-center">
                                <Video className="text-zinc-600" size={24} />
                                <button type="button" onClick={() => toggleAttachment('video')} className="absolute top-1 right-1 text-zinc-600 hover:text-red-500"><X size={12} /></button>
                                <span className="absolute bottom-1 left-2 text-[8px] font-mono text-zinc-600">VID_SEQ_A.MP4</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2">
                    {!attachments.includes('image') && (
                        <button 
                            type="button"
                            onClick={() => toggleAttachment('image')}
                            className="flex-1 flex items-center justify-center p-2.5 rounded border border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-all text-xs font-mono"
                        >
                            <ImageIcon size={14} className="mr-2" />
                            ADD_IMAGE
                        </button>
                    )}
                    {!attachments.includes('video') && (
                        <button 
                            type="button"
                            onClick={() => toggleAttachment('video')}
                            className="flex-1 flex items-center justify-center p-2.5 rounded border border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-all text-xs font-mono"
                        >
                            <Video size={14} className="mr-2" />
                            ADD_VIDEO
                        </button>
                    )}
                </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isAnalyzing || !content.trim()}
              className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-display font-bold uppercase tracking-widest text-sm rounded transition-all flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing_Neural_Net...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Transmit_Data</span>
                </>
              )}
            </button>
          </div>
          
          <p className="text-[10px] text-center text-zinc-600 font-mono">
            SECURE_CONNECTION // GEMINI_AI_ACTIVE
          </p>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;