import React, { useState, useEffect, useRef } from 'react';
import { Box, Layers, Loader2, Locate, Navigation, Search, X } from 'lucide-react';
import { Location, Feedback } from '../types';
import { searchLocation } from '../services/geoService';

declare var L: any;

interface MapAreaProps {
  feedbackList: Feedback[];
  onMapClick: (loc: Location) => void;
  interactive?: boolean;
  center?: Location; // Optional override for map center
  showSelectionMarker?: boolean; // If true, show a pin at the 'center' location
}

// Default Center (New York City) - Fallback
const DEFAULT_CENTER = [40.7128, -74.0060];

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
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  
  const userLocationMarkerRef = useRef<any | null>(null);
  const selectionMarkerRef = useRef<any | null>(null);
  const markersRef = useRef<any[]>([]);

  // Determine initial center
  const initialCenter = center ? [center.y, center.x] : DEFAULT_CENTER;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Check for Leaflet global variable
    const checkLeaflet = setInterval(() => {
        if ((window as any).L) {
            clearInterval(checkLeaflet);
            initMap();
        }
    }, 100);
    
    return () => clearInterval(checkLeaflet);
  }, []);

  // Effect to update view if center prop changes
  useEffect(() => {
    if (mapInstance && center) {
        // Fly to the new center smoothly
        mapInstance.flyTo([center.y, center.x], 13);
    }
  }, [center, mapInstance]);

  // Handle Selection Marker (for Wizard)
  useEffect(() => {
    if (!mapInstance || !L) return;

    if (showSelectionMarker && center) {
        if (selectionMarkerRef.current) {
            selectionMarkerRef.current.remove();
        }
        
        // Create a distinct marker for the "Tenant Center"
        const centerIcon = L.divIcon({
            html: `
                <div style="
                    color: #4f46e5; 
                    filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.3));
                ">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3" fill="white"/>
                    </svg>
                </div>
            `,
            className: 'center-pin-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });

        selectionMarkerRef.current = L.marker([center.y, center.x], { icon: centerIcon }).addTo(mapInstance);
    } else if (selectionMarkerRef.current) {
        selectionMarkerRef.current.remove();
        selectionMarkerRef.current = null;
    }
  }, [center, showSelectionMarker, mapInstance]);

  const initMap = () => {
      if (mapInstance) return; // Already initialized

      const map = L.map(mapRef.current, {
        center: initialCenter,
        zoom: 13, // Start slightly zoomed out
        zoomControl: false
      });

      // Define Layers
      const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });

      // Add default layer
      streetLayer.addTo(map);

      // Save layers for toggling
      setLayers({ street: streetLayer, satellite: satelliteLayer });

      // Click Handler
      map.on('click', (e: any) => {
          if (!interactive) return;
          const { lat, lng } = e.latlng;
          // Return as x (lng) and y (lat)
          onMapClick({ x: lng, y: lat });
      });

      // Location Found Handler
      map.on('locationfound', (e: any) => {
        const radius = e.accuracy / 2;
        
        if (userLocationMarkerRef.current) {
            map.removeLayer(userLocationMarkerRef.current);
        }

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

      map.on('locationerror', (e: any) => {
          console.warn("Location access denied", e.message);
          setIsLocating(false);
      });

      setMapInstance(map);
      setIsMapLoaded(true);

      // Fix for Leaflet partial rendering issues on load
      setTimeout(() => {
        map.invalidateSize();
        // Only auto-locate if we are using default center (no specific tenant center provided) and interactive
        if (interactive && !center) {
            map.locate({ setView: true, maxZoom: 16 });
        }
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
    e.stopPropagation();
    if (!searchQuery.trim() || !mapInstance) return;

    setIsSearching(true);
    setSearchError(false);
    
    const result = await searchLocation(searchQuery);
    
    if (result) {
        mapInstance.flyTo([result.lat, result.lon], 14);
        // Optional: If this is the Wizard, we might want to auto-select this point? 
        // For now, we just fly there and let the user click.
    } else {
        setSearchError(true);
    }
    setIsSearching(false);
  };

  // Handle Layer Toggle
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

  // Handle Markers
  useEffect(() => {
      if (!mapInstance || !L) return;

      // Clear existing markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Add new markers
      feedbackList.forEach(fb => {
          // Standard: y is Latitude, x is Longitude
          let lat = fb.location.y;
          let lng = fb.location.x;

          // Legacy percent-based data support logic (simple projection fallback)
          if (Math.abs(lat) <= 100 && Math.abs(lng) <= 100) {
              lat = DEFAULT_CENTER[0] + (fb.location.y - 50) * 0.0001;
              lng = DEFAULT_CENTER[1] + (fb.location.x - 50) * 0.0001;
          }

          // Custom Icon
          const getMarkerColor = (sentiment: string) => {
             if (sentiment === 'positive') return '#22c55e';
             if (sentiment === 'negative') return '#ef4444';
             return '#eab308';
          };
          
          const iconHtml = `
            <div style="
              background-color: ${getMarkerColor(fb.sentiment)};
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstance);
          
          // Popup
          const popupContent = `
            <div style="min-width: 200px; font-family: sans-serif;">
                <div style="font-weight: bold; margin-bottom: 4px; color: #1e293b;">${fb.category}</div>
                <div style="font-size: 13px; color: #475569; margin-bottom: 8px;">${fb.content}</div>
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="
                        display: inline-block;
                        padding: 2px 8px;
                        border-radius: 9999px;
                        font-size: 10px;
                        font-weight: 600;
                        text-transform: uppercase;
                        background-color: ${fb.sentiment === 'positive' ? '#dcfce7' : fb.sentiment === 'negative' ? '#fee2e2' : '#fef9c3'};
                        color: ${fb.sentiment === 'positive' ? '#166534' : fb.sentiment === 'negative' ? '#991b1b' : '#854d0e'};
                    ">
                        ${fb.sentiment}
                    </div>
                    <div style="font-size: 10px; color: #94a3b8;">${new Date(fb.timestamp).toLocaleDateString()}</div>
                </div>
            </div>
          `;

          marker.bindPopup(popupContent);
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
                 <p className="text-sm text-slate-500">Initializing Map...</p>
              </div>
          </div>
      )}

      {/* Interactive Controls Overlay */}
      {interactive && isMapLoaded && (
        <>
            {/* Search Bar (Top Center/Left) */}
            <div className="absolute top-4 left-4 right-16 md:right-auto md:w-80 z-[500]">
                <form onSubmit={handleSearch} className="relative shadow-md rounded-lg">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search city, street..."
                        className={`w-full p-3 pl-10 pr-10 rounded-lg outline-none border transition-all ${searchError ? 'border-red-400 bg-red-50 text-red-900 placeholder-red-400' : 'border-white bg-white/90 focus:bg-white text-slate-800'}`}
                    />
                    <div className="absolute left-3 top-3 text-slate-400">
                        <Search size={18} />
                    </div>
                    {searchQuery && (
                        <button 
                            type="button"
                            onClick={() => { setSearchQuery(''); setSearchError(false); }}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                    {isSearching && (
                        <div className="absolute right-10 top-3">
                             <Loader2 size={16} className="animate-spin text-indigo-500" />
                        </div>
                    )}
                </form>
            </div>

            {/* Map Tools (Top Right) */}
            <div className="absolute top-4 right-4 z-[500] flex flex-col space-y-2">
                {/* Locate Me */}
                <button 
                    onClick={handleManualLocate}
                    className="bg-white/90 p-2.5 rounded-lg shadow-md hover:bg-white text-slate-700 hover:text-indigo-600 transition-colors border border-slate-200"
                    title="Use My Location"
                >
                    {isLocating ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} className={userLocationMarkerRef.current ? "fill-indigo-500 text-indigo-600" : ""} />}
                </button>

                {/* View Toggle */}
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsSatellite(!isSatellite); }}
                    className="bg-white/90 p-2.5 rounded-lg shadow-md hover:bg-white text-slate-700 hover:text-indigo-600 transition-colors border border-slate-200"
                    title="Toggle Satellite View"
                >
                    {isSatellite ? <Layers size={20} /> : <Box size={20} />}
                </button>
            </div>
        </>
      )}

      <div ref={mapRef} className="w-full h-full z-0" />
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
      `}</style>
    </div>
  );
};

export default MapArea;