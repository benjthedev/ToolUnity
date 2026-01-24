import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a stub that won't crash
    return createClient('https://stub.supabase.co', 'stub-key');
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Create a lazy-loading proxy that always calls getSupabase()
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  }
});
