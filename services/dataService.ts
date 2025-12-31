import { Feedback, AccountSetup, Organization } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Key for LocalStorage Fallback
const STORAGE_KEY_FEEDBACK = 'echosphere_feedback';
const STORAGE_KEY_ACCOUNT = 'echosphere_account';
const STORAGE_KEY_CURRENT_ORG_ID = 'echosphere_current_org_id';

export const dataService = {
  // --- ORGANIZATION MANAGEMENT ---
  
  createOrganization: async (setup: AccountSetup): Promise<Organization | null> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!
        .from('organizations')
        .insert({
          name: setup.organizationName,
          slug: setup.regionCode.toLowerCase(),
          center: setup.center,
          focus_area: setup.focusArea
        })
        .select()
        .single();
      
      if (error) {
        console.error("Org Creation Error:", error);
        return null;
      }
      
      // Save ID locally to persist session
      localStorage.setItem(STORAGE_KEY_CURRENT_ORG_ID, data.id);
      return data as Organization;
    }

    // Local Fallback
    const newOrg: Organization = {
      id: 'local-org-' + Date.now(),
      name: setup.organizationName,
      slug: setup.regionCode,
      center: setup.center,
      focusArea: setup.focusArea
    };
    localStorage.setItem(STORAGE_KEY_ACCOUNT, JSON.stringify(newOrg));
    localStorage.setItem(STORAGE_KEY_CURRENT_ORG_ID, newOrg.id);
    return newOrg;
  },

  getOrganizationBySlug: async (slug: string): Promise<Organization | null> => {
     if (isSupabaseConfigured()) {
        const { data, error } = await supabase!
        .from('organizations')
        .select('*')
        .eq('slug', slug.toLowerCase())
        .single();
        
        if (data) return data as Organization;
        if (error) console.error("Error fetching org by slug:", error);
     }
     return null;
  },

  getCurrentOrganization: async (): Promise<Organization | null> => {
    // 1. Priority: Check URL Query Param (e.g. ?org=nyc)
    const params = new URLSearchParams(window.location.search);
    const urlSlug = params.get('org');

    if (urlSlug && isSupabaseConfigured()) {
        const org = await dataService.getOrganizationBySlug(urlSlug);
        if (org) {
            // Update session if we found a valid org from URL
            localStorage.setItem(STORAGE_KEY_CURRENT_ORG_ID, org.id);
            return org;
        }
    }

    // 2. Check LocalStorage Session
    const orgId = localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);
    
    if (isSupabaseConfigured() && orgId) {
      const { data } = await supabase!
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
        
      if (data) return data as Organization;
    }

    // 3. Fallback to LocalStorage (Legacy/Offline)
    const stored = localStorage.getItem(STORAGE_KEY_ACCOUNT);
    return stored ? JSON.parse(stored) : null;
  },

  // --- FEEDBACK MANAGEMENT ---

  // Updated to support pagination
  getFeedback: async (limit: number = 50, offset: number = 0): Promise<Feedback[]> => {
    // Ensure we have the correct ID (re-run logic to be safe)
    let orgId = localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);
    
    // If no ID in storage, try resolving current org again (handles URL params case)
    if (!orgId) {
        const org = await dataService.getCurrentOrganization();
        if (org) orgId = org.id;
    }

    // 1. Try Supabase with Pagination
    if (isSupabaseConfigured() && orgId) {
      const { data, error } = await supabase!
        .from('feedback')
        .select('*')
        .eq('organization_id', orgId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1); // Supabase range is inclusive
      
      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          organizationId: item.organization_id,
          imageUrl: item.image_url,
          ecoImpactScore: item.eco_impact_score,
          riskScore: item.risk_score,
          ecoImpactReasoning: item.eco_impact_reasoning,
          timestamp: new Date(item.timestamp),
          location: typeof item.location === 'string' ? JSON.parse(item.location) : item.location
        }));
      }
    }

    // 2. Fallback to LocalStorage (with simplified slicing)
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FEEDBACK);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      // Sort first to mimic DB behavior
      const sorted = parsed.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Filter locally based on simple range
      const sliced = sorted.slice(offset, offset + limit).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
      return sliced;
    } catch (e) {
      return [];
    }
  },

  saveFeedback: async (newFeedback: Feedback): Promise<Feedback[]> => {
    const orgId = localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);

    // 1. Try Supabase
    if (isSupabaseConfigured() && orgId) {
        // We do NOT await this in the UI thread for optimistic rendering, 
        // but the service function itself is async.
        const { error } = await supabase!.from('feedback').insert({
            organization_id: orgId, // Assign to current tenant
            location: newFeedback.location,
            content: newFeedback.content,
            sentiment: newFeedback.sentiment,
            category: newFeedback.category,
            image_url: newFeedback.imageUrl,
            summary: newFeedback.summary,
            risk_score: newFeedback.riskScore,
            eco_impact_score: newFeedback.ecoImpactScore,
            eco_impact_reasoning: newFeedback.ecoImpactReasoning,
            timestamp: new Date().toISOString()
        });
        
        if (error) {
            console.error("Supabase Save Error:", error);
            // In a real app, we might revert the optimistic update here or show an error toast.
        }
    }

    // 2. Always update LocalStorage (Optimistic Update)
    let current: Feedback[] = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY_FEEDBACK);
        if (stored) {
             const parsed = JSON.parse(stored);
             current = parsed.map((item: any) => ({ ...item, timestamp: new Date(item.timestamp) }));
        }
    } catch(e) {}
    
    const updated = [newFeedback, ...current];
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(updated));
    
    return updated;
  },

  getAccount: (): AccountSetup | null => {
     // Legacy support helper
    const stored = localStorage.getItem(STORAGE_KEY_ACCOUNT);
    return stored ? JSON.parse(stored) : null;
  },

  saveAccount: (account: AccountSetup) => {
    // Legacy support helper
    localStorage.setItem(STORAGE_KEY_ACCOUNT, JSON.stringify(account));
  },
  
  isProduction: () => isSupabaseConfigured()
};