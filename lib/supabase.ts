import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION COMPLETE
// Project: https://hnaihxmfrnzsoblcudhe.supabase.co
// ------------------------------------------------------------------
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hnaihxmfrnzsoblcudhe.supabase.co';

// Your provided Publishable Key (Safe for public/frontend use)
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_wOamHu58UreJnCTz5tHfUw_bmG7_M03';

// Create a single supabase client for interacting with your database
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;