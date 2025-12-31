import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import MapArea from './MapArea';
import FeedbackModal from './FeedbackModal';
import { Feedback, Location } from '../types';

// Initial Mock Data
const MOCK_FEEDBACK: Feedback[] = [
  { id: '1', location: { x: 20, y: 30 }, content: 'The park is beautiful but needs more trash cans.', sentiment: 'neutral', category: 'Sanitation', timestamp: new Date(), votes: 5 },
  { id: '2', location: { x: 55, y: 60 }, content: 'Dangerous pothole here! Nearly crashed my bike.', sentiment: 'negative', category: 'Infrastructure', timestamp: new Date(), votes: 12 },
  { id: '3', location: { x: 70, y: 25 }, content: 'Love the new mural downtown!', sentiment: 'positive', category: 'Culture', timestamp: new Date(), votes: 20 },
];

interface PublicViewProps {
  onBack: () => void;
}

const PublicView: React.FC<PublicViewProps> = ({ onBack }) => {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>(MOCK_FEEDBACK);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const handleMapClick = (loc: Location) => {
    setSelectedLocation(loc);
  };

  const handleFeedbackSubmit = (newFeedback: Feedback) => {
    setFeedbackList((prev) => [...prev, newFeedback]);
    setSelectedLocation(null);
  };

  return (
    <div className="relative h-screen w-full flex flex-col bg-slate-50">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="pointer-events-auto flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-md shadow-lg rounded-full text-slate-700 hover:text-indigo-600 transition-all font-medium border border-white/20"
          >
            <ArrowLeft size={18} />
            <span>Back Home</span>
          </button>

          <div className="hidden md:flex pointer-events-auto px-6 py-2 bg-indigo-600/90 backdrop-blur-md shadow-lg rounded-full text-white items-center space-x-2 border border-indigo-400/30">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-sm font-semibold tracking-wide">Live Feedback Mode</span>
          </div>
        </div>
      </header>

      {/* Main Map Area */}
      <div className="flex-1 relative z-0">
        <MapArea 
          feedbackList={feedbackList} 
          onMapClick={handleMapClick} 
        />
        
        {/* Helper Badge */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur text-white px-6 py-3 rounded-full shadow-xl pointer-events-none z-10 flex items-center space-x-3 border border-slate-700">
            <div className="bg-indigo-500 p-1.5 rounded-full">
                <Plus size={16} />
            </div>
            <span className="text-sm font-medium">Click anywhere on the map to add a feedback pin</span>
        </div>
      </div>

      {/* Modal */}
      {selectedLocation && (
        <FeedbackModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
};

export default PublicView;