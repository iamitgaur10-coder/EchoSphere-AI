import { AnalysisResponse, Feedback } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { APP_CONFIG } from '../config/constants';

// NOTE: All AI logic has been moved to the server (Supabase Edge Function) 
// to prevent API Key exposure.

export const analyzeFeedbackContent = async (text: string, imageBase64?: string, userCategory?: string): Promise<AnalysisResponse> => {
  if (!isSupabaseConfigured()) {
      throw new Error("Backend not connected. Cannot analyze feedback.");
  }

  try {
      const userLang = navigator.language || 'en-US';
      
      const { data, error } = await supabase!.functions.invoke('analyze-feedback', {
          body: {
              action: 'analyze',
              text,
              imageBase64,
              userCategory,
              userLang
          }
      });

      if (error) throw error;
      return data as AnalysisResponse;

  } catch (error: any) {
    console.error("Analysis Error:", error);
    // Fallback for UI if network fails
    throw new Error("AI Service Unavailable. Please try again.");
  }
};

export const checkDuplicates = async (newContent: string, existingItems: Feedback[]): Promise<string | null> => {
    if (!isSupabaseConfigured()) return null;
    
    try {
        if (existingItems.length === 0 || !newContent) return null;
        
        // Only send IDs and text to save bandwidth
        const candidates = existingItems.map(f => ({ id: f.id, text: f.content }));

        const { data, error } = await supabase!.functions.invoke('analyze-feedback', {
            body: {
                action: 'check_duplicate',
                newContent,
                candidates
            }
        });

        if (error) return null;
        return data.duplicateId;
    } catch (e) {
        return null;
    }
};

export const generateResponseDraft = async (feedback: Feedback): Promise<string> => {
  if (!isSupabaseConfigured()) return "Error: Backend required.";

  const { data, error } = await supabase!.functions.invoke('analyze-feedback', {
      body: {
          action: 'draft_response',
          feedback
      }
  });

  if (error) return "Could not generate draft.";
  return data.text;
};

export const generateSurveyQuestions = async (orgName: string, focusArea: string): Promise<string[]> => {
  if (!isSupabaseConfigured()) return ["Default Question 1?", "Default Question 2?"];

  const { data, error } = await supabase!.functions.invoke('analyze-feedback', {
      body: {
          action: 'generate_questions',
          orgName,
          focusArea
      }
  });

  if (error) return [];
  return data.questions;
};

export const generateExecutiveReport = async (feedbackList: Feedback[]): Promise<string> => {
  if (!isSupabaseConfigured()) return "Backend required for reporting.";
  
  // Truncate list to prevent payload limits
  const summaryList = feedbackList.slice(0, 30).map(f => ({ category: f.category, content: f.content }));

  const { data, error } = await supabase!.functions.invoke('analyze-feedback', {
      body: {
          action: 'generate_report',
          feedbackList: summaryList
      }
  });
  
  if (error) return "Report generation failed.";
  return data.text;
}