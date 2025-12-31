
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
      console.log("EchoSphere: Attempting to create organization in DB...", setup);
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
        console.error("EchoSphere: DB Create Org Error:", error.message, error.details);
        return null;
      }
      
      console.log("EchoSphere: Organization created successfully:", data);
      // Save ID locally to persist session
      localStorage.setItem(STORAGE_KEY_CURRENT_ORG_ID, data.id);
      return data as Organization;
    }

    // Local Fallback
    console.log("EchoSphere: Supabase not configured. Creating local fallback org.");
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
        
        if (error) {
           if (error.code !== 'PGRST116') {
             console.error("EchoSphere: Error fetching org by slug:", error.message);
           }
           return null;
        }
        return data as Organization;
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
            localStorage.setItem(STORAGE_KEY_CURRENT_ORG_ID, org.id);
            return org;
        }
    }

    // 2. Check LocalStorage Session
    const orgId = localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);
    
    if (isSupabaseConfigured() && orgId) {
      const { data, error } = await supabase!
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
        
      if (error) {
          console.warn("EchoSphere: Could not validate session Org ID:", error.message);
      } else if (data) {
          return data as Organization;
      }
    }

    // 3. Fallback to LocalStorage (Legacy/Offline)
    const stored = localStorage.getItem(STORAGE_KEY_ACCOUNT);
    return stored ? JSON.parse(stored) : null;
  },

  listOrganizations: async (): Promise<Organization[]> => {
      if (isSupabaseConfigured()) {
          const { data, error } = await supabase!
            .from('organizations')
            .select('*')
            .order('name');
            
          if (error) return [];
          return data as Organization[];
      }
      
      const stored = localStorage.getItem(STORAGE_KEY_ACCOUNT);
      return stored ? [JSON.parse(stored)] : [];
  },

  // --- FEEDBACK MANAGEMENT ---

  getFeedback: async (limit: number = 50, offset: number = 0): Promise<Feedback[]> => {
    let orgId = localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);
    
    if (!orgId) {
        const org = await dataService.getCurrentOrganization();
        if (org) orgId = org.id;
    }

    if (isSupabaseConfigured() && orgId) {
      const { data, error } = await supabase!
        .from('feedback')
        .select('*')
        .eq('organization_id', orgId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error("EchoSphere: Supabase Feedback Fetch Error:", error.message);
      } else if (data) {
        return data.map((item: any) => ({
          ...item,
          organizationId: item.organization_id,
          imageUrl: item.image_url,
          ecoImpactScore: item.eco_impact_score,
          riskScore: item.risk_score,
          ecoImpactReasoning: item.eco_impact_reasoning,
          contactEmail: item.contact_email,
          status: item.status || 'received',
          adminNotes: item.admin_notes || [],
          timestamp: new Date(item.timestamp),
          location: typeof item.location === 'string' ? JSON.parse(item.location) : item.location
        }));
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY_FEEDBACK);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      const sorted = parsed.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const sliced = sorted.slice(offset, offset + limit).map((item: any) => ({
        ...item,
        status: item.status || 'received',
        adminNotes: item.adminNotes || [],
        timestamp: new Date(item.timestamp)
      }));
      return sliced;
    } catch (e) {
      return [];
    }
  },

  saveFeedback: async (newFeedback: Feedback): Promise<Feedback[]> => {
    const orgId = localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);

    if (isSupabaseConfigured() && orgId) {
        console.log("EchoSphere: Saving feedback to Supabase...");
        const { error } = await supabase!.from('feedback').insert({
            organization_id: orgId,
            location: newFeedback.location,
            content: newFeedback.content,
            sentiment: newFeedback.sentiment,
            category: newFeedback.category,
            image_url: newFeedback.imageUrl,
            summary: newFeedback.summary,
            risk_score: newFeedback.riskScore,
            eco_impact_score: newFeedback.ecoImpactScore,
            eco_impact_reasoning: newFeedback.ecoImpactReasoning,
            contact_email: newFeedback.contactEmail,
            status: 'received',
            timestamp: new Date().toISOString()
        });
        
        if (error) {
            console.error("EchoSphere: Supabase Save Error:", error.message);
        }
    }

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

  // NEW: Update existing feedback (Status, Notes)
  updateFeedback: async (updatedItem: Feedback): Promise<void> => {
     const orgId = localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);

     if (isSupabaseConfigured() && orgId) {
         await supabase!
             .from('feedback')
             .update({
                 status: updatedItem.status,
                 admin_notes: updatedItem.adminNotes
             })
             .eq('id', updatedItem.id);
     }

     // Local Update
     try {
        const stored = localStorage.getItem(STORAGE_KEY_FEEDBACK);
        if (stored) {
             let parsed = JSON.parse(stored) as Feedback[];
             parsed = parsed.map(item => item.id === updatedItem.id ? updatedItem : item);
             localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(parsed));
        }
     } catch(e) {}
  },

  getAccount: (): AccountSetup | null => {
    const stored = localStorage.getItem(STORAGE_KEY_ACCOUNT);
    return stored ? JSON.parse(stored) : null;
  },

  saveAccount: (account: AccountSetup) => {
    localStorage.setItem(STORAGE_KEY_ACCOUNT, JSON.stringify(account));
  },
  
  isProduction: () => isSupabaseConfigured()
};
