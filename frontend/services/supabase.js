import { createClient } from '@supabase/supabase-js';

const env = window.env || {};

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Authentication will not work. Please ensure SUPABASE_ANON_KEY is set in your environment.");
}

// Fallback to avoid immediate crash during initialization, 
// though calls will fail if key is invalid.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');
