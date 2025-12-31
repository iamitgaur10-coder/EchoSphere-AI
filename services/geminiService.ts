import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AnalysisResponse, Feedback, GenAIPart } from '../types';
import { APP_CONFIG } from '../config/constants';

// Priority: 
// 1. process.env.API_KEY (Official Guideline)
// 2. VITE_API_KEY (Vercel/Vite Standard)
// 3. LocalStorage (Setup Wizard)
const getApiKey = () => {
    // 1. Check process.env (Standard Node/System)
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            // @ts-ignore
            return process.env.API_KEY;
        }
    } catch (e) {}

    // 2. Check Vite Env (Static Replacement)
    // Wrapped in try/catch to avoid "ReferenceError" if import.meta is not defined
    try {
        // @ts-ignore
        if (import.meta.env.VITE_API_KEY) {
            // @ts-ignore
            return import.meta.env.VITE_API_KEY;
        }
    } catch (e) {}
    
    // 3. Check Local Storage
    return localStorage.getItem('VITE_API_KEY') || '';
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null;

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

export const analyzeFeedbackContent = async (text: string, imageBase64?: string): Promise<AnalysisResponse> => {
  if (!apiKey || !ai) throw new Error("System Error: Gemini API Key is not configured. Please add VITE_API_KEY to your environment.");

  try {
    const userLang = navigator.language || 'en-US';
    const parts: GenAIPart[] = [];
    
    if (imageBase64) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } });
    }

    parts.push({
        text: `${APP_CONFIG.AI.GET_SYSTEM_INSTRUCTION(userLang)} Feedback Content: "${text}"`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: parts },
      config: {
        safetySettings: SAFETY_SETTINGS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] },
            category: { type: Type.STRING },
            summary: { type: Type.STRING },
            riskScore: { type: Type.INTEGER },
            ecoImpactScore: { type: Type.INTEGER },
            ecoImpactReasoning: { type: Type.STRING }
          },
          required: ['sentiment', 'category', 'summary', 'riskScore', 'ecoImpactScore', 'ecoImpactReasoning']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResponse;
    }
    throw new Error("Empty response from AI service.");
  } catch (error: unknown) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const checkDuplicates = async (newContent: string, existingItems: Feedback[]): Promise<string | null> => {
    if (!apiKey || !ai) return null; // Fail silently for this optional feature
    
    try {
        if (existingItems.length === 0 || !newContent) return null;
        const candidates = existingItems.map(f => ({ id: f.id, text: f.content }));
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `New report: "${newContent}". Existing: ${JSON.stringify(candidates)}. Find semantic duplicate (same issue). Return JSON: { isDuplicate: boolean, duplicateId: string | null }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isDuplicate: { type: Type.BOOLEAN },
                        duplicateId: { type: Type.STRING, nullable: true }
                    }
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);
            return result.isDuplicate ? result.duplicateId : null;
        }
        return null;
    } catch (e) {
        return null;
    }
};

export const generateSurveyQuestions = async (orgName: string, focusArea: string): Promise<string[]> => {
  if (!apiKey || !ai) throw new Error("System Error: Gemini API Key is not configured.");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${APP_CONFIG.AI.SURVEY_PROMPT} Org: ${orgName}, Focus: ${focusArea}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { questions: { type: Type.ARRAY, items: { type: Type.STRING } } }
      }
    }
  });

  if (response.text) return JSON.parse(response.text).questions;
  throw new Error("Failed to generate questions.");
};

export const generateExecutiveReport = async (feedbackList: Feedback[]): Promise<string> => {
  if (!apiKey || !ai) throw new Error("System Error: Gemini API Key is not configured.");

  const context = feedbackList.map(f => `- [${f.category}] ${f.content}`).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${APP_CONFIG.AI.REPORT_PROMPT} Data: ${context}`
  });
  
  return response.text || "Report generation failed.";
}