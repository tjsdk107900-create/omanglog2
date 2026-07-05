import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function testSupabaseConnection() {
  if (!supabase || !supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing Vite environment variables.');
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey,
      },
    });

    console.log('[Supabase] connection test', {
      ok: response.ok,
      status: response.status,
    });
  } catch (error) {
    console.error('[Supabase] connection test failed', error);
  }
}

testSupabaseConnection();
