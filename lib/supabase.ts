import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

// Helper to clean values (remove accidental quotes from build tools)
const clean = (val: string | undefined) => {
    if (!val) return '';
    return val.replace(/^['"]|['"]$/g, '').trim();
};

/**
 * reliableGet: Tries to fetch config from Vite Environment or LocalStorage.
 * Note: In Vite, import.meta.env.VITE_* is replaced statically at build time.
 */
const reliableGet = (key: string) => {
    let value = '';

    // 1. Direct Vite Env Access
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
        }
    } catch (e) {}

    // 2. Fallback to process.env (Standard Node/System)
    if (!value) {
        try {
            // @ts-ignore
            if (typeof process !== 'undefined' && process.env && process.env[key]) {
                // @ts-ignore
                value = process.env[key];
            }
        } catch (e) {}
    }

    // 3. Fallback to LocalStorage (Setup Wizard)
    if (!value && typeof window !== 'undefined') {
        value = localStorage.getItem(key) || '';
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

export const getEnvDebugInfo = () => {
    const url = reliableGet('VITE_SUPABASE_URL');
    const key = reliableGet('VITE_SUPABASE_ANON_KEY');
    const ai = reliableGet('VITE_API_KEY');
    
    return {
        urlStatus: url ? (url.length > 10 ? 'Configured' : 'Too Short') : 'Missing',
        keyStatus: key ? 'Configured' : 'Missing',
        aiStatus: ai ? 'Configured' : 'Missing'
    };
};

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
    window.location.reload();
};