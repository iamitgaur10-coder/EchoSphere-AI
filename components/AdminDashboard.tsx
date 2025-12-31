import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown, Minus, Leaf, Download, FileText, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Feedback } from '../types';
import { generateExecutiveReport } from '../services/geminiService';

// Mock Data for Admin with updated Eco fields
const MOCK_DATA: Feedback[] = [
  { id: '1', location: { x: 20, y: 30 }, content: 'More trash cans needed.', sentiment: 'neutral', category: 'Sanitation', timestamp: new Date(), votes: 5, summary: "Need bins", ecoImpactScore: 60, ecoImpactReasoning: "Reduces litter." },
  { id: '2', location: { x: 55, y: 60 }, content: 'Dangerous pothole.', sentiment: 'negative', category: 'Infrastructure', timestamp: new Date(), votes: 12, summary: "Pothole fix", ecoImpactScore: 10, ecoImpactReasoning: "Safety issue, neutral eco impact." },
  { id: '3', location: { x: 70, y: 25 }, content: 'Love the mural!', sentiment: 'positive', category: 'Culture', timestamp: new Date(), votes: 20, summary: "Nice mural", ecoImpactScore: 40, ecoImpactReasoning: "Cultural value." },
  { id: '4', location: { x: 10, y: 10 }, content: 'Street lights are out on Main St.', sentiment: 'negative', category: 'Safety', timestamp: new Date(), votes: 8, summary: "Dark streets", ecoImpactScore: 20, ecoImpactReasoning: "Safety priority." },
  { id: '5', location: { x: 40, y: 80 }, content: 'Great new bike lane.', sentiment: 'positive', category: 'Infrastructure', timestamp: new Date(), votes: 15, summary: "Good bike lane", ecoImpactScore: 90, ecoImpactReasoning: "Encourages low-carbon transport." },
  { id: '6', location: { x: 80, y: 50 }, content: 'Bus schedule is unreliable.', sentiment: 'negative', category: 'Transport', timestamp: new Date(), votes: 3, summary: "Late buses", ecoImpactScore: 85, ecoImpactReasoning: "Better transit reduces cars." },
];

const COLORS = {
  positive: '#22c55e', // green-500
  neutral: '#eab308', // yellow-500
  negative: '#ef4444', // red-500
};

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [reportText, setReportText] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Aggregate data for charts
  const sentimentData = [
    { name: 'Positive', value: MOCK_DATA.filter(d => d.sentiment === 'positive').length, color: COLORS.positive },
    { name: 'Neutral', value: MOCK_DATA.filter(d => d.sentiment === 'neutral').length, color: COLORS.neutral },
    { name: 'Negative', value: MOCK_DATA.filter(d => d.sentiment === 'negative').length, color: COLORS.negative },
  ];

  const categoryCount: Record<string, number> = {};
  MOCK_DATA.forEach(d => {
    categoryCount[d.category] = (categoryCount[d.category] || 0) + 1;
  });
  const categoryData = Object.keys(categoryCount).map(k => ({ name: k, value: categoryCount[k] }));

  // Eco Score average
  const avgEcoScore = Math.round(MOCK_DATA.reduce((acc, curr) => acc + (curr.ecoImpactScore || 0), 0) / MOCK_DATA.length);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const text = await generateExecutiveReport(MOCK_DATA);
    setReportText(text);
    setIsGeneratingReport(false);
  };

  const handleDownloadCSV = () => {
    const headers = ["ID", "Category", "Sentiment", "Content", "Eco Score", "Risk Score"];
    const rows = MOCK_DATA.map(f => [
        f.id, 
        f.category, 
        f.sentiment, 
        `"${f.content.replace(/"/g, '""')}"`, 
        f.ecoImpactScore || 0,
        0 // Risk score placeholder
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
             </button>
             <h1 className="text-xl font-bold tracking-tight">EchoSphere <span className="text-indigo-400">Admin</span></h1>
          </div>
          <div className="flex items-center space-x-3 text-sm">
             <button 
                onClick={handleDownloadCSV}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors text-slate-300"
             >
                <Download size={16} />
                <span>Export CSV</span>
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Feedback</p>
                  <p className="text-3xl font-bold text-slate-800">{MOCK_DATA.length}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                  <MessageSquare size={24} />
                </div>
              </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Eco-Impact Score</p>
                  <p className="text-3xl font-bold text-slate-800">{avgEcoScore}<span className="text-sm text-slate-400 font-normal">/100</span></p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                  <Leaf size={24} />
                </div>
              </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Positive Sentiment</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {Math.round((sentimentData[0].value / MOCK_DATA.length) * 100)}%
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Critical Issues</p>
                  <p className="text-3xl font-bold text-slate-800">2</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-red-600">
                  <AlertTriangle size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Executive Summary Block */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center space-x-2">
                        <FileText className="text-cyan-400" size={20} />
                        <span>AI Executive Summary</span>
                    </h2>
                    {!reportText && (
                        <button 
                            onClick={handleGenerateReport}
                            disabled={isGeneratingReport}
                            className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-full transition-colors flex items-center space-x-2"
                        >
                            {isGeneratingReport ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                            <span>Generate Analysis</span>
                        </button>
                    )}
                </div>
                {reportText ? (
                    <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
                        {reportText.split('\n').map((para, i) => <p key={i}>{para}</p>)}
                    </div>
                ) : (
                    <div className="text-slate-400 text-sm italic">
                        Click 'Generate Analysis' to have Gemini analyze all current feedback points and provide a strategic summary of urban trends and risks.
                    </div>
                )}
             </div>
             {/* Decor */}
             <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sentiment Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Sentiment Distribution</h2>
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
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Feedback by Category</h2>
              <div className="h-64 w-full flex-1 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Recent AI-Analyzed Feedback</h2>
              <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">View All</button>
            </div>
            <div className="divide-y divide-slate-100">
              {MOCK_DATA.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start space-x-4">
                  <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${
                    item.sentiment === 'positive' ? 'bg-green-100 text-green-600' :
                    item.sentiment === 'negative' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {item.sentiment === 'positive' ? <ThumbsUp size={16} /> :
                     item.sentiment === 'negative' ? <ThumbsDown size={16} /> :
                     <Minus size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex space-x-2">
                             <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">{item.category}</span>
                             {item.ecoImpactScore && item.ecoImpactScore > 70 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center">
                                    <Leaf size={10} className="mr-1" /> Eco-Positive
                                </span>
                             )}
                        </div>
                        <span className="text-xs text-slate-400">{item.timestamp.toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-800 text-sm font-medium line-clamp-1">{item.content}</p>
                    <div className="mt-1 flex items-center space-x-2 text-xs text-slate-500">
                        <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">AI Summary</span>
                        <span>{item.summary}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;