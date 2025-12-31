import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
    
    // Explicitly set the redirect URL to the current window's origin.
    // This ensures that when deployed, the email link points to the production URL,
    // overriding the default "Site URL" (often localhost) in Supabase settings.
    const { data, error } = await supabase!.auth.signUp({ 
        email, 
        password,
        options: {
            emailRedirectTo: window.location.origin
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