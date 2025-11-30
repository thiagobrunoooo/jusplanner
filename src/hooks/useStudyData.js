import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// --- HELPER: Debounce Save ---
const useDebouncedSave = (saveFn, delay = 2000) => {
    const timeoutRef = useRef(null);

    const triggerSave = (data) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            saveFn(data);
        }, delay);
    };

    return triggerSave;
};

// --- HELPER: Safe Parse ---
const safeParse = (jsonString, fallback) => {
    if (!jsonString || jsonString === 'undefined') return fallback;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse localStorage:", e);
        return fallback;
    }
};

// --- HELPER: Timestamp Comparison & Merge ---
// Returns true if remote is newer
const isNewer = (remoteRow, localRow) => {
    if (!remoteRow) return false;
    if (!localRow) return true;
    if (!localRow.updated_at) return true;
    if (!remoteRow.updated_at) return false;
    return new Date(remoteRow.updated_at) > new Date(localRow.updated_at);
};

// --- 1. USER STATS ---
export const useProfileData = (initialStats) => {
    const { user } = useAuth();
    // Initialize from localStorage immediately
    const [stats, setStats] = useState(() => {
        if (!user) return initialStats;
        const saved = localStorage.getItem(`userStats_${user.id}`);
        return safeParse(saved, initialStats);
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setStats(initialStats);
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const { data: remoteData } = await supabase.from('profiles').select('*').eq('id', user.id).single();

                if (remoteData) {
                    setStats(prev => {
                        // Merge logic: if remote is newer, take remote. Else keep local.
                        // For profiles, we usually trust the server more on initial load unless we have offline changes.
                        // Simple merge for now:
                        const merged = { ...prev, ...remoteData };
                        localStorage.setItem(`userStats_${user.id}`, JSON.stringify(merged));
                        return merged;
                    });
                } else {
                    // If no remote profile, create one from local
                    await saveToSupabase(stats);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();

        const channel = supabase.channel('profile_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                (payload) => {
                    if (payload.new) {
                        setStats(prev => {
                            const newState = { ...prev, ...payload.new };
                            localStorage.setItem(`userStats_${user.id}`, JSON.stringify(newState));
                            return newState;
                        });
                    }
                })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.id]);

    const saveToSupabase = async (newStats) => {
        if (!user) return;
        try {
            await supabase.from('profiles').upsert({
                id: user.id,
                ...newStats,
                updated_at: new Date().toISOString(),
                last_activity: new Date().toISOString()
            });
        } catch (err) { console.error(err); }
    };

    const debouncedSave = useDebouncedSave(saveToSupabase);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`userStats_${user.id}`, JSON.stringify(stats));
            if (!loading) debouncedSave(stats);
        }
    }, [stats, user, loading]);

    return [stats, setStats];
};

// --- 2. DAILY HISTORY ---
export const useDailyHistory = (initialHistory) => {
    const { user } = useAuth();
    const [history, setHistory] = useState(() => {
        if (!user) return initialHistory;
        const saved = localStorage.getItem(`dailyHistory_${user.id}`);
        return safeParse(saved, initialHistory);
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setHistory(initialHistory);
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const { data } = await supabase.from('daily_history').select('*').eq('user_id', user.id);
                if (data && data.length > 0) {
                    const historyMap = {};
                    data.forEach(row => {
                        historyMap[row.date] = {
                            questions: row.questions_count || 0,
                            time: row.study_time || 0,
                            xp: row.xp_earned || 0
                        };
                    });
                    setHistory(prev => {
                        const newHistory = { ...prev, ...historyMap };
                        localStorage.setItem(`dailyHistory_${user.id}`, JSON.stringify(newHistory));
                        return newHistory;
                    });
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();

        const channel = supabase.channel('daily_history_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_history', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'DELETE' && payload.old) {
                        setHistory(prev => {
                            if (payload.old.date) {
                                const newState = { ...prev };
                                delete newState[payload.old.date];
                                if (!window.isResetting) localStorage.setItem(`dailyHistory_${user.id}`, JSON.stringify(newState));
                                return newState;
                            }
                            return prev;
                        });
                    } else if (payload.new && payload.new.date) {
                        setHistory(prev => {
                            const newState = {
                                ...prev,
                                [payload.new.date]: {
                                    questions: payload.new.questions_count || 0,
                                    time: payload.new.study_time || 0,
                                    xp: payload.new.xp_earned || 0
                                }
                            };
                            if (!window.isResetting) localStorage.setItem(`dailyHistory_${user.id}`, JSON.stringify(newState));
                            return newState;
                        });
                    }
                })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.id]);

    const saveToSupabase = async (newHistory) => {
        if (!user) return;
        const today = new Date().toLocaleDateString('en-CA');
        const dayData = newHistory[today] || { questions: 0, time: 0, xp: 0 };

        // Handle legacy format (if just a number)
        const questions = typeof dayData === 'number' ? dayData : (dayData.questions || 0);
        const time = typeof dayData === 'object' ? (dayData.time || 0) : 0;
        const xp = typeof dayData === 'object' ? (dayData.xp || 0) : 0;

        try {
            await supabase.from('daily_history').upsert({
                user_id: user.id,
                date: today,
                questions_count: questions,
                study_time: time,
                xp_earned: xp,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, date' });
        } catch (err) { console.error(err); }
    };

    const debouncedSave = useDebouncedSave(saveToSupabase);

    useEffect(() => {
        if (!window.isResetting && user) {
            localStorage.setItem(`dailyHistory_${user.id}`, JSON.stringify(history));
        }
        if (user && !loading) debouncedSave(history);
    }, [history, user, loading]);

    return [history, setHistory];
};

// --- 3. TOPIC PROGRESS ---
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
                                // If local item has updated_at, it's a valid offline change -> Push it.
                                // If NO updated_at, it's legacy garbage -> Remove it from local state.
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
                            // We do this async without awaiting to not block render
                            supabase.from('topic_progress').upsert(changesToPush, { onConflict: 'user_id, topic_id' })
                                .then(({ error }) => { if (error) console.error("Sync push error:", error); });
                        }

                        localStorage.setItem(`studyProgress_${user.id}`, JSON.stringify(newProgress));
                        prevProgressRef.current = JSON.parse(JSON.stringify(newProgress)); // Update ref to avoid double save
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
                        // Handle Deletion
                        setProgress(prev => {
                            // If we have the ID, we might need to find which topic it belongs to if not keyed by ID
                            // But wait, our state is keyed by topic_id.
                            // With REPLICA IDENTITY FULL, payload.old should have topic_id.
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
                                prevProgressRef.current = JSON.parse(JSON.stringify(newState)); // Sync ref
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
                    // Ensure updated_at is set
                    const now = new Date().toISOString();
                    // If curr has no updated_at or it's old, update it. 
                    // Ideally the component updating the state should set updated_at, but we fallback here.
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

    // NEW: Log question session
    const logQuestionSession = async (subjectId, topicId, count, correctCount) => {
        console.log(`[logQuestionSession] Attempting to log: Subject=${subjectId}, Topic=${topicId}, Count=${count}`);
        if (!user || count <= 0) {
            console.warn("[logQuestionSession] Aborted: User not logged in or count <= 0");
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
            console.log("[logQuestionSession] Success!");
        } catch (err) { console.error("Error logging question session:", err); }
    };

    return [progress, setProgress, logQuestionSession];
};

// --- 4. STUDY TIME ---
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

    // NEW: Log individual session
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

// --- 5. NOTES ---
export const useNotes = (initialNotes = {}) => {
    const { user } = useAuth();
    const [notes, setNotes] = useState(() => {
        if (!user) return initialNotes;
        const saved = localStorage.getItem(`studyNotes_${user.id}`);
        return safeParse(saved, initialNotes);
    });
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const prevNotesRef = useRef({});

    // Helper to normalize note to object
    const normalize = (note) => {
        if (!note) return null;
        if (typeof note === 'string') return { content: note, updated_at: null }; // Legacy
        return note;
    };

    useEffect(() => {
        if (!user) {
            setNotes(initialNotes);
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const { data } = await supabase.from('notes').select('*').eq('user_id', user.id);
                if (data) {
                    setNotes(prev => {
                        const newNotes = { ...prev };
                        data.forEach(row => {
                            const localNote = normalize(prev[row.topic_id]);
                            const remoteNote = {
                                content: row.content,
                                updated_at: row.updated_at
                            };

                            // Conflict Resolution:
                            // 1. If we have no local note, take remote.
                            // 2. If we have local note but it's legacy (string), we might want to keep it if it's different? 
                            //    Risk: We overwrite offline work. 
                            //    Safe bet: If local is string, assume it's unsaved work -> Keep local (and it will sync up later).
                            // 3. If both have timestamps, compare.

                            if (!localNote) {
                                newNotes[row.topic_id] = remoteNote;
                            } else if (localNote.updated_at) {
                                // Both have timestamps
                                if (new Date(remoteNote.updated_at) > new Date(localNote.updated_at)) {
                                    newNotes[row.topic_id] = remoteNote;
                                }
                            } else {
                                // Local is legacy string. 
                                // If content is same, upgrade to object with server timestamp.
                                // If content differs, keep local (it will be treated as newer edit).
                                if (localNote.content === remoteNote.content) {
                                    newNotes[row.topic_id] = remoteNote;
                                }
                            }
                        });
                        localStorage.setItem(`studyNotes_${user.id}`, JSON.stringify(newNotes));
                        prevNotesRef.current = JSON.parse(JSON.stringify(newNotes));
                        return newNotes;
                    });
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();

        const channel = supabase.channel('notes_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'DELETE' && payload.old) {
                        setNotes(prev => {
                            if (payload.old.topic_id) {
                                const newState = { ...prev };
                                delete newState[payload.old.topic_id];
                                if (!window.isResetting) localStorage.setItem('studyNotes', JSON.stringify(newState));
                                prevNotesRef.current = JSON.parse(JSON.stringify(newState));
                                return newState;
                            }
                            return prev;
                        });
                    } else if (payload.new && payload.new.topic_id) {
                        setNotes(prev => {
                            const remoteNote = {
                                content: payload.new.content,
                                updated_at: payload.new.updated_at
                            };
                            const localNote = normalize(prev[payload.new.topic_id]);

                            // Only update if remote is strictly newer
                            if (!localNote || (localNote.updated_at && new Date(remoteNote.updated_at) > new Date(localNote.updated_at))) {
                                const newState = { ...prev, [payload.new.topic_id]: remoteNote };
                                if (!window.isResetting) localStorage.setItem('studyNotes', JSON.stringify(newState));
                                prevNotesRef.current = JSON.parse(JSON.stringify(newState));
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
            localStorage.setItem(`studyNotes_${user.id}`, JSON.stringify(notes));
        }
        if (!user || loading) return;

        const syncChanges = async () => {
            setIsSaving(true);
            const changes = [];
            Object.keys(notes).forEach(topicId => {
                const note = normalize(notes[topicId]);
                const prevNote = normalize(prevNotesRef.current[topicId]);

                // Check if content changed OR if it's a legacy note that needs syncing
                // If it's legacy (no updated_at), we treat it as "needs sync" if it differs from prev
                // But wait, if we just upgraded it in load(), it matches.

                const content = note?.content;
                const prevContent = prevNote?.content;

                if (content !== prevContent) {
                    console.log(`[useNotes] Syncing change for ${topicId}`);
                    changes.push({
                        user_id: user.id,
                        topic_id: topicId,
                        content: content,
                        updated_at: note?.updated_at || new Date().toISOString() // Use existing timestamp or new one
                    });
                }
            });

            if (changes.length > 0) {
                try {
                    const { error } = await supabase.from('notes').upsert(changes, { onConflict: 'user_id, topic_id' });
                    if (error) throw error;

                    // Update ref only after successful save
                    changes.forEach(change => {
                        prevNotesRef.current[change.topic_id] = {
                            content: change.content,
                            updated_at: change.updated_at
                        };
                    });
                } catch (error) {
                    console.error('Error syncing notes:', error);
                }
            }
            setIsSaving(false);
        };

        const timeout = setTimeout(syncChanges, 1000);
        return () => clearTimeout(timeout);
    }, [notes, user, loading]);

    const forceSave = async () => {
        if (!user) return;
        setIsSaving(true);
        const changes = [];
        Object.keys(notes).forEach(topicId => {
            const note = normalize(notes[topicId]);
            if (note) {
                changes.push({
                    user_id: user.id,
                    topic_id: topicId,
                    content: note.content,
                    updated_at: note.updated_at || new Date().toISOString()
                });
            }
        });

        if (changes.length > 0) {
            try {
                await supabase.from('notes').upsert(changes, { onConflict: 'user_id, topic_id' });
                // Update ref
                changes.forEach(change => {
                    prevNotesRef.current[change.topic_id] = {
                        content: change.content,
                        updated_at: change.updated_at
                    };
                });
            } catch (err) { console.error(err); }
        }
        setIsSaving(false);
    };

    return [notes, setNotes, isSaving, forceSave];
};

// --- 6. MATERIALS ---
export const useMaterials = (initialMaterials) => {
    const { user } = useAuth();
    const [materials, setMaterials] = useState(() => {
        if (!user) return initialMaterials;
        const saved = localStorage.getItem(`studyMaterials_${user.id}`);
        return safeParse(saved, initialMaterials);
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setMaterials(initialMaterials);
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                const { data } = await supabase.from('materials').select('*').eq('user_id', user.id);
                if (data) {
                    setMaterials(data);
                    localStorage.setItem(`studyMaterials_${user.id}`, JSON.stringify(data));
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();

        const channel = supabase.channel('materials_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'materials', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'DELETE' && payload.old) {
                        setMaterials(prev => {
                            const newState = prev.filter(m => m.id !== payload.old.id);
                            if (!window.isResetting) localStorage.setItem(`studyMaterials_${user.id}`, JSON.stringify(newState));
                            return newState;
                        });
                    } else if (payload.new) {
                        load(); // Reload for inserts/updates to be safe with lists
                    }
                })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.id]);

    const addMaterial = async (material) => {
        if (!user) return;
        try {
            const { data, error } = await supabase.from('materials').insert({
                user_id: user.id,
                ...material,
                updated_at: new Date().toISOString()
            }).select().single();

            if (data) {
                setMaterials(prev => {
                    const newState = [...prev, data];
                    localStorage.setItem(`studyMaterials_${user.id}`, JSON.stringify(newState));
                    return newState;
                });
            }
        } catch (err) { console.error(err); }
    };

    const deleteMaterial = async (id) => {
        console.log("Attempting to delete material:", id);
        if (!user) {
            console.error("No user logged in for delete");
            return;
        }
        try {
            // 1. Fetch item to get URL
            const { data: item, error: fetchError } = await supabase.from('materials').select('*').eq('id', id).single();

            if (fetchError) {
                console.error("Error fetching material to delete:", fetchError);
            }

            if (item) {
                console.log("Found material:", item);
                // 2. If it's a file in Supabase Storage, delete it
                if ((item.type === 'pdf' || item.type === 'image') && item.file_url && item.file_url.includes('supabase.co')) {
                    try {
                        // Extract path: .../materials/user_id/subject_id/filename
                        const parts = item.file_url.split('/materials/');
                        if (parts.length > 1) {
                            const path = parts[1];
                            console.log("Deleting from storage path:", path);
                            const { error: storageError } = await supabase.storage.from('materials').remove([path]);
                            if (storageError) console.error("Storage delete error:", storageError);
                            else console.log("Storage delete success");
                        }
                    } catch (storageErr) {
                        console.error("Failed to delete file from storage:", storageErr);
                    }
                }

                // 3. Delete metadata row
                const { error: deleteError } = await supabase.from('materials').delete().eq('id', id);
                if (deleteError) {
                    console.error("Database delete error:", deleteError);
                    alert("Erro ao excluir do banco de dados: " + deleteError.message);
                } else {
                    console.log("Database delete success");
                    setMaterials(prev => {
                        const newState = prev.filter(m => m.id !== id);
                        if (!window.isResetting) localStorage.setItem(`studyMaterials_${user.id}`, JSON.stringify(newState));
                        return newState;
                    });
                }
            }
        } catch (err) { console.error("Delete material exception:", err); }
    };

    return { materials, addMaterial, deleteMaterial };
};

// --- 7. SUBJECTS & TOPICS ---
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
