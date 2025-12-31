import React, { useState, useEffect, useRef } from 'react';
import { Box, Layers, Loader2, Locate, Navigation, Search, X, Filter, Leaf, ShieldAlert, Trash2, Car, HardHat, Palette, HelpCircle } from 'lucide-react';
import { Location, Feedback } from '../types';
import { searchLocation } from '../services/geoService';
import { renderToString } from 'react-dom/server';

declare var L: any;

interface MapAreaProps {
  feedbackList: Feedback[];
  onMapClick: (loc: Location) => void;
  interactive?: boolean;
  center?: Location;
  showSelectionMarker?: boolean;
}

const DEFAULT_CENTER = [40.7128, -74.0060];

// Category styling map
const CATEGORY_STYLES: Record<string, { color: string, icon: React.ReactNode }> = {
  'Sanitation': { color: '#ef4444', icon: <Trash2 size={14} color="white" /> },
  'Infrastructure': { color: '#f97316', icon: <HardHat size={14} color="white" /> },
  'Safety': { color: '#dc2626', icon: <ShieldAlert size={14} color="white" /> },
  'Traffic': { color: '#6366f1', icon: <Car size={14} color="white" /> },
  'Sustainability': { color: '#22c55e', icon: <Leaf size={14} color="white" /> },
  'Culture': { color: '#db2777', icon: <Palette size={14} color="white" /> },
  'General': { color: '#64748b', icon: <HelpCircle size={14} color="white" /> }
};

const MapArea: React.FC<MapAreaProps> = ({ 
  feedbackList, 
  onMapClick, 
  interactive = true, 
  center,
  showSelectionMarker = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any | null>(null);
  const [layers, setLayers] = useState<any | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  const userLocationMarkerRef = useRef<any | null>(null);
  const selectionMarkerRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);

  const initialCenter = center ? [center.y, center.x] : DEFAULT_CENTER;

  // -- Initialize Map --
  useEffect(() => {
    if (!mapRef.current) return;
    
    const checkLeaflet = setInterval(() => {
        if ((window as any).L) {
            clearInterval(checkLeaflet);
            initMap();
        }
    }, 100);
    
    return () => clearInterval(checkLeaflet);
  }, []);

  // -- Fly to Center Update --
  useEffect(() => {
    if (mapInstance && center) {
        mapInstance.flyTo([center.y, center.x], 13);
    }
  }, [center, mapInstance]);

  // -- Handle Tenant Center Marker --
  useEffect(() => {
    if (!mapInstance || !L) return;

    if (showSelectionMarker && center) {
        if (selectionMarkerRef.current) selectionMarkerRef.current.remove();
        
        const centerIcon = L.divIcon({
            html: `
                <div class="relative flex items-center justify-center">
                    <div class="absolute w-12 h-12 bg-indigo-500/20 rounded-full animate-ping"></div>
                    <div class="relative z-10 text-indigo-600 drop-shadow-xl">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            <circle cx="12" cy="9" r="2.5" fill="white"/>
                        </svg>
                    </div>
                </div>
            `,
            className: 'center-pin-marker',
            iconSize: [48, 48],
            iconAnchor: [24, 48]
        });

        selectionMarkerRef.current = L.marker([center.y, center.x], { icon: centerIcon }).addTo(mapInstance);
    }
  }, [center, showSelectionMarker, mapInstance]);

  const initMap = () => {
      if (mapInstance) return;

      const map = L.map(mapRef.current, {
        center: initialCenter,
        zoom: 13,
        zoomControl: false,
        attributionControl: false // Cleaner look
      });

      // High-quality CartoDB Voyager tiles (Clean, modern look)
      const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 20
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');

      streetLayer.addTo(map);
      setLayers({ street: streetLayer, satellite: satelliteLayer });

      map.on('click', (e: any) => {
          if (!interactive) return;
          const { lat, lng } = e.latlng;
          onMapClick({ x: lng, y: lat });
      });

      map.on('locationfound', (e: any) => {
        const radius = e.accuracy / 2;
        if (userLocationMarkerRef.current) map.removeLayer(userLocationMarkerRef.current);

        const userIcon = L.divIcon({
            html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-ring"></div>',
            className: 'user-location-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        const marker = L.marker(e.latlng, { icon: userIcon }).addTo(map);
        marker.bindPopup(`You are within ${Math.round(radius)} meters from this point`).openPopup();
        userLocationMarkerRef.current = marker;
        setIsLocating(false);
      });

      setMapInstance(map);
      setIsMapLoaded(true);

      setTimeout(() => {
        map.invalidateSize();
        if (interactive && !center) map.locate({ setView: true, maxZoom: 16 });
      }, 500);
  };

  const handleManualLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mapInstance) return;
    setIsLocating(true);
    mapInstance.locate({ setView: true, maxZoom: 16 });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstance) return;

    setIsSearching(true);
    setSearchError(false);
    
    const result = await searchLocation(searchQuery);
    
    if (result) {
        mapInstance.flyTo([result.lat, result.lon], 14);
    } else {
        setSearchError(true);
    }
    setIsSearching(false);
  };

  // -- Toggle Satellite --
  useEffect(() => {
      if (!mapInstance || !layers) return;
      if (isSatellite) {
          mapInstance.removeLayer(layers.street);
          mapInstance.addLayer(layers.satellite);
      } else {
          mapInstance.removeLayer(layers.satellite);
          mapInstance.addLayer(layers.street);
      }
  }, [isSatellite, mapInstance, layers]);

  // -- Render Markers --
  useEffect(() => {
      if (!mapInstance || !L) return;

      // 1. Clear existing
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // 2. Filter List
      const filteredList = activeFilter === 'All' 
        ? feedbackList 
        : feedbackList.filter(f => f.category === activeFilter);

      // 3. Add New Markers
      filteredList.forEach(fb => {
          let lat = fb.location.y;
          let lng = fb.location.x;

          // Fallback for demo percent data
          if (Math.abs(lat) <= 100 && Math.abs(lng) <= 100) {
              lat = DEFAULT_CENTER[0] + (fb.location.y - 50) * 0.0001;
              lng = DEFAULT_CENTER[1] + (fb.location.x - 50) * 0.0001;
          }

          // Get Style based on Category or Sentiment
          const style = CATEGORY_STYLES[fb.category] || CATEGORY_STYLES['General'];
          const iconString = renderToString(style.icon);

          const iconHtml = `
            <div class="relative group">
                <div style="background-color: ${style.color}" class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transform transition-transform group-hover:scale-110">
                    ${iconString}
                </div>
                <div style="border-top-color: ${style.color}" class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]"></div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: [32, 40],
            iconAnchor: [16, 40],
            popupAnchor: [0, -40]
          });

          const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);
          
          const popupContent = `
            <div class="font-sans min-w-[200px]">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold uppercase tracking-wide text-slate-500">${fb.category}</span>
                    <span class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">${new Date(fb.timestamp).toLocaleDateString()}</span>
                </div>
                <div class="text-sm text-slate-800 font-medium mb-2 leading-snug">"${fb.content}"</div>
                <div class="flex items-center space-x-2">
                    <div class="h-2 w-2 rounded-full ${fb.sentiment === 'positive' ? 'bg-green-500' : fb.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'}"></div>
                    <span class="text-xs text-slate-600 capitalize">${fb.sentiment}</span>
                </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          markersRef.current.push(marker);
      });

  }, [feedbackList, mapInstance, activeFilter]);

  // Unique Categories for Filter
  const categories = ['All', ...Array.from(new Set(feedbackList.map(f => f.category)))];

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden group">
      
      {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
      )}

      {interactive && isMapLoaded && (
        <>
            {/* --- CENTRAL COMMAND SEARCH BAR --- */}
            <div className="absolute top-24 md:top-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px] z-[500] transition-all duration-300">
                <form onSubmit={handleSearch} className="relative group/search">
                    <div className={`absolute inset-0 bg-white/40 rounded-full blur-md transition-opacity ${isSearching ? 'opacity-100' : 'opacity-0'}`}></div>
                    <div className="relative flex items-center bg-white/90 backdrop-blur-md shadow-xl rounded-full border border-white/50 transition-all hover:bg-white hover:scale-[1.02] focus-within:scale-[1.02] focus-within:ring-2 focus-within:ring-indigo-500/20">
                        <Search className="ml-4 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search city, neighborhood, or landmark..."
                            className={`w-full py-3 px-3 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm`}
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')} className="p-2 mr-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"><X size={14} /></button>
                        )}
                        {isSearching && <Loader2 size={16} className="mr-4 animate-spin text-indigo-500" />}
                    </div>
                </form>
                {searchError && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-red-50 text-red-600 text-xs py-2 px-4 rounded-lg shadow-lg text-center animate-fade-in-up border border-red-100">
                        Location not found. Try a broader search.
                    </div>
                )}

                {/* --- FLOATING FILTER PILLS --- */}
                <div className="mt-3 flex items-center justify-center space-x-2 overflow-x-auto no-scrollbar py-1 mask-linear-fade">
                    {categories.slice(0, 4).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveFilter(cat)}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border transition-all ${
                                activeFilter === cat 
                                ? 'bg-slate-800 text-white border-slate-800 transform scale-105' 
                                : 'bg-white/90 text-slate-600 border-white/50 hover:bg-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- RIGHT ACTION STACK --- */}
            <div className="absolute top-24 md:top-6 right-4 z-[500] flex flex-col space-y-3">
                <button 
                    onClick={handleManualLocate}
                    className="bg-white/90 backdrop-blur p-3 rounded-2xl shadow-lg border border-white/50 text-slate-600 hover:text-indigo-600 hover:bg-white transition-all hover:scale-105 active:scale-95"
                    title="Locate Me"
                >
                    {isLocating ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} className={userLocationMarkerRef.current ? "fill-indigo-500 text-indigo-600" : ""} />}
                </button>

                <button 
                    onClick={(e) => { e.stopPropagation(); setIsSatellite(!isSatellite); }}
                    className="bg-white/90 backdrop-blur p-3 rounded-2xl shadow-lg border border-white/50 text-slate-600 hover:text-indigo-600 hover:bg-white transition-all hover:scale-105 active:scale-95"
                    title="Layers"
                >
                    {isSatellite ? <Layers size={20} /> : <Box size={20} />}
                </button>
            </div>
        </>
      )}

      <div ref={mapRef} className="w-full h-full z-0 outline-none" />
      
      <style>{`
        .pulse-ring {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
            animation: pulse-blue 2s infinite;
        }
        @keyframes pulse-blue {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MapArea;