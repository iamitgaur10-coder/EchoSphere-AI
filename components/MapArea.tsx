import React, { useState, useEffect, useRef } from 'react';
import { Box, Layers, Loader2 } from 'lucide-react';
import { Location, Feedback } from '../types';

declare var google: any;

interface MapAreaProps {
  feedbackList: Feedback[];
  onMapClick: (loc: Location) => void;
  interactive?: boolean;
}

// Default Center (New York City)
const DEFAULT_CENTER = { lat: 40.7128, lng: -74.0060 };

const MapArea: React.FC<MapAreaProps> = ({ feedbackList, onMapClick, interactive = true }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any | null>(null);
  const [is3DMode, setIs3DMode] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const markersRef = useRef<any[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;
    
    const checkGoogle = setInterval(() => {
        if ((window as any).google) {
            clearInterval(checkGoogle);
            initMap();
        }
    }, 100);
    
    return () => clearInterval(checkGoogle);
  }, []);

  const initMap = () => {
      // Access google from global scope (declared as any) or window
      if (!google) return;

      const map = new google.maps.Map(mapRef.current as HTMLElement, {
          center: DEFAULT_CENTER,
          zoom: 17, // High zoom for 3D effect
          mapId: 'DEMO_MAP_ID', // Required for some advanced features
          disableDefaultUI: false,
          mapTypeId: 'satellite',
          heading: 0,
          tilt: 0,
      });

      map.addListener('click', (e: any) => {
          if (!interactive) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          // We treat Location type as {x: lng, y: lat} for Real Maps, 
          // though types.ts says 0-100, we overload it here for the Real Map implementation
          onMapClick({ x: lng, y: lat }); 
      });

      setMapInstance(map);
      setIsMapLoaded(true);
  };

  // Handle 3D Toggle
  useEffect(() => {
      if (!mapInstance) return;
      
      if (is3DMode) {
          mapInstance.setTilt(45);
          mapInstance.setHeading(90);
          mapInstance.setMapTypeId('hybrid');
      } else {
          mapInstance.setTilt(0);
          mapInstance.setHeading(0);
          mapInstance.setMapTypeId('roadmap');
      }
  }, [is3DMode, mapInstance]);

  // Handle Markers
  useEffect(() => {
      if (!mapInstance || !google) return;

      // Clear existing markers
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      // Add new markers
      feedbackList.forEach(fb => {
          // Check if location is real geo (lat/lng) or legacy percentage
          // If x is small (< 100) and y is small (< 100), it's percentage data from old mock.
          // We map old mock data to NYC area for demo purposes if needed, or skip.
          let lat = fb.location.y;
          let lng = fb.location.x;

          // Simple heuristic: if it looks like percentage, project it to NYC
          if (Math.abs(lat) <= 100 && Math.abs(lng) <= 100) {
              lat = DEFAULT_CENTER.lat + (fb.location.y - 50) * 0.0001;
              lng = DEFAULT_CENTER.lng + (fb.location.x - 50) * 0.0001;
          }

          const marker = new google.maps.Marker({
              position: { lat, lng },
              map: mapInstance,
              title: fb.category,
              animation: google.maps.Animation.DROP,
              // Color coding markers based on sentiment?
              // Standard API markers are red, but we could use custom icons. 
              // For MVP keeping standard.
          });
          
          // Add info window
          const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="color: black; padding: 4px;">
                    <h3 style="font-weight: bold;">${fb.category}</h3>
                    <p>${fb.content}</p>
                    <small>Sentiment: ${fb.sentiment}</small>
                </div>
              `
          });

          marker.addListener('click', () => {
              infoWindow.open(mapInstance, marker);
          });

          markersRef.current.push(marker);
      });

  }, [feedbackList, mapInstance]);

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      
      {/* Loading State */}
      {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
              <div className="flex flex-col items-center space-y-2">
                 <Loader2 className="animate-spin text-indigo-600" size={32} />
                 <p className="text-sm text-slate-500">Connecting to Google Maps...</p>
              </div>
          </div>
      )}

      {/* 3D Toggle Control */}
      {interactive && isMapLoaded && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIs3DMode(!is3DMode); }}
          className="absolute top-4 right-16 z-20 bg-white/90 p-2 rounded-lg shadow-md hover:bg-white text-slate-700 font-medium text-xs flex items-center space-x-2 border border-slate-200"
        >
          {is3DMode ? <Layers size={16} /> : <Box size={16} />}
          <span>{is3DMode ? "2D Map" : "3D Mode"}</span>
        </button>
      )}

      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default MapArea;