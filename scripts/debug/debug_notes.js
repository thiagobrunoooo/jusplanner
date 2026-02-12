
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uuqrzyjfbrgartmlcynz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("Fetching topics...");
    const { data: topics, error: tErr } = await supabase.from('topics').select('id, title, subject_id');
    if (tErr) console.error(tErr);
    else console.log(`Found ${topics.length} topics.`);

    console.log("Fetching notes...");
    const { data: notes, error: nErr } = await supabase.from('notes').select('*');
    if (nErr) console.error(nErr);
    else {
        console.log(`Found ${notes.length} notes.`);
        notes.forEach(n => {
            const topic = topics.find(t => n.topic_id.startsWith(t.id));
            console.log(`Note Key: ${n.topic_id} | Content Length: ${n.content?.length} | Topic: ${topic ? topic.title : 'Unknown'}`);
        });
    }
}

debug();
