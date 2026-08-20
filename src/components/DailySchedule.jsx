import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    CheckCircle2,
    Circle,
    ChevronDown,
    MoreVertical,
    StickyNote,
    Plus,
    Pin,
    Check,
    Trash2,
    Edit3,
    ArrowRightLeft,
    Sparkles,
    Coffee,
    Search,
    X,
    FolderPlus,
    Save,
    RotateCcw,
    Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSchedules } from '../hooks/useSchedules';
import { useSubjects } from '../hooks/useSubjects.jsx';
import { ICON_MAP } from '../lib/icons';
import {
    generateDynamicSchedule,
    resolveScheduleStructure,
    getWeekDescription
} from '../lib/scheduleGenerator';
import { useReminders } from '../hooks/useReminders';

// DebouncedInput component
const DebouncedInput = ({ value, onCommit, ...props }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = () => {
        if (localValue !== value) {
            onCommit(localValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    return (
        <input
            {...props}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
        />
    );
};

// Static fallback schedule
const SCHEDULE = {
    'week1': {
        'Dia 01': ['civ_negocio', 'const_teoria'],
        'Dia 02': ['adm_regime', 'pen_principios'],
        'Dia 03': ['proc_tgp', 'trab_principios'],
        'Dia 04': ['civ_defeitos', 'const_art5'],
        'Dia 05': ['adm_poderes', 'pen_fato'],
        'Dia 06': ['review'],
        'Dia 07': ['rest'],
    }
};

const DailySchedule = ({ progress, toggleCheck, updateQuestionMetrics, notes, setNotes }) => {
    const { subjects, addTopic } = useSubjects();
    const { activeSchedule, filteredSubjects, saveCustomSchedule } = useSchedules();
    const [selectedWeek, setSelectedWeek] = useState('week1');
    const [selectedDay, setSelectedDay] = useState('Dia 01');
    const [expandedCard, setExpandedCard] = useState(null);
    const { getRemindersByDate, addReminder, toggleDone, deleteReminder, reminders } = useReminders();
    const [scheduleReminderText, setScheduleReminderText] = useState('');

    // Estado do modo de edição manual da grade
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddTopicModal, setShowAddTopicModal] = useState(false);
    const [movingTopic, setMovingTopic] = useState(null); // { topicId, fromWeek, fromDay }
    const [searchTopicQuery, setSearchTopicQuery] = useState('');
    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
    const [newQuickTopicTitle, setNewQuickTopicTitle] = useState('');
    const [newQuickTopicSubjectId, setNewQuickTopicSubjectId] = useState('');

    // Resolve estrutura do cronograma (customizado ou dinâmico)
    const dynamicSchedule = useMemo(() => {
        if (!activeSchedule) return SCHEDULE;
        return resolveScheduleStructure(activeSchedule, subjects);
    }, [activeSchedule, subjects]);

    // Lista de semanas disponíveis
    const weeks = useMemo(() => Object.keys(dynamicSchedule).sort(), [dynamicSchedule]);

    // Garante que a semana selecionada exista
    useEffect(() => {
        if (weeks.length > 0 && !weeks.includes(selectedWeek)) {
            setSelectedWeek(weeks[0]);
        }
    }, [weeks, selectedWeek]);

    const days = useMemo(() => {
        const weekData = dynamicSchedule[selectedWeek];
        if (!weekData) return [];
        return Object.keys(weekData).sort();
    }, [selectedWeek, dynamicSchedule]);

    useEffect(() => {
        if (days.length > 0 && !days.includes(selectedDay)) {
            setSelectedDay(days[0]);
        }
    }, [selectedWeek, days, selectedDay]);

    const handleNoteChange = (topicId, text) => {
        setNotes(prev => ({
            ...prev,
            [topicId]: {
                content: text,
                updated_at: new Date().toISOString()
            }
        }));
    };

    const getNoteContent = (topicId) => {
        const note = notes[topicId];
        if (!note) return '';
        if (typeof note === 'string') return note;
        return note.content || '';
    };

    const currentDayTopicsIds = dynamicSchedule[selectedWeek]?.[selectedDay] || [];
    const isRestDay = currentDayTopicsIds.length === 1 && currentDayTopicsIds[0] === 'rest';
    const isReviewDay = currentDayTopicsIds.length === 1 && currentDayTopicsIds[0] === 'review';

    const currentDayTopics = subjects.flatMap(s => s.topics).filter(t => currentDayTopicsIds.includes(t.id));

    // Salva nova estrutura atualizada no Supabase e estado local
    const persistScheduleChange = async (newStructure) => {
        if (!activeSchedule) return;
        await saveCustomSchedule(activeSchedule.id, newStructure);
    };

    // Adiciona um tópico existente ao dia atual
    const handleAddTopicToDay = async (topicId) => {
        if (!activeSchedule) return;
        const currentIds = dynamicSchedule[selectedWeek]?.[selectedDay] || [];
        const cleanIds = currentIds.filter(id => id !== 'rest' && id !== 'review');
        if (cleanIds.includes(topicId)) return;

        const updatedStructure = {
            ...dynamicSchedule,
            [selectedWeek]: {
                ...(dynamicSchedule[selectedWeek] || {}),
                [selectedDay]: [...cleanIds, topicId]
            }
        };

        await persistScheduleChange(updatedStructure);
        setShowAddTopicModal(false);
    };

    // Cria um novo tópico na hora e adiciona ao dia
    const handleCreateAndAddTopic = async () => {
        if (!newQuickTopicTitle.trim() || !newQuickTopicSubjectId) return;

        const created = await addTopic(newQuickTopicSubjectId, {
            title: newQuickTopicTitle.trim(),
            subtopics: []
        });

        if (created && created.id) {
            await handleAddTopicToDay(created.id);
            setNewQuickTopicTitle('');
        }
    };

    // Remove tópico do dia atual
    const handleRemoveTopicFromDay = async (topicIdToRemove) => {
        if (!activeSchedule) return;
        const currentIds = dynamicSchedule[selectedWeek]?.[selectedDay] || [];
        const filtered = currentIds.filter(id => id !== topicIdToRemove);

        const updatedStructure = {
            ...dynamicSchedule,
            [selectedWeek]: {
                ...(dynamicSchedule[selectedWeek] || {}),
                [selectedDay]: filtered.length > 0 ? filtered : ['rest']
            }
        };

        await persistScheduleChange(updatedStructure);
    };

    // Define o dia como Descanso
    const handleSetDayAsRest = async () => {
        if (!activeSchedule) return;
        const updatedStructure = {
            ...dynamicSchedule,
            [selectedWeek]: {
                ...(dynamicSchedule[selectedWeek] || {}),
                [selectedDay]: ['rest']
            }
        };
        await persistScheduleChange(updatedStructure);
    };

    // Define o dia como Revisão Semanal
    const handleSetDayAsReview = async () => {
        if (!activeSchedule) return;
        const updatedStructure = {
            ...dynamicSchedule,
            [selectedWeek]: {
                ...(dynamicSchedule[selectedWeek] || {}),
                [selectedDay]: ['review']
            }
        };
        await persistScheduleChange(updatedStructure);
    };

    // Move um tópico de um dia para outro
    const handleExecuteMoveTopic = async (destWeek, destDay) => {
        if (!movingTopic || !activeSchedule) return;
        const { topicId, fromWeek, fromDay } = movingTopic;

        // Remove do dia de origem
        const sourceIds = (dynamicSchedule[fromWeek]?.[fromDay] || []).filter(id => id !== topicId);
        // Adiciona ao dia de destino
        const destIds = (dynamicSchedule[destWeek]?.[destDay] || []).filter(id => id !== 'rest' && id !== 'review');
        if (!destIds.includes(topicId)) {
            destIds.push(topicId);
        }

        const updatedStructure = {
            ...dynamicSchedule,
            [fromWeek]: {
                ...(dynamicSchedule[fromWeek] || {}),
                [fromDay]: sourceIds.length > 0 ? sourceIds : ['rest']
            },
            [destWeek]: {
                ...(dynamicSchedule[destWeek] || {}),
                [destDay]: destIds
            }
        };

        await persistScheduleChange(updatedStructure);
        setMovingTopic(null);
    };

    // Adiciona um novo dia à semana atual
    const handleAddNewDayToWeek = async () => {
        if (!activeSchedule) return;
        const currentDays = Object.keys(dynamicSchedule[selectedWeek] || {});
        let nextDayNum = 1;

        // Procura maior número de dia
        Object.values(dynamicSchedule).forEach(w => {
            Object.keys(w).forEach(d => {
                const match = d.match(/\d+/);
                if (match) {
                    const n = parseInt(match[0]);
                    if (n >= nextDayNum) nextDayNum = n + 1;
                }
            });
        });

        const newDayKey = `Dia ${String(nextDayNum).padStart(2, '0')}`;
        const updatedStructure = {
            ...dynamicSchedule,
            [selectedWeek]: {
                ...(dynamicSchedule[selectedWeek] || {}),
                [newDayKey]: ['rest']
            }
        };

        await persistScheduleChange(updatedStructure);
        setSelectedDay(newDayKey);
    };

    // Adiciona uma nova semana ao cronograma
    const handleAddNewWeek = async () => {
        if (!activeSchedule) return;
        const nextWeekNum = weeks.length + 1;
        const newWeekKey = `week${nextWeekNum}`;

        let nextDayNum = 1;
        Object.values(dynamicSchedule).forEach(w => {
            Object.keys(w).forEach(d => {
                const match = d.match(/\d+/);
                if (match) {
                    const n = parseInt(match[0]);
                    if (n >= nextDayNum) nextDayNum = n + 1;
                }
            });
        });

        const initialWeekDays = {};
        for (let i = 0; i < 7; i++) {
            const dayKey = `Dia ${String(nextDayNum + i).padStart(2, '0')}`;
            initialWeekDays[dayKey] = i === 6 ? ['rest'] : (i === 5 ? ['review'] : []);
        }

        const updatedStructure = {
            ...dynamicSchedule,
            [newWeekKey]: initialWeekDays
        };

        await persistScheduleChange(updatedStructure);
        setSelectedWeek(newWeekKey);
    };

    // Calcula progresso diário
    const totalTasks = currentDayTopics.length * 3;
    let completedTasks = 0;
    currentDayTopics.forEach(t => {
        if (progress[t.id]?.read) completedTasks++;
        if (progress[t.id]?.reviewed) completedTasks++;
        const qState = progress[t.id]?.questions;
        if (qState === true || qState?.completed) completedTasks++;
    });
    const dailyProgressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Filtra tópicos para o modal de adicionar tópico
    const filteredAvailableTopics = useMemo(() => {
        return subjects.flatMap(s => {
            if (selectedSubjectFilter !== 'all' && s.id !== selectedSubjectFilter) return [];
            return s.topics
                .filter(t => {
                    const query = searchTopicQuery.toLowerCase();
                    return t.title.toLowerCase().includes(query) || s.title.toLowerCase().includes(query);
                })
                .map(t => ({ ...t, subject: s }));
        });
    }, [subjects, selectedSubjectFilter, searchTopicQuery]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header & Controls */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cronograma de Estudos</h2>
                        {activeSchedule && (
                            <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm",
                                    isEditMode
                                        ? "bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-400/50"
                                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                )}
                            >
                                <Edit3 size={14} />
                                <span>{isEditMode ? 'Concluir Edição' : 'Editar Grade'}</span>
                            </button>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-1">
                        {activeSchedule ? (
                            <>Semana {selectedWeek.replace('week', '')}: {getWeekDescription(dynamicSchedule, selectedWeek, subjects)}</>
                        ) : (
                            'Selecione um cronograma para ver seu plano de estudos'
                        )}
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto no-scrollbar flex-1 xl:w-auto">
                            <div className="flex min-w-max">
                                {weeks.map((week, index) => (
                                    <button
                                        key={week}
                                        onClick={() => setSelectedWeek(week)}
                                        className={cn(
                                            "px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                                            selectedWeek === week
                                                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                        )}
                                    >
                                        Semana {index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isEditMode && (
                            <button
                                onClick={handleAddNewWeek}
                                title="Adicionar nova semana"
                                className="p-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1 flex-shrink-0"
                            >
                                <Plus size={14} />
                                <span>Nova Semana</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
                        {days.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                                    selectedDay === day
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                {day}
                            </button>
                        ))}

                        {isEditMode && (
                            <button
                                onClick={handleAddNewDayToWeek}
                                className="px-3 py-2 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 border border-blue-200/60 dark:border-blue-800/60 flex items-center gap-1 flex-shrink-0"
                            >
                                <Plus size={14} />
                                <span>Novo Dia</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* BARRA DE EDIÇÃO RÁPIDA DO DIA QUANDO EM MODO DE EDIÇÃO */}
            {isEditMode && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-indigo-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                >
                    <div className="flex items-center gap-2">
                        <Edit3 size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <div>
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                                Gerenciando: {selectedWeek.replace('week', 'Semana ')} • {selectedDay}
                            </span>
                            <span className="text-[11px] text-amber-700 dark:text-amber-400">
                                Adicione, mova ou altere tópicos deste dia livremente
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowAddTopicModal(true)}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                        >
                            <Plus size={14} />
                            <span>Adicionar Tópico</span>
                        </button>

                        <button
                            onClick={handleSetDayAsReview}
                            className="px-3 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                            <Sparkles size={14} />
                            <span>Definir como Revisão</span>
                        </button>

                        <button
                            onClick={handleSetDayAsRest}
                            className="px-3 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                            <Coffee size={14} />
                            <span>Definir como Descanso</span>
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Daily Progress Bar */}
            {!isRestDay && !isReviewDay && (
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{selectedDay}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{currentDayTopics.length} tópicos para estudar</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-4 sm:pt-0">
                        <div className="text-left sm:text-right">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progresso do Dia</span>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{dailyProgressPercentage}% Concluído</p>
                        </div>
                        <div className="w-16 h-16 relative flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    className="text-slate-100 dark:text-slate-800"
                                />
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={175.9}
                                    strokeDashoffset={175.9 - (175.9 * dailyProgressPercentage) / 100}
                                    className="text-blue-600 dark:text-blue-500 transition-all duration-500 ease-out"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-xs font-bold text-blue-700 dark:text-blue-400">{dailyProgressPercentage}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Reminders Bar */}
            {(() => {
                const dayNumber = parseInt(selectedDay.replace('Dia ', ''));
                const dayDate = new Date();
                dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
                const dateStr = dayDate.toISOString().split('T')[0];
                const dayReminders = reminders.filter(r => r.target_date === dateStr || (r.is_pinned && !r.is_done));

                return (
                    <div className="bg-amber-50/80 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/40 overflow-hidden">
                        <div className="px-4 py-2.5 flex items-center justify-between border-b border-amber-200/40 dark:border-amber-800/30">
                            <div className="flex items-center gap-2">
                                <StickyNote size={14} className="text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Avisos do Dia</span>
                                {dayReminders.filter(r => !r.is_done).length > 0 && (
                                    <span className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-full">
                                        {dayReminders.filter(r => !r.is_done).length}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick add for this day */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (scheduleReminderText.trim()) {
                                    addReminder({ content: scheduleReminderText, targetDate: dateStr });
                                    setScheduleReminderText('');
                                }
                            }}
                            className="px-4 py-2 flex items-center gap-2 border-b border-amber-100/60 dark:border-amber-900/30"
                        >
                            <input
                                type="text"
                                value={scheduleReminderText}
                                onChange={(e) => setScheduleReminderText(e.target.value)}
                                placeholder="Adicionar aviso para este dia..."
                                className="flex-1 px-2.5 py-1.5 text-xs bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800/50 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={!scheduleReminderText.trim()}
                                className="p-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-white rounded-md transition-colors"
                            >
                                <Plus size={12} />
                            </button>
                        </form>

                        {/* Reminders list */}
                        {dayReminders.length > 0 && (
                            <div className="divide-y divide-amber-100/60 dark:divide-amber-900/30">
                                {dayReminders.map(r => (
                                    <div key={r.id} className="px-4 py-2 flex items-center gap-2.5 group">
                                        <button
                                            onClick={() => toggleDone(r.id)}
                                            className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                                                r.is_done
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'border-amber-400 dark:border-amber-600 hover:border-emerald-400'
                                            )}
                                        >
                                            {r.is_done && <Check size={10} />}
                                        </button>
                                        <span className={cn(
                                            "flex-1 text-xs text-slate-700 dark:text-slate-300",
                                            r.is_done && 'line-through opacity-50'
                                        )}>
                                            {r.content}
                                        </span>
                                        {r.is_pinned && <Pin size={10} className="text-amber-500 flex-shrink-0" />}
                                        <button
                                            onClick={() => deleteReminder(r.id)}
                                            className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* CARDS DE CONTEÚDO */}
            <div className="grid gap-4">
                {/* 1. Dia de Descanso */}
                {isRestDay && (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-orange-200/50 dark:border-orange-900/30 shadow-sm p-6 space-y-4">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/50 rounded-2xl flex items-center justify-center mx-auto text-orange-600 dark:text-orange-400 shadow-inner">
                            <Coffee size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dia de Descanso Programado</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                                O descanso faz parte do aprendizado! Recarregue suas energias para manter o rendimento máximo nos próximos dias.
                            </p>
                        </div>
                        {isEditMode && (
                            <button
                                onClick={() => setShowAddTopicModal(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md inline-flex items-center gap-1.5"
                            >
                                <Plus size={14} />
                                <span>Adicionar Matéria neste Dia</span>
                            </button>
                        )}
                    </div>
                )}

                {/* 2. Dia de Revisão */}
                {isReviewDay && (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-purple-200/50 dark:border-purple-900/30 shadow-sm p-6 space-y-4">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/50 rounded-2xl flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400 shadow-inner">
                            <Sparkles size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dia de Revisão Semanal</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                                Aproveite este dia para repassar mapas mentais, refazer questões erradas e consolidar os pontos fracos da semana.
                            </p>
                        </div>
                        {isEditMode && (
                            <button
                                onClick={() => setShowAddTopicModal(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md inline-flex items-center gap-1.5"
                            >
                                <Plus size={14} />
                                <span>Adicionar Matéria neste Dia</span>
                            </button>
                        )}
                    </div>
                )}

                {/* 3. Nenhum tópico programado */}
                {!isRestDay && !isReviewDay && currentDayTopics.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed transition-colors space-y-3">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                            <Calendar className="text-slate-300 dark:text-slate-600" size={32} />
                        </div>
                        <h3 className="text-slate-600 dark:text-slate-300 font-medium">Nenhum estudo programado para este dia.</h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500">Clique abaixo para adicionar tópicos ou editar a grade.</p>
                        <button
                            onClick={() => setShowAddTopicModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all inline-flex items-center gap-1.5 shadow-md"
                        >
                            <Plus size={14} />
                            <span>Adicionar Tópico ao Dia</span>
                        </button>
                    </div>
                )}

                {/* 4. Lista de Tópicos do Dia */}
                {!isRestDay && !isReviewDay && currentDayTopics.map((topic) => {
                    const isExpanded = expandedCard === topic.id;
                    const topicProgress = progress[topic.id] || {};
                    const parentSubject = subjects.find(s => s.topics.find(t => t.id === topic.id));
                    const SubjectIcon = parentSubject ? (ICON_MAP[parentSubject.icon] || BookOpen) : BookOpen;

                    return (
                        <motion.div
                            key={topic.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                            className={cn(
                                "bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden group transition-all",
                                isExpanded
                                    ? "border-blue-200 dark:border-blue-800 shadow-xl ring-2 ring-blue-100 dark:ring-blue-900/50"
                                    : "border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md"
                            )}
                        >
                            {/* Card Header */}
                            <div className="p-6 flex items-center justify-between">
                                <div
                                    onClick={() => setExpandedCard(isExpanded ? null : topic.id)}
                                    className="flex items-center gap-5 cursor-pointer flex-1 min-w-0"
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm flex-shrink-0",
                                        topicProgress.read && topicProgress.reviewed && topicProgress.questions
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                            : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-blue-600 dark:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-100 dark:group-hover:border-blue-800"
                                    )}>
                                        {topicProgress.read && topicProgress.reviewed && topicProgress.questions
                                            ? <CheckCircle2 size={24} />
                                            : <SubjectIcon size={24} className={parentSubject?.color} />
                                        }
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                                                parentSubject ? `${parentSubject.bgLight} ${parentSubject.color} border-transparent` : "bg-slate-100 text-slate-500 border-slate-200"
                                            )}>
                                                {parentSubject?.title}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">{topic.title}</h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Botões de Edição do Card */}
                                    {isEditMode && (
                                        <div className="flex items-center gap-1 mr-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                            <button
                                                onClick={() => setMovingTopic({
                                                    topicId: topic.id,
                                                    fromWeek: selectedWeek,
                                                    fromDay: selectedDay
                                                })}
                                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
                                                title="Mover para outro dia"
                                            >
                                                <ArrowRightLeft size={12} />
                                                <span>Mover</span>
                                            </button>
                                            <button
                                                onClick={() => handleRemoveTopicFromDay(topic.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Remover deste dia"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setExpandedCard(isExpanded ? null : topic.id)}
                                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                    >
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                        >
                                            <ChevronDown size={20} />
                                        </motion.div>
                                    </button>
                                </div>
                            </div>

                            {reminders.filter(r => r.topic_id === topic.id && !r.is_done).length > 0 && !isExpanded && (
                                <div className="px-6 pb-4 flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-full">
                                        <StickyNote size={10} className="text-amber-500" />
                                        <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                            {reminders.filter(r => r.topic_id === topic.id && !r.is_done).length} aviso(s)
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Conteúdo Expandido */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        key="content"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{
                                            height: "auto",
                                            opacity: 1,
                                            transition: {
                                                height: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
                                                opacity: { duration: 0.25, delay: 0.1 }
                                            }
                                        }}
                                        exit={{
                                            height: 0,
                                            opacity: 0,
                                            transition: {
                                                height: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
                                                opacity: { duration: 0.15 }
                                            }
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                            {/* Subtopics List */}
                                            {topic.subtopics && topic.subtopics.length > 0 && (
                                                <div className="mt-2 mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <MoreVertical size={14} />
                                                        Pontos a Estudar
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {topic.subtopics.map((sub, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                                                <span>{sub}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Study Action Buttons */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <button
                                                    onClick={() => toggleCheck(topic.id, 'read')}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-xl border transition-all relative overflow-hidden",
                                                        topicProgress.read
                                                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400"
                                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                                        topicProgress.read ? "bg-green-200 dark:bg-green-900/50 text-green-700 dark:text-green-400" : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                                                    )}>
                                                        {topicProgress.read ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="block font-bold text-sm">Teoria</span>
                                                        <span className="text-xs opacity-70">Ler PDF/Livro</span>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => toggleCheck(topic.id, 'reviewed')}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-xl border transition-all relative overflow-hidden",
                                                        topicProgress.reviewed
                                                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400"
                                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                                        topicProgress.reviewed ? "bg-green-200 dark:bg-green-900/50 text-green-700 dark:text-green-400" : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                                                    )}>
                                                        {topicProgress.reviewed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="block font-bold text-sm">Revisão</span>
                                                        <span className="text-xs opacity-70">Mapa Mental/Resumo</span>
                                                    </div>
                                                </button>

                                                {/* Question Metrics Section */}
                                                <div className="col-span-1 md:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                                                (topicProgress.questions?.completed || topicProgress.questions === true) ? "bg-green-200 dark:bg-green-900/50 text-green-700 dark:text-green-400" : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                                                            )}>
                                                                {(topicProgress.questions?.completed || topicProgress.questions === true) ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                                            </div>
                                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Questões</span>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleCheck(topic.id, 'questions')}
                                                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                                        >
                                                            {(topicProgress.questions?.completed || topicProgress.questions === true) ? 'Reabrir' : 'Concluir'}
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Feitas</label>
                                                                <DebouncedInput
                                                                    id={`questions-total-${topic.id}`}
                                                                    type="number"
                                                                    min="0"
                                                                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-blue-400 outline-none"
                                                                    value={topicProgress.questions?.total || ''}
                                                                    onCommit={(val) => updateQuestionMetrics(topic.id, 'total', val)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Acertos</label>
                                                                <DebouncedInput
                                                                    id={`questions-correct-${topic.id}`}
                                                                    type="number"
                                                                    min="0"
                                                                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-green-600 dark:text-green-400 focus:border-green-400 outline-none"
                                                                    value={topicProgress.questions?.correct || ''}
                                                                    onCommit={(val) => updateQuestionMetrics(topic.id, 'correct', val)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                Erros: <span className="font-bold text-red-500 dark:text-red-400">
                                                                    {(topicProgress.questions?.total || 0) - (topicProgress.questions?.correct || 0)}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                <span className={cn(
                                                                    "font-bold",
                                                                    ((topicProgress.questions?.correct || 0) / (topicProgress.questions?.total || 1)) >= 0.7 ? "text-green-600 dark:text-green-400" : "text-orange-500 dark:text-orange-400"
                                                                )}>
                                                                    {topicProgress.questions?.total > 0
                                                                        ? Math.round(((topicProgress.questions?.correct || 0) / topicProgress.questions?.total) * 100)
                                                                        : 0}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                    Anotações & Dúvidas
                                                </label>
                                                <textarea
                                                    value={getNoteContent(topic.id)}
                                                    onChange={(e) => handleNoteChange(topic.id, e.target.value)}
                                                    placeholder="Registre aqui seus pontos de atenção..."
                                                    className="w-full h-24 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 outline-none transition-all text-sm text-slate-700 dark:text-slate-200 resize-none"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* MODAL: ADICIONAR TÓPICO AO DIA */}
            {showAddTopicModal && createPortal(
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
                    onClick={() => setShowAddTopicModal(false)}
                >
                    <motion.div
                        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                                    Adicionar Tópico ao {selectedDay}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Selecione um tópico existente ou crie um novo para esta data
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddTopicModal(false)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search & Subject Filter */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTopicQuery}
                                    onChange={(e) => setSearchTopicQuery(e.target.value)}
                                    placeholder="Pesquisar por assunto ou matéria..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                                />
                            </div>

                            {/* Subject filter chips */}
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                <button
                                    onClick={() => setSelectedSubjectFilter('all')}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                                        selectedSubjectFilter === 'all'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    )}
                                >
                                    Todas
                                </button>
                                {subjects.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedSubjectFilter(s.id)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                                            selectedSubjectFilter === s.id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        )}
                                    >
                                        {s.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Topics List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-72">
                            {filteredAvailableTopics.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                    Nenhum tópico encontrado. Crie um novo abaixo!
                                </div>
                            ) : (
                                filteredAvailableTopics.map(t => {
                                    const isAlreadyInDay = currentDayTopicsIds.includes(t.id);
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => !isAlreadyInDay && handleAddTopicToDay(t.id)}
                                            className={cn(
                                                "p-3 rounded-xl border flex items-center justify-between transition-all",
                                                isAlreadyInDay
                                                    ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-sm cursor-pointer'
                                            )}
                                        >
                                            <div className="min-w-0 pr-2">
                                                <span className={cn("text-[10px] font-bold uppercase", t.subject.color)}>
                                                    {t.subject.title}
                                                </span>
                                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                    {t.title}
                                                </h4>
                                            </div>

                                            {isAlreadyInDay ? (
                                                <span className="text-[10px] text-slate-400 font-semibold px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-md">
                                                    Já no dia
                                                </span>
                                            ) : (
                                                <button className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                                                    <Plus size={14} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Quick create topic in subject */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Criar Novo Tópico Rápido
                            </span>
                            <div className="flex gap-2">
                                <select
                                    value={newQuickTopicSubjectId}
                                    onChange={(e) => setNewQuickTopicSubjectId(e.target.value)}
                                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none w-1/3"
                                >
                                    <option value="">Matéria...</option>
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.title}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={newQuickTopicTitle}
                                    onChange={(e) => setNewQuickTopicTitle(e.target.value)}
                                    placeholder="Nome do novo tópico..."
                                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={handleCreateAndAddTopic}
                                    disabled={!newQuickTopicTitle.trim() || !newQuickTopicSubjectId}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                >
                                    <Plus size={14} />
                                    <span>Criar</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* MODAL: MOVER TÓPICO PARA OUTRO DIA */}
            {movingTopic && createPortal(
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
                    onClick={() => setMovingTopic(null)}
                >
                    <motion.div
                        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowRightLeft size={18} />
                                <h3 className="font-bold">Mover Tópico</h3>
                            </div>
                            <button
                                onClick={() => setMovingTopic(null)}
                                className="p-1 hover:bg-white/20 rounded-lg text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Escolha o destino para onde deseja transferir este tópico:
                            </p>

                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {weeks.map(weekKey => (
                                    <div key={weekKey} className="space-y-1.5">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                            {weekKey.replace('week', 'Semana ')}
                                        </span>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.keys(dynamicSchedule[weekKey] || {}).map(dayKey => {
                                                const isCurrent = movingTopic.fromWeek === weekKey && movingTopic.fromDay === dayKey;
                                                return (
                                                    <button
                                                        key={dayKey}
                                                        disabled={isCurrent}
                                                        onClick={() => handleExecuteMoveTopic(weekKey, dayKey)}
                                                        className={cn(
                                                            "p-2.5 rounded-xl border text-xs font-semibold transition-all text-left",
                                                            isCurrent
                                                                ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed'
                                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-200'
                                                        )}
                                                    >
                                                        {dayKey}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                            <button
                                onClick={() => setMovingTopic(null)}
                                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DailySchedule;
