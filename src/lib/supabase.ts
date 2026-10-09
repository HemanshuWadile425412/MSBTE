import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ehrmhjpsxwyqsebxdsyh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YQNJ04dBGeXtSfB_ngVBDA_gG-H34oq';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

const globalForSupabase = globalThis as unknown as { _supabaseSingleton?: SupabaseClient };

export const supabase: SupabaseClient =
  globalForSupabase._supabaseSingleton ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

if (import.meta.env.DEV) {
  globalForSupabase._supabaseSingleton = supabase;
}

export const BUCKET_NAME = 'academic_materials';

/**
 * Upload a study material file (handwritten note, cheat sheet, image, or PDF) to Supabase Storage
 */
export async function uploadChapterFile(
  userId: string,
  chapterId: string,
  file: File
): Promise<{ path: string; publicUrl: string }> {
  const fileExt = file.name.split('.').pop() || '';
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `${Date.now()}_${cleanBaseName}.${fileExt}`;
  const filePath = `${userId}/${chapterId}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get public or signed URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: publicUrlData.publicUrl,
  };
}

/**
 * Upload a subject syllabus PDF to Supabase Storage
 */
export async function uploadSubjectSyllabus(
  userId: string,
  subjectId: string,
  file: File
): Promise<{ path: string; publicUrl: string }> {
  const fileExt = file.name.split('.').pop() || 'pdf';
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `syllabus_${subjectId}_${Date.now()}_${cleanBaseName}.${fileExt}`;
  const filePath = `${userId}/syllabus/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: publicUrlData.publicUrl,
  };
}

/**
 * Upload a subject-level resource (PYQ / Previous Year Paper PDF)
 */
export async function uploadSubjectResource(
  userId: string,
  subjectId: string,
  file: File
): Promise<{ path: string; publicUrl: string }> {
  const fileExt = file.name.split('.').pop() || 'pdf';
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `pyq_${subjectId}_${Date.now()}_${cleanBaseName}.${fileExt}`;
  const filePath = `${userId}/pyqs/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: publicUrlData.publicUrl,
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteChapterFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    console.error('Failed to remove file from storage:', error);
  }
}

export const deleteStorageFile = deleteChapterFile;

/**
 * Get a valid viewing/download URL for a file in storage (synchronous, instant)
 */
export function getFileViewUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}
