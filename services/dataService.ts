import { Feedback, AccountSetup } from '../types';

// Key for LocalStorage
const STORAGE_KEY_FEEDBACK = 'echosphere_feedback';
const STORAGE_KEY_ACCOUNT = 'echosphere_account';

// Initial Seed Data (using Standard Coords: x=Lng, y=Lat)
const SEED_FEEDBACK: Feedback[] = [
  // NYC Coords: Lat 40.7128, Lng -74.0060
  { id: '1', location: { x: -74.0060, y: 40.7128 }, content: 'More trash cans needed.', sentiment: 'neutral', category: 'Sanitation', timestamp: new Date(), votes: 5, summary: "Need bins", ecoImpactScore: 60, ecoImpactReasoning: "Reduces litter.", riskScore: 30 },
  { id: '2', location: { x: -74.0075, y: 40.7135 }, content: 'Dangerous pothole.', sentiment: 'negative', category: 'Infrastructure', timestamp: new Date(), votes: 12, summary: "Pothole fix", ecoImpactScore: 10, ecoImpactReasoning: "Safety issue.", riskScore: 85 },
  { id: '3', location: { x: -74.0050, y: 40.7115 }, content: 'Love the mural!', sentiment: 'positive', category: 'Culture', timestamp: new Date(), votes: 20, summary: "Nice mural", ecoImpactScore: 40, ecoImpactReasoning: "Cultural value.", riskScore: 5 },
];

export const dataService = {
  getFeedback: (): Feedback[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FEEDBACK);
      if (!stored) {
        // Initialize with seed data if empty
        return SEED_FEEDBACK;
      }
      // Need to convert date strings back to Date objects
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (e) {
      console.error("DB Load Error", e);
      return [];
    }
  },

  saveFeedback: (newFeedback: Feedback) => {
    const current = dataService.getFeedback();
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
  
  clearData: () => {
    localStorage.removeItem(STORAGE_KEY_FEEDBACK);
    localStorage.removeItem(STORAGE_KEY_ACCOUNT);
  }
};