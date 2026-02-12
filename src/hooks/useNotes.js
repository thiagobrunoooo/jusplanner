import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { safeParse } from './helpers';

// --- NOTES ---
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

                            if (!localNote) {
                                newNotes[row.topic_id] = remoteNote;
                            } else if (localNote.updated_at) {
                                // Both have timestamps
                                if (new Date(remoteNote.updated_at) > new Date(localNote.updated_at)) {
                                    newNotes[row.topic_id] = remoteNote;
                                }
                            } else {
                                // Local is legacy string
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

                const content = note?.content;
                const prevContent = prevNote?.content;

                if (content !== prevContent) {
                    changes.push({
                        user_id: user.id,
                        topic_id: topicId,
                        content: content,
                        updated_at: note?.updated_at || new Date().toISOString()
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
