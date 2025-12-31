import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Terminal, Sun, Moon, Database, Key, CloudLightning, ShieldCheck, XCircle, HardDrive, HelpCircle } from 'lucide-react';
import PublicView from './components/PublicView';
import AdminDashboard from './components/AdminDashboard';
import Wizard from './components/Wizard';
import LandingPage from './components/LandingPage';
import { ViewState, AccountSetup } from './types';
import { dataService } from './services/dataService';
import { authService } from './services/authService';
import { supabase, isSupabaseConfigured, saveAppConfiguration, getEnvDebugInfo, getFallbackConfig } from './lib/supabase';

// -- Toast Component --
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 6000); 
        return () => clearTimeout(timer);
    }, [onClose]);

    let bgClass = 'bg-zinc-900/90 text-zinc-200 border-zinc-700';
    let icon = <CheckCircle size={14} className="text-green-500" />;

    if (type === 'error') {
        bgClass = 'bg-red-950/90 text-red-200 border-red-500/30';
        icon = <AlertCircle size={14} className="text-red-500" />;
    } else if (type === 'warning') {
        bgClass = 'bg-orange-950/90 text-orange-200 border-orange-500/30';
        icon = <AlertCircle size={14} className="text-orange-500" />;
    }

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center space-x-3 px-4 py-3 rounded border backdrop-blur-md animate-fade-in-up transition-all font-medium text-xs shadow-2xl ${bgClass}`}>
            {icon}
            <p className="tracking-wide">{message}</p>
            <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 hover:text-white"><X size={12} /></button>
        </div>
    );
};

// -- Explicit ON/OFF Theme Toggle --
const ThemeToggle = ({ isDark, toggle }: { isDark: boolean, toggle: () => void }) => (
    <button 
        onClick={toggle}
        className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-2 rounded-full border shadow-xl transition-all duration-300 group ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}
    >
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Dark Mode
        </span>
        
        <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center p-1 ${isDark ? 'bg-orange-600' : 'bg-zinc-200'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </div>

        <span className={`text-[10px] font-mono font-bold w-6 ${isDark ? 'text-white' : 'text-zinc-400'}`}>
            {isDark ? 'ON' : 'OFF'}
        </span>
    </button>
);

interface SetupScreenProps {
    onBypass: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onBypass, isDarkMode, toggleTheme }) => {
    const defaults = getFallbackConfig();
    const [url, setUrl] = useState(defaults.url || '');
    const [key, setKey] = useState(defaults.key || '');
    const [aiKey, setAiKey] = useState(defaults.aiKey || '');
    const [debugInfo, setDebugInfo] = useState(getEnvDebugInfo());

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveAppConfiguration(url, key, aiKey);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-900 dark:text-zinc-200 selection:bg-orange-500 selection:text-white transition-colors duration-300">
            <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />
            
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 shadow-2xl animate-fade-in-up transition-colors duration-300">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
                        <CloudLightning className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-zinc-900 dark:text-white mb-2">Connect to Cloud</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
                        To run EchoSphere in production mode, please connect your infrastructure.
                    </p>
                </div>

                {/* Diagnostics Panel */}
                <div className="bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded p-4 mb-6 text-xs space-y-2">
                    <h3 className="text-zinc-500 font-bold uppercase tracking-wider mb-2">Environment Diagnostics</h3>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500 dark:text-zinc-400">Supabase URL</span>
                        <span className={`flex items-center ${debugInfo.urlStatus === 'Configured' ? 'text-green-600 dark:text-green-500' : 'text-red-500'}`}>
                            {debugInfo.urlStatus === 'Configured' ? <ShieldCheck size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                            {debugInfo.urlStatus}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500 dark:text-zinc-400">Supabase Key</span>
                        <span className={`flex items-center ${debugInfo.keyStatus === 'Configured' ? 'text-green-600 dark:text-green-500' : 'text-red-500'}`}>
                            {debugInfo.keyStatus === 'Configured' ? <ShieldCheck size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                            {debugInfo.keyStatus}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500 dark:text-zinc-400">Gemini API Key</span>
                        <span className={`flex items-center ${debugInfo.aiStatus === 'Configured' ? 'text-green-600 dark:text-green-500' : 'text-red-500'}`}>
                            {debugInfo.aiStatus === 'Configured' ? <ShieldCheck size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                            {debugInfo.aiStatus}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center space-x-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                <Database size={12} />
                                <span>Supabase Project URL</span>
                            </label>
                            <input 
                                type="url" 
                                required
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://your-project.supabase.co"
                                className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm text-zinc-900 dark:text-white transition-colors"
                            />
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-600 mt-1 flex items-center">
                                <HelpCircle size={10} className="mr-1" />
                                Find this in Supabase Dashboard: Settings &gt; API.
                            </p>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                <Key size={12} />
                                <span>Supabase Anon Key</span>
                            </label>
                            <input 
                                type="password" 
                                required
                                value={key}
                                onChange={e => setKey(e.target.value)}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
                                className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm text-zinc-900 dark:text-white transition-colors"
                            />
                        </div>
                         <div>
                            <label className="flex items-center space-x-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                <Key size={12} />
                                <span>Gemini API Key (VITE_API_KEY)</span>
                            </label>
                            <input 
                                type="password" 
                                required
                                value={aiKey}
                                onChange={e => setAiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm text-zinc-900 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={!url || !key || !aiKey}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-widest text-sm rounded shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Initialize System
                    </button>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                        <span className="flex-shrink-0 mx-4 text-zinc-400 dark:text-zinc-600 text-xs font-bold uppercase">Or</span>
                        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                    </div>

                    <button 
                        type="button" 
                        onClick={onBypass}
                        className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-widest text-sm rounded border border-zinc-200 dark:border-zinc-700 transition-all flex items-center justify-center space-x-2 group"
                    >
                        <HardDrive size={14} className="group-hover:text-black dark:group-hover:text-white" />
                        <span>Use Local / Demo Mode</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [account, setAccount] = useState<AccountSetup | null>(null);
  
  // 1. Default to LIGHT mode (false)
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [pendingView, setPendingView] = useState<ViewState>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'warning'} | null>(null);
  
  // Initialize lazily to prevent flash
  // We check Supabase Config AND Local Skip Flag
  const [needsSetup, setNeedsSetup] = useState(() => {
     if (isSupabaseConfigured()) return false;
     if (typeof window !== 'undefined' && localStorage.getItem('echosphere_skip_setup') === 'true') return false;
     return true;
  });

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
      setToast({ msg, type });
  };

  useEffect(() => {
    // 2. Manage Theme via DOM Class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Initialize Data & Listen for Auth Redirects
    const initApp = async () => {
        // Handle URL Hash Errors (Supabase redirects with #error=...)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorDescription = hashParams.get('error_description');
        if (errorDescription) {
            showToast(decodeURIComponent(errorDescription), 'error');
            // Clear hash to clean up URL
            window.history.replaceState(null, '', window.location.pathname);
        }

        // Listen for Auth Session (Login via Email Link)
        if (isSupabaseConfigured()) {
            const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    setIsAuthenticated(true);
                    setShowLogin(false);
                    showToast("Verified & Logged In Successfully!");
                }
            });
            
            // Cleanup on unmount (though App.tsx rarely unmounts)
            // return () => subscription.unsubscribe(); 
        }

        const currentOrg = await dataService.getCurrentOrganization();
        
        if (currentOrg) {
            const accountConfig: AccountSetup = {
                organizationName: currentOrg.name,
                regionCode: currentOrg.slug,
                focusArea: currentOrg.focusArea,
                center: currentOrg.center,
                questions: [] 
            };
            setAccount(accountConfig);
            
            const params = new URLSearchParams(window.location.search);
            if (params.get('org')) {
                setCurrentView('public');
            }
        }
    };
    initApp();
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
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
        // If in Local/Demo mode, allow admin access with mock auth
        if (!isSupabaseConfigured()) {
            setIsAuthenticated(true);
            setShowLogin(false);
            setCurrentView(pendingView);
            showToast("Demo Mode: Admin Access Granted", 'warning');
        } else {
            showToast(result.error?.message || "Authentication Failed", 'error');
        }
    }
  };

  const handleProvision = (config: AccountSetup) => {
    dataService.saveAccount(config);
    setAccount(config);
    setCurrentView('admin');
    showToast(`Organization '${config.organizationName}' configured successfully`);
  };

  const handleBypassSetup = () => {
      localStorage.setItem('echosphere_skip_setup', 'true');
      setNeedsSetup(false);
  };

  if (needsSetup) {
      return <SetupScreen onBypass={handleBypassSetup} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

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
        
        <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />

        {renderView()}
        
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {showLogin && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-lg shadow-2xl p-8 w-full max-w-sm relative overflow-hidden">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center mb-4 text-orange-500">
                             <Terminal size={24} />
                        </div>
                        <h3 className="text-xl font-display font-bold dark:text-white tracking-tight">{isSignUpMode ? 'Create Admin Account' : 'Admin Login'}</h3>
                        {!isSupabaseConfigured() && (
                            <p className="text-xs text-orange-500 mt-2 font-bold uppercase tracking-wide">Demo Mode Enabled</p>
                        )}
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm"
                            autoFocus
                        />
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full p-3 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded focus:border-orange-500 outline-none text-sm"
                        />
                        <button 
                            type="submit"
                            disabled={isAuthLoading}
                            className={`w-full py-3 text-black font-display font-bold text-sm tracking-wide rounded uppercase transition-all flex justify-center ${isSignUpMode ? 'bg-orange-500 hover:bg-orange-400' : 'bg-zinc-200 dark:bg-zinc-100 hover:bg-zinc-300 dark:hover:bg-white'}`}
                        >
                            {isAuthLoading ? "Processing..." : (isSignUpMode ? "Sign Up" : "Login")}
                        </button>

                        <div className="pt-2 flex justify-center">
                            <button type="button" onClick={() => setIsSignUpMode(!isSignUpMode)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                {isSignUpMode ? "Have an account? Login" : "Need an account? Sign Up"}
                            </button>
                        </div>
                        <button type="button" onClick={() => setShowLogin(false)} className="w-full py-2 text-zinc-600 hover:text-zinc-400 text-xs font-bold uppercase tracking-wider">Cancel</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default App;