import React, { useState, useEffect, useRef } from 'react';
import { Box, Layers, Loader2, Navigation, Search, X, Trash2, HardHat, ShieldAlert, Car, Leaf, Palette, HelpCircle } from 'lucide-react';
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

// Map the Lucide icons to the keys used in APP_CONFIG.CATEGORIES
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
                    html: `<div class="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs border-2 border-white shadow-md">${count}</div>`,
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

  // -- Watch Center Updates --
  useEffect(() => {
      if (mapInstance && center) {
          mapInstance.flyTo([center.y, center.x], APP_CONFIG.MAP.DEFAULT_ZOOM);
      }
  }, [center, mapInstance]);

  // -- Watch Dark Mode --
  useEffect(() => {
      if (mapInstance && layers) {
          if (isSatellite) {
              layers.satellite.addTo(mapInstance);
          } else {
              mapInstance.removeLayer(layers.satellite);
              if (isDarkMode) {
                  layers.dark.addTo(mapInstance);
                  mapInstance.removeLayer(layers.light);
              } else {
                  layers.light.addTo(mapInstance);
                  mapInstance.removeLayer(layers.dark);
              }
          }
      }
  }, [isDarkMode, mapInstance, layers, isSatellite]);

  // -- Render Markers with Icons --
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

          // Find Icon based on category
          const catConfig = APP_CONFIG.CATEGORIES.find(c => c.name === fb.category);
          const IconComponent = catConfig ? ICON_MAP[catConfig.icon] : Box;
          const color = catConfig ? catConfig.color : '#f97316'; // Default orange

          // Render icon to string for Leaflet
          const iconSvgString = renderToString(
            <div className="flex items-center justify-center w-full h-full text-white">
                <IconComponent size={14} />
            </div>
          );

          const iconHtml = `
            <div class="relative group cursor-pointer transition-transform hover:scale-110">
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style="background-color: ${color}">
                    ${iconSvgString}
                </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-marker', // Needs CSS in index.html to reset styles
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });

          const marker = L.marker([lat, lng], { icon: customIcon });
          
          const popupContent = `
            <div class="font-sans min-w-[200px] p-1 text-zinc-800">
                <div class="font-bold text-xs mb-1 uppercase" style="color: ${color}">${cleanCategory}</div>
                <div class="text-xs mb-2 leading-snug">"${cleanContent}"</div>
                <div class="flex items-center justify-between text-[10px] text-zinc-400 font-mono border-t pt-1">
                     <span>${new Date(fb.timestamp).toLocaleDateString()}</span>
                     <span class="${fb.status === 'resolved' ? 'text-green-600 font-bold' : ''}">${fb.status}</span>
                </div>
            </div>
          `;

          marker.bindPopup(popupContent, { className: isDarkMode ? 'dark-popup' : 'light-popup' });
          return marker;
      });

      clusterGroupRef.current.addLayers(newMarkers);
  }, [feedbackList, mapInstance, activeFilter, isDarkMode]);


  // Handle Satellite Toggle
  const toggleSatellite = () => setIsSatellite(!isSatellite);

  // Handle Search
  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery) return;
      
      setIsSearching(true);
      setSearchError(false);
      const res = await searchLocation(searchQuery);
      
      if (res && mapInstance) {
          mapInstance.flyTo([res.lat, res.lon], 16);
          // Show temporary search result marker if needed
      } else {
          setSearchError(true);
      }
      setIsSearching(false);
  };

  // Handle User Location
  const handleLocateMe = () => {
      if (!mapInstance) return;
      setIsLocating(true);
      
      mapInstance.locate({ setView: true, maxZoom: 16, timeout: 10000 });
      
      mapInstance.on('locationfound', (e: LeafletLocationEvent) => {
          setIsLocating(false);
          // Add blue dot
          if (userLocationMarkerRef.current) mapInstance.removeLayer(userLocationMarkerRef.current);
          const radius = e.accuracy / 2;
          
          userLocationMarkerRef.current = L.marker([e.latlng.lat, e.latlng.lng], {
              icon: L.divIcon({
                  html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
                  className: 'custom-marker',
                  iconSize: [16, 16]
              })
          }).addTo(mapInstance);
      });

      mapInstance.on('locationerror', (e: LeafletErrorEvent) => {
          setIsLocating(false);
          if (onError) onError(e.message);
      });
  };

  return (
    <div className="relative w-full h-full bg-zinc-200 dark:bg-zinc-900 overflow-hidden group transition-colors duration-300">
      {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 z-10 pointer-events-none">
              <Loader2 className="animate-spin text-orange-600" size={32} />
          </div>
      )}
      
      {interactive && (
           <div className="absolute top-24 md:top-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px] z-[500] pointer-events-auto">
               <form onSubmit={handleSearch} className="relative group">
                   <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${searchError ? 'text-red-500' : 'text-zinc-400'}`}>
                       {searchError ? <X size={16} /> : <Search size={16} />}
                   </div>
                   <input
                       type="text"
                       className={`block w-full pl-10 pr-3 py-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border ${searchError ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-700'} rounded-full leading-5 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm shadow-xl text-zinc-900 dark:text-white transition-all`}
                       placeholder="Search address..."
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                   />
                   {isSearching && <div className="absolute inset-y-0 right-3 flex items-center"><Loader2 size={14} className="animate-spin text-orange-500"/></div>}
               </form>
           </div>
      )}

      {interactive && (
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-[400]">
              <button 
                  onClick={handleLocateMe}
                  className="bg-white dark:bg-zinc-900 p-2.5 rounded-full shadow-lg text-zinc-600 dark:text-zinc-300 hover:text-orange-600 hover:scale-110 transition-all border border-zinc-200 dark:border-zinc-800"
                  title="Locate Me"
              >
                  {isLocating ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
              </button>
              <button 
                  onClick={toggleSatellite}
                  className={`p-2.5 rounded-full shadow-lg transition-all border border-zinc-200 dark:border-zinc-800 ${isSatellite ? 'bg-orange-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-orange-600'}`}
                  title="Satellite View"
              >
                  <Layers size={20} />
              </button>
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