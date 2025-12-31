import React, { useState, useEffect } from 'react';
import { Layout, MapPin, Globe2, Sparkles, Building2 } from 'lucide-react';
import PublicView from './components/PublicView';
import AdminDashboard from './components/AdminDashboard';
import Wizard from './components/Wizard';
import { ViewState, AccountSetup } from './types';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [account, setAccount] = useState<AccountSetup | null>(null);

  // Load account from "backend" on start
  useEffect(() => {
    const storedAccount = dataService.getAccount();
    if (storedAccount) {
      setAccount(storedAccount);
    }
  }, []);

  const handleProvision = (config: AccountSetup) => {
    console.log("Provisioning Tenant:", config);
    dataService.saveAccount(config);
    setAccount(config);
    // After provisioning, go to Admin to see the "dashboard" for this new tenant
    setCurrentView('admin');
  };

  const renderView = () => {
    switch (currentView) {
      case 'wizard':
        return <Wizard onComplete={handleProvision} onCancel={() => setCurrentView('landing')} />;
      case 'public':
        return <PublicView onBack={() => setCurrentView('landing')} />;
      case 'admin':
        return <AdminDashboard onBack={() => setCurrentView('landing')} />;
      case 'landing':
      default:
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 relative overflow-hidden">
             {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 max-w-5xl w-full text-center space-y-12">
              <div className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                    <Globe2 size={64} className="text-cyan-400" />
                  </div>
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                  EchoSphere AI
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
                  The SaaS platform for intelligent, geo-located feedback.
                  <br/> Powered by Google Gemini 3 Flash.
                </p>
              </div>
              
              {account && (
                <div className="max-w-md mx-auto p-4 bg-green-500/20 border border-green-500/40 rounded-xl flex items-center justify-center space-x-2">
                    <Building2 size={20} className="text-green-400" />
                    <span className="text-green-100 font-medium">Tenant Active: {account.organizationName} ({account.regionCode})</span>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Wizard Card - Main Call to Action */}
                <button
                  onClick={() => setCurrentView('wizard')}
                  className="group relative p-8 bg-gradient-to-b from-indigo-500/20 to-purple-500/20 border-2 border-indigo-400/50 hover:border-indigo-300 rounded-3xl transition-all duration-300 flex flex-col items-center text-center space-y-4 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/40 col-span-1 md:col-span-1"
                >
                  <div className="absolute top-4 right-4 text-xs font-bold bg-indigo-500 px-2 py-1 rounded text-white">NEW</div>
                  <div className="p-4 bg-indigo-500/20 rounded-full group-hover:bg-indigo-500/30 transition-colors">
                    <Sparkles size={40} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Create Account</h3>
                    <p className="text-slate-400 text-sm">Launch your tenant with AI Wizard. Setup regions & questions in minutes.</p>
                  </div>
                </button>

                {/* Public Access Card */}
                <button
                  onClick={() => setCurrentView('public')}
                  className="group relative p-8 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded-3xl transition-all duration-300 flex flex-col items-center text-center space-y-4 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/20"
                >
                  <div className="p-4 bg-cyan-500/20 rounded-full group-hover:bg-cyan-500/30 transition-colors">
                    <MapPin size={40} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Public View</h3>
                    <p className="text-slate-400 text-sm">Explore the map, drop multimodal pins, and submit feedback.</p>
                  </div>
                </button>

                {/* Admin Access Card */}
                <button
                  onClick={() => setCurrentView('admin')}
                  className="group relative p-8 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 rounded-3xl transition-all duration-300 flex flex-col items-center text-center space-y-4 hover:transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20"
                >
                  <div className="p-4 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors">
                    <Layout size={40} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h3>
                    <p className="text-slate-400 text-sm">Analyze AI insights, sentiment trends, and manage your region.</p>
                  </div>
                </button>
              </div>
            </div>
            
            <footer className="absolute bottom-6 text-slate-500 text-sm">
              EchoSphere AI • v1.0 MVP
            </footer>
          </div>
        );
    }
  };

  return <>{renderView()}</>;
};

export default App;