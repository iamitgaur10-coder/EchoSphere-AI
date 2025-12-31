export type ViewState = 'landing' | 'public' | 'admin' | 'wizard';

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