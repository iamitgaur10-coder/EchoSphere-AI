import React, { useState, useEffect } from 'react';
import { Globe2, ArrowRight, MapPin, BarChart3, Radio, Scan, Zap, Activity, Hexagon, Fingerprint, MousePointer2, Database, Network, Cpu, Share2, Shield, Truck, Trees, Siren, Layers, Play, Mic, PenTool, LayoutDashboard } from 'lucide-react';
import { AccountSetup } from '../types';

interface LandingPageProps {
  onEnterPublic: () => void;
  onEnterAdmin: () => void;
  onEnterWizard: () => void;
  account: AccountSetup | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterPublic, onEnterAdmin, onEnterWizard, account }) => {
  const [tutorialMode, setTutorialMode] = useState<'citizen' | 'admin'>('citizen');

  // Fake "Data Stream" for the marquee
  const baseData = Array(10).fill(0).map((_, i) => ({
    id: `DAT-${Math.floor(Math.random() * 9000) + 1000}`,
    lat: (40.7 + Math.random() * 0.1).toFixed(4),
    lng: (-74.0 + Math.random() * 0.1).toFixed(4),
    status: Math.random() > 0.5 ? 'ANALYZING' : 'LOGGED'
  }));
  
  const dataStream = [...baseData, ...baseData, ...baseData, ...baseData];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 font-sans overflow-x-hidden selection:bg-orange-500 selection:text-white transition-colors duration-300">
      
      {/* --- Floating Nav --- */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-auto">
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-full px-4 py-3 md:px-6 md:py-3 flex items-center justify-between md:space-x-6 shadow-2xl transition-all hover:bg-white dark:hover:bg-zinc-900">
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-display font-bold text-zinc-900 dark:text-white tracking-tight text-sm md:text-base">EchoSphere</span>
            </div>
            <div className="hidden md:block h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700"></div>
            <div className="flex items-center space-x-4 text-xs font-mono">
                {account ? (
                    <button onClick={onEnterPublic} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors truncate max-w-[100px] md:max-w-none">
                        Tenant: {account.organizationName}
                    </button>
                ) : (
                    <button onClick={onEnterWizard} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors uppercase tracking-wide">
                        Get Started
                    </button>
                )}
                <button onClick={onEnterAdmin} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors uppercase tracking-wide">
                    Dashboard
                </button>
            </div>
        </div>
      </nav>

      {/* --- Section 1: The Blueprint Hero --- */}
      <section className="relative min-h-screen flex flex-col justify-center pt-24 px-6 lg:px-12 border-b border-zinc-200 dark:border-zinc-900 overflow-hidden">
        
        {/* Background Texture - Adjusted for Light Mode Visibility */}
        <div className="absolute inset-0 z-0 pointer-events-none grayscale">
             <img 
                src="https://images.unsplash.com/photo-1549488497-8a176881c195?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-10 mix-blend-multiply dark:opacity-20 dark:mix-blend-screen" 
                alt="Dark Map"
             />
        </div>
        
        {/* Gradient Overlay for Fade */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-zinc-50/80 dark:via-zinc-950/80 to-transparent"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-zinc-50 dark:from-zinc-950 via-zinc-50/80 dark:via-zinc-950/80 to-transparent"></div>

        {/* Grid Overlay - Darker in light mode */}
        <div className="absolute inset-0 z-0 dark:block hidden" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        <div className="absolute inset-0 z-0 dark:hidden block" style={{ backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10 pb-20">
            
            {/* Left: Typography */}
            <div className="space-y-8">
                <div className="inline-flex items-center space-x-2 border border-orange-500/30 bg-orange-500/10 px-3 py-1 rounded text-orange-600 dark:text-orange-400 text-[10px] font-mono tracking-widest uppercase backdrop-blur-md">
                    <Activity size={12} />
                    <span>Platform Active</span>
                </div>
                
                <h1 className="font-display text-5xl lg:text-8xl font-medium tracking-tighter text-zinc-900 dark:text-white leading-[0.9]">
                    Decode <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-900 dark:from-zinc-500 dark:via-zinc-200 dark:to-white">Urban Noise.</span>
                </h1>
                
                <p className="text-zinc-600 dark:text-zinc-400 max-w-lg text-lg leading-relaxed border-l-2 border-zinc-300 dark:border-zinc-800 pl-6">
                    A geospatial operating system that turns chaotic public feedback into structured, actionable intelligence using Gemini 3.0.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                    <button 
                        onClick={onEnterPublic}
                        className="group relative px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-display font-bold text-sm tracking-wide transition-all hover:bg-zinc-700 dark:hover:bg-zinc-200 w-full sm:w-auto text-center"
                    >
                        OPEN PUBLIC MAP
                        <div className="absolute inset-0 border border-zinc-900 dark:border-white translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform -z-10 bg-black/5"></div>
                    </button>
                    
                    <button 
                        onClick={onEnterWizard}
                        className="px-8 py-4 border border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-black/20 backdrop-blur-sm text-zinc-700 dark:text-zinc-300 font-display font-medium text-sm tracking-wide hover:border-zinc-500 hover:text-black dark:hover:text-white transition-colors w-full sm:w-auto text-center"
                    >
                        CREATE WORKSPACE
                    </button>
                </div>
            </div>

            {/* Right: 3D Interface Simulation (Larger) */}
            <div className="relative h-[600px] hidden lg:block perspective-1000">
                {/* The Tilted Plane */}
                <div className="absolute inset-0 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl transform rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-1000 overflow-hidden group">
                    
                    {/* Fake Header */}
                    <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center px-4 space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
                        <div className="flex-1 text-center font-mono text-[10px] text-zinc-400 dark:text-zinc-600">Live City Feed • Real-time</div>
                    </div>

                    {/* Fake Map Content */}
                    <div className="relative h-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                         {/* Map Image Underlay - Adjusted for Light/Dark visibility */}
                        <img 
                            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-50 mix-blend-multiply grayscale dark:opacity-20 dark:mix-blend-screen"
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
                                <div className="absolute left-8 top-0 bg-white/90 dark:bg-zinc-950/90 text-[10px] font-mono p-3 rounded-sm border-l-2 border-orange-500 whitespace-nowrap text-zinc-900 dark:text-orange-100 shadow-xl backdrop-blur-md">
                                    <span className="text-zinc-500 block mb-1">INCIDENT #9021</span>
                                    &gt; ALERT: Pothole Detected <br/>
                                    &gt; RISK: <span className="text-red-500 dark:text-red-400">CRITICAL</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating UI Elements inside 3D */}
                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border border-zinc-200 dark:border-zinc-800 p-4 rounded font-mono text-xs text-zinc-600 dark:text-zinc-400 shadow-2xl">
                            <div className="flex justify-between mb-2">
                                <span className="text-zinc-900 dark:text-white">Analysis Status</span>
                                <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ACTIVE</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 w-3/4 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- Global Metrics Strip --- */}
        <div className="absolute bottom-12 left-0 right-0 z-20 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md hidden lg:flex divide-x divide-zinc-200 dark:divide-zinc-800">
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Globe2 className="text-zinc-400 dark:text-zinc-600" size={20} />
                <div>
                    <div className="text-xs text-zinc-500 font-mono uppercase">Active Regions</div>
                    <div className="text-lg font-display text-zinc-900 dark:text-white">124</div>
                </div>
             </div>
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Database className="text-zinc-400 dark:text-zinc-600" size={20} />
                <div>
                    <div className="text-xs text-zinc-500 font-mono uppercase">Data Points</div>
                    <div className="text-lg font-display text-zinc-900 dark:text-white">8.2M+</div>
                </div>
             </div>
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Network className="text-zinc-400 dark:text-zinc-600" size={20} />
                <div>
                    <div className="text-xs text-zinc-500 font-mono uppercase">AI Predictions</div>
                    <div className="text-lg font-display text-zinc-900 dark:text-white">94.8%</div>
                </div>
             </div>
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Cpu className="text-zinc-400 dark:text-zinc-600" size={20} />
                <div>
                    <div className="text-xs text-zinc-500 font-mono uppercase">Response Time</div>
                    <div className="text-lg font-display text-green-600 dark:text-green-500">12ms</div>
                </div>
             </div>
        </div>

        {/* --- Infinite Data Marquee --- */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center overflow-hidden z-20">
            <div className="flex items-center space-x-12 animate-marquee whitespace-nowrap">
                {dataStream.map((item, i) => (
                    <div key={i} className="flex items-center space-x-3 font-mono text-[10px] text-zinc-500 opacity-60">
                        <span className="text-zinc-700 dark:text-zinc-500">ID: {item.id}</span>
                        <span>LAT: {item.lat}</span>
                        <span>LNG: {item.lng}</span>
                        <span className={item.status === 'ANALYZING' ? 'text-orange-500' : 'text-green-700 dark:text-green-800'}>[{item.status}]</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- Section 2: Operational Guide (Tutorial) --- */}
      <section className="py-24 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                <div>
                    <div className="inline-flex items-center space-x-2 text-orange-500 mb-2">
                        <Scan size={16} />
                        <span className="text-xs font-mono font-bold uppercase tracking-widest">System Protocols</span>
                    </div>
                    <h2 className="font-display text-3xl font-medium text-zinc-900 dark:text-white">Operational Guide</h2>
                    <p className="text-zinc-500 mt-2">Select your clearance level to view interaction protocols.</p>
                </div>

                {/* Role Switcher */}
                <div className="bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-lg inline-flex border border-zinc-200 dark:border-zinc-800">
                    <button 
                        onClick={() => setTutorialMode('citizen')}
                        className={`px-4 py-2 rounded-md text-xs font-bold font-mono uppercase transition-all ${
                            tutorialMode === 'citizen' 
                            ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                        }`}
                    >
                        Citizen Interface
                    </button>
                    <button 
                        onClick={() => setTutorialMode('admin')}
                        className={`px-4 py-2 rounded-md text-xs font-bold font-mono uppercase transition-all ${
                            tutorialMode === 'admin' 
                            ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                        }`}
                    >
                        Command Center
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {tutorialMode === 'citizen' ? (
                    <>
                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <MapPin size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-mono text-orange-500 mb-2">STEP_01</div>
                            <h3 className="font-display text-xl text-zinc-900 dark:text-white mb-3">Locate & Tag</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Enter the <span className="text-zinc-900 dark:text-zinc-300 font-bold">Public Map</span>. Click any location to drop a pin on the precise coordinates of an issue or idea.
                            </p>
                        </div>

                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <Mic size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-mono text-orange-500 mb-2">STEP_02</div>
                            <h3 className="font-display text-xl text-zinc-900 dark:text-white mb-3">Input Context</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Use <span className="text-zinc-900 dark:text-zinc-300 font-bold">Voice Dictation</span>, text, or upload photos. Our multimodal engine accepts raw unstructured data.
                            </p>
                        </div>

                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <Cpu size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-mono text-orange-500 mb-2">STEP_03</div>
                            <h3 className="font-display text-xl text-zinc-900 dark:text-white mb-3">AI Analysis</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Gemini instantly analyzes sentiment, assigns a <span className="text-zinc-900 dark:text-zinc-300 font-bold">Risk Score</span>, and routes it to the correct city department.
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <PenTool size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-mono text-blue-500 mb-2">PHASE_01</div>
                            <h3 className="font-display text-xl text-zinc-900 dark:text-white mb-3">Provision Workspace</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Use the <span className="text-zinc-900 dark:text-zinc-300 font-bold">Creation Wizard</span> to define your organization's name, region code, and geographic center point.
                            </p>
                        </div>

                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <LayoutDashboard size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-mono text-blue-500 mb-2">PHASE_02</div>
                            <h3 className="font-display text-xl text-zinc-900 dark:text-white mb-3">Deploy & Monitor</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Launch your tenant instance. Access the <span className="text-zinc-900 dark:text-zinc-300 font-bold">Admin Dashboard</span> to view real-time heatmaps and incoming data streams.
                            </p>
                        </div>

                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <BarChart3 size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-mono text-blue-500 mb-2">PHASE_03</div>
                            <h3 className="font-display text-xl text-zinc-900 dark:text-white mb-3">Strategic Intelligence</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Generate <span className="text-zinc-900 dark:text-zinc-300 font-bold">Executive Reports</span> and export CSVs. AI identifies trends, risks, and eco-impact opportunities automatically.
                            </p>
                        </div>
                    </>
                )}
            </div>
            
            <div className="mt-12 text-center">
                 {tutorialMode === 'citizen' ? (
                     <button onClick={onEnterPublic} className="text-sm font-bold border-b border-orange-500 text-zinc-900 dark:text-white pb-0.5 hover:text-orange-500 transition-colors">
                        Launch Public Interface &rarr;
                     </button>
                 ) : (
                     <button onClick={onEnterWizard} className="text-sm font-bold border-b border-blue-500 text-zinc-900 dark:text-white pb-0.5 hover:text-blue-500 transition-colors">
                        Start Provisioning Sequence &rarr;
                     </button>
                 )}
            </div>

        </div>
      </section>

      {/* --- Section 3: Neural Architecture --- */}
      <section className="py-24 bg-zinc-100 dark:bg-black border-b border-zinc-200 dark:border-zinc-900 relative">
        <div className="max-w-6xl mx-auto px-6">
            <div className="mb-16">
                <h2 className="font-display text-3xl font-medium text-zinc-900 dark:text-white">The Neural Architecture</h2>
                <p className="text-zinc-500 mt-2">End-to-end intelligence pipeline.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-gradient-to-r from-zinc-300 dark:from-zinc-800 via-orange-500/50 to-zinc-300 dark:to-zinc-800 -z-10"></div>

                {/* Node 1 */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl relative group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                    <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mb-6 z-10 relative group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800">
                        <Share2 size={24} className="text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="font-display text-lg text-zinc-900 dark:text-white mb-2">Multimodal Ingest</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
                        Aggregates unstructured data from mobile apps, IoT sensors, social feeds, and legacy 311 systems in real-time.
                    </p>
                </div>

                {/* Node 2 (Center) */}
                <div className="bg-white dark:bg-zinc-950 border border-orange-500/30 p-8 rounded-2xl relative shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-black text-[10px] font-bold uppercase tracking-wider rounded-full">Core Engine</div>
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/50 rounded-xl flex items-center justify-center mb-6 z-10 relative">
                        <Cpu size={24} className="text-orange-500" />
                    </div>
                    <h3 className="font-display text-lg text-zinc-900 dark:text-white mb-2">Gemini 3.0 Processing</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        The neural core analyzes sentiment, categorizes urgency, predicts trends, and verifies authenticity instantly.
                    </p>
                </div>

                {/* Node 3 */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl relative group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                    <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mb-6 z-10 relative group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800">
                        <Zap size={24} className="text-green-500 dark:text-green-400" />
                    </div>
                    <h3 className="font-display text-lg text-zinc-900 dark:text-white mb-2">Automated Action</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
                        Triggers work orders, updates public dashboards, and generates executive policy briefs without human intervention.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* --- Section 6: Deployed Sectors --- */}
      <section className="py-24 px-6 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                <div>
                    <h2 className="font-display text-3xl font-medium text-zinc-900 dark:text-white">Deployed Sectors</h2>
                    <p className="text-zinc-500 mt-2">Adaptable for any civic domain.</p>
                </div>
                <div className="hidden md:flex space-x-2">
                    <div className="w-12 h-1 bg-orange-500"></div>
                    <div className="w-4 h-1 bg-zinc-300 dark:bg-zinc-800"></div>
                </div>
             </div>

             <div className="grid md:grid-cols-4 gap-6">
                 {[
                    { icon: <Siren size={24} />, title: "Public Safety", desc: "Hazard reporting, light outages, and risk assessment." },
                    { icon: <Truck size={24} />, title: "Sanitation", desc: "Trash overflow, illegal dumping, and route optimization." },
                    { icon: <Trees size={24} />, title: "Parks & Rec", desc: "Facility maintenance, trail mapping, and event feedback." },
                    { icon: <Shield size={24} />, title: "Disaster Ops", desc: "Real-time damage logs and resource coordination." }
                 ].map((item, i) => (
                     <div key={i} className="group border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-default">
                        <div className="mb-4 text-zinc-400 dark:text-zinc-400 group-hover:text-orange-500 dark:group-hover:text-white transition-colors">{item.icon}</div>
                        <h4 className="font-bold text-zinc-900 dark:text-white mb-2">{item.title}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-600 dark:group-hover:text-zinc-400">{item.desc}</p>
                     </div>
                 ))}
             </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 px-6 border-t border-zinc-200 dark:border-zinc-900 text-center bg-zinc-100 dark:bg-zinc-950">
        <div className="flex items-center justify-center space-x-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
            <span className="font-display font-bold text-zinc-900 dark:text-white tracking-tight">EchoSphere</span>
        </div>
        <p className="text-xs text-zinc-500 font-mono">
            Status: Operational <br/>
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