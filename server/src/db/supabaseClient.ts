import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = config.supabase.url;
  const key = config.supabase.serviceRoleKey || config.supabase.anonKey;

  if (url && key && url.startsWith('http')) {
    try {
      supabase = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
      console.log('🌿 Supabase client initialized connected to:', url);
    } catch (e) {
      console.warn('⚠️ Could not initialize Supabase client, using resilient fallback store:', e);
    }
  }

  return supabase;
}

export const supabaseClient = getSupabaseClient();
