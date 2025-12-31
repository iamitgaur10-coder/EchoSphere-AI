import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown, Minus, Leaf, Download, FileText, Loader2, RefreshCw, Image as ImageIcon, Share2, Copy, Check, ChevronDown, LogOut } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Feedback, Organization } from '../types';
import { generateExecutiveReport } from '../services/geminiService';
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

const PAGE_SIZE = 20;

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onSignOut }) => {
  const [data, setData] = useState<Feedback[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  
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
    const result = await dataService.getFeedback(PAGE_SIZE, newOffset);
    
    if (result.length < PAGE_SIZE) {
        setHasMore(false);
    } else {
        setHasMore(true);
    }

    if (reset) {
        setData(result);
    } else {
        setData(prev => [...prev, ...result]);
    }

    setOffset(prev => prev + PAGE_SIZE);
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const handleLoadMore = async () => {
      if (isLoadingMore || !hasMore) return;
      setIsLoadingMore(true);
      
      const result = await dataService.getFeedback(PAGE_SIZE, offset);
      if (result.length < PAGE_SIZE) {
          setHasMore(false);
      }
      setData(prev => [...prev, ...result]);
      setOffset(prev => prev + PAGE_SIZE);
      setIsLoadingMore(false);
  };

  // --- REALTIME SUBSCRIPTION (Priority 4) ---
  useEffect(() => {
    if (!isSupabaseConfigured() || !currentOrg) return;

    const channel = supabase!
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feedback' },
        (payload) => {
          const newRow = payload.new;

          // Multi-tenancy Security: Only add if it belongs to this Org
          if (newRow.organization_id !== currentOrg.id) return;

          const newFeedback: Feedback = {
            id: newRow.id,
            organizationId: newRow.organization_id,
            location: newRow.location, 
            content: newRow.content,
            timestamp: new Date(newRow.timestamp),
            sentiment: newRow.sentiment,
            category: newRow.category,
            summary: newRow.summary,
            imageUrl: newRow.image_url,
            riskScore: newRow.risk_score,
            ecoImpactScore: newRow.eco_impact_score,
            ecoImpactReasoning: newRow.eco_impact_reasoning,
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

  const handleCopyLink = () => {
      if (!currentOrg) return;
      const origin = window.location.origin;
      const link = `${origin}/?org=${currentOrg.slug}`;
      navigator.clipboard.writeText(link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  // Aggregate data for charts (Use all loaded data for now, ideally would use separate aggregate API endpoint)
  const sentimentData = [
    { name: 'Positive', value: data.filter(d => d.sentiment === 'positive').length, color: COLORS.positive },
    { name: 'Neutral', value: data.filter(d => d.sentiment === 'neutral').length, color: COLORS.neutral },
    { name: 'Negative', value: data.filter(d => d.sentiment === 'negative').length, color: COLORS.negative },
  ];

  const categoryCount: Record<string, number> = {};
  data.forEach(d => {
    categoryCount[d.category] = (categoryCount[d.category] || 0) + 1;
  });
  const categoryData = Object.keys(categoryCount).map(k => ({ name: k, value: categoryCount[k] }));

  // Eco Score average
  const avgEcoScore = data.length > 0 
    ? Math.round(data.reduce((acc, curr) => acc + (curr.ecoImpactScore || 0), 0) / data.length)
    : 0;

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    // Only send the first 50 items to AI to prevent token overflow
    const contextData = data.slice(0, 50);
    const text = await generateExecutiveReport(contextData);
    setReportText(text);
    setIsGeneratingReport(false);
  };

  const handleDownloadCSV = () => {
    const headers = ["ID", "Date", "Category", "Sentiment", "Content", "Risk Score", "Eco Score", "Has Image"];
    const rows = data.map(f => [
        f.id, 
        f.timestamp.toISOString().split('T')[0],
        f.category, 
        f.sentiment, 
        `"${f.content.replace(/"/g, '""')}"`,
        f.riskScore || 0,
        f.ecoImpactScore || 0,
        f.imageUrl ? "Yes" : "No"
    ]);
    
    const csvContent = [
        headers.join(','), 
        ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `echosphere_report_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col text-zinc-900 dark:text-zinc-200 transition-colors duration-300">
      {/* Admin Header */}
      <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 z-10 sticky top-0 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <button onClick={onBack} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                <ArrowLeft size={18} />
             </button>
             <div>
                <h1 className="text-lg font-display font-bold tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>
                <div className="flex items-center space-x-2 text-xs text-zinc-500">
                    <span>Administrator Access</span>
                    {currentOrg && (
                        <>
                            <span>•</span>
                            <span className="text-orange-500 font-bold">{currentOrg.name}</span>
                        </>
                    )}
                </div>
             </div>
          </div>
          <div className="flex items-center space-x-3 text-sm">
             {isSupabaseConfigured() && (
                 <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-green-600 dark:text-green-500 font-bold uppercase tracking-wider hidden sm:inline">Live Feed</span>
                 </div>
             )}
             
             {/* Share Button */}
             {currentOrg && (
                <button 
                    onClick={handleCopyLink}
                    className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-500 px-3 py-1.5 rounded transition-colors text-white text-xs font-bold uppercase tracking-wide shadow-sm"
                    title="Copy Public Link"
                >
                    {isCopied ? <Check size={14} /> : <Share2 size={14} />}
                    <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Share Link'}</span>
                </button>
             )}

             <button onClick={() => refreshData()} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-500 hover:text-black dark:hover:text-white transition-colors" title="Refresh Data">
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
             </button>
             <button 
                onClick={handleDownloadCSV}
                className="flex items-center space-x-2 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 transition-colors text-zinc-700 dark:text-zinc-300 text-xs font-medium hidden sm:flex"
             >
                <Download size={14} />
                <span>Export</span>
             </button>
             
             <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2"></div>
             
             <button 
                onClick={onSignOut}
                className="flex items-center space-x-2 text-zinc-500 hover:text-red-600 dark:hover:text-red-500 transition-colors px-2 py-1.5"
                title="Sign Out"
             >
                 <LogOut size={16} />
                 <span className="hidden sm:inline text-xs font-bold uppercase">Log Out</span>
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-zinc-500 mb-1 font-bold">Total Feedback</p>
                  <p className="text-3xl font-display font-bold text-zinc-900 dark:text-white">{data.length}</p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                  <MessageSquare size={20} />
                </div>
              </div>
            </div>
             <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-zinc-500 mb-1 font-bold">Eco-Impact Score</p>
                  <p className="text-3xl font-display font-bold text-zinc-900 dark:text-white">{avgEcoScore}<span className="text-sm text-zinc-400 dark:text-zinc-600 font-normal">/100</span></p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-full text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20">
                  <Leaf size={20} />
                </div>
              </div>
            </div>
             <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-zinc-500 mb-1 font-bold">Positive Sentiment</p>
                  <p className="text-3xl font-display font-bold text-zinc-900 dark:text-white">
                    {data.length > 0 ? Math.round((sentimentData[0].value / data.length) * 100) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-full text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20">
                  <TrendingUp size={20} />
                </div>
              </div>
            </div>
             <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm">
               <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-zinc-500 mb-1 font-bold">High Priority</p>
                  <p className="text-3xl font-display font-bold text-zinc-900 dark:text-white">{data.filter(d => d.riskScore && d.riskScore > 80).length}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-full text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                  <AlertTriangle size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Executive Summary Block */}
          <div className="bg-gradient-to-r from-zinc-100 to-white dark:from-zinc-900 dark:to-black rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 relative overflow-hidden shadow-sm">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center space-x-2 text-zinc-900 dark:text-white">
                        <FileText className="text-orange-600 dark:text-orange-500" size={18} />
                        <span className="font-display">AI Summary</span>
                    </h2>
                    {!reportText && (
                        <button 
                            onClick={handleGenerateReport}
                            disabled={isGeneratingReport}
                            className="text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 px-3 py-1.5 rounded-full transition-colors flex items-center space-x-2 text-zinc-600 dark:text-zinc-300 shadow-sm"
                        >
                            {isGeneratingReport ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />}
                            <span>Generate Report (Based on recent items)</span>
                        </button>
                    )}
                </div>
                {reportText ? (
                    <div className="prose prose-sm max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed border-l-4 border-orange-500 pl-4">
                        {reportText.split('\n').map((para, i) => <p key={i} className="mb-2">{para}</p>)}
                    </div>
                ) : (
                    <div className="text-zinc-500 text-sm">
                        Click the button above to generate an AI-powered summary of trends and risks.
                    </div>
                )}
             </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sentiment Chart */}
            <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-sm">
              <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4 uppercase">Sentiment Distribution</h2>
              <div className="h-64 w-full flex-1 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderRadius: '4px', border: '1px solid var(--tooltip-border)', color: 'var(--tooltip-text)' }} itemStyle={{ color: 'var(--tooltip-text)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Chart */}
            <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-sm">
              <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4 uppercase">Category Breakdown</h2>
              <div className="h-64 w-full flex-1 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-stroke)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                    <Tooltip cursor={{fill: 'var(--tooltip-cursor)'}} contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderRadius: '4px', border: '1px solid var(--tooltip-border)', color: 'var(--tooltip-text)' }} itemStyle={{ color: 'var(--tooltip-text)' }} />
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent List */}
          <div className="bg-white dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
              <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase">Feedback Log</h2>
              <span className="text-zinc-500 text-xs">Showing {data.length} items</span>
            </div>
            {isLoading ? (
                <div className="p-8 flex justify-center text-zinc-500">
                    <Loader2 className="animate-spin" />
                </div>
            ) : (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {data.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors flex items-start space-x-4 animate-fade-in-up">
                        <div className={`mt-1 p-2 rounded-full flex-shrink-0 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800`}>
                            {item.sentiment === 'positive' ? <ThumbsUp size={14} className="text-green-500" /> :
                            item.sentiment === 'negative' ? <ThumbsDown size={14} className="text-red-500" /> :
                            <Minus size={14} className="text-yellow-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex space-x-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase tracking-wide border border-zinc-200 dark:border-zinc-700">{item.category}</span>
                                    {item.imageUrl && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center" title="Has Image">
                                            <ImageIcon size={10} className="mr-1" /> Image
                                        </span>
                                    )}
                                    {item.ecoImpactScore && item.ecoImpactScore > 70 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-500 border border-green-200 dark:border-green-900 flex items-center">
                                            <Leaf size={10} className="mr-1" /> Eco+
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-zinc-500">{item.timestamp.toLocaleDateString()}</span>
                            </div>
                            <p className="text-zinc-800 dark:text-zinc-300 text-sm mb-1">{item.content}</p>
                            <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
                                <span className="text-orange-600 dark:text-orange-500 font-bold">AI Summary:</span>
                                <span>{item.summary}</span>
                            </div>
                        </div>
                        </div>
                    ))}
                    
                    {hasMore && (
                        <div className="p-4 flex justify-center">
                            <button 
                                onClick={handleLoadMore} 
                                disabled={isLoadingMore}
                                className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-orange-600 dark:hover:text-orange-500 transition-colors disabled:opacity-50"
                            >
                                {isLoadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                                <span>Load More</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>

        </div>
      </div>
      
      <style>{`
        :root {
            --tooltip-bg: #ffffff;
            --tooltip-border: #e4e4e7;
            --tooltip-text: #18181b;
            --grid-stroke: #e4e4e7;
            --tooltip-cursor: #f4f4f5;
        }
        .dark {
            --tooltip-bg: #18181b;
            --tooltip-border: #27272a;
            --tooltip-text: #fff;
            --grid-stroke: #27272a;
            --tooltip-cursor: #27272a;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;