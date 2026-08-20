import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDebouncedSave, safeParse } from './helpers';

// --- DAILY HISTORY ---
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
                            questions: Number(row.questions_count) || 0,
                            time: Number(row.study_time) || 0,
                            xp: Number(row.xp_earned) || 0
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
                                    questions: Number(payload.new.questions_count) || 0,
                                    time: Number(payload.new.study_time) || 0,
                                    xp: Number(payload.new.xp_earned) || 0
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
        if (!user || !newHistory) return;

        try {
            const rowsToUpsert = Object.entries(newHistory)
                .filter(([dateStr]) => dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr))
                .map(([dateStr, dayData]) => {
                    let questions = 0;
                    if (typeof dayData === 'number' && !isNaN(dayData)) {
                        questions = dayData;
                    } else if (dayData && typeof dayData === 'object') {
                        questions = Number(dayData.questions || dayData.questions_count || 0) || 0;
                    } else if (typeof dayData === 'string') {
                        questions = parseInt(dayData, 10) || 0;
                    }

                    const time = typeof dayData === 'object' ? (Number(dayData?.time || dayData?.study_time) || 0) : 0;
                    const xp = typeof dayData === 'object' ? (Number(dayData?.xp || dayData?.xp_earned) || 0) : 0;

                    return {
                        user_id: user.id,
                        date: dateStr,
                        questions_count: questions,
                        study_time: time,
                        xp_earned: xp,
                        updated_at: new Date().toISOString()
                    };
                });

            if (rowsToUpsert.length > 0) {
                await supabase.from('daily_history').upsert(rowsToUpsert, { onConflict: 'user_id, date' });
            }
        } catch (err) { console.error('Error saving daily history to Supabase:', err); }
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
