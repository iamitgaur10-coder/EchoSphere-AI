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
    id: `FB-${Math.floor(Math.random() * 9000) + 1000}`,
    lat: (40.7 + Math.random() * 0.1).toFixed(4),
    lng: (-74.0 + Math.random() * 0.1).toFixed(4),
    status: Math.random() > 0.5 ? 'Processing' : 'Saved'
  }));
  
  const dataStream = [...baseData, ...baseData, ...baseData, ...baseData];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 font-sans overflow-x-hidden selection:bg-orange-500 selection:text-white transition-colors duration-300">
      
      {/* --- Floating Nav --- */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-auto">
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-full px-4 py-3 md:px-6 md:py-3 flex items-center justify-between md:space-x-6 shadow-2xl transition-all hover:bg-white dark:hover:bg-zinc-900">
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="font-display font-bold text-zinc-900 dark:text-white tracking-tight text-sm md:text-base">EchoSphere</span>
            </div>
            <div className="hidden md:block h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700"></div>
            <div className="flex items-center space-x-4 text-xs font-medium">
                {account ? (
                    <button onClick={onEnterPublic} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors truncate max-w-[100px] md:max-w-none">
                        {account.organizationName}
                    </button>
                ) : (
                    <button onClick={onEnterWizard} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
                        Get Started
                    </button>
                )}
                <button onClick={onEnterAdmin} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                    Dashboard
                </button>
            </div>
        </div>
      </nav>

      {/* --- Section 1: Hero --- */}
      <section className="relative min-h-screen flex flex-col justify-center pt-24 px-6 lg:px-12 border-b border-zinc-200 dark:border-zinc-900 overflow-hidden">
        
        {/* Background Texture */}
        <div className="absolute inset-0 z-0 pointer-events-none grayscale">
             <img 
                src="https://images.unsplash.com/photo-1549488497-8a176881c195?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-10 mix-blend-multiply dark:opacity-20 dark:mix-blend-screen" 
                alt="Dark Map"
             />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 via-zinc-50/80 dark:via-zinc-950/80 to-transparent"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-zinc-50 dark:from-zinc-950 via-zinc-50/80 dark:via-zinc-950/80 to-transparent"></div>

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10 pb-20">
            
            {/* Left: Typography */}
            <div className="space-y-8">
                <div className="inline-flex items-center space-x-2 border border-orange-500/30 bg-orange-500/10 px-3 py-1 rounded text-orange-600 dark:text-orange-400 text-xs font-medium tracking-wide">
                    <Activity size={12} />
                    <span>System Online</span>
                </div>
                
                <h1 className="font-display text-5xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
                    Better Cities, <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500">Together.</span>
                </h1>
                
                <p className="text-zinc-600 dark:text-zinc-400 max-w-lg text-lg leading-relaxed border-l-2 border-zinc-300 dark:border-zinc-800 pl-6">
                    A platform for communities to share feedback, report issues, and improve their neighborhoods using AI-powered insights.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
                    <button 
                        onClick={onEnterPublic}
                        className="group relative px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-sm tracking-wide transition-all hover:bg-zinc-700 dark:hover:bg-zinc-200 w-full sm:w-auto text-center rounded-lg shadow-lg"
                    >
                        View Public Map
                    </button>
                    
                    <button 
                        onClick={onEnterWizard}
                        className="px-8 py-4 border border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-black/20 backdrop-blur-sm text-zinc-700 dark:text-zinc-300 font-medium text-sm tracking-wide hover:border-zinc-500 hover:text-black dark:hover:text-white transition-colors w-full sm:w-auto text-center rounded-lg"
                    >
                        Create Organization
                    </button>
                </div>
            </div>

            {/* Right: 3D Interface Simulation */}
            <div className="relative h-[600px] hidden lg:block perspective-1000">
                {/* The Tilted Plane */}
                <div className="absolute inset-0 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl transform rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-1000 overflow-hidden group">
                    
                    {/* Fake Header */}
                    <div className="h-10 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center px-4 space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="flex-1 text-center font-mono text-xs text-zinc-400 dark:text-zinc-600">Live Map View</div>
                    </div>

                    {/* Fake Map Content */}
                    <div className="relative h-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                         {/* Map Image Underlay */}
                        <img 
                            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-50 mix-blend-multiply grayscale dark:opacity-20 dark:mix-blend-screen"
                            alt="City Map"
                        />
                        
                        {/* Map Grid */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        
                        {/* Data Points */}
                        <div className="absolute top-1/4 left-1/4">
                            <div className="relative">
                                <div className="w-12 h-12 bg-orange-500/20 rounded-full animate-ping absolute -left-4 -top-4"></div>
                                <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white relative z-10 shadow-lg"></div>
                                <div className="absolute left-8 top-0 bg-white/90 dark:bg-zinc-950/90 text-xs p-3 rounded-lg border-l-4 border-orange-500 whitespace-nowrap text-zinc-900 dark:text-orange-100 shadow-xl backdrop-blur-md">
                                    <span className="text-zinc-500 block mb-1 text-[10px] uppercase font-bold">New Report</span>
                                    Pothole reported on Main St. <br/>
                                    <span className="text-red-600 dark:text-red-400 font-bold text-[10px] uppercase">High Priority</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating UI Elements inside 3D */}
                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 shadow-xl">
                            <div className="flex justify-between mb-2">
                                <span className="text-zinc-900 dark:text-white font-medium">AI Analysis</span>
                                <span className="text-green-600 font-bold text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ACTIVE</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-3/4"></div>
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
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Communities</div>
                    <div className="text-lg font-display font-bold text-zinc-900 dark:text-white">124</div>
                </div>
             </div>
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Database className="text-zinc-400 dark:text-zinc-600" size={20} />
                <div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Reports Filed</div>
                    <div className="text-lg font-display font-bold text-zinc-900 dark:text-white">8.2M+</div>
                </div>
             </div>
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Network className="text-zinc-400 dark:text-zinc-600" size={20} />
                <div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Issues Resolved</div>
                    <div className="text-lg font-display font-bold text-zinc-900 dark:text-white">94.8%</div>
                </div>
             </div>
             <div className="flex-1 p-4 flex items-center justify-center space-x-3">
                <Cpu className="text-zinc-400 dark:text-zinc-600" size={20} />
                <div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Avg. Response</div>
                    <div className="text-lg font-display font-bold text-green-600 dark:text-green-500">24h</div>
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
                        <span className={item.status === 'Processing' ? 'text-orange-500' : 'text-green-700 dark:text-green-600'}>[{item.status}]</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- Section 2: How It Works --- */}
      <section className="py-24 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                <div>
                    <div className="inline-flex items-center space-x-2 text-orange-600 mb-2">
                        <Scan size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Guide</span>
                    </div>
                    <h2 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">How It Works</h2>
                    <p className="text-zinc-500 mt-2">See how EchoSphere helps both residents and city managers.</p>
                </div>

                {/* Role Switcher */}
                <div className="bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-lg inline-flex border border-zinc-200 dark:border-zinc-800">
                    <button 
                        onClick={() => setTutorialMode('citizen')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
                            tutorialMode === 'citizen' 
                            ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                        }`}
                    >
                        For Residents
                    </button>
                    <button 
                        onClick={() => setTutorialMode('admin')}
                        className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
                            tutorialMode === 'admin' 
                            ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                        }`}
                    >
                        For Admins
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
                            <div className="text-xs font-bold text-orange-600 mb-2 uppercase">Step 1</div>
                            <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-3">Drop a Pin</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Open the <span className="text-zinc-900 dark:text-zinc-300 font-bold">Public Map</span> and click on the location where you want to leave feedback or report an issue.
                            </p>
                        </div>

                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <Mic size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-bold text-orange-600 mb-2 uppercase">Step 2</div>
                            <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-3">Describe It</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Type your message, use <span className="text-zinc-900 dark:text-zinc-300 font-bold">Voice Input</span>, or upload a photo. You can describe what you see in your own words.
                            </p>
                        </div>

                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <Cpu size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-bold text-orange-600 mb-2 uppercase">Step 3</div>
                            <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-3">Instant Analysis</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Our AI instantly reads your feedback, checks the priority, and makes sure it gets to the right department.
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <PenTool size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-bold text-blue-500 mb-2 uppercase">Phase 1</div>
                            <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-3">Create Workspace</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Use the <span className="text-zinc-900 dark:text-zinc-300 font-bold">Setup Wizard</span> to name your organization and select the area you want to manage.
                            </p>
                        </div>

                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <LayoutDashboard size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-bold text-blue-500 mb-2 uppercase">Phase 2</div>
                            <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-3">Launch & Monitor</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Publish your public map. Use the <span className="text-zinc-900 dark:text-zinc-300 font-bold">Dashboard</span> to see real-time feedback and issues as they arrive.
                            </p>
                        </div>

                        <div className="group p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all">
                            <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <BarChart3 size={24} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-xs font-bold text-blue-500 mb-2 uppercase">Phase 3</div>
                            <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-3">Get Insights</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Generate <span className="text-zinc-900 dark:text-zinc-300 font-bold">Reports</span> with one click. AI helps you spot trends, risks, and ways to improve sustainability.
                            </p>
                        </div>
                    </>
                )}
            </div>
            
            <div className="mt-12 text-center">
                 {tutorialMode === 'citizen' ? (
                     <button onClick={onEnterPublic} className="text-sm font-bold border-b border-orange-500 text-zinc-900 dark:text-white pb-0.5 hover:text-orange-500 transition-colors">
                        Go to Public Map &rarr;
                     </button>
                 ) : (
                     <button onClick={onEnterWizard} className="text-sm font-bold border-b border-blue-500 text-zinc-900 dark:text-white pb-0.5 hover:text-blue-500 transition-colors">
                        Start Setup &rarr;
                     </button>
                 )}
            </div>

        </div>
      </section>

      {/* --- Section 3: Technology --- */}
      <section className="py-24 bg-zinc-100 dark:bg-black border-b border-zinc-200 dark:border-zinc-900 relative">
        <div className="max-w-6xl mx-auto px-6">
            <div className="mb-16">
                <h2 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">Our Technology</h2>
                <p className="text-zinc-500 mt-2">Turning messy data into clear action plans.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-gradient-to-r from-zinc-300 dark:from-zinc-800 via-orange-500/50 to-zinc-300 dark:to-zinc-800 -z-10"></div>

                {/* Node 1 */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl relative group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors shadow-sm">
                    <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mb-6 z-10 relative group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800">
                        <Share2 size={24} className="text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Easy Collection</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
                        Gather feedback from mobile apps, social media, and web forms all in one place.
                    </p>
                </div>

                {/* Node 2 (Center) */}
                <div className="bg-white dark:bg-zinc-950 border border-orange-500/30 p-8 rounded-2xl relative shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-black text-[10px] font-bold uppercase tracking-wider rounded-full">AI Powered</div>
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/50 rounded-xl flex items-center justify-center mb-6 z-10 relative">
                        <Cpu size={24} className="text-orange-500" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Smart Analysis</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Google Gemini AI reads every report to understand the problem, sentiment, and urgency instantly.
                    </p>
                </div>

                {/* Node 3 */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl relative group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors shadow-sm">
                    <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center mb-6 z-10 relative group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800">
                        <Zap size={24} className="text-green-500 dark:text-green-400" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Fast Action</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-500 leading-relaxed">
                        Automated alerts and reports help city teams respond faster and prioritize what matters most.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* --- Section 6: Use Cases --- */}
      <section className="py-24 px-6 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                <div>
                    <h2 className="font-display text-3xl font-bold text-zinc-900 dark:text-white">Use Cases</h2>
                    <p className="text-zinc-500 mt-2">Works for any community need.</p>
                </div>
                <div className="hidden md:flex space-x-2">
                    <div className="w-12 h-1 bg-orange-500"></div>
                    <div className="w-4 h-1 bg-zinc-300 dark:bg-zinc-800"></div>
                </div>
             </div>

             <div className="grid md:grid-cols-4 gap-6">
                 {[
                    { icon: <Siren size={24} />, title: "Public Safety", desc: "Report hazards, light outages, and safety concerns." },
                    { icon: <Truck size={24} />, title: "Sanitation", desc: "Track trash pickup, illegal dumping, and street cleaning." },
                    { icon: <Trees size={24} />, title: "Parks & Rec", desc: "Maintenance requests for parks, trails, and public spaces." },
                    { icon: <Shield size={24} />, title: "Disaster Ops", desc: "Real-time logs for storms, floods, and emergencies." }
                 ].map((item, i) => (
                     <div key={i} className="group border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-default shadow-sm hover:shadow-md">
                        <div className="mb-4 text-zinc-400 dark:text-zinc-400 group-hover:text-orange-500 dark:group-hover:text-white transition-colors">{item.icon}</div>
                        <h4 className="font-bold text-zinc-900 dark:text-white mb-2">{item.title}</h4>
                        <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-600 dark:group-hover:text-zinc-400">{item.desc}</p>
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
        <p className="text-xs text-zinc-500">
            System Operational <br/>
            © 2024 EchoSphere AI
        </p>
      </footer>
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
      `}</style>

    </div>
  );
};

export default LandingPage;