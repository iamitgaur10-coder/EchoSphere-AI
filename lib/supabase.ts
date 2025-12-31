import { createClient } from '@supabase/supabase-js';

// Helper to reliably get env vars in various environments (Vite, Webpack, Vercel)
const getEnvVar = (key: string) => {
  // Check import.meta.env (Standard for Vite)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // Check process.env (Standard for Node/Webpack/Vercel System Vars)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Create a single supabase client for interacting with your database
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;