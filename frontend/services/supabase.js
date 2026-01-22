import { createClient } from '@supabase/supabase-js';

const env = window.env || {};

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_KEY; // This should be the ANON key, not the SECRET key

if (!supabaseUrl) {
  console.error("Siteulation: SUPABASE_URL is not set.");
}

if (!supabaseKey) {
  console.error("Siteulation: SUPABASE_KEY is missing. Ensure SUPABASE_ANON_KEY is set in environment variables.");
}

// Initialize Supabase
// We use fallback values to prevent the app from white-screening immediately,
// but auth calls will fail if credentials are invalid.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
);
