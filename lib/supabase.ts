import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function initializeSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

export const supabase = {
  auth: new Proxy({}, {
    get: (_, prop) => {
      return (initializeSupabase().auth as any)[prop as string];
    }
  }),
  from: (table: string) => {
    return initializeSupabase().from(table);
  },
  rpc: (fn: string, args?: any) => {
    return initializeSupabase().rpc(fn, args);
  }
} as any;
