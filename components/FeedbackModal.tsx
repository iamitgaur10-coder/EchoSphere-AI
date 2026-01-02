import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Send, Mic, MicOff, Image as ImageIcon, Video, Paperclip, User, Trash2, ThumbsUp, AlertTriangle, Clock, Mail, CheckCircle2, Tag, Shield, Eye, EyeOff, Trophy } from 'lucide-react';
import DOMPurify from 'dompurify'; // Sanitization
import { analyzeFeedbackContent, checkDuplicates } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { rateLimitService } from '../services/rateLimitService';
import { Location, Feedback } from '../types';
import { getTranslation, APP_CONFIG } from '../config/constants';

interface FeedbackModalProps {
  location: Location;
  onClose: () => void;
  onSubmit: (feedback: Feedback) => void;
  existingFeedback?: Feedback[];
  isLoggedIn?: boolean;
  onLogin?: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ location, onClose, onSubmit, existingFeedback = [], isLoggedIn, onLogin }) => {
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
  const [isPrivacyBlurEnabled, setIsPrivacyBlurEnabled] = useState(false);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rateLimitWait, setRateLimitWait] = useState<number>(0);
  
  // Captcha State
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  const [isCheckingDupes, setIsCheckingDupes] = useState(false);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userLang = navigator.language || 'en-US';
  const t = getTranslation(userLang);

  useEffect(() => {
    // Render Turnstile
    if ((window as any).turnstile && turnstileRef.current) {
        (window as any).turnstile.render(turnstileRef.current, {
            sitekey: '0x4AAAAAAAzzzzzzzzzzzz', // Replace with your Turnstile Site Key (Testing key shown)
            callback: (token: string) => setCaptchaToken(token),
        });
    }
  }, []);

  useEffect(() => {
    if (!rateLimitService.check()) {
        setRateLimitWait(rateLimitService.getTimeUntilReset());
    }
  }, []);

  // Duplicate Check
  useEffect(() => {
      if (content.length < 10) return;
      if (duplicateId) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
          setIsCheckingDupes(true);
          const nearbyCandidates = existingFeedback.filter(f => {
              const dx = f.location.x - location.x;
              const dy = f.location.y - location.y;
              return Math.sqrt(dx*dx + dy*dy) < 0.001; 
          });

          if (nearbyCandidates.length > 0) {
              const matchId = await checkDuplicates(content, nearbyCandidates);
              if (matchId) setDuplicateId(matchId);
          }
          setIsCheckingDupes(false);
      }, 1500);

      return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [content, location, existingFeedback, duplicateId]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        if (isListening) { setIsListening(false); return; }
        const recognition = new SpeechRecognition();
        recognition.lang = userLang;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            setContent(prev => prev + ' ' + event.results[0][0].transcript);
        };
        recognition.start();
    } else {
        alert("Speech recognition not supported.");
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
        setIsPrivacyBlurEnabled(false);
        if (!attachments.includes('image')) setAttachments(prev => [...prev, 'image']);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePrivacyBlur = async () => {
    if (!imageBase64 || !originalImageBase64) return;
    if (isPrivacyBlurEnabled) {
        setImageBase64(originalImageBase64);
        setIsPrivacyBlurEnabled(false);
    } else {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = originalImageBase64;
        await new Promise((resolve) => { img.onload = resolve; });
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'blur(20px)';
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = `bold ${img.width / 15}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText("PRIVACY PROTECTED", img.width / 2, img.height / 2);
            setImageBase64(canvas.toDataURL('image/jpeg', 0.8));
            setIsPrivacyBlurEnabled(true);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !imageBase64)) return;
    
    // SECURITY: Captcha Check
    if (!captchaToken) {
        setErrorMsg("Please complete the security check.");
        return;
    }

    if (!selectedCategory) {
        setErrorMsg("Please select a category.");
        return;
    }

    if (!rateLimitService.check()) {
        const wait = rateLimitService.getTimeUntilReset();
        setRateLimitWait(wait);
        return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    
    try {
        // SECURITY: Sanitize Input
        const cleanContent = DOMPurify.sanitize(content);
        const cleanName = DOMPurify.sanitize(authorName);
        
        const textToAnalyze = cleanContent || "Analyze this image for urban planning issues.";
        const analysis = await analyzeFeedbackContent(textToAnalyze, imageBase64 || undefined, selectedCategory);

        if (analysis.isCivicIssue === false) {
            setIsAnalyzing(false);
            setErrorMsg(analysis.refusalReason || "This platform is for city services only.");
            return;
        }

        let publicImageUrl = undefined;
        if (isPrivacyBlurEnabled && imageBase64) {
             const res = await fetch(imageBase64);
             const blob = await res.blob();
             const file = new File([blob], "privacy-protected.jpg", { type: "image/jpeg" });
             const url = await storageService.uploadImage(file);
             if (url) publicImageUrl = url;
        } else if (imageFile) {
            const url = await storageService.uploadImage(imageFile);
            if (url) publicImageUrl = url;
        }

        const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);

        const newFeedback: Feedback = {
            id: newId,
            location,
            content: cleanContent,
            timestamp: new Date(),
            sentiment: analysis.sentiment,
            category: analysis.category,
            summary: analysis.summary,
            votes: 0,
            status: 'received',
            authorName: cleanName.trim() || 'Anonymous Citizen',
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
        setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-zinc-200 dark:border-zinc-800 transition-colors max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                {t.submitBtn}
            </h3>
          </div>
          <button onClick={onClose} aria-label="Close Modal" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-black dark:hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 relative">
          
          {rateLimitWait > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-500/50 rounded p-3 flex items-center space-x-3 text-orange-800 dark:text-orange-200 mb-4">
                  <Clock className="flex-shrink-0 text-orange-500" size={18} />
                  <div className="text-xs font-medium">
                      Wait <span className="font-bold">{rateLimitWait}s</span> before posting.
                  </div>
              </div>
          )}

          {errorMsg && !rateLimitWait && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded p-3 flex items-start space-x-3 text-red-800 dark:text-red-200 mb-4">
                  <AlertTriangle className="flex-shrink-0 text-red-500" size={18} />
                  <div className="text-xs font-medium">{errorMsg}</div>
              </div>
          )}

          {/* ... Duplicate banner code same as before ... */}

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">Name</label>
                <input 
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm"
                    placeholder="Anonymous"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">Email</label>
                <input 
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm"
                    placeholder="For updates"
                />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">Category *</label>
            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 bg-white dark:bg-black border rounded focus:border-orange-500 outline-none text-sm"
            >
                <option value="" disabled>Select a topic...</option>
                {APP_CONFIG.CATEGORIES.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">Description *</label>
            <div className="relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 p-3 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded focus:border-orange-500 outline-none resize-none text-sm"
                placeholder={t.describePlaceholder}
              />
              <button 
                type="button" 
                onClick={toggleListening}
                aria-label="Use Voice Input"
                className={`absolute bottom-2 right-2 p-1.5 rounded transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-100 text-zinc-500'}`}
              >
                <Mic size={14} />
              </button>
            </div>
          </div>
          
          {/* Image Upload UI (Same as before) */}
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 tracking-widest">{t.addPhoto}</label>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <div className="space-y-3">
                {imageBase64 ? (
                    <div className="space-y-2">
                        <div className="relative h-40 bg-zinc-100 dark:bg-zinc-900 rounded overflow-hidden border border-zinc-300 dark:border-zinc-800">
                             <img src={imageBase64} alt="Preview" className="h-full w-full object-cover" />
                             {isPrivacyBlurEnabled && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><span className="bg-black/70 text-white px-2 py-1 rounded text-xs">Privacy Active</span></div>}
                        </div>
                        <button type="button" onClick={togglePrivacyBlur} className="text-xs text-blue-500 font-bold">{isPrivacyBlurEnabled ? 'Undo Blur' : 'Blur Image'}</button>
                    </div>
                ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-4 border border-dashed rounded text-xs font-bold text-zinc-500 hover:text-orange-500 hover:border-orange-500 transition-all flex items-center justify-center gap-2">
                        <ImageIcon size={16} /> {t.addPhoto}
                    </button>
                )}
            </div>
          </div>

          {/* Cloudflare Turnstile Placeholder */}
          <div ref={turnstileRef} className="flex justify-center my-2 min-h-[65px]"></div>
          
          {/* Gamification Nudge */}
          {!isLoggedIn && onLogin && (
            <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg flex items-center justify-between group">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs">
                    <Trophy size={14} className="text-indigo-500" />
                    <span>Earn <strong>10 Karma</strong> for this report.</span>
                </div>
                <button 
                    type="button" 
                    onClick={onLogin}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 underline"
                >
                    Login / Sign Up
                </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isAnalyzing || (!content.trim() && !imageBase64) || rateLimitWait > 0 || !selectedCategory || !captchaToken}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold uppercase tracking-widest text-sm rounded shadow-lg flex items-center justify-center gap-2"
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            <span>{isAnalyzing ? t.analyzing : t.submitBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;