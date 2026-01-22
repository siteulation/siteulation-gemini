import { createClient } from '@supabase/supabase-js';

const env = window.env || {};

// Validate keys to ensure we aren't using undefined or empty strings silently
const isValidKey = (key) => typeof key === 'string' && key.length > 0;

if (!isValidKey(env.SUPABASE_URL)) {
  console.error("CRITICAL: SUPABASE_URL is missing from environment.");
}

if (!isValidKey(env.SUPABASE_KEY)) {
  console.error("CRITICAL: SUPABASE_KEY is missing. Check SUPABASE_ANON_KEY in backend env vars.");
}

// Check for common configuration error where Secret key is used
if (env.SUPABASE_KEY && env.SUPABASE_KEY.startsWith('ey') && env.SUPABASE_KEY.includes('service_role')) {
   console.error("SECURITY ALERT: It appears a SERVICE_ROLE key is being used in the browser. This is forbidden. Please use the ANON key.");
}

export const supabase = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_KEY || 'placeholder'
);
