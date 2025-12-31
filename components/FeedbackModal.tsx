import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Send, Mic, MicOff, Image as ImageIcon, Video, Paperclip, User, Trash2 } from 'lucide-react';
import { analyzeFeedbackContent } from '../services/geminiService';
import { storageService } from '../services/storageService';
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
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple browser speech recognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
       return;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
        setIsListening(false);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        if (!attachments.includes('image')) {
            setAttachments(prev => [...prev, 'image']);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImageBase64(null);
    setImageFile(null);
    setAttachments(prev => prev.filter(t => t !== 'image'));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageBase64) return;

    setIsAnalyzing(true);
    
    // 1. Analyze Content (Text + Local Image Base64)
    const textToAnalyze = content || "Analyze this image for urban planning issues.";
    const analysis = await analyzeFeedbackContent(textToAnalyze, imageBase64 || undefined);

    // 2. Upload Image to Cloud (if present)
    let publicImageUrl = undefined;
    if (imageFile) {
        const url = await storageService.uploadImage(imageFile);
        if (url) publicImageUrl = url;
    } else if (imageBase64) {
        // Fallback for when storage isn't configured, use base64 for local demo
        publicImageUrl = imageBase64;
    }

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
      imageUrl: publicImageUrl,
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
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-200">Submit Feedback</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Location Badge */}
          <div className="flex items-center space-x-2 text-xs text-zinc-500 bg-black/50 p-2 rounded border border-zinc-800 font-mono">
            <span className="text-orange-500 font-bold">Location:</span>
            <span>{location.y.toFixed(4)}, {location.x.toFixed(4)}</span>
          </div>

          {/* Identity Field */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase tracking-widest">
                Your Name (Optional)
            </label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-orange-500 transition-colors">
                    <User size={14} />
                </div>
                <input 
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full pl-9 p-2.5 bg-black border border-zinc-800 rounded focus:border-orange-500 outline-none text-sm text-zinc-300 placeholder-zinc-700 transition-colors"
                    placeholder="Anonymous"
                />
            </div>
          </div>

          {/* Content Field */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase tracking-widest">
              Description
            </label>
            <div className="relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 p-3 bg-black border border-zinc-800 rounded focus:border-orange-500 outline-none resize-none text-sm text-zinc-300 placeholder-zinc-700 transition-colors leading-relaxed"
                placeholder="Describe what you see..."
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
                    title="Voice Input"
                >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Multimodal Inputs */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">
                Add Photo
            </label>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
            />

            <div className="space-y-3">
                {imageBase64 ? (
                    <div className="relative group bg-zinc-900 rounded border border-zinc-800 h-32 flex items-center justify-center overflow-hidden">
                        <img src={imageBase64} alt="Preview" className="h-full w-full object-cover opacity-80" />
                        <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded-full hover:bg-red-600 transition-colors"><X size={14} /></button>
                        <span className="absolute bottom-1 left-2 text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded">Photo Attached</span>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={triggerFileUpload}
                            className="flex-1 flex items-center justify-center p-4 rounded border border-dashed border-zinc-800 hover:border-orange-500 hover:bg-zinc-900 text-zinc-500 hover:text-orange-500 transition-all text-xs font-bold group"
                        >
                            <ImageIcon size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                            Upload Photo
                        </button>
                    </div>
                )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isAnalyzing || (!content.trim() && !imageBase64)}
              className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-display font-bold uppercase tracking-widest text-sm rounded transition-all flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
          
          <p className="text-[10px] text-center text-zinc-600 font-medium">
            Powered by Google Gemini AI
          </p>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;