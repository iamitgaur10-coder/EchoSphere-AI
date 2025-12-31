import { Feedback, AccountSetup } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Key for LocalStorage Fallback
const STORAGE_KEY_FEEDBACK = 'echosphere_feedback';
const STORAGE_KEY_ACCOUNT = 'echosphere_account';

// Initial Seed Data
const SEED_FEEDBACK: Feedback[] = [
  { id: '1', location: { x: -74.0060, y: 40.7128 }, content: 'More trash cans needed.', sentiment: 'neutral', category: 'Sanitation', timestamp: new Date(), votes: 5, summary: "Need bins", ecoImpactScore: 60, ecoImpactReasoning: "Reduces litter.", riskScore: 30 },
  { id: '2', location: { x: -74.0075, y: 40.7135 }, content: 'Dangerous pothole.', sentiment: 'negative', category: 'Infrastructure', timestamp: new Date(), votes: 12, summary: "Pothole fix", ecoImpactScore: 10, ecoImpactReasoning: "Safety issue.", riskScore: 85 },
];

export const dataService = {
  getFeedback: async (): Promise<Feedback[]> => {
    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!
        .from('feedback')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          location: typeof item.location === 'string' ? JSON.parse(item.location) : item.location
        }));
      }
    }

    // 2. Fallback to LocalStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FEEDBACK);
      if (!stored) return SEED_FEEDBACK;
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (e) {
      return [];
    }
  },

  saveFeedback: async (newFeedback: Feedback): Promise<Feedback[]> => {
    // 1. Try Supabase
    if (isSupabaseConfigured()) {
        const { error } = await supabase!.from('feedback').insert({
            id: newFeedback.id,
            location: newFeedback.location, // Supabase handles JSONB
            content: newFeedback.content,
            sentiment: newFeedback.sentiment,
            category: newFeedback.category,
            "imageUrl": newFeedback.imageUrl,
            timestamp: newFeedback.timestamp.toISOString(),
            // Store other AI fields if you add columns for them in Supabase
        });
        if (error) console.error("Supabase Save Error:", error);
    }

    // 2. Always update LocalStorage (for UI Optimistic Update + Fallback)
    // In a real app, we would re-fetch from DB, but for speed we append locally
    let current: Feedback[] = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY_FEEDBACK);
        if (stored) {
             const parsed = JSON.parse(stored);
             current = parsed.map((item: any) => ({ ...item, timestamp: new Date(item.timestamp) }));
        } else {
            current = SEED_FEEDBACK;
        }
    } catch(e) {}
    
    const updated = [newFeedback, ...current];
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(updated));
    return updated;
  },

  getAccount: (): AccountSetup | null => {
    const stored = localStorage.getItem(STORAGE_KEY_ACCOUNT);
    return stored ? JSON.parse(stored) : null;
  },

  saveAccount: (account: AccountSetup) => {
    localStorage.setItem(STORAGE_KEY_ACCOUNT, JSON.stringify(account));
  },
  
  // New helper to check if we are in production mode
  isProduction: () => isSupabaseConfigured()
};