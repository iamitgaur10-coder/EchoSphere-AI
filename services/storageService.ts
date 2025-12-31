import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const storageService = {
  uploadImage: async (file: File): Promise<string | null> => {
    if (!isSupabaseConfigured()) {
        throw new Error("Configuration Error: Storage bucket not configured.");
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase!.storage
        .from('uploads')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase!.storage.from('uploads').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Storage Upload Error:", error);
      throw error;
    }
  }
};