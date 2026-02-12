import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useDebouncedSave, safeParse } from './helpers';

// --- USER STATS ---
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
                        // Smart Merge: Only overwrite if remote is newer
                        const remoteDate = new Date(remoteData.updated_at || 0);
                        const localDate = new Date(prev.updated_at || 0);

                        if (remoteDate > localDate) {
                            const merged = { ...prev, ...remoteData };
                            localStorage.setItem(`userStats_${user.id}`, JSON.stringify(merged));
                            return merged;
                        }
                        return prev;
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
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                ...newStats,
                updated_at: new Date().toISOString(),
                last_activity: new Date().toISOString().split('T')[0]
            });
            if (error) throw error;

        } catch (err) { console.error("Error saving profile:", err); }
    };

    const debouncedSave = useDebouncedSave(saveToSupabase);

    useEffect(() => {
        if (user) {
            localStorage.setItem(`userStats_${user.id}`, JSON.stringify(stats));
            if (!loading) debouncedSave(stats);
        }
    }, [stats, user, loading]);

    return [stats, setStats, saveToSupabase];
};
