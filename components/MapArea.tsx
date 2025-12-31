import React, { useState, useEffect, useRef } from 'react';
import { Box, Layers, Loader2, Locate, Navigation, Search, X, Filter, Leaf, ShieldAlert, Trash2, Car, HardHat, Palette, HelpCircle } from 'lucide-react';
import { Location, Feedback, LeafletNamespace, LeafletMap, LeafletLayer, LeafletLayerGroup, LeafletLocationEvent, LeafletErrorEvent } from '../types';
import { searchLocation } from '../services/geoService';
import { renderToString } from 'react-dom/server';
import { APP_CONFIG } from '../config/constants';

// Cast window.L to our strict interface
const L = (window as any).L as LeafletNamespace;

interface MapAreaProps {
  feedbackList: Feedback[];
  onMapClick: (loc: Location) => void;
  interactive?: boolean;
  center?: Location;
  showSelectionMarker?: boolean;
  isDarkMode?: boolean;
  onError?: (msg: string) => void;
}

// Map icon string names to actual components
const ICON_MAP: Record<string, any> = {
  'Trash2': Trash2,
  'HardHat': HardHat,
  'ShieldAlert': ShieldAlert,
  'Car': Car,
  'Leaf': Leaf,
  'Palette': Palette,
  'HelpCircle': HelpCircle
};

const MapArea: React.FC<MapAreaProps> = ({ 
  feedbackList, 
  onMapClick, 
  interactive = true, 
  center,
  showSelectionMarker = false,
  isDarkMode = true,
  onError
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [layers, setLayers] = useState<Record<string, LeafletLayer> | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  const userLocationMarkerRef = useRef<LeafletLayer | null>(null);
  const selectionMarkerRef = useRef<LeafletLayer | null>(null);
  
  // Ref for Marker Cluster Group
  const clusterGroupRef = useRef<LeafletLayerGroup | null>(null);

  // Use config for default center
  const initialCenter = center 
    ? [center.y, center.x] 
    : [APP_CONFIG.MAP.DEFAULT_CENTER.y, APP_CONFIG.MAP.DEFAULT_CENTER.x];

  // Dynamic Category Styles derived from Config
  const getCategoryStyle = (categoryName: string) => {
    const config = APP_CONFIG.CATEGORIES.find(c => c.name === categoryName) || APP_CONFIG.CATEGORIES.find(c => c.name === 'General');
    const IconComponent = ICON_MAP[config?.icon || 'HelpCircle'] || HelpCircle;
    return {
      color: config?.color || '#94a3b8',
      icon: <IconComponent size={14} color="black" />
    };
  };

  const filterCategories = ['All', ...APP_CONFIG.CATEGORIES.map(c => c.name)];

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
        mapInstance.flyTo([center.y, center.x], APP_CONFIG.MAP.DEFAULT_ZOOM);
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

        const marker = L.marker([center.y, center.x], { icon: centerIcon }).addTo(mapInstance as any);
        selectionMarkerRef.current = marker;
    }
  }, [center, showSelectionMarker, mapInstance]);

  const initMap = () => {
      if (mapInstance) return;

      const map = L.map(mapRef.current!, {
        center: initialCenter as [number, number],
        zoom: APP_CONFIG.MAP.DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false
      });

      // Use Configured Tile Layers
      const darkLayer = L.tileLayer(APP_CONFIG.MAP.TILES.DARK, { maxZoom: 20 });
      const lightLayer = L.tileLayer(APP_CONFIG.MAP.TILES.LIGHT, { maxZoom: 19 });
      const satelliteLayer = L.tileLayer(APP_CONFIG.MAP.TILES.SATELLITE);

      // Initial Add based on current prop
      if (isDarkMode) darkLayer.addTo(map);
      else lightLayer.addTo(map);

      setLayers({ dark: darkLayer, light: lightLayer, satellite: satelliteLayer });

      // Initialize Cluster Group
      if (L.markerClusterGroup) {
        const clusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 40,
            iconCreateFunction: function(cluster: any) {
                const count = cluster.getChildCount();
                let sizeClass = 'w-8 h-8';
                if (count > 10) sizeClass = 'w-10 h-10';
                if (count > 100) sizeClass = 'w-12 h-12';
                
                return L.divIcon({
                    html: `<div class="${sizeClass} rounded-full bg-orange-600/90 text-white flex items-center justify-center font-bold text-xs border-2 border-white/20 shadow-lg">${count}</div>`,
                    className: 'custom-cluster-icon',
                    iconSize: null
                });
            }
        });
        clusterGroupRef.current = clusterGroup;
        map.addLayer(clusterGroup);
      } else {
        console.warn("Leaflet.markercluster not loaded");
        // Fallback group if cluster lib missing
        clusterGroupRef.current = L.layerGroup().addTo(map);
      }

      map.on('click', (e: any) => {
          if (!interactive) return;
          const { lat, lng } = e.latlng;
          onMapClick({ x: lng, y: lat });
      });

      map.on('locationfound', (e: LeafletLocationEvent) => {
        const radius = e.accuracy / 2;
        if (userLocationMarkerRef.current) map.removeLayer(userLocationMarkerRef.current);

        const userIcon = L.divIcon({
            html: '<div class="w-4 h-4 bg-orange-500 rounded-full border border-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.8)]"></div>',
            className: 'user-location-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        const marker = L.marker(e.latlng as any, { icon: userIcon }).addTo(map as any);
        marker.bindPopup(`You are within ${Math.round(radius)} meters from this point`).openPopup();
        userLocationMarkerRef.current = marker;
        setIsLocating(false);
      });

      map.on('locationerror', (e: LeafletErrorEvent) => {
        setIsLocating(false);
        console.warn("Location Access Error:", e);
        const msg = e.message === "User denied Geolocation" 
            ? "Location permission denied. Please enable in browser settings." 
            : e.message || "Could not access location.";
            
        if (onError) onError(msg);
      });

      setMapInstance(map);
      setIsMapLoaded(true);

      setTimeout(() => {
        map.invalidateSize();
        if (interactive && !center) {
            map.locate({ setView: true, maxZoom: 16 });
        }
      }, 500);
  };

  const handleManualLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mapInstance) return;
    setIsLocating(true);
    mapInstance.locate({ setView: true, maxZoom: 16, timeout: 10000 });
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
      
      if (mapInstance.hasLayer(layers.dark)) mapInstance.removeLayer(layers.dark);
      if (mapInstance.hasLayer(layers.light)) mapInstance.removeLayer(layers.light);
      if (mapInstance.hasLayer(layers.satellite)) mapInstance.removeLayer(layers.satellite);

      if (isSatellite) {
          mapInstance.addLayer(layers.satellite);
      } else {
          if (isDarkMode) mapInstance.addLayer(layers.dark);
          else mapInstance.addLayer(layers.light);
      }
  }, [isSatellite, mapInstance, layers, isDarkMode]);

  // -- Render Markers into Cluster Group --
  useEffect(() => {
      if (!mapInstance || !L || !clusterGroupRef.current) return;

      // 1. Clear existing cluster layers
      clusterGroupRef.current.clearLayers();

      // 2. Filter List
      const filteredList = activeFilter === 'All' 
        ? feedbackList 
        : feedbackList.filter(f => f.category === activeFilter);

      // 3. Create Markers
      const newMarkers = filteredList.map(fb => {
          let lat = fb.location.y;
          let lng = fb.location.x;

          // Fallback for demo percent data coordinates
          if (Math.abs(lat) <= 100 && Math.abs(lng) <= 100) {
            const defaultX = APP_CONFIG.MAP.DEFAULT_CENTER.x;
            const defaultY = APP_CONFIG.MAP.DEFAULT_CENTER.y;
            lat = defaultY + (fb.location.y - 50) * 0.0001;
            lng = defaultX + (fb.location.x - 50) * 0.0001;
          }

          const style = getCategoryStyle(fb.category);
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

          const marker = L.marker([lat, lng], { icon: customIcon });
          
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

          return marker;
      });

      // 4. Batch Add to Cluster
      clusterGroupRef.current.addLayers(newMarkers);

  }, [feedbackList, mapInstance, activeFilter, isDarkMode]);

  return (
    <div className="relative w-full h-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden group transition-colors duration-300">
      
      {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 z-10 pointer-events-none">
              <Loader2 className="animate-spin text-orange-600" size={32} />
          </div>
      )}

      {interactive && (
        <>
            {/* Search and Filters UI (Identical to previous) */}
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

                <div className="mt-3 flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                    {filterCategories.map(cat => (
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
        /* Reuse existing styles plus generic cluster style fallback */
        .dark-popup .leaflet-popup-content-wrapper {
            background: #09090b; 
            color: #e4e4e7;
            border: 1px solid #27272a;
            border-radius: 4px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        .dark-popup .leaflet-popup-tip {
            background: #27272a;
        }
        .dark-popup .leaflet-popup-close-button {
            color: #71717a !important;
        }
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
