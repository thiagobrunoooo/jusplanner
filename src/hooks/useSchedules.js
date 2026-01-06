import { useState, useEffect, useCallback, createContext, useContext, createElement, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECTS } from '../data/subjects';

const ScheduleContext = createContext(null);

export function ScheduleProvider(props) {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [activeSchedule, setActiveScheduleState] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadSchedules = useCallback(async () => {
        if (!user) {
            setSchedules([]);
            setActiveScheduleState(null);
            setLoading(false);
            return;
        }

        try {
            const { data: schedulesData, error } = await supabase
                .from('schedules')
                .select('*, schedule_topics (topic_id)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const transformed = (schedulesData || []).map(s => ({
                ...s,
                topicIds: s.schedule_topics?.map(t => t.topic_id) || []
            }));

            setSchedules(transformed);

            const active = transformed.find(s => s.is_active);
            setActiveScheduleState(active || transformed[0] || null);

        } catch (err) {
            console.error('Failed to load schedules:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadSchedules();
    }, [loadSchedules]);

    const createSchedule = async (name, topicIds, isPreset = false) => {
        if (!user) return null;

        try {
            const { data: newSchedule, error: scheduleError } = await supabase
                .from('schedules')
                .insert({
                    user_id: user.id,
                    name,
                    is_preset: isPreset,
                    is_active: schedules.length === 0
                })
                .select()
                .single();

            if (scheduleError) throw scheduleError;

            if (topicIds && topicIds.length > 0) {
                const topicsToInsert = topicIds.map(topic_id => ({
                    schedule_id: newSchedule.id,
                    topic_id
                }));

                const { error: topicsError } = await supabase
                    .from('schedule_topics')
                    .insert(topicsToInsert);

                if (topicsError) throw topicsError;
            }

            await loadSchedules();
            return newSchedule;

        } catch (err) {
            console.error('Failed to create schedule:', err);
            return null;
        }
    };

    const setActiveSchedule = async (scheduleId) => {
        if (!user) return;

        try {
            await supabase
                .from('schedules')
                .update({ is_active: false })
                .eq('user_id', user.id);

            await supabase
                .from('schedules')
                .update({ is_active: true })
                .eq('id', scheduleId);

            const active = schedules.find(s => s.id === scheduleId);
            setActiveScheduleState(active);

            setSchedules(prev => prev.map(s => ({
                ...s,
                is_active: s.id === scheduleId
            })));

        } catch (err) {
            console.error('Failed to set active schedule:', err);
        }
    };

    const deleteSchedule = async (scheduleId) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', scheduleId);

            if (error) throw error;

            await loadSchedules();

        } catch (err) {
            console.error('Failed to delete schedule:', err);
        }
    };

    const updateScheduleTopics = async (scheduleId, topicIds) => {
        if (!user) return;

        try {
            await supabase
                .from('schedule_topics')
                .delete()
                .eq('schedule_id', scheduleId);

            if (topicIds && topicIds.length > 0) {
                const topicsToInsert = topicIds.map(topic_id => ({
                    schedule_id: scheduleId,
                    topic_id
                }));

                await supabase
                    .from('schedule_topics')
                    .insert(topicsToInsert);
            }

            await loadSchedules();

        } catch (err) {
            console.error('Failed to update schedule topics:', err);
        }
    };

    // Filtra SUBJECTS baseado nos tópicos do cronograma ativo
    const filteredSubjects = useMemo(() => {
        if (!activeSchedule || !activeSchedule.topicIds || activeSchedule.topicIds.length === 0) {
            // Se não há cronograma ativo, retorna todos
            return SUBJECTS;
        }

        const activeTopicIds = new Set(activeSchedule.topicIds);

        // Filtra subjects que têm pelo menos um tópico selecionado
        return SUBJECTS.map(subject => {
            const filteredTopics = subject.topics.filter(topic => activeTopicIds.has(topic.id));
            if (filteredTopics.length === 0) return null;
            return {
                ...subject,
                topics: filteredTopics
            };
        }).filter(Boolean);
    }, [activeSchedule]);

    const value = {
        schedules,
        activeSchedule,
        filteredSubjects,
        loading,
        createSchedule,
        setActiveSchedule,
        deleteSchedule,
        updateScheduleTopics,
        reload: loadSchedules
    };

    return createElement(ScheduleContext.Provider, { value }, props.children);
}

export function useSchedules() {
    const context = useContext(ScheduleContext);
    if (!context) {
        throw new Error('useSchedules must be used within ScheduleProvider');
    }
    return context;
}
