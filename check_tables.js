import { supabase } from './src/lib/supabase.js';

async function listTables() {
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public');

    if (error) {
        console.error('Error listing tables:', error);
    } else {
        console.log('Tables:', data.map(t => t.table_name));
    }
}

listTables();
