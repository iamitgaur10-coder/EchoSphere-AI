import { Feedback, AccountSetup, Organization } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Key for LocalStorage Fallback
const STORAGE_KEY_FEEDBACK = 'echosphere_feedback';
const STORAGE_KEY_ACCOUNT = 'echosphere_account';
const STORAGE_KEY_CURRENT_ORG_ID = 'echosphere_current_org_id';

// Helper to map DB columns to Types
const mapOrg = (row: any): Organization => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    center: row.center,
    focusArea: row.focus_area // Map snake_case to camelCase
});

export const dataService = {
  // --- ORGANIZATION MANAGEMENT ---
  
  createOrganization: async (setup: AccountSetup): Promise<Organization | null> => {
    if (isSupabaseConfigured()) {
      console.log("EchoSphere: Attempting to create organization in DB...", setup);
      try {
          const { data, error } = await supabase!
            .from('organizations')
            .insert({
              id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: setup.organizationName,
              slug: setup.regionCode.toLowerCase(),
              center: setup.center,
              focus_area: setup.focusArea
            })
            .select()
            .single();
          
          if (error) {
            if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
                throw new Error("Network error");
            }
            console.error("❌ [DataService] DB Create Org Error:", error);
            return null;
          }
          
          console.log("✅ EchoSphere: Organization created successfully:", data);
          localStorage.setItem(STORAGE_KEY_CURRENT_ORG_ID, data.id);
          return mapOrg(data);
      } catch (e) {
          console.warn("⚠️ [DataService] Connection failed. Falling back to local mode.");
      }
    }

    // Local Fallback
    console.log("⚠️ EchoSphere: Using local fallback org.");
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
        try {
            const { data, error } = await supabase!
            .from('organizations')
            .select('*')
            .eq('slug', slug.toLowerCase())
            .single();
            
            if (error) {
               if (error.code !== 'PGRST116') {
                 console.error("❌ [DataService] Error fetching org by slug:", error.message);
               }
               return null;
            }
            return mapOrg(data);
        } catch (e) {
            console.warn("⚠️ [DataService] Network error fetching slug.");
            return null;
        }
     }
     return null;
  },

  getCurrentOrganization: async (): Promise<Organization | null> => {
    // 1. Priority: Check URL Query Param
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
      try {
          const { data, error } = await supabase!
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single();
            
          if (error) {
              // Silent fail
          } else if (data) {
              return mapOrg(data);
          }
      } catch (e) {}
    }

    // 3. Fallback to LocalStorage (Legacy/Offline)
    const stored = localStorage.getItem(STORAGE_KEY_ACCOUNT);
    return stored ? JSON.parse(stored) : null;
  },

  listOrganizations: async (): Promise<Organization[]> => {
      if (isSupabaseConfigured()) {
          try {
              const { data, error } = await supabase!
                .from('organizations')
                .select('*')
                .order('name');
                
              if (error) {
                  if (error.message && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
                      throw new Error("Fetch failed");
                  }
                  console.error("❌ [DataService] List Orgs Error:", error.message);
                  return [];
              }
              return data.map(mapOrg);
          } catch (e) {
              console.warn("⚠️ [DataService] Network unavailable for listing. Using local storage.");
          }
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
      try {
          const { data, error } = await supabase!
            .from('feedback')
            .select('*')
            .eq('organization_id', orgId)
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);
          
          if (error) {
            if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
                throw new Error("Network error");
            }
            console.error("❌ [DataService] Feedback Fetch Error:", error.message);
          } else if (data) {
            return data.map((item: any) => ({
              ...item,
              organizationId: item.organization_id,
              userId: item.user_id, 
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
      } catch (e) {
          console.warn("⚠️ [DataService] Using local feedback cache.");
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

    // Save to LocalStorage first (Optimistic)
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

    // Try Sync to DB
    if (isSupabaseConfigured() && orgId) {
        console.log("EchoSphere: Syncing feedback to Supabase...");
        
        supabase!.from('feedback').insert({
            id: newFeedback.id, 
            organization_id: orgId,
            user_id: newFeedback.userId, 
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
        })
        .then(({ error }) => {
            if (error) console.error("❌ [DataService] Sync Failed:", error.message);
            else console.log("✅ [DataService] Sync Success");
        })
        .catch(err => {
            console.warn("⚠️ [DataService] Sync network error (Background):", err);
        });
    }
    
    return updated;
  },

  updateFeedback: async (updatedItem: Feedback): Promise<void> => {
     const orgId = localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);

     if (isSupabaseConfigured() && orgId) {
         supabase!
             .from('feedback')
             .update({
                 status: updatedItem.status,
                 admin_notes: updatedItem.adminNotes
             })
             .eq('id', updatedItem.id)
             .then(({ error }) => {
                 if (error) console.error("❌ [DataService] Update Failed:", error.message);
             })
             .catch(err => console.warn("Update network error (Background)", err));
     }

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