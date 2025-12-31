
export const APP_CONFIG = {
  MAP: {
    DEFAULT_CENTER: { x: -118.2437, y: 34.0522 }, // Los Angeles (Default Fallback)
    DEFAULT_ZOOM: 13,
    TILES: {
      DARK: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
      LIGHT: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png', // Switched to B&W Positron tiles
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
    // Dynamic System Instruction to support i18n
    GET_SYSTEM_INSTRUCTION: (lang: string) => `Analyze the following public feedback for a city planning tool. 
      Output language: ${lang}.
      Tasks:
      1. Identify sentiment (positive/negative/neutral).
      2. Categorize the topic (Infrastructure, Safety, Recreation, Traffic, Sanitation, Sustainability, Culture).
      3. Provide a 5-10 word summary in ${lang}.
      4. Assign a Risk Score (0-100, 100=urgent).
      5. Assign an Eco-Impact Score (0-100) assessing if this suggestion helps the environment.
      6. Provide 1 sentence reasoning for the Eco-Impact in ${lang}.
      7. CRITICAL: Determine if this is a valid civic issue (potholes, safety, trash, parks, traffic) OR if it is irrelevant (commercial reviews, dating profiles, spam, general rants).
      Set isCivicIssue to true only for valid city/community issues.`,
      
    SURVEY_PROMPT: `Generate 5 engaging, short, and relevant feedback questions for a public engagement platform.`,
    REPORT_PROMPT: `You are an expert urban planning analyst. 
      Generate a concise executive summary (max 150 words) based on the following citizen feedback data.
      Highlight key trends, urgent risks, and opportunities for sustainability.`
  },
  I18N: {
    'en-US': {
      submitBtn: 'Submit Feedback',
      analyzing: 'Analyzing...',
      duplicateFound: 'Similar Report Found',
      upvoteInstead: 'Upvote Instead',
      describePlaceholder: 'Describe a pothole, broken light, safety hazard, or idea to improve the city...',
      addPhoto: 'Add Photo',
      voiceInput: 'Voice Input'
    },
    'es-ES': {
      submitBtn: 'Enviar Comentarios',
      analyzing: 'Analizando...',
      duplicateFound: 'Reporte Similar Encontrado',
      upvoteInstead: 'Votar a favor',
      describePlaceholder: 'Describa un bache, luz rota, peligro de seguridad o idea para mejorar la ciudad...',
      addPhoto: 'Añadir Foto',
      voiceInput: 'Entrada de Voz'
    },
    'fr-FR': {
      submitBtn: 'Envoyer',
      analyzing: 'Analyse en cours...',
      duplicateFound: 'Rapport Similaire Trouvé',
      upvoteInstead: 'Voter pour',
      describePlaceholder: 'Décrivez un nid-de-poule, une lumière cassée ou une idée pour la ville...',
      addPhoto: 'Ajouter une photo',
      voiceInput: 'Entrée Vocale'
    },
    'de-DE': {
        submitBtn: 'Feedback Senden',
        analyzing: 'Analysieren...',
        duplicateFound: 'Ähnlicher Bericht gefunden',
        upvoteInstead: 'Stattdessen hochvoten',
        describePlaceholder: 'Beschreiben Sie ein Schlagloch, eine kaputte Lampe oder eine Idee...',
        addPhoto: 'Foto hinzufügen',
        voiceInput: 'Spracheingabe'
    }
  }
};

export const getTranslation = (lang: string) => {
  // Simple fallback logic
  const shortLang = lang.split('-')[0]; // e.g., 'es' from 'es-MX'
  
  // Try exact match
  // @ts-ignore
  if (APP_CONFIG.I18N[lang]) return APP_CONFIG.I18N[lang];
  
  // Try partial match
  const partial = Object.keys(APP_CONFIG.I18N).find(k => k.startsWith(shortLang));
  // @ts-ignore
  if (partial) return APP_CONFIG.I18N[partial];

  // Default to English
  return APP_CONFIG.I18N['en-US'];
};