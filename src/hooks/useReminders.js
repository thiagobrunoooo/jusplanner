import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useReminders = () => {
    const { user } = useAuth();
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Carrega lembretes do Supabase
    const loadReminders = useCallback(async () => {
        if (!user) {
            setReminders([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('reminders')
                .select('*')
                .eq('user_id', user.id)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReminders(data || []);
        } catch (err) {
            console.error('Error loading reminders:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Load + Realtime subscription
    useEffect(() => {
        loadReminders();

        if (!user) return;

        const channel = supabase
            .channel('reminders_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user.id}` },
                () => loadReminders()
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.id, loadReminders]);

    // Adicionar lembrete
    const addReminder = useCallback(async ({ content, targetDate = null, subjectId = null, topicId = null, color = 'blue' }) => {
        if (!user || !content.trim()) return null;

        try {
            const { data, error } = await supabase
                .from('reminders')
                .insert({
                    user_id: user.id,
                    content: content.trim(),
                    target_date: targetDate,
                    subject_id: subjectId,
                    topic_id: topicId,
                    color,
                })
                .select()
                .single();

            if (error) throw error;

            setReminders(prev => [data, ...prev]);
            return data;
        } catch (err) {
            console.error('Error adding reminder:', err);
            return null;
        }
    }, [user]);

    // Atualizar lembrete
    const updateReminder = useCallback(async (id, updates) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('reminders')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
        } catch (err) {
            console.error('Error updating reminder:', err);
        }
    }, [user]);

    // Deletar lembrete
    const deleteReminder = useCallback(async (id) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('reminders')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setReminders(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Error deleting reminder:', err);
        }
    }, [user]);

    // Toggle done
    const toggleDone = useCallback(async (id) => {
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;
        await updateReminder(id, { is_done: !reminder.is_done });
    }, [reminders, updateReminder]);

    // Toggle pin
    const togglePin = useCallback(async (id) => {
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;
        await updateReminder(id, { is_pinned: !reminder.is_pinned });
    }, [reminders, updateReminder]);

    // Lembretes de hoje (target_date = hoje OU pinned OU sem data)
    const todayReminders = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return reminders.filter(r => {
            if (r.is_pinned) return true;
            if (!r.target_date) return true;
            return r.target_date === today;
        });
    }, [reminders]);

    // Lembretes por data específica
    const getRemindersByDate = useCallback((date) => {
        return reminders.filter(r => {
            if (r.is_pinned) return true;
            return r.target_date === date;
        });
    }, [reminders]);

    // Lembretes por tópico
    const getRemindersByTopic = useCallback((topicId) => {
        return reminders.filter(r => r.topic_id === topicId);
    }, [reminders]);

    // Contagem de pendentes
    const pendingCount = useMemo(() => {
        return todayReminders.filter(r => !r.is_done).length;
    }, [todayReminders]);

    return {
        reminders,
        todayReminders,
        pendingCount,
        loading,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleDone,
        togglePin,
        getRemindersByDate,
        getRemindersByTopic,
    };
};
