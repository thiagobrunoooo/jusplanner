import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { safeParse, isNewer } from './helpers';

// --- TOPIC PROGRESS ---
export const useProgressData = (initialProgress) => {
    const { user } = useAuth();
    const [progress, setProgress] = useState(() => {
        if (!user) return initialProgress;
        const saved = localStorage.getItem(`studyProgress_${user.id}`);
        return safeParse(saved, initialProgress);
    });
    const [loading, setLoading] = useState(true);
    const prevProgressRef = useRef({});

    useEffect(() => {
        if (!user) {
            setProgress(initialProgress);
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const { data } = await supabase.from('topic_progress').select('*').eq('user_id', user.id);

                if (data) {
                    setProgress(prev => {
                        const newProgress = { ...prev };
                        const changesToPush = [];

                        // 1. Process Server Data
                        data.forEach(remoteRow => {
                            const localRow = prev[remoteRow.topic_id];

                            if (isNewer(remoteRow, localRow)) {
                                // Server is newer, update local
                                newProgress[remoteRow.topic_id] = {
                                    is_read: remoteRow.is_read,
                                    is_reviewed: remoteRow.is_reviewed,
                                    questions_total: remoteRow.questions_total,
                                    questions_correct: remoteRow.questions_correct,
                                    questions: {
                                        total: remoteRow.questions_total,
                                        correct: remoteRow.questions_correct,
                                        completed: remoteRow.questions_total > 0
                                    },
                                    read: remoteRow.is_read, // Compat
                                    reviewed: remoteRow.is_reviewed, // Compat
                                    subtopics_progress: remoteRow.subtopics_progress || {},
                                    updated_at: remoteRow.updated_at
                                };
                            } else if (localRow && isNewer(localRow, remoteRow)) {
                                // Local is newer, mark to push
                                changesToPush.push({
                                    user_id: user.id,
                                    topic_id: remoteRow.topic_id,
                                    is_read: localRow.is_read || localRow.read || false,
                                    is_reviewed: localRow.is_reviewed || localRow.reviewed || false,
                                    questions_total: localRow.questions?.total || localRow.questions_total || 0,
                                    questions_correct: localRow.questions?.correct || localRow.questions_correct || 0,
                                    subtopics_progress: localRow.subtopics_progress || {},
                                    updated_at: localRow.updated_at
                                });
                            }
                        });

                        // 2. Identify Local-Only items to push
                        Object.keys(prev).forEach(topicId => {
                            if (!data.find(r => r.topic_id === topicId)) {
                                const localItem = prev[topicId];
                                if (localItem.updated_at) {
                                    changesToPush.push({
                                        user_id: user.id,
                                        topic_id: topicId,
                                        is_read: localItem.is_read || localItem.read || false,
                                        is_reviewed: localItem.is_reviewed || localItem.reviewed || false,
                                        questions_total: localItem.questions?.total || localItem.questions_total || 0,
                                        questions_correct: localItem.questions?.correct || localItem.questions_correct || 0,
                                        subtopics_progress: localItem.subtopics_progress || {},
                                        updated_at: localItem.updated_at
                                    });
                                } else {
                                    // Legacy item, remove from newProgress to clean up
                                    delete newProgress[topicId];
                                }
                            }
                        });

                        // 3. Push outdated/missing items to server
                        if (changesToPush.length > 0) {
                            supabase.from('topic_progress').upsert(changesToPush, { onConflict: 'user_id, topic_id' })
                                .then(({ error }) => { if (error) console.error("Sync push error:", error); });
                        }

                        localStorage.setItem(`studyProgress_${user.id}`, JSON.stringify(newProgress));
                        prevProgressRef.current = JSON.parse(JSON.stringify(newProgress));
                        return newProgress;
                    });
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();

        const channel = supabase.channel('progress_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'topic_progress', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'DELETE' && payload.old) {
                        setProgress(prev => {
                            const topicId = payload.old.topic_id;
                            if (topicId && prev[topicId]) {
                                const newState = { ...prev };
                                delete newState[topicId];
                                localStorage.setItem('studyProgress', JSON.stringify(newState));
                                prevProgressRef.current = JSON.parse(JSON.stringify(newState));
                                return newState;
                            }
                            return prev;
                        });
                    } else if (payload.new && payload.new.topic_id) {
                        const row = payload.new;
                        setProgress(prev => {
                            // Only update if server is strictly newer
                            if (isNewer(row, prev[row.topic_id])) {
                                const newState = {
                                    ...prev,
                                    [row.topic_id]: {
                                        is_read: row.is_read,
                                        is_reviewed: row.is_reviewed,
                                        questions_total: row.questions_total,
                                        questions_correct: row.questions_correct,
                                        questions: {
                                            total: row.questions_total,
                                            correct: row.questions_correct,
                                            completed: row.questions_total > 0
                                        },
                                        read: row.is_read,
                                        reviewed: row.is_reviewed,
                                        subtopics_progress: row.subtopics_progress || {},
                                        updated_at: row.updated_at
                                    }
                                };
                                localStorage.setItem('studyProgress', JSON.stringify(newState));
                                prevProgressRef.current = JSON.parse(JSON.stringify(newState));
                                return newState;
                            }
                            return prev;
                        });
                    }
                })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.id]);

    useEffect(() => {
        if (!window.isResetting && user) {
            localStorage.setItem(`studyProgress_${user.id}`, JSON.stringify(progress));
        }
        if (!user || loading) return;

        const syncChanges = async () => {
            const changes = [];
            Object.keys(progress).forEach(key => {
                const curr = progress[key];
                const prev = prevProgressRef.current[key];

                // Deep comparison
                if (JSON.stringify(curr) !== JSON.stringify(prev)) {
                    const now = new Date().toISOString();
                    const payload = {
                        user_id: user.id,
                        topic_id: key,
                        is_read: curr.is_read || curr.read || false,
                        is_reviewed: curr.is_reviewed || curr.reviewed || false,
                        questions_total: curr.questions?.total || curr.questions_total || 0,
                        questions_correct: curr.questions?.correct || curr.questions_correct || 0,
                        subtopics_progress: curr.subtopics_progress || {},
                        updated_at: curr.updated_at || now
                    };
                    changes.push(payload);
                }
            });

            if (changes.length > 0) {
                try {
                    await supabase.from('topic_progress').upsert(changes, { onConflict: 'user_id, topic_id' });
                    // Update ref AFTER successful save
                    prevProgressRef.current = JSON.parse(JSON.stringify(progress));
                } catch (err) { console.error(err); }
            }
        };

        const timeout = setTimeout(syncChanges, 500);
        return () => clearTimeout(timeout);
    }, [progress, user, loading]);

    // Log question session
    const logQuestionSession = async (subjectId, topicId, count, correctCount) => {
        if (!user || count <= 0) {
            return;
        }
        try {
            const { error } = await supabase.from('question_sessions').insert({
                user_id: user.id,
                subject_id: subjectId,
                topic_id: topicId,
                questions_count: count,
                correct_count: correctCount,
                created_at: new Date().toISOString()
            });
            if (error) throw error;

        } catch (err) { console.error("Error logging question session:", err); }
    };

    return [progress, setProgress, logQuestionSession];
};
