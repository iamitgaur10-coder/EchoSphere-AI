import React, { useState, useRef } from 'react';
import { MapPin, Box, Layers } from 'lucide-react';
import { Location, Feedback } from '../types';

interface MapAreaProps {
  feedbackList: Feedback[];
  onMapClick: (loc: Location) => void;
  interactive?: boolean;
}

const MapArea: React.FC<MapAreaProps> = ({ feedbackList, onMapClick, interactive = true }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [is3DMode, setIs3DMode] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !mapRef.current) return;
    
    // We only allow clicking in 2D mode for accuracy, or we need to account for transform
    // For MVP, simplifying to 2D click only or approximate
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    onMapClick({ x, y });
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden perspective-1000">
      
      {/* 3D Toggle Control */}
      {interactive && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIs3DMode(!is3DMode); }}
          className="absolute top-4 right-4 z-20 bg-white/90 p-2 rounded-lg shadow-md hover:bg-white text-slate-700 font-medium text-xs flex items-center space-x-2 border border-slate-200"
        >
          {is3DMode ? <Layers size={16} /> : <Box size={16} />}
          <span>{is3DMode ? "2D Map" : "3D View"}</span>
        </button>
      )}

      <div 
        ref={mapRef}
        onClick={handleClick}
        className={`relative w-full h-full bg-slate-200 transition-transform duration-700 ease-in-out transform-style-3d shadow-2xl ${
          is3DMode ? 'rotate-x-45 scale-75 origin-center translate-y-12' : ''
        } ${interactive ? 'cursor-crosshair' : 'cursor-default'}`}
      >
        {/* Background Map Placeholder */}
        <img 
          src="https://picsum.photos/1200/800?grayscale&blur=2" 
          alt="City Map" 
          className="w-full h-full object-cover opacity-60 mix-blend-multiply pointer-events-none"
        />
        
        {/* Grid overlay for tech feel */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} 
        />

        {/* Existing Pins */}
        {feedbackList.map((fb) => (
          <div
            key={fb.id}
            className={`absolute transform -translate-x-1/2 -translate-y-full hover:z-10 transition-all duration-200 ${is3DMode ? 'hover:-translate-y-[120%]' : ''}`}
            style={{ 
                left: `${fb.location.x}%`, 
                top: `${fb.location.y}%`,
                // In 3D mode, we make pins stand up by rotating them opposite to the map tilt
                transform: is3DMode 
                    ? 'translate(-50%, -100%) rotateX(-45deg) scale(1.5)' 
                    : 'translate(-50%, -100%)'
            }}
          >
            <div className="group/pin relative">
              <MapPin 
                size={32} 
                className={`drop-shadow-lg ${
                  fb.sentiment === 'positive' ? 'text-green-500' :
                  fb.sentiment === 'negative' ? 'text-red-500' : 'text-yellow-500'
                }`}
                fill="currentColor"
              />
              
              {/* Tooltip */}
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white text-slate-800 text-xs p-2 rounded shadow-xl opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-20 ${is3DMode ? 'hidden' : ''}`}>
                <p className="font-bold">{fb.category}</p>
                <p className="line-clamp-2">{fb.content}</p>
                <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                  <span>{new Date(fb.timestamp).toLocaleDateString()}</span>
                  <span className="capitalize">{fb.sentiment}</span>
                </div>
              </div>
            </div>
            
            {/* Pulse effect on ground in 3D */}
            {is3DMode && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 bg-white/50 rounded-full animate-ping -mt-1"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapArea;