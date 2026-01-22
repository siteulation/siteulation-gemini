import { createClient } from '@supabase/supabase-js';

// NOTE: In a real Vite app, these would be import.meta.env.VITE_SUPABASE_URL etc.
// For this generated code, we assume the user will replace these strings or configure the bundler.
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);