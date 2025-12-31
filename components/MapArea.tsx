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
  isDarkMode?: boolean;
}

const DEFAULT_CENTER = [40.7128, -74.0060];

// Category styling map
const CATEGORY_STYLES: Record<string, { color: string, icon: React.ReactNode }> = {
  'Sanitation': { color: '#ef4444', icon: <Trash2 size={14} color="black" /> }, // Red
  'Infrastructure': { color: '#f97316', icon: <HardHat size={14} color="black" /> }, // Orange
  'Safety': { color: '#eab308', icon: <ShieldAlert size={14} color="black" /> }, // Yellow
  'Traffic': { color: '#3b82f6', icon: <Car size={14} color="black" /> }, // Blue
  'Sustainability': { color: '#22c55e', icon: <Leaf size={14} color="black" /> }, // Green
  'Culture': { color: '#d946ef', icon: <Palette size={14} color="black" /> }, // Fuchsia
  'General': { color: '#94a3b8', icon: <HelpCircle size={14} color="black" /> } // Slate
};

// Hardcoded list to ensure render even if object keys fail
const PREDEFINED_CATEGORIES = ['All', 'Sanitation', 'Infrastructure', 'Safety', 'Traffic', 'Sustainability', 'Culture', 'General'];

const MapArea: React.FC<MapAreaProps> = ({ 
  feedbackList, 
  onMapClick, 
  interactive = true, 
  center,
  showSelectionMarker = false,
  isDarkMode = true
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

  // -- Dynamic Tile Update on Theme Change --
  useEffect(() => {
      if (!mapInstance || !layers) return;
      if (isSatellite) return; // Satellite overrides theme

      // Safely remove both to avoid duplicates
      if (mapInstance.hasLayer(layers.dark)) mapInstance.removeLayer(layers.dark);
      if (mapInstance.hasLayer(layers.light)) mapInstance.removeLayer(layers.light);

      if (isDarkMode) {
          mapInstance.addLayer(layers.dark);
      } else {
          mapInstance.addLayer(layers.light);
      }
  }, [isDarkMode, mapInstance, layers, isSatellite]);

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
                    <div class="absolute w-12 h-12 bg-orange-500/20 rounded-full animate-ping"></div>
                    <div class="relative z-10 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="black" stroke-width="1">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            <circle cx="12" cy="9" r="2.5" fill="black"/>
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
        attributionControl: false
      });

      // CartoDB Dark Matter (Dark Mode)
      const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
      
      // CartoDB Voyager (Light Mode - More Colorful/Visible than Positron)
      const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
      
      // Satellite
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');

      // Initial Add based on current prop
      if (isDarkMode) darkLayer.addTo(map);
      else lightLayer.addTo(map);

      setLayers({ dark: darkLayer, light: lightLayer, satellite: satelliteLayer });

      map.on('click', (e: any) => {
          if (!interactive) return;
          const { lat, lng } = e.latlng;
          onMapClick({ x: lng, y: lat });
      });

      map.on('locationfound', (e: any) => {
        const radius = e.accuracy / 2;
        if (userLocationMarkerRef.current) map.removeLayer(userLocationMarkerRef.current);

        const userIcon = L.divIcon({
            html: '<div class="w-4 h-4 bg-orange-500 rounded-full border border-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.8)]"></div>',
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
      
      // Remove all base layers first
      if (mapInstance.hasLayer(layers.dark)) mapInstance.removeLayer(layers.dark);
      if (mapInstance.hasLayer(layers.light)) mapInstance.removeLayer(layers.light);
      if (mapInstance.hasLayer(layers.satellite)) mapInstance.removeLayer(layers.satellite);

      if (isSatellite) {
          mapInstance.addLayer(layers.satellite);
      } else {
          // Restore theme based layer
          if (isDarkMode) mapInstance.addLayer(layers.dark);
          else mapInstance.addLayer(layers.light);
      }
  }, [isSatellite, mapInstance, layers, isDarkMode]);

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
                <div style="background-color: ${style.color}" class="w-8 h-8 rounded-full border border-black shadow-[0_0_10px_${style.color}80] flex items-center justify-center transform transition-transform group-hover:scale-110">
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
            <div class="font-sans min-w-[200px] bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 p-1">
                <div class="flex items-center justify-between mb-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <span class="text-[10px] font-mono font-bold uppercase tracking-wide text-zinc-500">${fb.category}</span>
                    <span class="text-[10px] bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-200 dark:border-zinc-800">${new Date(fb.timestamp).toLocaleDateString()}</span>
                </div>
                <div class="text-xs font-medium mb-3 leading-snug">"${fb.content}"</div>
                <div class="flex items-center space-x-2">
                    <div class="h-1.5 w-1.5 rounded-full ${fb.sentiment === 'positive' ? 'bg-green-500' : fb.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'}"></div>
                    <span class="text-[10px] text-zinc-400 capitalize font-mono">${fb.sentiment}</span>
                </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
             className: isDarkMode ? 'dark-popup' : 'light-popup'
          });
          markersRef.current.push(marker);
      });

  }, [feedbackList, mapInstance, activeFilter, isDarkMode]);

  return (
    <div className="relative w-full h-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden group transition-colors duration-300">
      
      {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-10">
              <Loader2 className="animate-spin text-orange-600" size={32} />
          </div>
      )}

      {interactive && isMapLoaded && (
        <>
            {/* --- CENTRAL COMMAND SEARCH BAR --- */}
            <div className="absolute top-24 md:top-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px] z-[500] transition-all duration-300">
                <form onSubmit={handleSearch} className="relative group/search">
                    <div className="relative flex items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl rounded border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                        <Search className="ml-4 text-zinc-400 dark:text-zinc-500" size={14} />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="SEARCH_LOCUS..."
                            className={`w-full py-3 px-3 bg-transparent outline-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 text-xs font-mono uppercase`}
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')} className="p-2 mr-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"><X size={12} /></button>
                        )}
                        {isSearching && <Loader2 size={14} className="mr-4 animate-spin text-orange-500" />}
                    </div>
                </form>
                {searchError && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-200 text-xs py-2 px-4 rounded text-center animate-fade-in-up font-mono">
                        ERR_LOC_NOT_FOUND
                    </div>
                )}

                {/* --- FLOATING FILTER PILLS --- */}
                <div className="mt-3 flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 mask-linear-fade">
                    {PREDEFINED_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveFilter(cat)}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-sm text-[10px] font-mono uppercase tracking-wide border transition-all flex-shrink-0 ${
                                activeFilter === cat 
                                ? 'bg-orange-600 text-white dark:text-black border-orange-600 font-bold' 
                                : 'bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500'
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
                    className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-3 rounded shadow-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-orange-500 hover:border-orange-500 transition-colors"
                    title="LOCATE_USER"
                >
                    {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} className={userLocationMarkerRef.current ? "fill-orange-500 text-orange-600" : ""} />}
                </button>

                <button 
                    onClick={(e) => { e.stopPropagation(); setIsSatellite(!isSatellite); }}
                    className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-3 rounded shadow-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-orange-500 hover:border-orange-500 transition-colors"
                    title="TOGGLE_LAYER"
                >
                    {isSatellite ? <Layers size={16} /> : <Box size={16} />}
                </button>
            </div>
        </>
      )}

      <div ref={mapRef} className="w-full h-full z-0 outline-none bg-zinc-200 dark:bg-zinc-900" />
      
      <style>{`
        /* Dark Leaflet Popups */
        .dark-popup .leaflet-popup-content-wrapper {
            background: #09090b; /* zinc-950 */
            color: #e4e4e7; /* zinc-200 */
            border: 1px solid #27272a; /* zinc-800 */
            border-radius: 4px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        .dark-popup .leaflet-popup-tip {
            background: #27272a; /* zinc-800 */
        }
        .dark-popup .leaflet-popup-close-button {
            color: #71717a !important; /* zinc-500 */
        }

        /* Light Leaflet Popups */
        .light-popup .leaflet-popup-content-wrapper {
            background: #ffffff;
            color: #18181b;
            border: 1px solid #e4e4e7;
            border-radius: 4px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .light-popup .leaflet-popup-tip {
            background: #ffffff;
        }
        .light-popup .leaflet-popup-close-button {
            color: #a1a1aa !important;
        }

        .leaflet-container {
            background: transparent !important;
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