import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Terminal, Cloud, Database, UserPlus, LogIn, Moon, Sun } from 'lucide-react';
import PublicView from './components/PublicView';
import AdminDashboard from './components/AdminDashboard';
import Wizard from './components/Wizard';
import LandingPage from './components/LandingPage';
import { ViewState, AccountSetup } from './types';
import { dataService } from './services/dataService';
import { authService } from './services/authService';

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
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center space-x-3 px-4 py-3 rounded border backdrop-blur-md animate-fade-in-up transition-all font-medium text-xs shadow-2xl ${type === 'success' ? 'bg-zinc-900/90 text-zinc-200 border-green-500/30' : 'bg-zinc-900/90 text-red-200 border-red-500/30'}`}>
            {type === 'success' ? <CheckCircle size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-red-500" />}
            <p className="tracking-wide">{message}</p>
            <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 hover:text-white"><X size={12} /></button>
        </div>
    );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [account, setAccount] = useState<AccountSetup | null>(null);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Auth State
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [pendingView, setPendingView] = useState<ViewState>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [systemMode, setSystemMode] = useState<'LOCAL' | 'CLOUD'>('LOCAL');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
  };

  useEffect(() => {
    // 1. Initialize System Mode
    setSystemMode(dataService.isProduction() ? 'CLOUD' : 'LOCAL');
    
    // 2. Initialize Theme
    document.documentElement.classList.add('dark');

    // 3. Initialize Data / Multi-tenancy from URL
    const initApp = async () => {
        const currentOrg = await dataService.getCurrentOrganization();
        
        if (currentOrg) {
            // Map the Organization object back to AccountSetup structure for the LandingPage UI
            const accountConfig: AccountSetup = {
                organizationName: currentOrg.name,
                regionCode: currentOrg.slug,
                focusArea: currentOrg.focusArea,
                center: currentOrg.center,
                questions: [] 
            };
            setAccount(accountConfig);
            
            // DEEP LINK CHECK: If ?org= is in URL, go straight to map
            const params = new URLSearchParams(window.location.search);
            if (params.get('org')) {
                setCurrentView('public');
            }
        }
    };
    initApp();

  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const handleProtectedAction = (targetView: ViewState) => {
    if (isAuthenticated) {
        setCurrentView(targetView);
    } else {
        setPendingView(targetView);
        setShowLogin(true);
        setEmail('');
        setPassword('');
        setIsSignUpMode(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);

    let result;
    if (isSignUpMode) {
        result = await authService.signUp(email, password);
    } else {
        result = await authService.signIn(email, password);
    }

    setIsAuthLoading(false);

    if (result.user && !result.error) {
        setIsAuthenticated(true);
        setShowLogin(false);
        setCurrentView(pendingView);
        showToast(isSignUpMode ? `Account created for ${result.user.email}` : `Welcome back, ${result.user.email}`);
    } else {
        showToast(result.error?.message || "Authentication Failed", 'error');
    }
  };

  const handleProvision = (config: AccountSetup) => {
    // Wizard complete
    dataService.saveAccount(config);
    setAccount(config);
    setCurrentView('admin');
    showToast(`Organization '${config.organizationName}' configured successfully`);
  };

  const renderView = () => {
    switch (currentView) {
      case 'wizard':
        return <Wizard onComplete={handleProvision} onCancel={() => setCurrentView('landing')} />;
      case 'public':
        return (
          <PublicView 
            onBack={() => setCurrentView('landing')} 
            showToast={(msg, type) => showToast(msg, type)} 
            isDarkMode={isDarkMode}
          />
        );
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
    <div className="font-sans antialiased min-h-screen transition-colors duration-300">
        
        {/* System Status Indicator */}
        <div className="fixed top-0 left-0 right-0 h-1 z-[100] flex">
            {systemMode === 'CLOUD' ? (
                <div className="flex-1 bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
            ) : (
                <div className="flex-1 bg-zinc-800 dark:bg-zinc-700"></div>
            )}
        </div>

        {/* Global Theme Toggle */}
        <button 
            onClick={toggleTheme}
            className="fixed top-4 right-4 z-[9999] p-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg text-zinc-600 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-500 transition-all"
            title="Toggle Theme"
        >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {renderView()}
        
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* Global Admin Login Modal */}
        {showLogin && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-lg shadow-2xl p-8 w-full max-w-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>
                    
                    <div className="text-center mb-6">
                        <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center mb-4 text-orange-500">
                             <Terminal size={24} />
                        </div>
                        <h3 className="text-xl font-display font-bold dark:text-white tracking-tight">{isSignUpMode ? 'Create Admin Account' : 'Admin Login'}</h3>
                        <p className="text-xs text-zinc-500 mt-2">Access your organization's dashboard</p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm font-medium text-center placeholder-zinc-500 dark:placeholder-zinc-700 transition-colors text-black dark:text-white"
                                autoFocus
                            />
                        </div>
                        <div>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm font-medium text-center placeholder-zinc-500 dark:placeholder-zinc-700 transition-colors text-black dark:text-white"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isAuthLoading}
                            className={`w-full py-3 text-black font-display font-bold text-sm tracking-wide rounded uppercase transition-all flex justify-center ${isSignUpMode ? 'bg-orange-500 hover:bg-orange-400' : 'bg-zinc-200 dark:bg-zinc-100 hover:bg-zinc-300 dark:hover:bg-white'}`}
                        >
                            {isAuthLoading ? "Processing..." : (isSignUpMode ? "Sign Up" : "Login")}
                        </button>

                        <div className="pt-2 flex justify-center">
                            <button
                                type="button"
                                onClick={() => setIsSignUpMode(!isSignUpMode)}
                                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center space-x-1"
                            >
                                {isSignUpMode ? (
                                    <><span>Have an account?</span> <LogIn size={10} /></>
                                ) : (
                                    <><span>Need an account?</span> <UserPlus size={10} /></>
                                )}
                            </button>
                        </div>

                        <button 
                            type="button"
                            onClick={() => setShowLogin(false)}
                            className="w-full py-2 text-zinc-600 hover:text-zinc-400 text-xs font-bold uppercase tracking-wider"
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