import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const storageService = {
  uploadImage: async (file: File): Promise<string | null> => {
    if (!isSupabaseConfigured()) {
      console.warn("Storage not configured. Returning local preview URL.");
      // Fallback: Convert to Base64 for local demo only
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'uploads' bucket
      const { error: uploadError } = await supabase!.storage
        .from('uploads')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data } = supabase!.storage.from('uploads').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload Error:", error);
      return null;
    }
  }
};