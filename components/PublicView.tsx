import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Activity, User } from 'lucide-react';
import MapArea from './MapArea';
import FeedbackModal from './FeedbackModal';
import { Feedback, Location, AccountSetup } from '../types';
import { dataService } from '../services/dataService';

interface PublicViewProps {
  onBack: () => void;
  showToast?: (msg: string) => void;
  isDarkMode?: boolean;
}

const PublicView: React.FC<PublicViewProps> = ({ onBack, showToast, isDarkMode = true }) => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [account, setAccount] = useState<AccountSetup | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [liveFeed, setLiveFeed] = useState<string[]>([]);

  // Load data async
  useEffect(() => {
    const load = async () => {
        const list = await dataService.getFeedback();
        setFeedbackList(list);
        const storedAccount = dataService.getAccount();
        if (storedAccount) {
            setAccount(storedAccount);
        }
    };
    load();

    // Simulate Live Feed
    const actions = ["New pothole reported downtown", "Safety score updated", "Vote recorded on Main St", "Feedback analyzed by AI"];
    const interval = setInterval(() => {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLiveFeed(prev => [`${time} • ${action}`, ...prev].slice(0, 3));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleMapClick = (loc: Location) => {
    setSelectedLocation(loc);
  };

  const handleFeedbackSubmit = async (newFeedback: Feedback) => {
    const updatedList = await dataService.saveFeedback(newFeedback);
    setFeedbackList(updatedList);
    setSelectedLocation(null);
    if (showToast) showToast("Feedback Submitted Successfully");
  };

  return (
    <div className="relative h-screen w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="pointer-events-auto flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-2xl rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline font-medium text-xs">Back to Home</span>
          </button>

          <div className="hidden md:flex pointer-events-auto px-5 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-2xl rounded-full border border-orange-500/20 dark:border-orange-900/50 text-orange-600 dark:text-orange-500 items-center space-x-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider">Live Updates</span>
          </div>
        </div>
      </header>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        <MapArea 
          feedbackList={feedbackList} 
          onMapClick={handleMapClick}
          center={account?.center}
          isDarkMode={isDarkMode}
        />
        
        {/* Floating Action Badge */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-600 dark:text-zinc-300 px-6 py-3 rounded-full shadow-lg flex items-center space-x-3 border border-zinc-200 dark:border-zinc-700 animate-bounce-slow">
                <div className="bg-orange-600 p-1.5 rounded-full shadow-lg text-white dark:text-black">
                    <Plus size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Tap map to add feedback</span>
            </div>
        </div>

        {/* Live Feed Ticker (Bottom Left) */}
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
      </div>

      {/* Feedback Modal */}
      {selectedLocation && (
        <FeedbackModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onSubmit={handleFeedbackSubmit}
        />
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