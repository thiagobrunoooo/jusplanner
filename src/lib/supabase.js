import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase project credentials
// 1. Go to https://supabase.com/dashboard
// 2. Create a new project
// 3. Go to Project Settings -> API
// 4. Copy the "Project URL" and "anon public" key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
