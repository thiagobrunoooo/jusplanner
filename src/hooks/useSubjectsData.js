import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// --- SUBJECTS & TOPICS (standalone query hook) ---
// Note: This is different from the context-based useSubjects in useSubjects.jsx.
// This hook is used by components that need a simple subjects list without the full CRUD context.
export const useSubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch subjects
                const { data: subjectsData, error: subjError } = await supabase
                    .from('subjects')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (subjError) throw subjError;

                // Fetch topics
                const { data: topicsData, error: topicsError } = await supabase
                    .from('topics')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (topicsError) throw topicsError;

                // Merge topics into subjects
                const merged = subjectsData.map(subject => ({
                    ...subject,
                    topics: topicsData.filter(t => t.subject_id === subject.id)
                }));

                setSubjects(merged);
            } catch (err) {
                console.error("Failed to load subjects:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return { subjects, loading };
};
