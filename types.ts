
export type ViewState = 'landing' | 'public' | 'admin' | 'wizard' | 'content';

export interface Location {
  x: number; // Longitude (e.g. -74.0060)
  y: number; // Latitude (e.g. 40.7128)
}

export interface Organization {
  id: string;
  name: string;
  slug: string; // Unique ID (e.g. 'nyc')
  center: Location;
  focusArea: string;
}

export interface Feedback {
  id: string;
  organizationId?: string; // Link to specific tenant
  location: Location;
  content: string;
  timestamp: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  summary?: string;
  authorName?: string;
  votes: number;
  attachments?: ('image' | 'video' | 'audio')[];
  imageUrl?: string; 
  ecoImpactScore?: number; 
  ecoImpactReasoning?: string;
  riskScore?: number;
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}

export interface AnalysisResponse {
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  summary: string;
  riskScore: number;
  ecoImpactScore: number;
  ecoImpactReasoning: string;
}

export interface AccountSetup {
  organizationName: string;
  regionCode: string; // e.g. "NYC"
  focusArea: string; // e.g. "Urban Planning"
  center: Location;
  questions: string[];
}

// --- TYPE SAFETY: Leaflet & GenAI Interfaces ---

export interface GenAIPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

// Minimal Leaflet Definitions to replace 'any'
export interface LeafletMap {
  flyTo: (coords: [number, number], zoom: number) => void;
  removeLayer: (layer: LeafletLayer) => void;
  addLayer: (layer: LeafletLayer) => void;
  hasLayer: (layer: LeafletLayer) => boolean;
  on: (event: string, callback: (e: any) => void) => void;
  locate: (options: { setView: boolean; maxZoom: number; timeout?: number }) => void;
  invalidateSize: () => void;
}

export interface LeafletLayer {
  addTo: (map: LeafletMap | LeafletLayerGroup) => LeafletLayer;
  bindPopup: (content: string, options?: any) => LeafletLayer;
  openPopup: () => void;
  remove: () => void;
}

export interface LeafletLayerGroup extends LeafletLayer {
  clearLayers: () => void;
  addLayers: (layers: LeafletLayer[]) => void;
  getChildCount: () => number;
}

export interface LeafletIconOptions {
  html: string;
  className: string;
  iconSize: [number, number] | null;
  iconAnchor?: [number, number];
  popupAnchor?: [number, number];
}

export interface LeafletLocationEvent {
  latlng: { lat: number; lng: number };
  accuracy: number;
}

export interface LeafletErrorEvent {
  message: string;
}

// Global L namespace interface
export interface LeafletNamespace {
  map: (element: HTMLElement, options?: any) => LeafletMap;
  tileLayer: (url: string, options?: any) => LeafletLayer;
  marker: (coords: [number, number], options?: any) => LeafletLayer;
  divIcon: (options: LeafletIconOptions) => any;
  markerClusterGroup?: (options?: any) => LeafletLayerGroup;
  layerGroup: () => LeafletLayerGroup;
}