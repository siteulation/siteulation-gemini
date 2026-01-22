import { createClient } from '@supabase/supabase-js';

const env = window.env || {};

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials missing from window.env. Check if SUPABASE_URL and SUPABASE_ANON_KEY are set.");
}

// Ensure we don't crash the app immediately if key is missing, although creates will fail
const keyToUse = supabaseKey || 'MISSING_KEY';

export const supabase = createClient(supabaseUrl, keyToUse);
