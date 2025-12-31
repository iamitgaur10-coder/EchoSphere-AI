import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AnalysisResponse, Feedback } from '../types';
import { APP_CONFIG } from '../config/constants';

// Helper to reliably get env vars
const getEnvVar = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const apiKey = getEnvVar('API_KEY') || getEnvVar('VITE_API_KEY');

const ai = new GoogleGenAI({ apiKey: apiKey });

// Safety Settings: Block inappropriate content
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

export const analyzeFeedbackContent = async (text: string, imageBase64?: string): Promise<AnalysisResponse> => {
  try {
    if (!apiKey) throw new Error("API Key is missing. Please set VITE_API_KEY or API_KEY in your environment.");

    // Detect User Language
    const userLang = navigator.language || 'en-US';

    const parts: any[] = [];
    
    // Add Image Part if exists
    if (imageBase64) {
        const cleanBase64 = imageBase64.split(',')[1];
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
            }
        });
    }

    // Add Text Part with Dynamic Language Instruction
    parts.push({
        text: `${APP_CONFIG.AI.GET_SYSTEM_INSTRUCTION(userLang)}

      Feedback Content: "${text}"`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
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
    throw new Error("No response text from Gemini");
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // Check for Safety Block
    if (error.message && error.message.includes("SAFETY")) {
        throw new Error("Content flagged as inappropriate by AI Safety filters.");
    }
    
    // Fallback response
    return {
      sentiment: 'neutral',
      category: 'General',
      summary: 'Analysis unavailable',
      riskScore: 0,
      ecoImpactScore: 50,
      ecoImpactReasoning: 'Analysis failed (Check API Key or Content)'
    };
  }
};

// New RAG-Lite Feature: Duplicate Detection
export const checkDuplicates = async (newContent: string, existingItems: Feedback[]): Promise<string | null> => {
    try {
        if (existingItems.length === 0 || !newContent) return null;

        const candidates = existingItems.map(f => ({ id: f.id, text: f.content }));
        const candidatesJson = JSON.stringify(candidates);

        const prompt = `
            I have a new user report: "${newContent}".
            Here is a list of existing reports nearby: ${candidatesJson}.
            
            Task:
            Check if the new report describes the EXACT SAME issue as any existing report (semantic duplicate).
            If it is a duplicate, return the ID of the existing report.
            If not, return null.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isDuplicate: { type: Type.BOOLEAN },
                        duplicateId: { type: Type.STRING, nullable: true },
                        reasoning: { type: Type.STRING }
                    }
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);
            if (result.isDuplicate && result.duplicateId) {
                return result.duplicateId;
            }
        }
        return null;

    } catch (e) {
        console.warn("Duplicate check failed", e);
        return null;
    }
};

export const generateSurveyQuestions = async (orgName: string, focusArea: string): Promise<string[]> => {
  // ... (Existing code kept same, just brevity for diff)
  // Ideally update prompt to inject language here too, but skipping for brevity as per instructions to only change necessary files
  try {
    if (!apiKey) throw new Error("API Key is missing");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${APP_CONFIG.AI.SURVEY_PROMPT}
      Organization: ${orgName}
      Focus Area: ${focusArea}
      Target Audience: Local residents and visitors.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['questions']
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.questions || [];
    }
    return ["What do you like most about this area?", "What needs improvement?"];
  } catch (error) {
    return [
      "How would you rate the cleanliness of this area?",
      "Do you feel safe walking here at night?",
      "How is the traffic flow in this location?",
      "Are there enough public amenities nearby?",
      "What is your vision for this space?"
    ];
  }
};

export const generateExecutiveReport = async (feedbackList: Feedback[]): Promise<string> => {
  try {
    if (!apiKey) throw new Error("API Key is missing");
    const userLang = navigator.language || 'en-US';

    const context = feedbackList.map(f => `- [${f.category}] ${f.content} (Sentiment: ${f.sentiment})`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${APP_CONFIG.AI.REPORT_PROMPT}
      Output Language: ${userLang}.
      
      Data:
      ${context}`
    });
    
    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Report Generation Error:", error);
    return "AI reporting service is currently unavailable. Please check your API Key configuration.";
  }
}