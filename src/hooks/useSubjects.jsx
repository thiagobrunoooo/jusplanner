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

// Sanitiza tópicos para garantir que tópicos de Direito Processual não fiquem erroneamente dentro de Direito Material
const sanitizeAndSeparateProcessualTopics = (subjectsList) => {
    if (!Array.isArray(subjectsList) || subjectsList.length === 0) return { sanitizedList: subjectsList, hasChanges: false };

    let hasChanges = false;
    let list = subjectsList.map(s => ({ ...s, topics: [...(s.topics || [])] }));

    // 1. DPC / Processo Civil vs Direito Civil
    const civilIdx = list.findIndex(s => s.id === 'civil' || s.title?.toLowerCase() === 'direito civil');
    let procCivilIdx = list.findIndex(s => s.id === 'proc_civil' || s.title?.toLowerCase().includes('processo civil') || s.title?.toLowerCase().includes('processual civil'));

    if (civilIdx !== -1) {
        const civilTopics = list[civilIdx].topics;
        const procCivilKeywords = [
            'processual civil', 'processo civil', 'cpc', 'petição inicial', 'peticao inicial',
            'litisconsórcio', 'litisconsorcio', 'tutela provisória', 'tutela provisoria',
            'cumprimento de sentença', 'cumprimento de sentenca', 'recursos cíveis', 'recursos civeis',
            'teoria geral do processo', 'intervenção de terceiros', 'intervencao de terceiros',
            'fase postulatória', 'fase postulatoria', 'saneamento', 'produção de provas', 'provas no cpc',
            'jurisdição e ação', 'jurisdicao e acao', 'competência cível', 'competencia civel'
        ];

        const misplaced = civilTopics.filter(t => {
            const title = (t.title || '').toLowerCase();
            return procCivilKeywords.some(kw => title.includes(kw));
        });

        if (misplaced.length > 0) {
            hasChanges = true;
            list[civilIdx].topics = civilTopics.filter(t => !misplaced.some(m => m.id === t.id));

            if (procCivilIdx === -1) {
                const newProc = {
                    id: 'proc_civil',
                    title: 'Direito Processual Civil',
                    color: 'text-indigo-600',
                    bgColor: 'bg-indigo-600',
                    bgLight: 'bg-indigo-50',
                    icon: 'ScrollText',
                    topics: [...misplaced],
                    position: list.length
                };
                list.push(newProc);
                procCivilIdx = list.length - 1;
            } else {
                const existingProcIds = new Set(list[procCivilIdx].topics.map(t => t.id));
                const toAdd = misplaced.filter(t => !existingProcIds.has(t.id));
                list[procCivilIdx].topics = [...list[procCivilIdx].topics, ...toAdd];
            }
        }
    }

    // 2. DPP / Processo Penal vs Direito Penal
    const penalIdx = list.findIndex(s => s.id === 'penal' || s.title?.toLowerCase() === 'direito penal');
    let procPenalIdx = list.findIndex(s => s.id === 'proc_penal' || s.title?.toLowerCase().includes('processo penal') || s.title?.toLowerCase().includes('processual penal'));

    if (penalIdx !== -1) {
        const penalTopics = list[penalIdx].topics;
        const procPenalKeywords = [
            'processual penal', 'processo penal', 'cpp', 'inquérito policial', 'inquerito policial',
            'ação penal', 'acao penal', 'prisão preventiva', 'prisao preventiva', 'liberdade provisória',
            'competência penal', 'competencia penal', 'provas no cpp', 'tribunal do júri', 'tribunal do juri',
            'recursos penais', 'recurso em sentido estrito'
        ];

        const misplaced = penalTopics.filter(t => {
            const title = (t.title || '').toLowerCase();
            return procPenalKeywords.some(kw => title.includes(kw));
        });

        if (misplaced.length > 0) {
            hasChanges = true;
            list[penalIdx].topics = penalTopics.filter(t => !misplaced.some(m => m.id === t.id));

            if (procPenalIdx === -1) {
                const newProc = {
                    id: 'proc_penal',
                    title: 'Direito Processual Penal',
                    color: 'text-cyan-600',
                    bgColor: 'bg-cyan-600',
                    bgLight: 'bg-cyan-50',
                    icon: 'Shield',
                    topics: [...misplaced],
                    position: list.length
                };
                list.push(newProc);
            } else {
                const existingProcIds = new Set(list[procPenalIdx].topics.map(t => t.id));
                const toAdd = misplaced.filter(t => !existingProcIds.has(t.id));
                list[procPenalIdx].topics = [...list[procPenalIdx].topics, ...toAdd];
            }
        }
    }

    return { sanitizedList: list, hasChanges };
};

export function SubjectsProvider({ children }) {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
    const [loading, setLoading] = useState(true);
    const [isCustomized, setIsCustomized] = useState(false);

    // Carrega matérias do usuário ou usa padrão
    const loadSubjects = useCallback(async () => {
        if (!user) {
            const { sanitizedList } = sanitizeAndSeparateProcessualTopics(DEFAULT_SUBJECTS);
            setSubjects(sanitizedList);
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
                const rawList = data.map(transformFromDB);
                const { sanitizedList, hasChanges } = sanitizeAndSeparateProcessualTopics(rawList);
                setSubjects(sanitizedList);
                setIsCustomized(true);

                // Se houver tópicos mal posicionados salvos no DB, atualiza de forma assíncrona
                if (hasChanges) {
                    try {
                        const toUpsert = sanitizedList.map((s, idx) =>
                            transformToDB({ ...s, position: idx }, user.id)
                        );
                        await supabase.from('user_subjects').upsert(toUpsert, { onConflict: 'user_id, subject_id' });
                    } catch (syncErr) {
                        console.warn('Auto-heal sync notice:', syncErr);
                    }
                }
            } else {
                // Usuário ainda não customizou - usa padrão
                const { sanitizedList } = sanitizeAndSeparateProcessualTopics(DEFAULT_SUBJECTS);
                setSubjects(sanitizedList);
                setIsCustomized(false);
            }
        } catch (err) {
            console.error('Failed to load subjects:', err);
            const { sanitizedList } = sanitizeAndSeparateProcessualTopics(DEFAULT_SUBJECTS);
            setSubjects(sanitizedList);
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

    // Adiciona e atualiza múltiplas matérias e tópicos em lote (usado pelo importador)
    const addMultipleSubjectsAndTopics = async (newSubjectsList = [], updatedSubjectsList = []) => {
        if (!user) {
            setSubjects(prev => {
                const updated = [...prev];
                updatedSubjectsList.forEach(up => {
                    const idx = updated.findIndex(s => s.id === up.id);
                    if (idx !== -1) updated[idx] = { ...updated[idx], topics: up.topics };
                });
                newSubjectsList.forEach(ns => {
                    if (!updated.some(s => s.id === ns.id)) {
                        updated.push(ns);
                    }
                });
                return updated;
            });
            return true;
        }

        try {
            if (!isCustomized) {
                await initializeFromDefaults();
            }

            if (newSubjectsList.length > 0) {
                const toInsert = newSubjectsList.map((s, idx) =>
                    transformToDB({ ...s, position: subjects.length + idx }, user.id)
                );
                await supabase.from('user_subjects').upsert(toInsert, { onConflict: 'user_id, subject_id' });
            }

            for (const up of updatedSubjectsList) {
                await supabase.from('user_subjects').update({
                    topics: up.topics,
                    updated_at: new Date().toISOString()
                }).eq('user_id', user.id).eq('subject_id', up.id);
            }

            await loadSubjects();
            return true;
        } catch (err) {
            console.error('Failed to add multiple subjects:', err);
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
        addMultipleSubjectsAndTopics,
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
