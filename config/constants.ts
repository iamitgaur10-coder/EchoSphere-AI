export const APP_CONFIG = {
  MAP: {
    DEFAULT_CENTER: { x: -118.2437, y: 34.0522 }, // Los Angeles (Default Fallback)
    DEFAULT_ZOOM: 13,
    TILES: {
      DARK: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
      LIGHT: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      SATELLITE: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    }
  },
  CATEGORIES: [
    { name: 'Sanitation', color: '#ef4444', icon: 'Trash2' },
    { name: 'Infrastructure', color: '#f97316', icon: 'HardHat' },
    { name: 'Safety', color: '#eab308', icon: 'ShieldAlert' },
    { name: 'Traffic', color: '#3b82f6', icon: 'Car' },
    { name: 'Sustainability', color: '#22c55e', icon: 'Leaf' },
    { name: 'Culture', color: '#d946ef', icon: 'Palette' },
    { name: 'General', color: '#94a3b8', icon: 'HelpCircle' }
  ],
  AI: {
    SYSTEM_INSTRUCTION: `Analyze the following public feedback for a city planning tool. 
      Tasks:
      1. Identify sentiment (positive/negative/neutral).
      2. Categorize the topic (Infrastructure, Safety, Recreation, Traffic, Sanitation, Sustainability, Culture).
      3. Provide a 5-10 word summary.
      4. Assign a Risk Score (0-100, 100=urgent).
      5. Assign an Eco-Impact Score (0-100) assessing if this suggestion helps the environment (e.g. planting trees = high, more parking = low).
      6. Provide 1 sentence reasoning for the Eco-Impact.`,
    SURVEY_PROMPT: `Generate 5 engaging, short, and relevant feedback questions for a public engagement platform.`,
    REPORT_PROMPT: `You are an expert urban planning analyst. 
      Generate a concise executive summary (max 150 words) based on the following citizen feedback data.
      Highlight key trends, urgent risks, and opportunities for sustainability.`
  }
};