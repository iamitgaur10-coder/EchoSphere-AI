import React from 'react';
import { Globe2, Sparkles, Building2, ArrowRight, ShieldCheck, MapPin, Zap, BarChart3, Users, Leaf, Cpu, Lock } from 'lucide-react';
import { AccountSetup } from '../types';

interface LandingPageProps {
  onEnterPublic: () => void;
  onEnterAdmin: () => void;
  onEnterWizard: () => void;
  account: AccountSetup | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterPublic, onEnterAdmin, onEnterWizard, account }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      
      {/* --- Navbar --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1 rounded-lg">
                <Globe2 size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">EchoSphere AI</span>
          </div>
          <div className="flex items-center space-x-4">
             {account && (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span>{account.organizationName}</span>
                </div>
             )}
             <button 
                onClick={onEnterAdmin}
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
             >
                Admin Login
             </button>
             <button 
                onClick={onEnterPublic}
                className="bg-white text-slate-950 px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-slate-200 transition-colors"
             >
                Launch App
             </button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 px-6 border-b border-white/5 overflow-hidden">
         {/* Background Glows */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
         <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

         <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/50 border border-white/10 text-[10px] uppercase tracking-wider font-semibold text-indigo-400 animate-fade-in-up">
                <Sparkles size={10} />
                <span>Powered by Gemini 1.5 Pro</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                The Operating System for <br/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">Modern Cities</span>
            </h1>
            
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Collect geo-located feedback, analyze citizen sentiment in real-time, and forecast urban trends using advanced multimodal AI.
            </p>

            <div className="flex items-center justify-center space-x-4 pt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <button 
                    onClick={onEnterWizard}
                    className="group relative px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center space-x-2"
                >
                    <span>Provision Tenant</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                    onClick={onEnterPublic}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium border border-slate-700 transition-all flex items-center space-x-2"
                >
                    <MapPin size={14} />
                    <span>View Live Map</span>
                </button>
            </div>
         </div>
      </section>

      {/* --- Bento Grid Features --- */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-lg font-semibold text-white mb-8 flex items-center space-x-2">
            <Cpu size={18} className="text-indigo-500" />
            <span>Core Capabilities</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[500px]">
            
            {/* Feature 1: Large Map Visual */}
            <div className="md:col-span-2 md:row-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/80 z-10"></div>
                <img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=1000" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" alt="City Map" />
                <div className="relative z-20 h-full flex flex-col justify-end">
                    <div className="bg-indigo-600/90 w-fit p-2 rounded-lg mb-3">
                        <Globe2 size={20} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Geospatial Intelligence</h3>
                    <p className="text-sm text-slate-400">Pinpoint issues with 1-meter precision. Visualize data layers for traffic, safety, and infrastructure.</p>
                </div>
            </div>

            {/* Feature 2: AI Analysis */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
                <div className="flex justify-between items-start">
                    <Zap size={20} className="text-yellow-400" />
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">REAL-TIME</span>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Sentiment Analysis</h3>
                    <p className="text-xs text-slate-500 mt-1">AI reads between the lines to detect anger, joy, or urgency.</p>
                </div>
            </div>

            {/* Feature 3: Eco Scoring */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:bg-slate-900 transition-colors">
                 <div className="flex justify-between items-start">
                    <Leaf size={20} className="text-green-400" />
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">SUSTAINABILITY</span>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Eco-Impact Score</h3>
                    <p className="text-xs text-slate-500 mt-1">Automatically rate feedback based on environmental impact.</p>
                </div>
            </div>

            {/* Feature 4: Admin Dashboard */}
            <div className="md:col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center space-x-6 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                 <div className="flex-1 z-10">
                    <h3 className="text-lg font-bold text-white mb-1">Executive Reporting</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Generate PDF-ready summaries for city councils in seconds. Let Gemini summarize thousands of comments into actionable policy points.
                    </p>
                    <div className="flex space-x-2">
                        <div className="h-1.5 w-8 bg-indigo-500 rounded-full"></div>
                        <div className="h-1.5 w-4 bg-slate-700 rounded-full"></div>
                        <div className="h-1.5 w-4 bg-slate-700 rounded-full"></div>
                    </div>
                 </div>
                 <div className="w-24 h-24 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center shadow-2xl group-hover:-translate-y-1 transition-transform">
                    <BarChart3 size={32} className="text-indigo-400" />
                 </div>
            </div>

        </div>
      </section>

      {/* --- Use Cases --- */}
      <section className="py-20 bg-slate-900 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-white">Built for every department</h2>
                <p className="text-sm text-slate-400 mt-2">One platform, endless applications.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: "Public Works", icon: <Building2 className="text-orange-400" />, desc: "Track potholes, broken streetlights, and sanitation issues automatically." },
                    { title: "Public Safety", icon: <ShieldCheck className="text-red-400" />, desc: "Identify poorly lit areas and safety hazards before accidents happen." },
                    { title: "Urban Planning", icon: <Users className="text-cyan-400" />, desc: "Gather community consensus on new parks, zoning, and transit lines." }
                ].map((item, i) => (
                    <div key={i} className="bg-slate-950 p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="mb-4 bg-slate-900 w-fit p-3 rounded-lg border border-white/5">{item.icon}</div>
                        <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- Pricing / Footer --- */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-xl font-bold text-white">Ready to modernize your community?</h2>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
                <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30">
                    <h3 className="text-sm font-bold text-white">Community</h3>
                    <div className="text-2xl font-bold text-white mt-2">Free</div>
                    <p className="text-xs text-slate-500 mt-1">Up to 1,000 feedback points</p>
                </div>
                <div className="p-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-[9px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded">POPULAR</div>
                    <h3 className="text-sm font-bold text-white">Enterprise</h3>
                    <div className="text-2xl font-bold text-white mt-2">$49<span className="text-sm font-normal text-slate-400">/mo</span></div>
                    <p className="text-xs text-indigo-200 mt-1">Unlimited AI & Reporting</p>
                </div>
            </div>

            <div className="pt-10 text-xs text-slate-600 flex justify-center space-x-6">
                <span>© 2024 EchoSphere AI</span>
                <a href="#" className="hover:text-slate-400">Privacy</a>
                <a href="#" className="hover:text-slate-400">Terms</a>
                <a href="#" className="hover:text-slate-400">Security</a>
            </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;