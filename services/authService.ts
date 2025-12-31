import { supabase, isSupabaseConfigured, getSiteUrl } from '../lib/supabase';

export const authService = {
  signIn: async (email: string, password: string): Promise<{ user: any; error: any }> => {
    if (!isSupabaseConfigured()) {
       return { user: null, error: { message: "System Error: Database connection required." } };
    }
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    return { user: data.user, error };
  },

  signUp: async (email: string, password: string): Promise<{ user: any; error: any }> => {
    if (!isSupabaseConfigured()) {
        return { user: null, error: { message: "System Error: Database connection required." } };
    }
    
    // Determine the redirect URL:
    // 1. Use VITE_SITE_URL if configured (Best for Production)
    // 2. Fallback to window.location.origin (Best for Localhost/Auto-deploy)
    // NOTE: This URL must be whitelisted in Supabase Dashboard > Auth > URL Configuration > Redirect URLs
    let redirectUrl = getSiteUrl();
    
    if (!redirectUrl) {
        redirectUrl = window.location.origin;
    }

    // Ensure no trailing slash for consistency
    if (redirectUrl.endsWith('/')) {
        redirectUrl = redirectUrl.slice(0, -1);
    }
    
    console.log(`EchoSphere: Signing up with redirect URL: ${redirectUrl}`);

    const { data, error } = await supabase!.auth.signUp({ 
        email, 
        password,
        options: {
            emailRedirectTo: redirectUrl
        } 
    });
    
    return { user: data.user, error };
  },

  signOut: async () => {
    if (isSupabaseConfigured()) await supabase!.auth.signOut();
  },

  getCurrentUser: async () => {
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase!.auth.getUser();
    return data.user;
  }
};