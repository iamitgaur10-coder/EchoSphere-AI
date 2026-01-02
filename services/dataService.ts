import { Feedback, AccountSetup, Organization, Location } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Key for LocalStorage Fallback
const STORAGE_KEY_FEEDBACK = 'echosphere_feedback';
const STORAGE_KEY_ACCOUNT = 'echosphere_account';
const STORAGE_KEY_CURRENT_ORG_ID = 'echosphere_current_org_id';

const mapOrg = (row: any): Organization => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    center: row.center, 
    focusArea: row.focus_area 
});

// --- MOCK DATA FOR DEMO MODE ---
const MOCK_DEMO_ORG: Organization = {
    id: 'demo-org',
    name: 'Demo City',
    slug: 'demo',
    center: { x: -118.2437, y: 34.0522 }, // Los Angeles
    focusArea: 'Urban Planning'
};

const MOCK_FEEDBACK_DATA: Feedback[] = [
    { id: 'm1', location: { x: -118.25, y: 34.05 }, content: 'Traffic light sync issue causing delays.', sentiment: 'negative', category: 'Traffic', timestamp: new Date(Date.now() - 86400000), votes: 3, status: 'received', summary: "Traffic signal sync problem", riskScore: 45, ecoImpactScore: 20, ecoImpactReasoning: "Idling cars increase emissions." },
    { id: 'm2', location: { x: -118.24, y: 34.06 }, content: 'Park clean up needed near the fountain.', sentiment: 'neutral', category: 'Sanitation', timestamp: new Date(Date.now() - 172800000), votes: 8, status: 'triaged', summary: "Park litter report", riskScore: 10, ecoImpactScore: 80, ecoImpactReasoning: "Cleaning improves local ecosystem." },
    { id: 'm3', location: { x: -118.235, y: 34.045 }, content: 'Love the new bike lane protections!', sentiment: 'positive', category: 'Infrastructure', timestamp: new Date(Date.now() - 250000000), votes: 12, status: 'resolved', summary: "Positive bike lane feedback", riskScore: 0, ecoImpactScore: 95, ecoImpactReasoning: "Promotes cycling over driving." },
    { id: 'm4', location: { x: -118.26, y: 34.055 }, content: 'Streetlight flickering constantly.', sentiment: 'negative', category: 'Safety', timestamp: new Date(Date.now() - 4000000), votes: 1, status: 'received', summary: "Broken streetlight", riskScore: 60, ecoImpactScore: 30, ecoImpactReasoning: "Energy waste from malfunction." }
];

export const dataService = {
  // --- ORGANIZATION MANAGEMENT ---
  
  createOrganization: async (setup: AccountSetup): Promise<{ org: Organization | null, error: string | null }> => {
    if (isSupabaseConfigured()) {
      try {
          const { data, error } = await supabase!
            .from('organizations')
            .insert({
              id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: setup.organizationName,
              slug: setup.regionCode.toLowerCase(),
              center: setup.center, 
              focus_area: setup.focusArea,
              subscription_tier: 'free'
            })
            .select()
            .single();
          
          if (error) throw error;
          
          localStorage.setItem(STORAGE_KEY_CURRENT_ORG_ID, data.id);
          return { org: mapOrg(data), error: null };
      } catch (e: any) {
          console.warn("DB Create Org Error", e);
          return { org: null, error: e.message || "Unknown database error" };
      }
    }
    // Not configured
    return { org: null, error: null };
  },

  getOrganizationBySlug: async (slug: string): Promise<Organization | null> => {
     if (isSupabaseConfigured()) {
        const { data, error } = await supabase!
        .from('organizations')
        .select('*')
        .eq('slug', slug.toLowerCase())
        .single();
        
        if (!error && data) {
            localStorage.setItem(STORAGE_KEY_CURRENT_ORG_ID, data.id);
            return mapOrg(data);
        }
     }
     
     // FALLBACK: Always load Demo City if real one is missing
     if (slug.toLowerCase() === 'demo') {
         localStorage.setItem(STORAGE_KEY_CURRENT_ORG_ID, MOCK_DEMO_ORG.id);
         return MOCK_DEMO_ORG;
     }

     return null;
  },

  getCurrentOrganization: async (): Promise<Organization | null> => {
    // Check LocalStorage Session
    const orgId = localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);
    
    // Return Mock if ID matches
    if (orgId === MOCK_DEMO_ORG.id) return MOCK_DEMO_ORG;

    if (isSupabaseConfigured() && orgId) {
      const { data } = await supabase!
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      if (data) return mapOrg(data);
    }
    return null;
  },

  listOrganizations: async (): Promise<Organization[]> => {
      if (isSupabaseConfigured()) {
          const { data } = await supabase!
            .from('organizations')
            .select('*')
            .order('name');
          if (data) return data.map(mapOrg);
      }
      return [MOCK_DEMO_ORG]; // Ensure at least demo exists
  },

  saveAccount: (setup: AccountSetup): void => {
      localStorage.setItem(STORAGE_KEY_ACCOUNT, JSON.stringify(setup));
      // For local mode fallback or initial setup persistence
      if (!isSupabaseConfigured()) {
          const mockId = `org-local-${Date.now()}`;
          localStorage.setItem(STORAGE_KEY_CURRENT_ORG_ID, mockId);
      }
  },

  // --- FEEDBACK MANAGEMENT ---

  getFeedback: async (limit: number = 50, offset: number = 0, specificOrgId?: string): Promise<Feedback[]> => {
    let orgId = specificOrgId || localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);
    
    // Serve Mock Data for Demo
    if (orgId === MOCK_DEMO_ORG.id) {
        // Simple pagination for mock data
        return MOCK_FEEDBACK_DATA.slice(offset, offset + limit);
    }

    if (!orgId) {
        const org = await dataService.getCurrentOrganization();
        if (org) orgId = org.id;
    }

    if (isSupabaseConfigured() && orgId) {
      try {
          // SECURITY: Use the Secure View 'public_feedback_safe' for public reads
          const { data: { session } } = await supabase!.auth.getSession();
          const tableToQuery = session ? 'feedback' : 'public_feedback_safe';

          const { data, error } = await supabase!
            .from(tableToQuery)
            .select('*, location_geojson:location::geojson')
            .eq('organization_id', orgId)
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);
          
          if (data) {
            return data.map((item: any) => {
                let loc = { x: 0, y: 0 };
                // Parse GeoJSON from PostGIS
                if (item.location_geojson) {
                    const geo = JSON.parse(item.location_geojson);
                    loc = { x: geo.coordinates[0], y: geo.coordinates[1] };
                }

                return {
                  ...item,
                  organizationId: item.organization_id,
                  userId: item.user_id, 
                  imageUrl: item.image_url,
                  ecoImpactScore: item.eco_impact_score,
                  riskScore: item.risk_score,
                  ecoImpactReasoning: item.eco_impact_reasoning,
                  contactEmail: item.contact_email, // Might be undefined if public view
                  status: item.status || 'received',
                  adminNotes: item.admin_notes || [],
                  timestamp: new Date(item.timestamp),
                  location: loc
                };
            });
          }
      } catch (e) {
          console.error(e);
      }
    }
    return [];
  },

  saveFeedback: async (newFeedback: Feedback): Promise<Feedback[]> => {
    const orgId = newFeedback.organizationId || localStorage.getItem(STORAGE_KEY_CURRENT_ORG_ID);

    // Save to LocalStorage (Optimistic)
    let current: Feedback[] = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY_FEEDBACK);
        if (stored) current = JSON.parse(stored);
    } catch(e) {}
    
    const updated = [newFeedback, ...current];
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(updated));

    // If Demo Mode, just return local update
    if (orgId === MOCK_DEMO_ORG.id) {
        return updated;
    }

    // Sync to DB
    if (isSupabaseConfigured() && orgId) {
        
        // Convert to PostGIS Point format: POINT(lng lat) (SRID 4326)
        const pointWKT = `SRID=4326;POINT(${newFeedback.location.x} ${newFeedback.location.y})`;

        const { error } = await supabase!.from('feedback').insert({
            id: newFeedback.id, 
            organization_id: orgId,
            user_id: newFeedback.userId, 
            location: pointWKT, // Insert as WKT
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
            console.error("Sync Failed:", error.message);
            throw new Error("Failed to save: " + error.message);
        }
    }
    
    return updated;
  },

  updateFeedback: async (updatedItem: Feedback): Promise<void> => {
     if (isSupabaseConfigured()) {
         supabase!
             .from('feedback')
             .update({
                 status: updatedItem.status,
                 admin_notes: updatedItem.adminNotes
             })
             .eq('id', updatedItem.id)
             .then(({ error }) => {
                 if (error) console.error("Update Failed:", error.message);
             });
     }
  },

  isProduction: () => isSupabaseConfigured()
};