import { supabase } from './src/lib/supabase.js';

async function testConnection() {
    console.log("Testing connection to Supabase...");
    // Try to select from 'subjects' table which should exist and be public
    const { data, error } = await supabase
        .from('subjects')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Connection failed:', error);
    } else {
        console.log('Connection successful! Subjects count:', data);
        // Also try to read one row to be sure
        const { data: rows, error: rowError } = await supabase.from('subjects').select('*').limit(1);
        if (rowError) {
            console.error('Error reading rows:', rowError);
        } else {
            console.log('Successfully read rows:', rows.length);
        }
    }
}

testConnection();
