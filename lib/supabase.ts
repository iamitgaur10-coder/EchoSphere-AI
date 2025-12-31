import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

// FALLBACK KEYS (As provided by user for specific deployment)
// In production, these should ideally be environment variables.
const FALLBACK_ENV = {
    // This is the URL you provided:
    VITE_SUPABASE_URL: "https://hnaihxmfrnzsoblcudhe.supabase.co",
    
    // Ensure these keys are also correct from your Supabase Dashboard > Settings > API
    VITE_SUPABASE_ANON_KEY: "sb_publishable_wOamHu58UreJnCTz5tHfUw_bmG7_M03",
    VITE_API_KEY: "AIzaSyArN7otlgUTAp-Bf_QPM9dDCnAHp2lOtsc",
    VITE_SITE_URL: "" // Optional: Set this to your production URL (e.g. https://myapp.vercel.app)
};

// Helper to clean values (remove accidental quotes from build tools)
const clean = (val: string | undefined) => {
    if (!val) return '';
    return val.replace(/^['"]|['"]$/g, '').trim();
};

/**
 * reliableGet: Tries to fetch config from Vite Environment, Process Env, LocalStorage, or Fallback.
 */
const reliableGet = (key: string) => {
    let value = '';

    // 1. Direct Vite Env Access (Static Replacement)
    try {
        if (key === 'VITE_SUPABASE_URL') {
            // @ts-ignore
            value = import.meta.env.VITE_SUPABASE_URL;
        } else if (key === 'VITE_SUPABASE_ANON_KEY') {
            // @ts-ignore
            value = import.meta.env.VITE_SUPABASE_ANON_KEY;
        } else if (key === 'VITE_API_KEY') {
            // @ts-ignore
            value = import.meta.env.VITE_API_KEY;
        } else if (key === 'VITE_SITE_URL') {
            // @ts-ignore
            value = import.meta.env.VITE_SITE_URL;
        }
    } catch (e) {}

    // 2. Fallback to process.env
    if (!value) {
        try {
            // @ts-ignore
            if (typeof process !== 'undefined' && process.env && process.env[key]) {
                // @ts-ignore
                value = process.env[key];
            }
        } catch (e) {}
    }

    // 3. Fallback to LocalStorage
    if (!value && typeof window !== 'undefined') {
        value = localStorage.getItem(key) || '';
    }

    // 4. Fallback to Hardcoded (Last Resort)
    if (!value && FALLBACK_ENV[key as keyof typeof FALLBACK_ENV]) {
        value = FALLBACK_ENV[key as keyof typeof FALLBACK_ENV];
    }

    return clean(value);
}

const supabaseUrl = reliableGet('VITE_SUPABASE_URL');
const supabaseKey = reliableGet('VITE_SUPABASE_ANON_KEY');

// Initialize Client if keys exist
export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'undefined') {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.error("EchoSphere: Failed to initialize Supabase client", e);
    }
}

export const isSupabaseConfigured = () => !!supabase;

export const getGeminiApiKey = () => reliableGet('VITE_API_KEY');
export const getSiteUrl = () => reliableGet('VITE_SITE_URL');

export const getEnvDebugInfo = () => {
    const url = reliableGet('VITE_SUPABASE_URL');
    const key = reliableGet('VITE_SUPABASE_ANON_KEY');
    const ai = reliableGet('VITE_API_KEY');
    const site = reliableGet('VITE_SITE_URL');
    
    return {
        urlStatus: url ? (url.length > 10 ? 'Configured' : 'Too Short') : 'Missing',
        keyStatus: key ? 'Configured' : 'Missing',
        aiStatus: ai ? 'Configured' : 'Missing',
        siteUrlStatus: site ? 'Configured' : 'Auto-detect'
    };
};

export const getFallbackConfig = () => ({
    url: FALLBACK_ENV.VITE_SUPABASE_URL,
    key: FALLBACK_ENV.VITE_SUPABASE_ANON_KEY,
    aiKey: FALLBACK_ENV.VITE_API_KEY
});

/**
 * Saves configuration to browser storage and reloads the app to apply changes.
 */
export const saveAppConfiguration = (url: string, key: string, aiKey: string) => {
    if (!url || !key) return;
    localStorage.setItem('VITE_SUPABASE_URL', clean(url));
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', clean(key));
    if (aiKey) localStorage.setItem('VITE_API_KEY', clean(aiKey));
    
    // Hard reload to ensure fresh module initialization with new keys
    window.location.reload();
};

/**
 * Clears local configuration
 */
export const resetAppConfiguration = () => {
    localStorage.removeItem('VITE_SUPABASE_URL');
    localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
    localStorage.removeItem('VITE_API_KEY');
    localStorage.removeItem('VITE_SITE_URL');
    window.location.reload();
};