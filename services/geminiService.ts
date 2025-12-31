import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, Feedback } from '../types';

// NOTE: This assumes process.env.API_KEY is available in the build environment.
const apiKey = process.env.API_KEY || 'YOUR_API_KEY_HERE';
const ai = new GoogleGenAI({ apiKey });

export const analyzeFeedbackContent = async (text: string): Promise<AnalysisResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following public feedback for a city planning tool. 
      
      Tasks:
      1. Identify sentiment (positive/negative/neutral).
      2. Categorize the topic (Infrastructure, Safety, Recreation, Traffic, Sanitation, Sustainability).
      3. Provide a 5-10 word summary.
      4. Assign a Risk Score (0-100, 100=urgent).
      5. Assign an Eco-Impact Score (0-100) assessing if this suggestion helps the environment (e.g. planting trees = high, more parking = low).
      6. Provide 1 sentence reasoning for the Eco-Impact.

      Feedback: "${text}"`,
      config: {
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
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      sentiment: 'neutral',
      category: 'General',
      summary: 'Analysis unavailable',
      riskScore: 0,
      ecoImpactScore: 50,
      ecoImpactReasoning: 'Analysis failed'
    };
  }
};

export const generateSurveyQuestions = async (orgName: string, focusArea: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 5 engaging, short, and relevant feedback questions for a public engagement platform.
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
    console.error("Gemini Question Generation Error:", error);
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
    const context = feedbackList.map(f => `- [${f.category}] ${f.content} (Sentiment: ${f.sentiment})`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert urban planning analyst. 
      Generate a concise executive summary (max 150 words) based on the following citizen feedback data.
      Highlight key trends, urgent risks, and opportunities for sustainability.
      
      Data:
      ${context}`
    });
    
    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Report Generation Error:", error);
    return "AI reporting service is currently unavailable.";
  }
}