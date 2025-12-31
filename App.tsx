import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
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
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center space-x-3 px-4 py-3 rounded-lg shadow-2xl backdrop-blur-md animate-fade-in-up transition-all border ${type === 'success' ? 'bg-slate-900/90 text-white border-green-500/30' : 'bg-red-900/90 text-white border-red-500/30'}`}>
            {type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertCircle size={18} className="text-red-400" />}
            <p className="text-sm font-medium">{message}</p>
            <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100"><X size={14} /></button>
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
        showToast("Authenticated as Administrator");
    } else {
        showToast("Invalid Password (Try 'admin')", 'error');
    }
  };

  const handleProvision = (config: AccountSetup) => {
    dataService.saveAccount(config);
    setAccount(config);
    setCurrentView('admin');
    showToast(`Tenant "${config.organizationName}" provisioned successfully!`);
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
    <div className="font-sans antialiased text-slate-900">
        {renderView()}
        
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* Global Admin Login Modal (Triggered by Landing Page) */}
        {showLogin && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
                <div className="bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-6 w-full max-w-xs">
                    <div className="text-center mb-6">
                        <h3 className="text-lg font-bold">Admin Access</h3>
                        <p className="text-xs text-slate-500">Security Level 1</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-3">
                        <div>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                                autoFocus
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
                        >
                            Login
                        </button>
                        <button 
                            type="button"
                            onClick={() => setShowLogin(false)}
                            className="w-full py-2 text-slate-500 hover:text-slate-400 text-xs"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default App;