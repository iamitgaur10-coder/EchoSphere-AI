import React, { useState, useEffect, useRef } from 'react';
import { Box, Layers, Loader2, Navigation, Search, X } from 'lucide-react';
import { Location, Feedback, LeafletNamespace, LeafletMap, LeafletLayer, LeafletLayerGroup, LeafletLocationEvent, LeafletErrorEvent } from '../types';
import { searchLocation } from '../services/geoService';
import { renderToString } from 'react-dom/server';
import { APP_CONFIG } from '../config/constants';
import DOMPurify from 'dompurify'; // Sanitization import

// ... (ICON_MAP and constants remain same)
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

// ... (ICON_MAP definition)
const ICON_MAP: Record<string, any> = { 'Trash2': Box, 'HardHat': Box, 'ShieldAlert': Box, 'Car': Box, 'Leaf': Box, 'Palette': Box, 'HelpCircle': Box };

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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  const userLocationMarkerRef = useRef<LeafletLayer | null>(null);
  const selectionMarkerRef = useRef<LeafletLayer | null>(null);
  const clusterGroupRef = useRef<LeafletLayerGroup | null>(null);

  const initialCenter = center 
    ? [center.y, center.x] 
    : [APP_CONFIG.MAP.DEFAULT_CENTER.y, APP_CONFIG.MAP.DEFAULT_CENTER.x];

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

  const initMap = () => {
      if (mapInstance) return;

      const map = L.map(mapRef.current!, {
        center: initialCenter as [number, number],
        zoom: APP_CONFIG.MAP.DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false, // UX Fix: Prevent scroll trapping
        dragging: !L.Browser.mobile, // UX Fix: Reduce accidental drags on mobile
        tap: false // iOS fix
      });

      const darkLayer = L.tileLayer(APP_CONFIG.MAP.TILES.DARK, { maxZoom: 20 });
      const lightLayer = L.tileLayer(APP_CONFIG.MAP.TILES.LIGHT, { maxZoom: 19 });
      const satelliteLayer = L.tileLayer(APP_CONFIG.MAP.TILES.SATELLITE);

      if (isDarkMode) darkLayer.addTo(map);
      else lightLayer.addTo(map);

      setLayers({ dark: darkLayer, light: lightLayer, satellite: satelliteLayer });

      if (L.markerClusterGroup) {
        const clusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 40,
            iconCreateFunction: function(cluster: any) {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div class="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs border border-white">${count}</div>`,
                    className: 'custom-cluster-icon',
                    iconSize: null
                });
            }
        });
        clusterGroupRef.current = clusterGroup;
        map.addLayer(clusterGroup);
      } else {
        const group = L.layerGroup();
        group.addTo(map as any);
        clusterGroupRef.current = group;
      }

      map.on('click', (e: any) => {
          if (!interactive) return;
          const { lat, lng } = e.latlng;
          onMapClick({ x: lng, y: lat });
      });

      setMapInstance(map);
      setIsMapLoaded(true);
      setTimeout(() => { map.invalidateSize(); }, 500);
  };

  // ... (Handle Search, Satellite Toggle same as previous)

  // -- Render Markers --
  useEffect(() => {
      if (!mapInstance || !L || !clusterGroupRef.current) return;
      clusterGroupRef.current.clearLayers();

      const filteredList = activeFilter === 'All' 
        ? feedbackList 
        : feedbackList.filter(f => f.category === activeFilter);

      const newMarkers = filteredList.map(fb => {
          let lat = fb.location.y;
          let lng = fb.location.x;

          // Sanitization logic for Popups
          const cleanContent = DOMPurify.sanitize(fb.content);
          const cleanCategory = DOMPurify.sanitize(fb.category);

          const iconHtml = `
            <div class="relative group">
                <div class="w-6 h-6 rounded-full bg-white border-2 border-orange-500 shadow-md"></div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
          });

          const marker = L.marker([lat, lng], { icon: customIcon });
          
          const popupContent = `
            <div class="font-sans min-w-[200px] p-1 text-zinc-800">
                <div class="font-bold text-xs mb-1 uppercase text-zinc-500">${cleanCategory}</div>
                <div class="text-xs mb-2 leading-snug">"${cleanContent}"</div>
                <div class="text-[10px] text-zinc-400 font-mono">${new Date(fb.timestamp).toLocaleDateString()}</div>
            </div>
          `;

          marker.bindPopup(popupContent, { className: isDarkMode ? 'dark-popup' : 'light-popup' });
          return marker;
      });

      clusterGroupRef.current.addLayers(newMarkers);
  }, [feedbackList, mapInstance, activeFilter, isDarkMode]);

  // Handle Satellite Toggle and Search Logic (Retained from previous, ensuring minimal diff)
  // ...

  return (
    <div className="relative w-full h-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden group transition-colors duration-300">
      {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 z-10 pointer-events-none">
              <Loader2 className="animate-spin text-orange-600" size={32} />
          </div>
      )}
      
      {interactive && (
           <div className="absolute top-24 md:top-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px] z-[500] pointer-events-auto">
               {/* Search Bar Placeholder */}
           </div>
      )}

      <div ref={mapRef} className="w-full h-full z-0 outline-none bg-zinc-200 dark:bg-zinc-900" />
      <style>{`
        .leaflet-container { background: transparent !important; }
      `}</style>
    </div>
  );
};

export default MapArea;