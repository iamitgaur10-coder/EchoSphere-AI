// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/genai@^1.34.0";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('VITE_API_KEY'); // Use secret env var
    if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const { action, text, imageBase64, userCategory, userLang, newContent, candidates, feedback, orgName, focusArea, feedbackList } = await req.json();

    const model = 'gemini-3-flash-preview';

    // --- ACTION: ANALYZE FEEDBACK ---
    if (action === 'analyze') {
        const prompt = `Analyze the following public feedback for a city planning tool. 
          Output language: ${userLang}.
          Tasks:
          1. Identify sentiment (positive/negative/neutral).
          2. Categorize the topic (Infrastructure, Safety, Recreation, Traffic, Sanitation, Sustainability, Culture).
          3. Provide a 5-10 word summary in ${userLang}.
          4. Assign a Risk Score (0-100, 100=urgent).
          5. Assign an Eco-Impact Score (0-100) assessing if this suggestion helps the environment.
          6. Provide 1 sentence reasoning for the Eco-Impact in ${userLang}.
          7. CRITICAL: Determine if this is a VALID CIVIC ISSUE.
             - TRUE: Potholes, broken lights, trash, safety hazards, traffic, community ideas.
             - FALSE: Commercial reviews, spam, personal ads, gibberish.
          
          Context: User selected category: "${userCategory || 'Unspecified'}".
          Feedback Content: "${text}"`;

        const parts: any[] = [{ text: prompt }];
        if (imageBase64) {
             // imageBase64 comes as data:image/jpeg;base64,.... we need to strip prefix
             const data = imageBase64.split(',')[1];
             parts.push({ inlineData: { mimeType: 'image/jpeg', data } });
        }

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    sentiment: { type: "STRING", enum: ['positive', 'negative', 'neutral'] },
                    category: { type: "STRING" },
                    summary: { type: "STRING" },
                    riskScore: { type: "INTEGER" },
                    ecoImpactScore: { type: "INTEGER" },
                    ecoImpactReasoning: { type: "STRING" },
                    isCivicIssue: { type: "BOOLEAN" },
                    refusalReason: { type: "STRING" }
                  },
                  required: ['sentiment', 'category', 'summary', 'riskScore', 'ecoImpactScore', 'isCivicIssue']
                }
            }
        });
        
        return new Response(response.text, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- ACTION: CHECK DUPLICATES ---
    if (action === 'check_duplicate') {
        const response = await ai.models.generateContent({
            model,
            contents: `New report: "${newContent}". Existing: ${JSON.stringify(candidates)}. Find semantic duplicate. Return JSON: { isDuplicate: boolean, duplicateId: string | null }`,
            config: { responseMimeType: "application/json" }
        });
        return new Response(response.text, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- ACTION: DRAFT RESPONSE ---
    if (action === 'draft_response') {
        const prompt = `Write a short, professional city official email response.
        Status: ${feedback.status}. Category: ${feedback.category}. Content: "${feedback.content}".
        Tone: Empathetic. Max 100 words.`;
        
        const response = await ai.models.generateContent({ model, contents: prompt });
        return new Response(JSON.stringify({ text: response.text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- ACTION: GENERATE REPORT ---
    if (action === 'generate_report') {
        const prompt = `Generate executive summary (max 150 words) based on: ${JSON.stringify(feedbackList)}`;
        const response = await ai.models.generateContent({ model, contents: prompt });
        return new Response(JSON.stringify({ text: response.text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error("Invalid action");

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})