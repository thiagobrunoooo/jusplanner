import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase project credentials
// 1. Go to https://supabase.com/dashboard
// 2. Create a new project
// 3. Go to Project Settings -> API
// 4. Copy the "Project URL" and "anon public" key
const supabaseUrl = 'https://uuqrzyjfbrgartmlcynz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cXJ6eWpmYnJnYXJ0bWxjeW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjI2NTEsImV4cCI6MjA3OTY5ODY1MX0.gbA6uh4n4ARYecq9qkQQHcirbjQwCh3H-w7inkFlWas';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
