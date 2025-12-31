import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown, Minus, Leaf, Download, FileText, Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Feedback } from '../types';
import { generateExecutiveReport } from '../services/geminiService';
import { dataService } from '../services/dataService';

const COLORS = {
  positive: '#22c55e', // green-500
  neutral: '#eab308', // yellow-500
  negative: '#ef4444', // red-500
};

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [data, setData] = useState<Feedback[]>([]);
  const [reportText, setReportText] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load real data
  const loadData = async () => {
    setIsLoading(true);
    const result = await dataService.getFeedback();
    setData(result);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshData = () => {
    loadData();
  };

  // Aggregate data for charts
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
    const text = await generateExecutiveReport(data);
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
    <div className="min-h-screen bg-zinc-950 flex flex-col text-zinc-200">
      {/* Admin Header */}
      <div className="bg-zinc-950 border-b border-zinc-800 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded text-zinc-500 hover:text-white transition-colors">
                <ArrowLeft size={18} />
             </button>
             <div>
                <h1 className="text-lg font-display font-bold tracking-tight text-white">Dashboard</h1>
                <div className="text-xs text-zinc-500">Administrator Access</div>
             </div>
          </div>
          <div className="flex items-center space-x-3 text-sm">
             <button onClick={refreshData} className="p-2 hover:bg-zinc-900 rounded text-zinc-500 hover:text-white transition-colors" title="Refresh Data">
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
             </button>
             <button 
                onClick={handleDownloadCSV}
                className="flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded border border-zinc-700 transition-colors text-zinc-300 text-xs font-medium"
             >
                <Download size={14} />
                <span>Export Data</span>
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-zinc-500 mb-1 font-bold">Total Feedback</p>
                  <p className="text-3xl font-display font-bold text-white">{data.length}</p>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400 border border-indigo-500/20">
                  <MessageSquare size={20} />
                </div>
              </div>
            </div>
             <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-zinc-500 mb-1 font-bold">Eco-Impact Score</p>
                  <p className="text-3xl font-display font-bold text-white">{avgEcoScore}<span className="text-sm text-zinc-600 font-normal">/100</span></p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full text-green-400 border border-green-500/20">
                  <Leaf size={20} />
                </div>
              </div>
            </div>
             <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-zinc-500 mb-1 font-bold">Positive Sentiment</p>
                  <p className="text-3xl font-display font-bold text-white">
                    {data.length > 0 ? Math.round((sentimentData[0].value / data.length) * 100) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full text-green-400 border border-green-500/20">
                  <TrendingUp size={20} />
                </div>
              </div>
            </div>
             <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
               <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-zinc-500 mb-1 font-bold">High Priority</p>
                  <p className="text-3xl font-display font-bold text-white">{data.filter(d => d.riskScore && d.riskScore > 80).length}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-full text-red-400 border border-red-500/20">
                  <AlertTriangle size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Executive Summary Block */}
          <div className="bg-gradient-to-r from-zinc-900 to-black rounded-xl border border-zinc-800 p-6 relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center space-x-2 text-white">
                        <FileText className="text-orange-500" size={18} />
                        <span className="font-display">AI Summary</span>
                    </h2>
                    {!reportText && (
                        <button 
                            onClick={handleGenerateReport}
                            disabled={isGeneratingReport}
                            className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-3 py-1.5 rounded-full transition-colors flex items-center space-x-2 text-zinc-300"
                        >
                            {isGeneratingReport ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />}
                            <span>Generate Report</span>
                        </button>
                    )}
                </div>
                {reportText ? (
                    <div className="prose prose-invert max-w-none text-zinc-400 text-sm leading-relaxed border-l-4 border-orange-500 pl-4">
                        {reportText.split('\n').map((para, i) => <p key={i} className="mb-2">{para}</p>)}
                    </div>
                ) : (
                    <div className="text-zinc-500 text-sm">
                        Click the button above to generate an AI-powered summary of all recent feedback and trends.
                    </div>
                )}
             </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sentiment Chart */}
            <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 flex flex-col">
              <h2 className="text-sm font-bold text-zinc-300 mb-4 uppercase">Sentiment Distribution</h2>
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
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '4px', border: '1px solid #27272a', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Chart */}
            <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 flex flex-col">
              <h2 className="text-sm font-bold text-zinc-300 mb-4 uppercase">Category Breakdown</h2>
              <div className="h-64 w-full flex-1 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                    <Tooltip cursor={{fill: '#27272a'}} contentStyle={{ backgroundColor: '#18181b', borderRadius: '4px', border: '1px solid #27272a', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent List */}
          <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h2 className="text-sm font-bold text-zinc-300 uppercase">Recent Feedback</h2>
              <button onClick={refreshData} className="text-orange-500 text-xs font-bold hover:text-orange-400">REFRESH</button>
            </div>
            {isLoading ? (
                <div className="p-8 flex justify-center text-zinc-500">
                    <Loader2 className="animate-spin" />
                </div>
            ) : (
                <div className="divide-y divide-zinc-800">
                {data.slice(0, 10).map((item) => (
                    <div key={item.id} className="p-4 hover:bg-zinc-900 transition-colors flex items-start space-x-4">
                    <div className={`mt-1 p-2 rounded-full flex-shrink-0 bg-black border border-zinc-800`}>
                        {item.sentiment === 'positive' ? <ThumbsUp size={14} className="text-green-500" /> :
                        item.sentiment === 'negative' ? <ThumbsDown size={14} className="text-red-500" /> :
                        <Minus size={14} className="text-yellow-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex space-x-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 uppercase tracking-wide border border-zinc-700">{item.category}</span>
                                {item.imageUrl && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-900 flex items-center" title="Has Image">
                                        <ImageIcon size={10} className="mr-1" /> Image
                                    </span>
                                )}
                                {item.ecoImpactScore && item.ecoImpactScore > 70 && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-900/30 text-green-500 border border-green-900 flex items-center">
                                        <Leaf size={10} className="mr-1" /> Eco+
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-zinc-500">{item.timestamp.toLocaleDateString()}</span>
                        </div>
                        <p className="text-zinc-300 text-sm mb-1">{item.content}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
                            <span className="text-orange-500 font-bold">AI Summary:</span>
                            <span>{item.summary}</span>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;