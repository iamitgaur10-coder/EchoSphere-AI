import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

/**
 * reliableGet: Tries to fetch config from Vite Environment or LocalStorage.
 * Note: In Vite, import.meta.env.VITE_* is replaced statically at build time.
 * We must access them directly (without aliases) for the replacement to work.
 */
const reliableGet = (key: string) => {
    // 1. Direct Vite Env Access (Required for Vercel/Vite)
    // We use try/catch to handle cases where import.meta might be undefined
    // but we DO NOT check 'import.meta.env &&' because that object often doesn't exist
    // at runtime, even if the variable replacement ("https://...") happened.
    try {
        if (key === 'VITE_SUPABASE_URL') {
            // @ts-ignore
            return import.meta.env.VITE_SUPABASE_URL || '';
        }
        if (key === 'VITE_SUPABASE_ANON_KEY') {
            // @ts-ignore
            return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
        }
        if (key === 'VITE_API_KEY') {
            // @ts-ignore
            return import.meta.env.VITE_API_KEY || '';
        }
    } catch (e) {
        // Fallback for environments where import.meta is strictly forbidden
        // console.warn("EchoSphere: Error accessing import.meta.env", e);
    }

    // 2. Check process.env (Standard Node/System & Index.html Polyfill)
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            // @ts-ignore
            return process.env[key];
        }
    } catch (e) {}

    // 3. Fallback to LocalStorage (Setup Wizard)
    if (typeof window !== 'undefined') {
        return localStorage.getItem(key) || '';
    }
    return '';
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

/**
 * Saves configuration to browser storage and reloads the app to apply changes.
 * This allows the app to be set up via the UI without a .env file.
 */
export const saveAppConfiguration = (url: string, key: string, aiKey: string) => {
    if (!url || !key) return;
    localStorage.setItem('VITE_SUPABASE_URL', url);
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', key);
    if (aiKey) localStorage.setItem('VITE_API_KEY', aiKey);
    
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