import { createClient } from '@supabase/supabase-js';

const env = window.env || {};

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials missing from window.env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
