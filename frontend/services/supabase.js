import { createClient } from '@supabase/supabase-js';

const env = window.env || {};

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials missing. Ensure SUPABASE_ANON_KEY is set in environment variables.");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
