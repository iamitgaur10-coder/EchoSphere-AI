export type ViewState = 'landing' | 'public' | 'admin' | 'wizard';

export interface Location {
  x: number; // Longitude (e.g. -74.0060)
  y: number; // Latitude (e.g. 40.7128)
}

export interface Feedback {
  id: string;
  location: Location;
  content: string;
  timestamp: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  summary?: string;
  authorName?: string;
  votes: number;
  attachments?: ('image' | 'video' | 'audio')[];
  ecoImpactScore?: number; // 0-100, where 100 is high positive impact
  ecoImpactReasoning?: string;
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