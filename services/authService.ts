import { supabase, isSupabaseConfigured } from '../lib/supabase';

const isProduction = () => {
  // @ts-ignore
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) || 
         (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production');
};

export const authService = {
  // Login with Email
  signIn: async (email: string, password: string): Promise<{ user: any; error: any }> => {
    if (!isSupabaseConfigured()) {
      // STRICT: Disable demo login in production builds if Supabase isn't configured,
      // though typically Supabase IS configured in production.
      if (isProduction()) {
         return { user: null, error: { message: "Configuration Error: Database connection required." } };
      }

      // Fallback for local development/demo
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
        if (isProduction()) {
           return { user: null, error: { message: "Registration unavailable." } };
        }

        // Enable Mock Registration for Local/Demo Mode
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