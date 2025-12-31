import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Terminal } from 'lucide-react';
import PublicView from './components/PublicView';
import AdminDashboard from './components/AdminDashboard';
import Wizard from './components/Wizard';
import LandingPage from './components/LandingPage';
import { ViewState, AccountSetup } from './types';
import { dataService } from './services/dataService';

// -- Toast Component --
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center space-x-3 px-4 py-3 rounded border backdrop-blur-md animate-fade-in-up transition-all font-mono text-xs shadow-2xl ${type === 'success' ? 'bg-zinc-900/90 text-zinc-200 border-green-500/30' : 'bg-zinc-900/90 text-red-200 border-red-500/30'}`}>
            {type === 'success' ? <CheckCircle size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-red-500" />}
            <p className="uppercase tracking-wide">{message}</p>
            <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 hover:text-white"><X size={12} /></button>
        </div>
    );
};
// --------------------

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [account, setAccount] = useState<AccountSetup | null>(null);
  
  // Auth State
  const [showLogin, setShowLogin] = useState(false);
  const [pendingView, setPendingView] = useState<ViewState>('landing');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
  };

  useEffect(() => {
    const storedAccount = dataService.getAccount();
    if (storedAccount) {
      setAccount(storedAccount);
    }
  }, []);

  const handleProtectedAction = (targetView: ViewState) => {
    if (isAuthenticated) {
        setCurrentView(targetView);
    } else {
        setPendingView(targetView);
        setShowLogin(true);
        setPassword('');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') { 
        setIsAuthenticated(true);
        setShowLogin(false);
        setCurrentView(pendingView);
        showToast("ACCESS_GRANTED: ADMIN_LEVEL_1");
    } else {
        showToast("ACCESS_DENIED: INVALID_CREDENTIALS", 'error');
    }
  };

  const handleProvision = (config: AccountSetup) => {
    dataService.saveAccount(config);
    setAccount(config);
    setCurrentView('admin');
    showToast(`TENANT_PROVISIONED: ${config.organizationName.toUpperCase()}`);
  };

  const renderView = () => {
    switch (currentView) {
      case 'wizard':
        return <Wizard onComplete={handleProvision} onCancel={() => setCurrentView('landing')} />;
      case 'public':
        return <PublicView onBack={() => setCurrentView('landing')} showToast={(msg) => showToast(msg)} />;
      case 'admin':
        return <AdminDashboard onBack={() => setCurrentView('landing')} />;
      case 'landing':
      default:
        return (
          <LandingPage 
            onEnterPublic={() => setCurrentView('public')}
            onEnterAdmin={() => handleProtectedAction('admin')}
            onEnterWizard={() => handleProtectedAction('wizard')}
            account={account}
          />
        );
    }
  };

  return (
    <div className="font-sans antialiased bg-zinc-950 text-zinc-200 min-h-screen selection:bg-orange-500 selection:text-white">
        {renderView()}
        
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* Global Admin Login Modal (Triggered by Landing Page) */}
        {showLogin && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
                <div className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-lg shadow-2xl p-8 w-full max-w-sm relative overflow-hidden">
                    {/* Decorative Scanner Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>
                    
                    <div className="text-center mb-8">
                        <div className="mx-auto w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mb-4 text-orange-500">
                             <Terminal size={24} />
                        </div>
                        <h3 className="text-xl font-display font-bold text-white tracking-tight">System Access</h3>
                        <p className="text-xs font-mono text-zinc-500 mt-2">AUTHENTICATION_REQUIRED</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="ENTER_PASSPHRASE"
                                className="w-full p-3 bg-black border border-zinc-800 rounded focus:border-orange-500 outline-none text-sm font-mono text-center placeholder-zinc-700 transition-colors text-white"
                                autoFocus
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full py-3 bg-zinc-100 hover:bg-white text-black font-display font-bold text-sm tracking-wide rounded uppercase transition-all"
                        >
                            Authenticate
                        </button>
                        <button 
                            type="button"
                            onClick={() => setShowLogin(false)}
                            className="w-full py-2 text-zinc-600 hover:text-zinc-400 text-xs font-mono uppercase tracking-wider"
                        >
                            [Cancel_Request]
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default App;