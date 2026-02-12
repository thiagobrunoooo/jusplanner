import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDebouncedSave, safeParse } from './helpers';

// --- STUDY TIME ---
export const useStudyTime = (initialTime) => {
    const { user } = useAuth();
    const [studyTime, setStudyTime] = useState(() => {
        if (!user) return initialTime;
        const saved = localStorage.getItem(`studyTime_${user.id}`);
        return safeParse(saved, initialTime);
    });
    const [loading, setLoading] = useState(true);
    const prevTimeRef = useRef({});

    useEffect(() => {
        if (!user) {
            setStudyTime(initialTime);
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const { data } = await supabase.from('study_time').select('*').eq('user_id', user.id);
                if (data && data.length > 0) {
                    const timeMap = {};
                    data.forEach(row => timeMap[row.subject_id] = row.seconds);

                    setStudyTime(prev => {
                        // Max merge strategy: take the higher time
                        const newTime = { ...prev };
                        Object.entries(timeMap).forEach(([subj, seconds]) => {
                            if ((newTime[subj] || 0) < seconds) {
                                newTime[subj] = seconds;
                            }
                        });
                        localStorage.setItem(`studyTime_${user.id}`, JSON.stringify(newTime));
                        prevTimeRef.current = JSON.parse(JSON.stringify(newTime));
                        return newTime;
                    });
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();

        const channel = supabase.channel('study_time_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'study_time', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'DELETE' && payload.old) {
                        setStudyTime(prev => {
                            if (payload.old.subject_id) {
                                const newState = { ...prev };
                                delete newState[payload.old.subject_id];
                                if (!window.isResetting) localStorage.setItem('studyTime', JSON.stringify(newState));
                                prevTimeRef.current = JSON.parse(JSON.stringify(newState));
                                return newState;
                            }
                            return prev;
                        });
                    } else if (payload.new && payload.new.subject_id) {
                        setStudyTime(prev => {
                            const current = prev[payload.new.subject_id] || 0;
                            if (payload.new.seconds > current) {
                                const newState = { ...prev, [payload.new.subject_id]: payload.new.seconds };
                                if (!window.isResetting) localStorage.setItem('studyTime', JSON.stringify(newState));
                                prevTimeRef.current = JSON.parse(JSON.stringify(newState));
                                return newState;
                            }
                            return prev;
                        });
                    }
                })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.id]);

    const saveToSupabase = async (newTime) => {
        if (!user) return;
        const changes = [];
        Object.keys(newTime).forEach(subjectId => {
            const seconds = newTime[subjectId];
            const prevSeconds = prevTimeRef.current[subjectId] || 0;
            if (seconds > prevSeconds) {
                changes.push({
                    user_id: user.id,
                    subject_id: subjectId,
                    seconds: seconds,
                    updated_at: new Date().toISOString()
                });
            }
        });

        if (changes.length > 0) {
            try {
                await supabase.from('study_time').upsert(changes, { onConflict: 'user_id, subject_id' });
                // Update ref
                changes.forEach(change => {
                    prevTimeRef.current[change.subject_id] = change.seconds;
                });
            } catch (err) { console.error(err); }
        }
    };

    const debouncedSave = useDebouncedSave(saveToSupabase);

    useEffect(() => {
        if (!window.isResetting && user) {
            localStorage.setItem(`studyTime_${user.id}`, JSON.stringify(studyTime));
        }
        if (user && !loading) debouncedSave(studyTime);
    }, [studyTime, user, loading]);

    // Log individual session
    const logSession = async (subjectId, seconds) => {
        if (!user || seconds < 60) return; // Only log significant sessions (> 1 min)
        try {
            await supabase.from('study_sessions').insert({
                user_id: user.id,
                subject_id: subjectId,
                duration_seconds: seconds,
                created_at: new Date().toISOString()
            });
        } catch (err) { console.error("Error logging session:", err); }
    };

    return [studyTime, setStudyTime, logSession];
};
