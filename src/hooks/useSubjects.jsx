import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECTS as DEFAULT_SUBJECTS } from '../data/subjects';

const SubjectsContext = createContext(null);

// Converte formato do Supabase para formato do app
const transformFromDB = (dbSubject) => ({
    id: dbSubject.subject_id,
    title: dbSubject.title,
    color: dbSubject.color || 'text-blue-600',
    bgColor: dbSubject.bg_color || 'bg-blue-600',
    bgLight: dbSubject.bg_light || 'bg-blue-50',
    icon: dbSubject.icon || 'BookOpen',
    topics: dbSubject.topics || [],
    position: dbSubject.position || 0,
    _dbId: dbSubject.id // Guarda o ID do Supabase
});

// Converte formato do app para formato do Supabase
const transformToDB = (subject, userId) => ({
    user_id: userId,
    subject_id: subject.id,
    title: subject.title,
    color: subject.color,
    bg_color: subject.bgColor,
    bg_light: subject.bgLight,
    icon: subject.icon,
    topics: subject.topics,
    position: subject.position || 0,
    updated_at: new Date().toISOString()
});

export function SubjectsProvider({ children }) {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
    const [loading, setLoading] = useState(true);
    const [isCustomized, setIsCustomized] = useState(false);

    // Carrega matérias do usuário ou usa padrão
    const loadSubjects = useCallback(async () => {
        if (!user) {
            setSubjects(DEFAULT_SUBJECTS);
            setIsCustomized(false);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_subjects')
                .select('*')
                .eq('user_id', user.id)
                .order('position', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                setSubjects(data.map(transformFromDB));
                setIsCustomized(true);
            } else {
                // Usuário ainda não customizou - usa padrão
                setSubjects(DEFAULT_SUBJECTS);
                setIsCustomized(false);
            }
        } catch (err) {
            console.error('Failed to load subjects:', err);
            setSubjects(DEFAULT_SUBJECTS);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    // Inicializa matérias do usuário a partir do padrão
    const initializeFromDefaults = async () => {
        if (!user) return false;

        try {
            const subjectsToInsert = DEFAULT_SUBJECTS.map((subject, index) =>
                transformToDB({ ...subject, position: index }, user.id)
            );

            const { error } = await supabase
                .from('user_subjects')
                .upsert(subjectsToInsert, { onConflict: 'user_id, subject_id' });

            if (error) throw error;

            await loadSubjects();
            return true;
        } catch (err) {
            console.error('Failed to initialize subjects:', err);
            return false;
        }
    };

    // Adiciona nova matéria
    const addSubject = async (subject) => {
        if (!user) return null;

        // Garante que o usuário tem matérias customizadas
        if (!isCustomized) {
            await initializeFromDefaults();
        }

        const newSubject = {
            ...subject,
            id: subject.id || `custom_${Date.now()}`,
            position: subjects.length
        };

        try {
            const { data, error } = await supabase
                .from('user_subjects')
                .insert(transformToDB(newSubject, user.id))
                .select()
                .single();

            if (error) throw error;

            setSubjects(prev => [...prev, transformFromDB(data)]);
            return transformFromDB(data);
        } catch (err) {
            console.error('Failed to add subject:', err);
            return null;
        }
    };

    // Atualiza matéria existente
    const updateSubject = async (subjectId, updates) => {
        if (!user) return false;

        // Garante que o usuário tem matérias customizadas
        if (!isCustomized) {
            await initializeFromDefaults();
        }

        try {
            const subjectToUpdate = subjects.find(s => s.id === subjectId);
            if (!subjectToUpdate) return false;

            const updatedSubject = { ...subjectToUpdate, ...updates };

            const { error } = await supabase
                .from('user_subjects')
                .update({
                    title: updatedSubject.title,
                    color: updatedSubject.color,
                    bg_color: updatedSubject.bgColor,
                    bg_light: updatedSubject.bgLight,
                    icon: updatedSubject.icon,
                    topics: updatedSubject.topics,
                    position: updatedSubject.position,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id)
                .eq('subject_id', subjectId);

            if (error) throw error;

            setSubjects(prev => prev.map(s =>
                s.id === subjectId ? { ...s, ...updates } : s
            ));
            return true;
        } catch (err) {
            console.error('Failed to update subject:', err);
            return false;
        }
    };

    // Exclui matéria
    const deleteSubject = async (subjectId) => {
        if (!user) return false;

        try {
            const { error } = await supabase
                .from('user_subjects')
                .delete()
                .eq('user_id', user.id)
                .eq('subject_id', subjectId);

            if (error) throw error;

            setSubjects(prev => prev.filter(s => s.id !== subjectId));
            return true;
        } catch (err) {
            console.error('Failed to delete subject:', err);
            return false;
        }
    };

    // Adiciona tópico a uma matéria
    const addTopic = async (subjectId, topic) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return false;

        const newTopic = {
            id: topic.id || `topic_${Date.now()}`,
            title: topic.title,
            subtopics: topic.subtopics || []
        };

        const updatedTopics = [...subject.topics, newTopic];
        return await updateSubject(subjectId, { topics: updatedTopics });
    };

    // Atualiza tópico
    const updateTopic = async (subjectId, topicId, updates) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return false;

        const updatedTopics = subject.topics.map(t =>
            t.id === topicId ? { ...t, ...updates } : t
        );

        return await updateSubject(subjectId, { topics: updatedTopics });
    };

    // Exclui tópico
    const deleteTopic = async (subjectId, topicId) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return false;

        const updatedTopics = subject.topics.filter(t => t.id !== topicId);
        return await updateSubject(subjectId, { topics: updatedTopics });
    };

    // Reseta para matérias padrão
    const resetToDefaults = async () => {
        if (!user) return false;

        try {
            // Remove todas as matérias customizadas
            await supabase
                .from('user_subjects')
                .delete()
                .eq('user_id', user.id);

            setSubjects(DEFAULT_SUBJECTS);
            setIsCustomized(false);
            return true;
        } catch (err) {
            console.error('Failed to reset subjects:', err);
            return false;
        }
    };

    const value = {
        subjects,
        loading,
        isCustomized,
        addSubject,
        updateSubject,
        deleteSubject,
        addTopic,
        updateTopic,
        deleteTopic,
        resetToDefaults,
        initializeFromDefaults,
        reload: loadSubjects
    };

    return (
        <SubjectsContext.Provider value={value}>
            {children}
        </SubjectsContext.Provider>
    );
}

export function useSubjects() {
    const context = useContext(SubjectsContext);
    if (!context) {
        throw new Error('useSubjects must be used within SubjectsProvider');
    }
    return context;
}

// Hook para obter matérias sem contexto (para uso em ScheduleManager etc)
export function useSubjectsData() {
    const context = useContext(SubjectsContext);
    // Se não estiver no contexto, retorna os padrões
    return context?.subjects || DEFAULT_SUBJECTS;
}
