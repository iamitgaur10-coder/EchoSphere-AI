import React, { useState, useEffect, useRef } from 'react';
import { Box, Layers, Loader2 } from 'lucide-react';
import { Location, Feedback } from '../types';

declare var L: any;

interface MapAreaProps {
  feedbackList: Feedback[];
  onMapClick: (loc: Location) => void;
  interactive?: boolean;
}

// Default Center (New York City)
const DEFAULT_CENTER = [40.7128, -74.0060];

const MapArea: React.FC<MapAreaProps> = ({ feedbackList, onMapClick, interactive = true }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any | null>(null);
  const [layers, setLayers] = useState<any | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const markersRef = useRef<any[]>([]);

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

  const initMap = () => {
      if (mapInstance) return; // Already initialized

      const map = L.map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 16,
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

      setMapInstance(map);
      setIsMapLoaded(true);

      // Fix for Leaflet partial rendering issues on load
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
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
          let lat = fb.location.y;
          let lng = fb.location.x;

          // Legacy percent-based data support logic (simple projection)
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
            "></div>
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

      {/* Layer Toggle Control */}
      {interactive && isMapLoaded && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsSatellite(!isSatellite); }}
          className="absolute top-4 right-4 z-[500] bg-white/90 p-2 rounded-lg shadow-md hover:bg-white text-slate-700 font-medium text-xs flex items-center space-x-2 border border-slate-200"
        >
          {isSatellite ? <Layers size={16} /> : <Box size={16} />}
          <span>{isSatellite ? "Street View" : "Satellite"}</span>
        </button>
      )}

      <div ref={mapRef} className="w-full h-full z-0" />
    </div>
  );
};

export default MapArea;