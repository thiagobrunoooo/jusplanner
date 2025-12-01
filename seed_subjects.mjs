import { createClient } from '@supabase/supabase-js';
import { SUBJECTS } from './src/data/subjects.js';

// Hardcoded credentials from src/lib/supabase.js to avoid import issues with non-module file if any
const supabaseUrl = 'https://uuqrzyjfbrgartmlcynz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Starting seed process...');

    for (const subject of SUBJECTS) {
        console.log(`Processing subject: ${subject.title}`);

        // 1. Insert Subject
        const { error: subjError } = await supabase
            .from('subjects')
            .upsert({
                id: subject.id,
                title: subject.title,
                color: subject.color,
                bg_color: subject.bgColor,
                bg_light: subject.bgLight,
                icon: subject.icon
            });

        if (subjError) {
            console.error(`Error inserting subject ${subject.id}:`, subjError);
            continue;
        }

        // 2. Insert Topics
        for (const topic of subject.topics) {
            const { error: topicError } = await supabase
                .from('topics')
                .upsert({
                    id: topic.id,
                    subject_id: subject.id,
                    title: topic.title,
                    subtopics: topic.subtopics
                });

            if (topicError) {
                console.error(`Error inserting topic ${topic.id}:`, topicError);
            }
        }
    }

    console.log('Seed process completed!');
}

seed();
