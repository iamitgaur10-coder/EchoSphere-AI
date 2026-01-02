import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Activity, User, LogIn, Trophy, Clock, History, X, Share2, Check, Download, Building2, Map as MapIcon, ArrowRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import MapArea from './MapArea';
import FeedbackModal from './FeedbackModal';
import { Feedback, Location, Organization } from '../types';
import { dataService } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';

interface PublicViewProps {
  onBack: () => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  isDarkMode?: boolean;
  onTriggerLogin?: () => void;
}

const PublicView: React.FC<PublicViewProps> = ({ onBack, showToast, isDarkMode = true, onTriggerLogin }) => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [liveFeed, setLiveFeed] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orgNotFound, setOrgNotFound] = useState(false);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [userKarma, setUserKarma] = useState(0);
  const [userHistory, setUserHistory] = useState<Feedback[]>([]);

  // 1. Initial Data Load
  useEffect(() => {
    const load = async () => {
        setIsLoading(true);
        setOrgNotFound(false);
        let org: Organization | null = null;
        
        if (slug) {
            org = await dataService.getOrganizationBySlug(slug);
        } else {
            org = await dataService.getCurrentOrganization();
        }

        if (!org) {
            setOrgNotFound(true);
            setIsLoading(false);
            return;
        }

        setCurrentOrg(org);
        
        // Load User
        const user = await authService.getCurrentUser();
        setCurrentUser(user);

        // Initial load allows more items
        const list = await dataService.getFeedback(100, 0, org.id);
        setFeedbackList(list);

        // Pre-fill live feed
        if (list.length > 0) {
            const recent = list.slice(0, 3).map(f => {
                const time = f.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `${time} • ${f.category} (${f.sentiment})`;
            });
            setLiveFeed(recent);
        }
        setIsLoading(false);
    };
    load();
  }, [slug]);

  // 2. Real-time Subscription & Auth Listener
  useEffect(() => {
    if (!isSupabaseConfigured() || !currentOrg) return;

    // A. Feedback Subscription
    const channel = supabase!
      .channel('public:feedback')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feedback' },
        (payload) => {
          const newRow = payload.new;
          if (newRow.organization_id !== currentOrg.id) return;
          
          const newFeedback: Feedback = {
            id: newRow.id,
            organizationId: newRow.organization_id,
            userId: newRow.user_id,
            location: newRow.location, 
            content: newRow.content,
            timestamp: new Date(newRow.timestamp),
            sentiment: newRow.sentiment,
            category: newRow.category,
            status: newRow.status || 'received',
            summary: newRow.summary,
            imageUrl: newRow.image_url,
            votes: 0
          };

          setFeedbackList((prev) => {
             if (prev.some(f => f.id === newFeedback.id)) return prev;
             return [newFeedback, ...prev];
          });

          // Live Feed Update
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const msg = `${time} • New Report: ${newFeedback.category} (${newFeedback.sentiment})`;
          setLiveFeed(prev => [msg, ...prev].slice(0, 3));
          
          if (showToast) showToast("New feedback received in real-time!");
        }
      )
      .subscribe();

    // B. Auth Subscription (Updates Karma/Profile when user logs in via overlay)
    const { data: { subscription: authSub } } = supabase!.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
            setCurrentUser(session.user);
        } else {
            setCurrentUser(null);
            setUserHistory([]);
            setUserKarma(0);
        }
    });

    return () => {
      supabase!.removeChannel(channel);
      authSub.unsubscribe();
    };
  }, [currentOrg, showToast]);

  // 3. Recalculate Karma whenever Feedback List or Current User changes
  useEffect(() => {
      if (currentUser && feedbackList.length > 0) {
          const myItems = feedbackList.filter(f => f.userId === currentUser.id);
          setUserHistory(myItems);
          const karma = myItems.reduce((acc, curr) => acc + 10 + (curr.status === 'resolved' ? 50 : 0), 0);
          setUserKarma(karma);
      }
  }, [currentUser, feedbackList]);


  const handleMapClick = (loc: Location) => {
    setSelectedLocation(loc);
  };

  const handleFeedbackSubmit = async (newFeedback: Feedback) => {
    // Attach User ID if logged in
    if (currentUser) {
        newFeedback.userId = currentUser.id;
        newFeedback.authorName = currentUser.email?.split('@')[0] || 'Citizen';
        newFeedback.contactEmail = currentUser.email;
    }

    // Assign to current Org
    if (currentOrg) {
        newFeedback.organizationId = currentOrg.id;
    }

    setFeedbackList(prev => [newFeedback, ...prev]);
    setSelectedLocation(null);
    if (showToast) showToast("Feedback Submitted Successfully");

    try {
        await dataService.saveFeedback(newFeedback);
        
        // Optimistic Karma Update (The useEffect above will also catch it, but this is instant)
        if (currentUser) {
            setUserHistory(prev => [newFeedback, ...prev]);
            setUserKarma(prev => prev + 10);
        }
    } catch (e: any) {
        console.error("Submission failed", e);
        if (showToast) showToast(e.message || "Submission failed", "error");
    }
  };

  const handleLogin = () => {
      if (onTriggerLogin) onTriggerLogin();
  };

  const handleShare = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      if (showToast) showToast("Link copied! Share this map with your community.");
  };
  
  const handleExportData = () => {
      const dataStr = JSON.stringify(userHistory, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'my-echosphere-data.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      if (showToast) showToast("Data export started.");
  };

  const handleActivateCity = () => {
      if (slug) {
          navigate(`/setup?region=${slug}`);
      } else {
          navigate('/setup');
      }
  };

  if (orgNotFound) {
      return (
          <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                  <MapIcon size={32} className="text-zinc-400" />
              </div>
              <h2 className="text-2xl font-display font-bold text-zinc-900 dark:text-white mb-2 uppercase">
                  {slug ? slug.toUpperCase() : 'City'} Not Found
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-8">
                  This community hasn't been activated on EchoSphere yet. Residents can't post feedback until an administrator sets it up.
              </p>
              
              <div className="space-y-3 w-full max-w-sm">
                  <button 
                      onClick={handleActivateCity}
                      className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold uppercase tracking-widest text-sm rounded flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                      <Plus size={16} />
                      <span>Activate {slug || 'New City'}</span>
                  </button>
                  <button 
                      onClick={() => navigate('/org/demo')}
                      className="w-full py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-900 dark:text-white font-bold uppercase tracking-widest text-sm rounded transition-all"
                  >
                      Visit Demo City
                  </button>
                  <button 
                      onClick={() => navigate('/')}
                      className="w-full py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 text-xs font-bold uppercase tracking-wider"
                  >
                      Go Home
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="relative h-screen w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
              <button 
                onClick={onBack}
                className="pointer-events-auto flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-2xl rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline font-medium text-xs">Back</span>
              </button>
              
              <button
                onClick={handleShare}
                aria-label="Share Map"
                className="pointer-events-auto flex items-center space-x-2 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-lg rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-orange-500 transition-colors"
                title="Share Map"
              >
                  <Share2 size={16} />
              </button>
          </div>

          <div className="pointer-events-auto flex items-center space-x-3">
             {currentUser ? (
                 <button 
                    onClick={() => setShowProfile(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white shadow-2xl rounded-full border border-orange-500 hover:bg-orange-500 transition-all group"
                 >
                     <User size={16} />
                     <span className="text-xs font-bold">{currentUser.email?.split('@')[0]}</span>
                     <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">{userKarma} pts</span>
                 </button>
             ) : (
                 <button 
                    onClick={handleLogin}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-2xl rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-orange-600 hover:border-orange-500 transition-all"
                 >
                     <LogIn size={16} />
                     <span className="text-xs font-bold">Login / Sign Up</span>
                 </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        <MapArea 
          feedbackList={feedbackList} 
          onMapClick={handleMapClick}
          center={currentOrg?.center}
          isDarkMode={isDarkMode}
          onError={(msg) => showToast && showToast(msg, 'error')}
        />
        
        {/* Floating Action Badge */}
        {!isLoading && currentOrg && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-600 dark:text-zinc-300 px-6 py-3 rounded-full shadow-lg flex items-center space-x-3 border border-zinc-200 dark:border-zinc-700 animate-bounce-slow">
                    <div className="bg-orange-600 p-1.5 rounded-full shadow-lg text-white dark:text-black">
                        <Plus size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Tap map to add feedback</span>
                </div>
            </div>
        )}

        {/* Live Feed Ticker */}
        {liveFeed.length > 0 && (
            <div className="absolute bottom-6 left-6 z-10 hidden md:block w-72 pointer-events-none">
                <div className="space-y-2">
                    {liveFeed.map((msg, i) => (
                        <div key={i} className={`bg-white/80 dark:bg-black/80 backdrop-blur-sm p-3 rounded-lg border-l-4 border-orange-500 text-xs text-zinc-600 dark:text-zinc-300 flex items-center space-x-2 animate-fade-in-left shadow-lg`} style={{ opacity: 1 - (i * 0.3) }}>
                            <Activity size={12} className="text-orange-500 flex-shrink-0" />
                            <span className="truncate">{msg}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Feedback Modal */}
      {selectedLocation && (
        <FeedbackModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onSubmit={handleFeedbackSubmit}
          existingFeedback={feedbackList}
          isLoggedIn={!!currentUser}
          onLogin={onTriggerLogin}
        />
      )}

      {/* USER PROFILE MODAL */}
      {showProfile && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up">
              <div className="bg-white dark:bg-zinc-950 w-full sm:max-w-md h-[80vh] sm:h-auto sm:rounded-2xl shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-800">
                  <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 sm:rounded-t-2xl">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {currentUser?.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Citizen Profile</h3>
                              <p className="text-xs text-zinc-500">{currentUser?.email}</p>
                          </div>
                      </div>
                      <button onClick={() => setShowProfile(false)} aria-label="Close Profile" className="text-zinc-400 hover:text-black dark:hover:text-white"><X size={20}/></button>
                  </div>

                  <div className="p-6 grid grid-cols-2 gap-4">
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-500/20 text-center">
                          <Trophy className="mx-auto text-orange-500 mb-2" size={24} />
                          <div className="text-2xl font-display font-bold text-zinc-900 dark:text-white">{userKarma}</div>
                          <div className="text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 tracking-wider">Civic Karma</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20 text-center">
                          <History className="mx-auto text-blue-500 mb-2" size={24} />
                          <div className="text-2xl font-display font-bold text-zinc-900 dark:text-white">{userHistory.length}</div>
                          <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">Reports Filed</div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 pt-0">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 sticky top-0 bg-white dark:bg-zinc-950 py-2">My History</h4>
                      {userHistory.length > 0 ? (
                          <div className="space-y-3">
                              {userHistory.map(item => (
                                  <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'resolved' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                      <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-start">
                                              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-200">{item.category}</span>
                                              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 uppercase">{item.status}</span>
                                          </div>
                                          <p className="text-xs text-zinc-500 truncate mt-1">{item.content}</p>
                                          <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-400">
                                              <Clock size={10} />
                                              <span>{item.timestamp.toLocaleDateString()}</span>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-8 text-zinc-400">
                              <p className="text-sm">No reports filed yet.</p>
                              <p className="text-xs mt-1">Tap the map to earn your first karma!</p>
                          </div>
                      )}
                  </div>
                  
                  {/* GDPR Export Button */}
                  <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 sm:rounded-b-2xl">
                       <button onClick={handleExportData} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors w-full justify-center">
                           <Download size={14} /> 
                           <span>Export My Personal Data (JSON)</span>
                       </button>
                  </div>
              </div>
          </div>
      )}
      
      <style>{`
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
            animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PublicView;