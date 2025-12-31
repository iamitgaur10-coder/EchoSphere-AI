import React, { useState, useEffect } from 'react';
import { Globe2, ArrowRight, MapPin, BarChart3, Radio, Scan, Zap, Activity, Hexagon, Fingerprint, MousePointer2, Database, Network, Cpu, Share2, Shield, Truck, Trees, Siren, Layers, Play } from 'lucide-react';
import { AccountSetup } from '../types';

interface LandingPageProps {
  onEnterPublic: () => void;
  onEnterAdmin: () => void;
  onEnterWizard: () => void;
  account: AccountSetup | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterPublic, onEnterAdmin, onEnterWizard, account }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'analyze'>('scan');
  const [demoText, setDemoText] = useState("The streetlights on 5th Ave have been broken for 3 weeks.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Fake "Data Stream" for the marquee - Doubled length for smooth looping
  const baseData = Array(10).fill(0).map((_, i) => ({
    id: `DAT-${Math.floor(Math.random() * 9000) + 1000}`,
    lat: (40.7 + Math.random() * 0.1).toFixed(4),
    lng: (-74.0 + Math.random() * 0.1).toFixed(4),
    status: Math.random() > 0.5 ? 'ANALYZING' : 'LOGGED'
  }));
  
  // Duplicate 4 times for a very long seamless stream
  const dataStream = [...baseData, ...baseData, ...baseData, ...baseData];

  const handleRunDemo = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisResult({
            sentiment: "Negative",
            urgency: "High (85/100)",
            category: "Infrastructure",
            dept: "Public Works"
        });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans overflow-x-hidden selection:bg-orange-500 selection:text-white">
      
      {/* --- Floating Nav --- */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-auto">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full px-4 py-3 md:px-6 md:py-3 flex items-center justify-between md:space-x-6 shadow-2xl transition-all hover:bg-zinc-900">
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-display font-bold text-white tracking-tight text-sm md:text-base">EchoSphere_OS</span>
            </div>
            <div className="hidden md:block h-4 w-[1px] bg-zinc-700"></div>
            <div className="flex items-center space-x-4 text-xs font-mono">
                {account ? (
                    <button onClick={onEnterPublic} className="hover:text-white transition-colors truncate max-w-[100px] md:max-w-none">
                        Tenant: {account.organizationName}
                    </button>
                ) : (
                    <button onClick={onEnterWizard} className="hover:text-white transition-colors">
                        [PROVISION]
                    </button>
                )}
                <button onClick={onEnterAdmin} className="text-zinc-500 hover:text-white transition-colors">
                    // ADMIN
                </button>
            </div>
        </div>
      </nav>

      {/* --- Section 1: The Blueprint Hero --- */}
      <section className="relative min-h-screen flex flex-col justify-center pt-24 px-6 lg:px-12 border-b border-zinc-900 overflow-hidden">
        
        {/* Background Texture - Dark City Map */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none grayscale mix-blend-screen">
             <img 
                src="https://images.unsplash.com/photo-1549488497-8a176881c195?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-full object-cover" 
                alt="Dark Map"
             />
        </div>
        
        {/* Gradient Overlay for Fade */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"></div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10 pb-20">
            
            {/* Left: Typography */}
            <div className="space-y-8">
                <div className="inline-flex items-center space-x-2 border border-orange-500/30 bg-orange-900/10 px-3 py-1 rounded text-orange-400 text-[10px] font-mono tracking-widest uppercase backdrop-blur-md">
                    <Activity size={12} />
                    <span>System Online • v3.0</span>
                </div>
                
                <h1 className="font-display text-5xl lg:text-8xl font-medium tracking-tighter text-white leading-[0.9]">
                    Decode <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 via-zinc-200 to-white">Urban Noise.</span>
                </h1>
                
                <p className="text-zinc-400 max-w-lg text-lg leading-relaxed border-l-2 border-zinc-800 pl-6">
                    A geospatial operating system that turns chaotic public feedback into structured, actionable intelligence using Gemini 3.0.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                    <button 
                        onClick={onEnterPublic}
                        className="group relative px-8 py-4 bg-white text-black font-display font-bold text-sm tracking-wide transition-all hover:bg-zinc-200 w-full sm:w-auto text-center"
                    >
                        LAUNCH_PUBLIC_VIEW
                        <div className="absolute inset-0 border border-white translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform -z-10 bg-black/5"></div>
                    </button>
                    
                    <button 
                        onClick={onEnterWizard}
                        className="px-8 py-4 border border-zinc-700 bg-black/20 backdrop-blur-sm text-zinc-300 font-display font-medium text-sm tracking-wide hover:border-zinc-500 hover:text-white transition-colors w-full sm:w-auto text-center"
                    >
                        DEPLOY NEW INSTANCE
                    </button>
                </div>
            </div>

            {/* Right: 3D Interface Simulation (Larger) */}
            <div className="relative h-[600px] hidden lg:block perspective-1000">
                {/* The Tilted Plane */}
                <div className="absolute inset-0 bg-zinc-900/90 border border-zinc-700 rounded-xl shadow-2xl transform rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-1000 overflow-hidden group">
                    
                    {/* Fake Header */}
                    <div className="h-10 border-b border-zinc-800 bg-zinc-950 flex items-center px-4 space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
                        <div className="flex-1 text-center font-mono text-[10px] text-zinc-600">Map_View_Controller.tsx • Live Stream</div>
                    </div>

                    {/* Fake Map Content */}
                    <div className="relative h-full bg-zinc-900">
                         {/* Map Image Underlay */}
                        <img 
                            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen"
                            alt="City Map"
                        />
                        
                        {/* Map Grid */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        
                        {/* Scanner Line */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)] animate-scan z-10 opacity-70"></div>
                        
                        {/* Data Points */}
                        <div className="absolute top-1/4 left-1/4">
                            <div className="relative">
                                <div className="w-12 h-12 bg-orange-500/20 rounded-full animate-ping absolute -left-4 -top-4"></div>
                                <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white relative z-10 shadow-[0_0_15px_rgba(249,115,22,1)]"></div>
                                <div className="absolute left-8 top-0 bg-zinc-950/90 text-[10px] font-mono p-3 rounded-sm border-l-2 border-orange-500 whitespace-nowrap text-orange-100 shadow-xl backdrop-blur-md">
                                    <span className="text-zinc-500 block mb-1">INCIDENT #9021</span>
                                    &gt; ALERT: Pothole Detected <br/>
                                    &gt; RISK: <span className="text-red-400">CRITICAL</span>
                                </div>
                            </div>
                        </div>

                         <div className="absolute bottom-1/3 right-1/4">
                            <div className="relative">
                                <div className="w-3 h-3 bg-blue-500 rounded-full border border-blue-400 shadow-[0_0_10px_rgba(59,130,246,1)]"></div>
                                <div className="absolute right-6 top-0 text-[10px] font-mono text-blue-400">
                                    USER_VERIFIED
                                </div>
                            </div>
                        </div>

                        {/* Floating UI Elements inside 3D */}
                        <div className="absolute bottom-6 left-6 right-6 bg-zinc-950/90 backdrop-blur-lg border border-zinc-800 p-4 rounded font-mono text-xs text-zinc-400 shadow-2xl">
                            <div className="flex justify-between mb-2">
                                <span className="text-white">ANALYSIS_QUEUE</span>
                                <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ACTIVE</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-1 w-full bg-zinc-800 rounded overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 w-3/4 animate-pulse"></div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-600">
                                    <div className="border border-zinc-800 p-1 text-center">CPU: 42%</div>
                                    <div className="border border-zinc-800 p-1 text-center">MEM: 1.2GB</div>
                                    <div className="border border-zinc-800 p-1 text-center">NET: 40Mb/s</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements behind */}
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-full border-2 border-zinc-800/30 -z-10 transform translate-x-4 translate-y-4 rounded-xl border-dashed"></div>
            </div>
        </div>

        {/* --- Global Metrics Strip (Fills visual space) --- */}
        <div className="absolute bottom-12 left-0 right-0 z-20 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md hidden lg:flex divide-x divide-zinc-800">
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Globe2 className="text-zinc-600" size={20} />
                <div>
                    <div className="text-xs text-zinc-500 font-mono uppercase">Active Regions</div>
                    <div className="text-lg font-display text-white">124</div>
                </div>
             </div>
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Database className="text-zinc-600" size={20} />
                <div>
                    <div className="text-xs text-zinc-500 font-mono uppercase">Data Points</div>
                    <div className="text-lg font-display text-white">8.2M+</div>
                </div>
             </div>
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Network className="text-zinc-600" size={20} />
                <div>
                    <div className="text-xs text-zinc-500 font-mono uppercase">AI Predictions</div>
                    <div className="text-lg font-display text-white">94.8%</div>
                </div>
             </div>
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Cpu className="text-zinc-600" size={20} />
                <div>
                    <div className="text-xs text-zinc-500 font-mono uppercase">System Latency</div>
                    <div className="text-lg font-display text-green-500">12ms</div>
                </div>
             </div>
        </div>

        {/* --- Infinite Data Marquee --- */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-zinc-950 border-t border-zinc-800 flex items-center overflow-hidden z-20">
            <div className="flex items-center space-x-12 animate-marquee whitespace-nowrap">
                {dataStream.map((item, i) => (
                    <div key={i} className="flex items-center space-x-3 font-mono text-[10px] text-zinc-500 opacity-60">
                        <span className="text-zinc-700">ID: {item.id}</span>
                        <span>LAT: {item.lat}</span>
                        <span>LNG: {item.lng}</span>
                        <span className={item.status === 'ANALYZING' ? 'text-orange-500' : 'text-green-800'}>[{item.status}]</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- Section 2: Neural Architecture (New) --- */}
      <section className="py-24 bg-black border-b border-zinc-900 relative">
        <div className="max-w-6xl mx-auto px-6">
            <div className="mb-16">
                <h2 className="font-display text-3xl font-medium text-white">The Neural Architecture</h2>
                <p className="text-zinc-500 mt-2">End-to-end intelligence pipeline.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-gradient-to-r from-zinc-800 via-orange-500/50 to-zinc-800 -z-10"></div>

                {/* Node 1 */}
                <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl relative group hover:border-zinc-700 transition-colors">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center mb-6 z-10 relative group-hover:bg-zinc-800">
                        <Share2 size={24} className="text-blue-400" />
                    </div>
                    <h3 className="font-display text-lg text-white mb-2">Multimodal Ingest</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Aggregates unstructured data from mobile apps, IoT sensors, social feeds, and legacy 311 systems in real-time.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-[10px] border border-zinc-800 px-2 py-1 rounded text-zinc-500 font-mono">JSON</span>
                        <span className="text-[10px] border border-zinc-800 px-2 py-1 rounded text-zinc-500 font-mono">AUDIO</span>
                        <span className="text-[10px] border border-zinc-800 px-2 py-1 rounded text-zinc-500 font-mono">VIDEO</span>
                    </div>
                </div>

                {/* Node 2 (Center) */}
                <div className="bg-zinc-950 border border-orange-500/30 p-8 rounded-2xl relative shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-black text-[10px] font-bold uppercase tracking-wider rounded-full">Core Engine</div>
                    <div className="w-12 h-12 bg-orange-900/20 border border-orange-500/50 rounded-xl flex items-center justify-center mb-6 z-10 relative">
                        <Cpu size={24} className="text-orange-500" />
                    </div>
                    <h3 className="font-display text-lg text-white mb-2">Gemini 3.0 Processing</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        The neural core analyzes sentiment, categorizes urgency, predicts trends, and verifies authenticity instantly.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded font-mono">NLP</span>
                        <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded font-mono">VISION</span>
                    </div>
                </div>

                {/* Node 3 */}
                <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl relative group hover:border-zinc-700 transition-colors">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center mb-6 z-10 relative group-hover:bg-zinc-800">
                        <Zap size={24} className="text-green-400" />
                    </div>
                    <h3 className="font-display text-lg text-white mb-2">Automated Action</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Triggers work orders, updates public dashboards, and generates executive policy briefs without human intervention.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-[10px] border border-zinc-800 px-2 py-1 rounded text-zinc-500 font-mono">API</span>
                        <span className="text-[10px] border border-zinc-800 px-2 py-1 rounded text-zinc-500 font-mono">WEBHOOKS</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- Section 3: The Interactive Logic --- */}
      <section className="py-24 px-6 border-b border-zinc-900 bg-zinc-950 relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10">
            <div className="mb-12 text-center md:text-left">
                <h2 className="font-display text-3xl md:text-4xl font-medium text-white mb-4">The Logic Engine</h2>
                <p className="text-zinc-500 max-w-xl text-lg">Don't just collect dots on a map. Understand them. <br/>Experience the Gemini 3.0 processing pipeline.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-0 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/50 shadow-2xl">
                {/* Left: Input Console */}
                <div className="lg:col-span-3 p-8 border-b lg:border-b-0 lg:border-r border-zinc-800">
                    <div className="flex space-x-4 mb-6">
                        <button 
                            onClick={() => setActiveTab('scan')}
                            className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'scan' ? 'text-white border-b-2 border-orange-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            Raw Input
                        </button>
                    </div>
                    
                    <div className="relative group">
                        <textarea 
                            value={demoText}
                            onChange={(e) => setDemoText(e.target.value)}
                            className="w-full h-48 bg-black/50 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-300 focus:ring-1 focus:ring-orange-500 outline-none resize-none transition-all focus:bg-black"
                        />
                        <div className="absolute bottom-4 right-4">
                            <button 
                                onClick={handleRunDemo}
                                disabled={isAnalyzing}
                                className="bg-white text-black px-5 py-2 rounded text-xs font-bold hover:bg-orange-500 hover:text-white transition-colors flex items-center space-x-2 shadow-lg"
                            >
                                {isAnalyzing ? <Scan className="animate-spin" size={14} /> : <Zap size={14} />}
                                <span>RUN ANALYSIS</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Output Visualization */}
                <div className="lg:col-span-2 p-8 bg-zinc-950 relative min-h-[300px]">
                    {isAnalyzing ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-500 space-y-4">
                             <div className="font-mono text-xs animate-pulse tracking-widest">PROCESSING_DATA</div>
                             <div className="w-48 h-1 bg-zinc-800 rounded overflow-hidden">
                                <div className="h-full bg-orange-500 animate-[scan_1s_ease-in-out_infinite] w-full origin-left"></div>
                             </div>
                             <div className="text-[10px] font-mono text-zinc-600">Connecting to Neural Engine...</div>
                        </div>
                    ) : analysisResult ? (
                        <div className="space-y-6 animate-fade-in-up h-full flex flex-col justify-center">
                            <div className="space-y-1 pb-4 border-b border-zinc-900">
                                <div className="text-[10px] uppercase text-zinc-500 font-mono tracking-wider">Sentiment</div>
                                <div className="text-2xl text-white font-display flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                                    <span>{analysisResult.sentiment}</span>
                                </div>
                            </div>
                             <div className="space-y-2 pb-4 border-b border-zinc-900">
                                <div className="text-[10px] uppercase text-zinc-500 font-mono tracking-wider">Urgency Score</div>
                                <div className="w-full bg-zinc-900 border border-zinc-800 h-3 rounded-full overflow-hidden relative">
                                    <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 w-[85%] relative z-10"></div>
                                    {/* Grid lines on bar */}
                                    <div className="absolute inset-0 z-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent 90%, rgba(0,0,0,0.5) 90%)', backgroundSize: '10% 100%' }}></div>
                                </div>
                                <div className="text-right text-xs font-mono text-orange-400">{analysisResult.urgency}</div>
                            </div>
                            <div className="p-4 border border-zinc-800 rounded bg-zinc-900/30">
                                <div className="flex justify-between items-center text-xs text-zinc-400 font-mono mb-2">
                                    <span>ROUTING_TARGET</span>
                                    <ArrowRight size={12} />
                                </div>
                                <div className="text-sm text-white font-medium flex items-center gap-2">
                                    <div className="p-1 bg-zinc-800 rounded"><Database size={12}/></div>
                                    {analysisResult.dept}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 font-mono space-y-2">
                             <MousePointer2 size={24} className="opacity-50 animate-bounce" />
                             <span className="text-xs">[AWAITING_INPUT]</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* --- Section 4: Command Center Visual (New) --- */}
      <section className="relative py-32 bg-zinc-950 overflow-hidden border-b border-zinc-900">
         <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
             <div className="mb-12">
                <h2 className="font-display text-4xl text-white font-medium">Total Situational Awareness</h2>
                <p className="text-zinc-500 mt-4 max-w-2xl mx-auto">
                    The visual command center gives administrators a god's eye view of city operations, powered by real-time data streams.
                </p>
             </div>

             {/* UI Mockup Container */}
             <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-2xl overflow-hidden aspect-video max-w-5xl mx-auto group">
                {/* Background Map Image */}
                <div className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-luminosity" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=2000')" }}></div>
                
                {/* Overlay UI Elements - Glassmorphism */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/20"></div>

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-4">
                    <div className="flex items-center space-x-4">
                        <div className="font-mono text-xs text-orange-500">LIVE_OPERATIONS</div>
                        <div className="h-4 w-[1px] bg-zinc-700"></div>
                        <div className="font-mono text-xs text-zinc-400">SECTOR_7</div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-mono text-zinc-300">ONLINE</span>
                    </div>
                </div>

                {/* Floating Widgets */}
                <div className="absolute top-20 left-8 w-64 bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-lg p-4 text-left">
                    <div className="text-[10px] text-zinc-500 font-mono mb-2 uppercase">Heatmap Density</div>
                    <div className="flex items-end space-x-1 h-12 mb-2">
                         <div className="w-1/5 bg-orange-900/50 h-[30%] rounded-t"></div>
                         <div className="w-1/5 bg-orange-700/50 h-[60%] rounded-t"></div>
                         <div className="w-1/5 bg-orange-500 h-[80%] rounded-t"></div>
                         <div className="w-1/5 bg-orange-700/50 h-[50%] rounded-t"></div>
                         <div className="w-1/5 bg-orange-900/50 h-[40%] rounded-t"></div>
                    </div>
                    <div className="text-xs text-white font-mono">High Activity: Downtown</div>
                </div>

                <div className="absolute top-20 right-8 w-56 bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-lg p-4 text-left">
                     <div className="text-[10px] text-zinc-500 font-mono mb-2 uppercase">Incoming Feed</div>
                     <div className="space-y-2">
                        <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
                            <img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=50&h=50&fit=crop" className="w-8 h-8 rounded bg-zinc-800 object-cover" />
                            <div className="text-[10px] text-zinc-300 leading-tight">Structure damage reported on 4th.</div>
                        </div>
                        <div className="flex items-center space-x-2">
                             <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-500"><Activity size={12}/></div>
                             <div className="text-[10px] text-zinc-300 leading-tight">Sensor 402 offline.</div>
                        </div>
                     </div>
                </div>
                
                {/* Center Reticle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-orange-500/30 rounded-full flex items-center justify-center">
                    <div className="w-28 h-28 border border-white/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="w-1 h-1 bg-orange-500 rounded-full absolute"></div>
                    <div className="absolute w-full h-[1px] bg-orange-500/20"></div>
                    <div className="absolute h-full w-[1px] bg-orange-500/20"></div>
                </div>
             </div>
         </div>
      </section>

      {/* --- Section 5: Expanded Feature Matrix (Bento Grid) --- */}
      <section className="py-24 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-3xl font-medium text-white mb-12">Capability Matrix</h2>
            <div className="grid md:grid-cols-3 gap-px bg-zinc-800 border border-zinc-800">
                {/* Feature 1 */}
                <div className="bg-zinc-950 p-10 hover:bg-zinc-900 transition-colors">
                    <div className="w-10 h-10 flex items-center justify-center mb-6 text-orange-500 bg-orange-500/10 rounded-lg">
                        <Globe2 size={20} />
                    </div>
                    <h3 className="font-display text-lg text-white mb-2">Spatial Context</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Full 3D context logging including orientation and user telemetry.
                    </p>
                </div>
                
                {/* Feature 2 */}
                <div className="bg-zinc-950 p-10 hover:bg-zinc-900 transition-colors">
                    <div className="w-10 h-10 flex items-center justify-center mb-6 text-blue-500 bg-blue-500/10 rounded-lg">
                        <Fingerprint size={20} />
                    </div>
                    <h3 className="font-display text-lg text-white mb-2">Civic Verification</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Anti-spam systems verify humanity and location proximity.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-zinc-950 p-10 hover:bg-zinc-900 transition-colors">
                    <div className="w-10 h-10 flex items-center justify-center mb-6 text-green-500 bg-green-500/10 rounded-lg">
                        <Hexagon size={20} />
                    </div>
                    <h3 className="font-display text-lg text-white mb-2">Eco-Impact Grading</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Automatic environmental impact scoring for every report.
                    </p>
                </div>

                 {/* Feature 4 */}
                 <div className="bg-zinc-950 p-10 hover:bg-zinc-900 transition-colors">
                    <div className="w-10 h-10 flex items-center justify-center mb-6 text-purple-500 bg-purple-500/10 rounded-lg">
                        <Layers size={20} />
                    </div>
                    <h3 className="font-display text-lg text-white mb-2">Multi-Tenant</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Isolated database schemas for secure, scalable city deployment.
                    </p>
                </div>

                {/* Feature 5 */}
                <div className="bg-zinc-950 p-10 hover:bg-zinc-900 transition-colors">
                    <div className="w-10 h-10 flex items-center justify-center mb-6 text-pink-500 bg-pink-500/10 rounded-lg">
                        <Scan size={20} />
                    </div>
                    <h3 className="font-display text-lg text-white mb-2">Computer Vision</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Gemini identifies objects, damage levels, and hazards in photos.
                    </p>
                </div>

                {/* Feature 6 */}
                <div className="bg-zinc-950 p-10 hover:bg-zinc-900 transition-colors">
                    <div className="w-10 h-10 flex items-center justify-center mb-6 text-yellow-500 bg-yellow-500/10 rounded-lg">
                        <BarChart3 size={20} />
                    </div>
                    <h3 className="font-display text-lg text-white mb-2">Predictive Reports</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Forecast emerging issues before they become critical failures.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* --- Section 6: Deployed Sectors (New) --- */}
      <section className="py-24 px-6 bg-black border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                <div>
                    <h2 className="font-display text-3xl font-medium text-white">Deployed Sectors</h2>
                    <p className="text-zinc-500 mt-2">Adaptable for any civic domain.</p>
                </div>
                <div className="hidden md:flex space-x-2">
                    <div className="w-12 h-1 bg-orange-500"></div>
                    <div className="w-4 h-1 bg-zinc-800"></div>
                </div>
             </div>

             <div className="grid md:grid-cols-4 gap-6">
                 {[
                    { icon: <Siren size={24} />, title: "Public Safety", desc: "Hazard reporting, light outages, and risk assessment." },
                    { icon: <Truck size={24} />, title: "Sanitation", desc: "Trash overflow, illegal dumping, and route optimization." },
                    { icon: <Trees size={24} />, title: "Parks & Rec", desc: "Facility maintenance, trail mapping, and event feedback." },
                    { icon: <Shield size={24} />, title: "Disaster Ops", desc: "Real-time damage logs and resource coordination." }
                 ].map((item, i) => (
                     <div key={i} className="group border border-zinc-800 p-6 rounded-xl hover:bg-zinc-900 transition-all cursor-default">
                        <div className="mb-4 text-zinc-400 group-hover:text-white transition-colors">{item.icon}</div>
                        <h4 className="font-bold text-white mb-2">{item.title}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-400">{item.desc}</p>
                     </div>
                 ))}
             </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 px-6 border-t border-zinc-900 text-center bg-zinc-950">
        <div className="flex items-center justify-center space-x-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
            <span className="font-display font-bold text-white tracking-tight">EchoSphere_OS</span>
        </div>
        <p className="text-xs text-zinc-600 font-mono">
            SYSTEM_STATUS: NOMINAL <br/>
            © 2024 ARCHITECTURAL SYSTEMS INC.
        </p>
      </footer>
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
      `}</style>

    </div>
  );
};

export default LandingPage;