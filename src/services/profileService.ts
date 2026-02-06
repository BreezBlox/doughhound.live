import { supabase } from '@/services/supabaseClient';

export async function getSupabaseUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('Supabase getUser failed:', error.message);
    return null;
  }
  return data.user?.id ?? null;
}

export async function fetchProfileSheetId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('sheet_id')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.warn('Supabase profile fetch failed:', error.message);
    }
    return null;
  }

  return data?.sheet_id ?? null;
}

export async function upsertProfileSheetId(userId: string, sheetId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, sheet_id: sheetId }, { onConflict: 'user_id' });

  if (error) {
    console.warn('Supabase profile upsert failed:', error.message);
    return false;
  }

  return true;
}
