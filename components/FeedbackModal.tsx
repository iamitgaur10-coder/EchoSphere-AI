
import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Send, Mic, MicOff, Image as ImageIcon, Video, Paperclip, User, Trash2, ThumbsUp, AlertTriangle, Clock, Mail, CheckCircle2, Tag, Shield, Eye, EyeOff } from 'lucide-react';
import { analyzeFeedbackContent, checkDuplicates } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { rateLimitService } from '../services/rateLimitService';
import { Location, Feedback } from '../types';
import { getTranslation, APP_CONFIG } from '../config/constants';

interface FeedbackModalProps {
  location: Location;
  onClose: () => void;
  onSubmit: (feedback: Feedback) => void;
  existingFeedback?: Feedback[]; // For duplicate detection
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ location, onClose, onSubmit, existingFeedback = [] }) => {
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null); // Store original for toggling
  const [isPrivacyBlurEnabled, setIsPrivacyBlurEnabled] = useState(false);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rateLimitWait, setRateLimitWait] = useState<number>(0);
  
  // Duplicate Detection State
  const [isCheckingDupes, setIsCheckingDupes] = useState(false);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load Translations
  const userLang = navigator.language || 'en-US';
  const t = getTranslation(userLang);

  // Simple browser speech recognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
       return;
    }
  }, []);

  // Check Rate Limit on Mount
  useEffect(() => {
    if (!rateLimitService.check()) {
        setRateLimitWait(rateLimitService.getTimeUntilReset());
    }
  }, []);

  // Duplicate Detection Effect
  useEffect(() => {
      if (content.length < 10) return;
      if (duplicateId) return; // Already found one

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
          setIsCheckingDupes(true);
          
          const nearbyCandidates = existingFeedback.filter(f => {
              const dx = f.location.x - location.x;
              const dy = f.location.y - location.y;
              return Math.sqrt(dx*dx + dy*dy) < 0.001; // Approx 100m
          });

          if (nearbyCandidates.length > 0) {
              const matchId = await checkDuplicates(content, nearbyCandidates);
              if (matchId) {
                  setDuplicateId(matchId);
              }
          }
          setIsCheckingDupes(false);
      }, 1500);

      return () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
      };
  }, [content, location, existingFeedback, duplicateId]);

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
        recognition.lang = userLang; // Use detected language

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
        const result = reader.result as string;
        setImageBase64(result);
        setOriginalImageBase64(result);
        setIsPrivacyBlurEnabled(false); // Reset blur on new upload
        if (!attachments.includes('image')) {
            setAttachments(prev => [...prev, 'image']);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // CLIENT-SIDE BLUR LOGIC
  const togglePrivacyBlur = async () => {
    if (!imageBase64 || !originalImageBase64) return;

    if (isPrivacyBlurEnabled) {
        // Restore original
        setImageBase64(originalImageBase64);
        setIsPrivacyBlurEnabled(false);
    } else {
        // Apply Blur
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = originalImageBase64;
            
            await new Promise((resolve) => { img.onload = resolve; });

            canvas.width = img.width;
            canvas.height = img.height;
            
            if (ctx) {
                // Draw image
                ctx.drawImage(img, 0, 0);
                
                // Apply strong blur
                ctx.filter = 'blur(20px)'; // Heavy blur for privacy
                ctx.drawImage(canvas, 0, 0); // Redraw over itself with filter
                
                // Overlay "PRIVACY PROTECTED" text
                ctx.filter = 'none';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = `bold ${img.width / 15}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText("PRIVACY PROTECTED", img.width / 2, img.height / 2);

                setImageBase64(canvas.toDataURL('image/jpeg', 0.8));
                setIsPrivacyBlurEnabled(true);
            }
        } catch (e) {
            console.error("Blur failed", e);
            alert("Could not process image privacy.");
        }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImageBase64(null);
    setOriginalImageBase64(null);
    setImageFile(null);
    setAttachments(prev => prev.filter(t => t !== 'image'));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpvoteDuplicate = () => {
      onClose();
      alert("Duplicate report upvoted! Thank you for validating this issue.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !imageBase64)) return;

    if (!selectedCategory) {
        setErrorMsg("Please select a category for your report.");
        return;
    }

    if (!rateLimitService.check()) {
        const wait = rateLimitService.getTimeUntilReset();
        setRateLimitWait(wait);
        setErrorMsg(`Rate limit exceeded. Please wait ${wait} seconds.`);
        return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    
    try {
        const textToAnalyze = content || "Analyze this image for urban planning issues.";
        const analysis = await analyzeFeedbackContent(textToAnalyze, imageBase64 || undefined, selectedCategory);

        if (analysis.isCivicIssue === false) {
            setIsAnalyzing(false);
            setErrorMsg(analysis.refusalReason || "This platform is for city services and maintenance issues only.");
            return;
        }

        // 2. Upload Image (If blurred, we upload the base64 data uri directly)
        let publicImageUrl = undefined;
        if (isPrivacyBlurEnabled && imageBase64) {
             // Convert Data URI to Blob for upload
             const res = await fetch(imageBase64);
             const blob = await res.blob();
             const file = new File([blob], "privacy-protected.jpg", { type: "image/jpeg" });
             const url = await storageService.uploadImage(file);
             if (url) publicImageUrl = url;
        } else if (imageFile) {
            const url = await storageService.uploadImage(imageFile);
            if (url) publicImageUrl = url;
        } else if (imageBase64) {
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
            status: 'received',
            authorName: authorName.trim() || 'Anonymous Citizen',
            contactEmail: contactEmail.trim() || undefined,
            attachments: attachments as any,
            imageUrl: publicImageUrl,
            ecoImpactScore: analysis.ecoImpactScore,
            ecoImpactReasoning: analysis.ecoImpactReasoning,
            riskScore: analysis.riskScore
        };

        rateLimitService.record();
        onSubmit(newFeedback);
    } catch (err: any) {
        console.error(err);
        const msg = err.message || JSON.stringify(err);
        
        if (msg.includes("leaked") || msg.includes("API key")) {
            setErrorMsg("Critical: Your API Key was revoked by Google because it was exposed. Please create a new one.");
        } 
        else if (msg.includes("403")) {
            setErrorMsg("System Error: AI Service Permission Denied (403). Check API Key.");
        } 
        else {
             setErrorMsg(err.message || "An unexpected error occurred.");
        }
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${rateLimitWait > 0 ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}`}></div>
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                {t.submitBtn}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-black dark:hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 relative">
          
          {/* Visual Education Guide */}
          <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-800/50">
            <div className="flex justify-between items-start gap-2">
                 <div className="flex-1">
                     <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1 flex items-center">
                        <CheckCircle2 size={10} className="mr-1" /> What to report
                     </p>
                     <p className="text-[10px] text-blue-600 dark:text-blue-300 leading-snug">
                         Infrastructure (potholes, lights), Sanitation (trash), Safety hazards, or Community improvement ideas.
                     </p>
                 </div>
                 <div className="w-[1px] bg-blue-200 dark:bg-blue-800 h-8 mx-2"></div>
                 <div className="flex-1">
                     <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1 flex items-center">
                        <X size={10} className="mr-1" /> Do NOT report
                     </p>
                     <p className="text-[10px] text-red-600 dark:text-red-300 leading-snug">
                         Commercial reviews, personal ads, spam, or generic compliments.
                     </p>
                 </div>
            </div>
          </div>

          {/* Rate Limit Banner */}
          {rateLimitWait > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-500/50 rounded p-3 flex items-center space-x-3 text-orange-800 dark:text-orange-200 mb-4">
                  <Clock className="flex-shrink-0 text-orange-500" size={18} />
                  <div className="text-xs font-medium">
                      You are posting too fast. Please wait <span className="font-bold">{rateLimitWait}s</span> before submitting again.
                  </div>
              </div>
          )}

          {/* Safety Error Banner */}
          {errorMsg && !rateLimitWait && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded p-3 flex items-start space-x-3 text-red-800 dark:text-red-200 mb-4 animate-pulse">
                  <AlertTriangle className="flex-shrink-0 text-red-500" size={18} />
                  <div className="text-xs font-medium">{errorMsg}</div>
              </div>
          )}

          {/* Duplicate Detection Banner */}
          {duplicateId && (
               <div className="absolute inset-0 z-10 bg-white/95 dark:bg-zinc-950/95 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-200 dark:border-blue-500/50">
                        <ThumbsUp size={32} className="text-blue-600 dark:text-blue-500" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-zinc-900 dark:text-white mb-2">{t.duplicateFound}</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 max-w-xs">
                        {t.duplicateFound} (ID: {duplicateId}). We found a report very similar to yours nearby.
                    </p>
                    <button 
                        type="button"
                        onClick={handleUpvoteDuplicate}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all shadow-lg shadow-blue-500/20 mb-4"
                    >
                        {t.upvoteInstead}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setDuplicateId(null)} 
                        className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
                    >
                        No, this is different
                    </button>
               </div>
          )}

          {/* Location Badge */}
          <div className="flex items-center space-x-2 text-xs text-zinc-600 dark:text-zinc-500 bg-zinc-100 dark:bg-black/50 p-2 rounded border border-zinc-200 dark:border-zinc-800 font-mono">
            <span className="text-orange-600 dark:text-orange-500 font-bold">Location:</span>
            <span>{location.y.toFixed(4)}, {location.x.toFixed(4)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Identity Field */}
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">
                    Name (Optional)
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600 group-focus-within:text-orange-500 transition-colors">
                        <User size={14} />
                    </div>
                    <input 
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="w-full pl-9 p-2.5 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm text-zinc-900 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-700 transition-colors"
                        placeholder="Anonymous"
                    />
                </div>
            </div>

            {/* Contact Info (Closing the Loop) */}
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">
                    Email (Optional)
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600 group-focus-within:text-orange-500 transition-colors">
                        <Mail size={14} />
                    </div>
                    <input 
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full pl-9 p-2.5 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm text-zinc-900 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-700 transition-colors"
                        placeholder="For updates"
                    />
                </div>
            </div>
          </div>
          
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">
              Category <span className="text-orange-500">*</span>
            </label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600 group-focus-within:text-orange-500 transition-colors">
                    <Tag size={14} />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full pl-9 p-3 bg-white dark:bg-black border rounded focus:border-orange-500 outline-none text-sm appearance-none transition-colors ${!selectedCategory ? 'text-zinc-400 dark:text-zinc-600 border-zinc-300 dark:border-zinc-800' : 'text-zinc-900 dark:text-zinc-200 border-orange-500 dark:border-orange-500'}`}
                >
                    <option value="" disabled>Select a topic that matches your issue...</option>
                    {APP_CONFIG.CATEGORIES.map(cat => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                     <div className="h-0 w-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-zinc-400 dark:border-t-zinc-600"></div>
                </div>
            </div>
          </div>

          {/* Content Field */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">
              Description <span className="text-orange-500">*</span>
            </label>
            <div className="relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 p-3 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded focus:border-orange-500 outline-none resize-none text-sm text-zinc-900 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-700 transition-colors leading-relaxed"
                placeholder={t.describePlaceholder}
              />
              <div className="absolute bottom-2 right-2 flex space-x-2">
                 {isCheckingDupes && (
                     <div className="flex items-center bg-white/90 dark:bg-black/50 px-2 py-1 rounded text-[10px] text-zinc-500">
                         <Loader2 size={10} className="animate-spin mr-1" /> Checking...
                     </div>
                 )}
                 <button 
                    type="button" 
                    onClick={toggleListening}
                    className={`p-1.5 rounded transition-all ${
                        isListening 
                        ? 'bg-red-500/20 text-red-500 border border-red-500 animate-pulse' 
                        : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-black dark:hover:text-white'
                    }`}
                    title={t.voiceInput}
                >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Multimodal Inputs */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 tracking-widest">
                {t.addPhoto}
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
                    <div className="space-y-2">
                        <div className="relative group bg-zinc-100 dark:bg-zinc-900 rounded border border-zinc-300 dark:border-zinc-800 h-40 flex items-center justify-center overflow-hidden">
                            <img src={imageBase64} alt="Preview" className="h-full w-full object-cover opacity-90" />
                            <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded-full hover:bg-red-600 transition-colors z-20"><X size={14} /></button>
                            
                            {/* Privacy Badge Overlay */}
                            {isPrivacyBlurEnabled && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10 pointer-events-none">
                                    <div className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                        <EyeOff size={12} /> Privacy Blur Active
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Privacy Toggle Control */}
                        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                <Shield size={14} className={isPrivacyBlurEnabled ? 'text-green-500' : 'text-zinc-400'} />
                                <span className="font-medium">Privacy Protection</span>
                            </div>
                            <button 
                                type="button"
                                onClick={togglePrivacyBlur}
                                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded transition-colors ${
                                    isPrivacyBlurEnabled 
                                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700' 
                                    : 'bg-green-600 text-white hover:bg-green-500'
                                }`}
                            >
                                {isPrivacyBlurEnabled ? 'Undo Blur' : 'Blur Image'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={triggerFileUpload}
                            className="flex-1 flex items-center justify-center p-4 rounded border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-orange-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 hover:text-orange-500 transition-all text-xs font-bold group bg-white dark:bg-transparent"
                        >
                            <ImageIcon size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                            {t.addPhoto}
                        </button>
                    </div>
                )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isAnalyzing || (!content.trim() && !imageBase64) || rateLimitWait > 0 || !selectedCategory}
              className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-white dark:text-black font-display font-bold uppercase tracking-widest text-sm rounded transition-all flex items-center justify-center space-x-2 shadow-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t.analyzing}</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>{t.submitBtn}</span>
                </>
              )}
            </button>
          </div>
          
          <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-600 font-medium">
            Powered by Google Gemini AI
          </p>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;