import React, { useState, useEffect } from 'react';
import { Globe2, ArrowRight, MapPin, BarChart3, Radio, Scan, Zap, Activity, Hexagon, Fingerprint, MousePointer2, Database, Network, Cpu, Share2, Shield, Truck, Trees, Siren, Layers, Play, Mic, PenTool, LayoutDashboard, Building2, MousePointerClick, Github, Twitter, Linkedin } from 'lucide-react';
import { AccountSetup, Organization, Feedback } from '../types';
import { APP_CONFIG } from '../config/constants';
import { dataService } from '../services/dataService';
import MapArea from './MapArea';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onEnterPublic: () => void;
  onEnterAdmin: () => void;
  onEnterWizard: () => void;
  onOpenContent: (page: string) => void;
  account: AccountSetup | null;
  isDarkMode?: boolean;
}

const LA_CENTER = { x: -118.2437, y: 34.0522 };

// Mock data for the visual map effect
const VISUAL_FEEDBACK: Feedback[] = [
    { id: 'v1', location: { x: -118.25, y: 34.05 }, content: 'Traffic light sync issue', sentiment: 'negative', category: 'Traffic', timestamp: new Date(), votes: 0, status: 'received' },
    { id: 'v2', location: { x: -118.24, y: 34.06 }, content: 'Park clean up needed', sentiment: 'neutral', category: 'Sanitation', timestamp: new Date(), votes: 0, status: 'triaged' },
    { id: 'v3', location: { x: -118.235, y: 34.045 }, content: 'Great new bike lane', sentiment: 'positive', category: 'Infrastructure', timestamp: new Date(), votes: 0, status: 'resolved' },
    { id: 'v4', location: { x: -118.26, y: 34.055 }, content: 'Suspicious activity', sentiment: 'negative', category: 'Safety', timestamp: new Date(), votes: 0, status: 'received' },
    { id: 'v5', location: { x: -118.245, y: 34.04 }, content: 'Pothole repair', sentiment: 'neutral', category: 'Infrastructure', timestamp: new Date(), votes: 0, status: 'in_progress' },
    { id: 'v6', location: { x: -118.255, y: 34.065 }, content: 'Noise complaint', sentiment: 'negative', category: 'General', timestamp: new Date(), votes: 0, status: 'received' },
    { id: 'v7', location: { x: -118.23, y: 34.052 }, content: 'New tree planting', sentiment: 'positive', category: 'Sustainability', timestamp: new Date(), votes: 0, status: 'resolved' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onEnterPublic, onEnterAdmin, onEnterWizard, onOpenContent, account, isDarkMode = false }) => {
  const [tutorialMode, setTutorialMode] = useState<'citizen' | 'admin'>('citizen');
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
  const [showOrgList, setShowOrgList] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
      const loadOrgs = async () => {
          const orgs = await dataService.listOrganizations();
          setAvailableOrgs(orgs);
      };
      loadOrgs();
  }, []);

  const handleSwitchOrg = (slug: string) => {
      navigate(`/org/${slug}`);
  };

  // Fake "Data Stream" for the marquee
  const baseLat = APP_CONFIG.MAP.DEFAULT_CENTER.y;
  const baseLng = APP_CONFIG.MAP.DEFAULT_CENTER.x;

  const baseData = Array(10).fill(0).map((_, i) => ({
    id: `FB-${Math.floor(Math.random() * 9000) + 1000}`,
    lat: (baseLat + (Math.random() * 0.1) - 0.05).toFixed(4),
    lng: (baseLng + (Math.random() * 0.1) - 0.05).toFixed(4),
    status: Math.random() > 0.5 ? 'Processing' : 'Saved'
  }));
  
  const dataStream = [...baseData, ...baseData, ...baseData, ...baseData];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 font-sans overflow-x-hidden selection:bg-orange-500 selection:text-white transition-colors duration-300">
      
      {/* --- Floating Nav --- */}
      <nav className="fixed top-2 md:top-4 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-5xl md:w-auto">
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-full px-3 py-2 md:px-6 md:py-2.5 flex items-center justify-between md:space-x-6 shadow-xl transition-all hover:bg-white dark:hover:bg-zinc-900">
            <div className="flex items-center space-x-2 cursor-pointer flex-shrink-0" onClick={() => setShowOrgList(!showOrgList)}>
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="font-display font-bold text-zinc-900 dark:text-white tracking-tight text-sm">EchoSphere</span>
            </div>
            <div className="hidden md:block h-3 w-[1px] bg-zinc-300 dark:bg-zinc-700"></div>
            <div className="flex items-center space-x-2 md:space-x-4 text-[10px] md:text-xs font-medium">
                {account ? (
                    <button onClick={onEnterPublic} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors truncate max-w-[60px] md:max-w-none font-bold">
                        {account.organizationName}
                    </button>
                ) : (
                    <button onClick={onEnterWizard} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors whitespace-nowrap">
                        Get Started
                    </button>
                )}
                <button onClick={onEnterAdmin} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                    Dashboard
                </button>
                
                {availableOrgs.length > 0 && (
                     <div className="relative group">
                        <button onClick={() => setShowOrgList(!showOrgList)} className="flex items-center space-x-1 text-orange-600 hover:text-orange-500 transition-colors">
                            <Globe2 size={12} />
                            <span className="hidden sm:inline">Explore</span>
                        </button>
                        
                        {/* Dropdown for Communities */}
                        {showOrgList && (
                             <div className="absolute top-full right-0 mt-3 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden py-1 animate-fade-in-up">
                                 <div className="px-4 py-2 text-[10px] font-bold uppercase text-zinc-500 tracking-wider border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                                     Active Communities
                                 </div>
                                 <div className="max-h-56 overflow-y-auto">
                                     {availableOrgs.map(org => (
                                         <button 
                                            key={org.id}
                                            onClick={() => handleSwitchOrg(org.slug)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between group"
                                         >
                                             <div>
                                                 <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-orange-600">{org.name}</div>
                                                 <div className="text-[9px] text-zinc-500">{org.focusArea || 'General'}</div>
                                             </div>
                                             <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-orange-500" />
                                         </button>
                                     ))}
                                 </div>
                                 <div className="border-t border-zinc-200 dark:border-zinc-800 p-1.5">
                                     <button 
                                        onClick={onEnterWizard}
                                        className="w-full py-1.5 text-[10px] font-bold text-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-400"
                                     >
                                         + Create New
                                     </button>
                                 </div>
                             </div>
                        )}
                     </div>
                )}
            </div>
        </div>
      </nav>

      {/* --- Section 1: Hero --- */}
      <section className="relative pt-24 pb-12 lg:py-0 lg:min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-12 border-b border-zinc-200 dark:border-zinc-900 overflow-hidden">
        
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

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 lg:pb-16">
            
            {/* Left: Typography */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 rounded text-orange-600 dark:text-orange-400 text-[10px] font-medium tracking-wide">
                    <Activity size={10} />
                    <span>System Online</span>
                </div>
                
                <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
                    Better Cities, <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500">Together.</span>
                </h1>
                
                <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 lg:border-l-2 lg:border-zinc-300 lg:dark:border-zinc-800 lg:pl-6">
                    A platform for communities to share feedback, report issues, and improve their neighborhoods using AI-powered insights.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                    <button 
                        onClick={onEnterPublic}
                        className="group relative px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-sm tracking-wide transition-all hover:bg-zinc-700 dark:hover:bg-zinc-200 w-full sm:w-auto text-center rounded-lg shadow-lg"
                    >
                        View Public Map
                    </button>
                    
                    <button 
                        onClick={onEnterWizard}
                        className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-black/20 backdrop-blur-sm text-zinc-700 dark:text-zinc-300 font-medium text-sm tracking-wide hover:border-zinc-500 hover:text-black dark:hover:text-white transition-colors w-full sm:w-auto text-center rounded-lg"
                    >
                        Create Organization
                    </button>
                </div>
                
                {/* Org Quick Links */}
                {availableOrgs.length > 0 && (
                    <div className="pt-2 hidden sm:block">
                        <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2 tracking-wider">Active Communities</p>
                        <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                            {availableOrgs.slice(0, 3).map(org => (
                                <button 
                                    key={org.id} 
                                    onClick={() => handleSwitchOrg(org.slug)}
                                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-[10px] hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
                                >
                                    <Building2 size={10} />
                                    <span>{org.name}</span>
                                </button>
                            ))}
                            {availableOrgs.length > 3 && (
                                <button 
                                    onClick={() => setShowOrgList(true)}
                                    className="px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                >
                                    +{availableOrgs.length - 3} more
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: 3D Interface Simulation */}
            <div className="lg:col-span-7 relative h-[400px] lg:h-[500px] xl:h-[550px] hidden lg:block perspective-1000 -mr-16">
                {/* The Tilted Plane */}
                <div className="absolute inset-0 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl transform rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-1000 overflow-hidden group">
                    
                    {/* Fake Header */}
                    <div className="h-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center px-4 space-x-2 relative z-20">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        <div className="flex-1 text-center font-mono text-[10px] text-zinc-400 dark:text-zinc-600">Live Map View (LA)</div>
                        <MousePointerClick size={12} className="text-zinc-400" />
                    </div>

                    {/* Map Content */}
                    <div className="relative h-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                        
                         {/* Live Leaflet Map */}
                         <div className="absolute inset-0 w-full h-full z-10 grayscale hover:grayscale-0 transition-all duration-700">
                            <MapArea 
                                feedbackList={VISUAL_FEEDBACK}
                                onMapClick={() => {}}
                                interactive={true}
                                center={LA_CENTER}
                                isDarkMode={isDarkMode}
                            />
                         </div>

                         {/* Subtle Grid Overlay */}
                        <div className="absolute inset-0 pointer-events-none z-20 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        
                        {/* Interactive Hint Overlay (Fades out on hover) */}
                        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none group-hover:opacity-0 transition-opacity duration-500">
                             <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-white/20">
                                <MousePointer2 size={14} className="animate-bounce" />
                                Interact
                             </div>
                        </div>

                        {/* Floating UI Elements inside 3D */}
                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 shadow-xl z-30 pointer-events-none">
                            <div className="flex justify-between mb-2">
                                <span className="text-zinc-900 dark:text-white font-medium text-xs">AI Analysis</span>
                                <span className="text-green-600 font-bold text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ACTIVE</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-3/4 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- Global Metrics Strip --- */}
        <div className="absolute bottom-12 left-0 right-0 z-20 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md hidden lg:flex divide-x divide-zinc-200 dark:divide-zinc-800">
             <div className="flex-1 p-3 flex items-center justify-center space-x-3">
                <Globe2 className="text-zinc-400 dark:text-zinc-600" size={18} />
                <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Communities</div>
                    <div className="text-base font-display font-bold text-zinc-900 dark:text-white">
                        {availableOrgs.length > 124 ? availableOrgs.length : '124+'}
                    </div>
                </div>
             </div>
             <div className="flex-1 p-3 flex items-center justify-center space-x-3">
                <Database className="text-zinc-400 dark:text-zinc-600" size={18} />
                <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Reports Filed</div>
                    <div className="text-base font-display font-bold text-zinc-900 dark:text-white">8.2M+</div>
                </div>
             </div>
             <div className="flex-1 p-3 flex items-center justify-center space-x-3">
                <Network className="text-zinc-400 dark:text-zinc-600" size={18} />
                <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Issues Resolved</div>
                    <div className="text-base font-display font-bold text-zinc-900 dark:text-white">94.8%</div>
                </div>
             </div>
             <div className="flex-1 p-3 flex items-center justify-center space-x-3">
                <Cpu className="text-zinc-400 dark:text-zinc-600" size={18} />
                <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Avg. Response</div>
                    <div className="text-base font-display font-bold text-green-600 dark:text-green-500">24h</div>
                </div>
             </div>
        </div>

        {/* --- Infinite Data Marquee --- */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center overflow-hidden z-20">
            <div className="flex items-center space-x-12 animate-marquee whitespace-nowrap">
                {dataStream.map((item, i) => (
                    <div key={i} className="flex items-center space-x-3 font-mono text-[9px] text-zinc-500 opacity-60">
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
      <section className="py-12 md:py-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
                <div>
                    <div className="inline-flex items-center space-x-2 text-orange-600 mb-2">
                        <Scan size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Guide</span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">How It Works</h2>
                    <p className="text-sm text-zinc-500 mt-2">See how EchoSphere helps both residents and city managers.</p>
                </div>

                {/* Role Switcher */}
                <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg inline-flex border border-zinc-200 dark:border-zinc-800 self-start md:self-auto">
                    <button 
                        onClick={() => setTutorialMode('citizen')}
                        className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all ${
                            tutorialMode === 'citizen' 
                            ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                        }`}
                    >
                        For Residents
                    </button>
                    <button 
                        onClick={() => setTutorialMode('admin')}
                        className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold uppercase transition-all ${
                            tutorialMode === 'admin' 
                            ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                        }`}
                    >
                        For Admins
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tutorialMode === 'citizen' ? (
                    <>
                        <div className="group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all">
                            <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <MapPin size={20} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-[10px] font-bold text-orange-600 mb-1.5 uppercase">Step 1</div>
                            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Drop a Pin</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Open the <span className="text-zinc-900 dark:text-zinc-300 font-bold">Public Map</span> and click on the location where you want to leave feedback or report an issue.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all">
                            <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <Mic size={20} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-[10px] font-bold text-orange-600 mb-1.5 uppercase">Step 2</div>
                            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Describe It</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Type your message, use <span className="text-zinc-900 dark:text-zinc-300 font-bold">Voice Input</span>, or upload a photo. You can describe what you see in your own words.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 transition-all">
                            <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <Cpu size={20} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-[10px] font-bold text-orange-600 mb-1.5 uppercase">Step 3</div>
                            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Instant Analysis</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Our AI instantly reads your feedback, checks the priority, and makes sure it gets to the right department.
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all">
                            <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <PenTool size={20} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-[10px] font-bold text-blue-500 mb-1.5 uppercase">Phase 1</div>
                            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Create Workspace</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Use the <span className="text-zinc-900 dark:text-zinc-300 font-bold">Setup Wizard</span> to name your organization and select the area you want to manage.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all">
                            <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <LayoutDashboard size={20} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-[10px] font-bold text-blue-500 mb-1.5 uppercase">Phase 2</div>
                            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Launch & Monitor</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Publish your public map. Use the <span className="text-zinc-900 dark:text-zinc-300 font-bold">Dashboard</span> to see real-time feedback and issues as they arrive.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-all">
                            <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <BarChart3 size={20} className="text-zinc-900 dark:text-white" />
                            </div>
                            <div className="text-[10px] font-bold text-blue-500 mb-1.5 uppercase">Phase 3</div>
                            <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Get Insights</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                Generate <span className="text-zinc-900 dark:text-zinc-300 font-bold">Reports</span> with one click. AI helps you spot trends, risks, and ways to improve sustainability.
                            </p>
                        </div>
                    </>
                )}
            </div>
            
            <div className="mt-8 text-center">
                 {tutorialMode === 'citizen' ? (
                     <button onClick={onEnterPublic} className="text-xs font-bold border-b border-orange-500 text-zinc-900 dark:text-white pb-0.5 hover:text-orange-500 transition-colors">
                        Go to Public Map &rarr;
                     </button>
                 ) : (
                     <button onClick={onEnterWizard} className="text-xs font-bold border-b border-blue-500 text-zinc-900 dark:text-white pb-0.5 hover:text-blue-500 transition-colors">
                        Start Setup &rarr;
                     </button>
                 )}
            </div>

        </div>
      </section>

      {/* --- Section 3: Technology --- */}
      <section className="py-12 md:py-16 bg-zinc-100 dark:bg-black border-b border-zinc-200 dark:border-zinc-900 relative">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="mb-8 md:mb-12">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Our Technology</h2>
                <p className="text-sm text-zinc-500 mt-2">Turning messy data into clear action plans.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-10 left-0 w-full h-[2px] bg-gradient-to-r from-zinc-300 dark:from-zinc-800 via-orange-500/50 to-zinc-300 dark:to-zinc-800 -z-10"></div>

                {/* Node 1 */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl relative group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors shadow-sm">
                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center mb-4 z-10 relative group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800">
                        <Share2 size={20} className="text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Easy Collection</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-500 leading-relaxed">
                        Gather feedback from mobile apps, social media, and web forms all in one place.
                    </p>
                </div>

                {/* Node 2 (Center) */}
                <div className="bg-white dark:bg-zinc-950 border border-orange-500/30 p-6 rounded-2xl relative shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-orange-500 text-black text-[9px] font-bold uppercase tracking-wider rounded-full">AI Powered</div>
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/50 rounded-lg flex items-center justify-center mb-4 z-10 relative">
                        <Cpu size={20} className="text-orange-500" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Smart Analysis</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Google Gemini AI reads every report to understand the problem, sentiment, and urgency instantly.
                    </p>
                </div>

                {/* Node 3 */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl relative group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors shadow-sm">
                    <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center mb-4 z-10 relative group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800">
                        <Zap size={20} className="text-green-500 dark:text-green-400" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-white mb-2">Fast Action</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-500 leading-relaxed">
                        Automated alerts and reports help city teams respond faster and prioritize what matters most.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* --- Section 6: Use Cases --- */}
      <section className="py-12 md:py-16 px-4 md:px-6 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12">
                <div>
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Use Cases</h2>
                    <p className="text-sm text-zinc-500 mt-2">Works for any community need.</p>
                </div>
                <div className="hidden md:flex space-x-2">
                    <div className="w-12 h-1 bg-orange-500"></div>
                    <div className="w-4 h-1 bg-zinc-300 dark:bg-zinc-800"></div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                    { icon: <Siren size={20} />, title: "Public Safety", desc: "Report hazards, light outages, and safety concerns." },
                    { icon: <Truck size={20} />, title: "Sanitation", desc: "Track trash pickup, illegal dumping, and street cleaning." },
                    { icon: <Trees size={20} />, title: "Parks & Rec", desc: "Maintenance requests for parks, trails, and public spaces." },
                    { icon: <Shield size={20} />, title: "Disaster Ops", desc: "Real-time logs for storms, floods, and emergencies." }
                 ].map((item, i) => (
                     <div key={i} className="group border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-default shadow-sm hover:shadow-md">
                        <div className="mb-3 text-zinc-400 dark:text-zinc-400 group-hover:text-orange-500 dark:group-hover:text-white transition-colors">{item.icon}</div>
                        <h4 className="font-bold text-zinc-900 dark:text-white mb-1.5">{item.title}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-600 dark:group-hover:text-zinc-400">{item.desc}</p>
                     </div>
                 ))}
             </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                <div className="col-span-2 lg:col-span-2">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
                        <span className="font-display font-bold text-lg text-zinc-900 dark:text-white tracking-tight">EchoSphere</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed mb-6 max-w-xs">
                        Empowering communities with AI-driven insights for better urban planning, faster issue resolution, and transparent governance.
                    </p>
                    <div className="flex space-x-4">
                        <a href="#" className="text-zinc-400 hover:text-orange-500 transition-colors"><Twitter size={16} /></a>
                        <a href="#" className="text-zinc-400 hover:text-orange-500 transition-colors"><Github size={16} /></a>
                        <a href="#" className="text-zinc-400 hover:text-orange-500 transition-colors"><Linkedin size={16} /></a>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white mb-4 text-xs uppercase tracking-wider">Product</h4>
                    <ul className="space-y-2 text-xs text-zinc-500">
                        <li><button onClick={onEnterPublic} className="hover:text-orange-500 transition-colors">Public Map</button></li>
                        <li><button onClick={onEnterWizard} className="hover:text-orange-500 transition-colors">For Organizations</button></li>
                        <li><button onClick={() => onOpenContent('case-studies')} className="hover:text-orange-500 transition-colors">Case Studies</button></li>
                        <li><button onClick={() => onOpenContent('pricing')} className="hover:text-orange-500 transition-colors">Pricing</button></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white mb-4 text-xs uppercase tracking-wider">Resources</h4>
                    <ul className="space-y-2 text-xs text-zinc-500">
                        <li><button onClick={() => onOpenContent('documentation')} className="hover:text-orange-500 transition-colors">Documentation</button></li>
                        <li><button onClick={() => onOpenContent('api-reference')} className="hover:text-orange-500 transition-colors">API Reference</button></li>
                        <li><button onClick={() => onOpenContent('community')} className="hover:text-orange-500 transition-colors">Community Forum</button></li>
                        <li><button onClick={() => onOpenContent('help')} className="hover:text-orange-500 transition-colors">Help Center</button></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white mb-4 text-xs uppercase tracking-wider">Legal</h4>
                    <ul className="space-y-2 text-xs text-zinc-500">
                        <li><button onClick={() => onOpenContent('privacy-policy')} className="hover:text-orange-500 transition-colors">Privacy Policy</button></li>
                        <li><button onClick={() => onOpenContent('terms-of-service')} className="hover:text-orange-500 transition-colors">Terms of Service</button></li>
                        <li><button onClick={() => onOpenContent('cookies')} className="hover:text-orange-500 transition-colors">Cookie Policy</button></li>
                        <li><button onClick={() => onOpenContent('security')} className="hover:text-orange-500 transition-colors">Security</button></li>
                    </ul>
                </div>
            </div>
            
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] text-zinc-400">
                    © 2024 EchoSphere AI Inc. All rights reserved.
                </p>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-full bg-white dark:bg-black">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span>All Systems Operational</span>
                </div>
            </div>
        </div>
      </footer>
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
      `}</style>

    </div>
  );
};

export default LandingPage;