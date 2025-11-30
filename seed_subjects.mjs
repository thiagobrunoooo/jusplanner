import { createClient } from '@supabase/supabase-js';
import { SUBJECTS } from './src/data/subjects.js';

// Hardcoded credentials from src/lib/supabase.js to avoid import issues with non-module file if any
const supabaseUrl = 'https://uuqrzyjfbrgartmlcynz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cXJ6eWpmYnJnYXJ0bWxjeW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjI2NTEsImV4cCI6MjA3OTY5ODY1MX0.gbA6uh4n4ARYecq9qkQQHcirbjQwCh3H-w7inkFlWas';

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
