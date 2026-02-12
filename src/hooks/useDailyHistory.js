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
