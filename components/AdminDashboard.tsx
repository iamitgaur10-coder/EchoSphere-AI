import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown, Minus, Leaf, Download, FileText, Loader2, RefreshCw, Image as ImageIcon, Share2, Copy, Check, ChevronDown, LogOut, Clock, Filter, Mail, Sparkles, Send } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Feedback, Organization, FeedbackStatus } from '../types';
import { generateExecutiveReport, generateResponseDraft } from '../services/geminiService';
import { dataService } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const COLORS = {
  positive: '#22c55e', // green-500
  neutral: '#eab308', // yellow-500
  negative: '#ef4444', // red-500
};

interface AdminDashboardProps {
  onBack: () => void;
  onSignOut: () => void;
}

const STATUS_OPTIONS: Record<FeedbackStatus, { label: string, color: string }> = {
    'received': { label: 'Received', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
    'triaged': { label: 'Triaged', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' },
    'in_progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' },
    'resolved': { label: 'Resolved', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' }
};

// Skeleton Component for loading states
const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`}></div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onSignOut }) => {
  const [data, setData] = useState<Feedback[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  
  // Selection State (Master-Detail)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = data.find(item => item.id === selectedId);
  const [noteInput, setNoteInput] = useState('');
  const [draftResponse, setDraftResponse] = useState<string | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  
  // Pagination State
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load Initial Data
  const loadData = async (reset = false) => {
    if (reset) {
        setIsLoading(true);
        setOffset(0);
        setData([]);
    }

    const org = await dataService.getCurrentOrganization();
    setCurrentOrg(org);
    
    const newOffset = reset ? 0 : offset;
    const result = await dataService.getFeedback(50, newOffset);
    
    if (result.length < 50) {
        setHasMore(false);
    } else {
        setHasMore(true);
    }

    if (reset) {
        setData(result);
        if (result.length > 0) setSelectedId(result[0].id); // Select first item
    } else {
        setData(prev => [...prev, ...result]);
    }

    setOffset(prev => prev + 50);
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const handleLoadMore = async () => {
      if (isLoadingMore || !hasMore) return;
      setIsLoadingMore(true);
      
      const result = await dataService.getFeedback(50, offset);
      if (result.length < 50) {
          setHasMore(false);
      }
      setData(prev => [...prev, ...result]);
      setOffset(prev => prev + 50);
      setIsLoadingMore(false);
  };

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (!isSupabaseConfigured() || !currentOrg) return;

    const channel = supabase!
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feedback' },
        (payload) => {
          const newRow = payload.new;
          if (newRow.organization_id !== currentOrg.id) return;

          const newFeedback: Feedback = {
            id: newRow.id,
            organizationId: newRow.organization_id,
            location: newRow.location, 
            content: newRow.content,
            timestamp: new Date(newRow.timestamp),
            sentiment: newRow.sentiment,
            category: newRow.category,
            status: newRow.status || 'received',
            summary: newRow.summary,
            imageUrl: newRow.image_url,
            riskScore: newRow.risk_score,
            ecoImpactScore: newRow.eco_impact_score,
            ecoImpactReasoning: newRow.eco_impact_reasoning,
            contactEmail: newRow.contact_email,
            adminNotes: newRow.admin_notes || [],
            votes: 0
          };

          setData(prev => [newFeedback, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [currentOrg]);

  const refreshData = () => {
    loadData(true);
  };

  const updateItemStatus = async (status: FeedbackStatus) => {
      if (!selectedItem) return;
      const updated = { ...selectedItem, status };
      
      // Optimistic UI Update
      setData(prev => prev.map(item => item.id === selectedItem.id ? updated : item));
      
      await dataService.updateFeedback(updated);
  };

  const addAdminNote = async () => {
      if (!selectedItem || !noteInput.trim()) return;
      
      const newNotes = [...(selectedItem.adminNotes || []), noteInput];
      const updated = { ...selectedItem, adminNotes: newNotes };
      
      setData(prev => prev.map(item => item.id === selectedItem.id ? updated : item));
      await dataService.updateFeedback(updated);
      setNoteInput('');
  };

  const generateDraft = async () => {
      if (!selectedItem) return;
      setIsDrafting(true);
      const draft = await generateResponseDraft(selectedItem);
      setDraftResponse(draft);
      setIsDrafting(false);
  };

  // PRODUCTION HOOK: Sends email via Supabase Edge Function
  const handleSendEmail = async () => {
    if (!selectedItem || !draftResponse || !selectedItem.contactEmail) return;

    if (isSupabaseConfigured()) {
        try {
            const { data, error } = await supabase!.functions.invoke('send-email', {
                body: { 
                    to: selectedItem.contactEmail,
                    subject: `Update regarding your report: ${selectedItem.category}`,
                    message: draftResponse
                }
            });
            
            if (error) {
                console.error("Failed to send email via Edge Function", error);
                alert("Error: Failed to send email via backend function.");
            } else {
                alert(`Email successfully dispatched via backend.`);
                setDraftResponse(null);
            }
        } catch (e) {
            console.error("Email send failed", e);
            alert("System Error: Could not invoke send-email function.");
        }
    } else {
        alert("PRODUCTION ERROR: Supabase backend is not configured. Cannot send email.");
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const contextData = data.slice(0, 50);
    const text = await generateExecutiveReport(contextData);
    setReportText(text);
    setIsGeneratingReport(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col text-zinc-900 dark:text-zinc-200 transition-colors duration-300">
      
      {/* Header */}
      <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-20">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <button onClick={onBack} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                <ArrowLeft size={18} />
             </button>
             <div>
                <h1 className="text-sm font-display font-bold tracking-tight text-zinc-900 dark:text-white uppercase">EchoSphere Admin</h1>
                {currentOrg && <div className="text-xs text-orange-600 dark:text-orange-500 font-bold">{currentOrg.name}</div>}
             </div>
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => refreshData()} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
             </button>
             <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
             <button onClick={onSignOut} className="flex items-center space-x-2 text-zinc-500 hover:text-red-600 dark:hover:text-red-500 transition-colors px-2 py-1.5">
                 <LogOut size={16} />
             </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANE: List View */}
        <div className="w-full md:w-[450px] flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Inbox ({data.length})</div>
                <div className="flex space-x-2">
                    {/* Placeholder for Filters */}
                    <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-400"><Filter size={14}/></button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="flex space-x-3 p-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="w-3/4 h-4" />
                                    <Skeleton className="w-1/2 h-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {data.map((item) => (
                            <button 
                                key={item.id} 
                                onClick={() => setSelectedId(item.id)}
                                className={`w-full p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-start space-x-3 text-left ${selectedId === item.id ? 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500' : 'border-l-4 border-transparent'}`}
                            >
                                <div className={`mt-1 p-1.5 rounded-full flex-shrink-0 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800`}>
                                    {item.sentiment === 'positive' ? <ThumbsUp size={12} className="text-green-500" /> :
                                    item.sentiment === 'negative' ? <ThumbsDown size={12} className="text-red-500" /> :
                                    <Minus size={12} className="text-yellow-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{item.category}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${STATUS_OPTIONS[item.status].color}`}>
                                            {STATUS_OPTIONS[item.status].label}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 line-clamp-2 leading-snug">{item.content}</p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-400">{item.timestamp.toLocaleDateString()}</span>
                                        {item.riskScore && item.riskScore > 75 && (
                                            <span className="text-[10px] font-bold text-red-500 flex items-center"><AlertTriangle size={10} className="mr-1"/> High Risk</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                         {hasMore && (
                            <div className="p-4">
                                <button onClick={handleLoadMore} disabled={isLoadingMore} className="w-full py-2 text-xs font-bold uppercase text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                    {isLoadingMore ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* CENTER/RIGHT PANE: Detail View */}
        <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-y-auto">
            {selectedItem ? (
                <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
                    
                    {/* Action Bar */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
                        <div className="flex items-center space-x-4">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status:</span>
                            <div className="flex space-x-2">
                                {(Object.keys(STATUS_OPTIONS) as FeedbackStatus[]).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => updateItemStatus(status)}
                                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                            selectedItem.status === status 
                                            ? STATUS_OPTIONS[status].color + ' ring-2 ring-offset-1 dark:ring-offset-zinc-900 ring-zinc-200 dark:ring-zinc-700'
                                            : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                        }`}
                                    >
                                        {STATUS_OPTIONS[status].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">ID: {selectedItem.id.slice(0,8)}</div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left Column: Details */}
                        <div className="lg:col-span-2 space-y-6">
                             {/* Content Card */}
                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
                                 <div className="flex justify-between items-start mb-4">
                                     <div className="flex items-center space-x-3">
                                         <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                             <MessageSquare size={20} />
                                         </div>
                                         <div>
                                             <h3 className="font-bold text-zinc-900 dark:text-white">{selectedItem.category} Issue</h3>
                                             <p className="text-xs text-zinc-500">{selectedItem.authorName || 'Anonymous'} • {selectedItem.timestamp.toLocaleString()}</p>
                                         </div>
                                     </div>
                                     {selectedItem.contactEmail && (
                                         <span className="flex items-center space-x-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                             <Mail size={12} />
                                             <span>Contact Available</span>
                                         </span>
                                     )}
                                 </div>
                                 
                                 <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800 mb-6">
                                     <p className="text-lg leading-relaxed text-zinc-800 dark:text-zinc-200">{selectedItem.content}</p>
                                 </div>

                                 {selectedItem.imageUrl && (
                                     <div className="mb-6">
                                         <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Attachment</p>
                                         <img src={selectedItem.imageUrl} alt="Report attachment" className="rounded-lg max-h-64 object-cover border border-zinc-200 dark:border-zinc-800" />
                                     </div>
                                 )}

                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded border border-orange-100 dark:border-orange-900/30">
                                         <div className="text-xs font-bold text-orange-700 dark:text-orange-500 uppercase mb-1">AI Summary</div>
                                         <p className="text-sm text-zinc-700 dark:text-zinc-300">{selectedItem.summary}</p>
                                     </div>
                                     <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded border border-green-100 dark:border-green-900/30">
                                         <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs font-bold text-green-700 dark:text-green-500 uppercase">Eco-Impact</div>
                                            <span className="text-lg font-bold text-green-700 dark:text-green-500">{selectedItem.ecoImpactScore}/100</span>
                                         </div>
                                         <p className="text-xs text-zinc-600 dark:text-zinc-400">{selectedItem.ecoImpactReasoning}</p>
                                     </div>
                                 </div>
                             </div>

                             {/* AI Response Agent */}
                             <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
                                 <div className="flex items-center justify-between mb-4">
                                     <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                         <Sparkles size={16} className="text-purple-500" />
                                         Agent Response
                                     </h3>
                                     {!draftResponse && (
                                         <button 
                                            onClick={generateDraft}
                                            disabled={isDrafting}
                                            className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded font-bold transition-colors disabled:opacity-50"
                                         >
                                             {isDrafting ? 'Drafting...' : 'Draft Email to Resident'}
                                         </button>
                                     )}
                                 </div>
                                 
                                 {draftResponse ? (
                                     <div className="space-y-3 animate-fade-in-up">
                                         <div className="bg-zinc-50 dark:bg-black p-4 rounded border border-zinc-200 dark:border-zinc-800 font-mono text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                             {draftResponse}
                                         </div>
                                         <div className="flex justify-end gap-2">
                                             <button onClick={() => setDraftResponse(null)} className="text-xs text-zinc-500 hover:text-zinc-900 p-2">Discard</button>
                                             <button onClick={handleSendEmail} className="text-xs bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-500 flex items-center gap-2">
                                                 <Send size={12} /> Send Email
                                             </button>
                                         </div>
                                     </div>
                                 ) : (
                                     <p className="text-sm text-zinc-500 italic">Use the AI Agent to draft a polite, context-aware response to this resident based on the issue details and current status.</p>
                                 )}
                             </div>
                        </div>

                        {/* Right Column: Internal */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm h-full flex flex-col">
                                <h3 className="font-bold text-zinc-900 dark:text-white mb-4 text-sm uppercase">Internal Notes</h3>
                                <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-[300px]">
                                    {selectedItem.adminNotes && selectedItem.adminNotes.length > 0 ? (
                                        selectedItem.adminNotes.map((note, i) => (
                                            <div key={i} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-700">
                                                {note}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-zinc-400 text-xs py-8">No notes yet. Collaborate with your team here.</div>
                                    )}
                                </div>
                                <div className="mt-auto">
                                    <textarea 
                                        value={noteInput}
                                        onChange={(e) => setNoteInput(e.target.value)}
                                        className="w-full p-2 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded text-sm focus:border-orange-500 outline-none mb-2"
                                        placeholder="Add a note..."
                                        rows={3}
                                    />
                                    <button 
                                        onClick={addAdminNote}
                                        disabled={!noteInput.trim()}
                                        className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-xs uppercase rounded disabled:opacity-50"
                                    >
                                        Add Note
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare size={32} />
                    </div>
                    <p className="font-medium">Select a ticket to view details</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;