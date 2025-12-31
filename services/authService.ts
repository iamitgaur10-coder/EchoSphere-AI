import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const authService = {
  // Login with Email
  signIn: async (email: string, password: string): Promise<{ user: any; error: any }> => {
    if (!isSupabaseConfigured()) {
      // Fallback for demo mode
      if (email === 'admin' && password === 'admin') {
        return { user: { id: 'demo-admin', email: 'admin@echosphere.ai' }, error: null };
      }
      return { user: null, error: { message: "Demo Mode: Use 'admin' / 'admin' or Register to continue" } };
    }
    
    // Real Supabase Login
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    return { user: data.user, error };
  },

  // Sign Up (For new tenants)
  signUp: async (email: string, password: string): Promise<{ user: any; error: any }> => {
    if (!isSupabaseConfigured()) {
        // Enable Mock Registration for Local/Demo Mode
        // This allows the UI flow (Wizard, etc.) to be tested without a backend.
        return { 
            user: { 
                id: `mock-user-${Date.now()}`, 
                email: email,
                role: 'authenticated'
            }, 
            error: null 
        };
    }

    const { data, error } = await supabase!.auth.signUp({ email, password });
    return { user: data.user, error };
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      await supabase!.auth.signOut();
    }
  },

  getCurrentUser: async () => {
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase!.auth.getUser();
    return data.user;
  }
};