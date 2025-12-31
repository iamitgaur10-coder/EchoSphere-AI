import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Activity, User } from 'lucide-react';
import MapArea from './MapArea';
import FeedbackModal from './FeedbackModal';
import { Feedback, Location, AccountSetup } from '../types';
import { dataService } from '../services/dataService';

interface PublicViewProps {
  onBack: () => void;
  showToast?: (msg: string) => void;
}

const PublicView: React.FC<PublicViewProps> = ({ onBack, showToast }) => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [account, setAccount] = useState<AccountSetup | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [liveFeed, setLiveFeed] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    setFeedbackList(dataService.getFeedback());
    const storedAccount = dataService.getAccount();
    if (storedAccount) {
        setAccount(storedAccount);
    }

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

  const handleFeedbackSubmit = (newFeedback: Feedback) => {
    const updatedList = dataService.saveFeedback(newFeedback);
    setFeedbackList(updatedList);
    setSelectedLocation(null);
    if (showToast) showToast("Feedback submitted successfully! AI analysis complete.");
  };

  return (
    <div className="relative h-screen w-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="pointer-events-auto flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-md shadow-lg rounded-full text-slate-700 hover:text-indigo-600 transition-all font-medium border border-white/20 hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back Home</span>
          </button>

          <div className="hidden md:flex pointer-events-auto px-5 py-2 bg-indigo-600/90 backdrop-blur-md shadow-lg rounded-full text-white items-center space-x-3 border border-indigo-400/30">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-sm font-semibold tracking-wide">Live Mode</span>
          </div>
        </div>
      </header>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        <MapArea 
          feedbackList={feedbackList} 
          onMapClick={handleMapClick}
          center={account?.center} 
        />
        
        {/* Floating Action Badge */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 border border-slate-700 animate-bounce-slow">
                <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-full shadow-lg">
                    <Plus size={18} className="text-white" />
                </div>
                <span className="text-sm font-medium">Tap map to report</span>
            </div>
        </div>

        {/* Live Feed Ticker (Bottom Left) */}
        <div className="absolute bottom-6 left-6 z-10 hidden md:block w-64 pointer-events-none">
            <div className="space-y-2">
                {liveFeed.map((msg, i) => (
                    <div key={i} className={`bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-white/40 text-xs text-slate-600 flex items-center space-x-2 animate-fade-in-left`} style={{ opacity: 1 - (i * 0.3) }}>
                        <Activity size={12} className="text-indigo-500" />
                        <span>{msg}</span>
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