import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    CheckCircle2,
    Circle,
    ChevronDown,
    MoreVertical
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSchedules } from '../hooks/useSchedules';
import { SUBJECTS } from '../data/subjects';
import { ICON_MAP } from '../lib/icons';
import { generateDynamicSchedule, getWeekDescription } from '../lib/scheduleGenerator';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

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
        'Dia 06': ['rev_sem1'],
        'Dia 07': ['rest'],
    },
    'week2': {
        'Dia 08': ['civ_obrigacoes', 'const_remedios'],
        'Dia 09': ['adm_atos', 'pen_ilicitude'],
        'Dia 10': ['proc_sujeitos', 'trab_contrato'],
        'Dia 11': ['civ_pagamento', 'const_org_estado'],
        'Dia 12': ['adm_atos_extincao', 'pen_culpabilidade'],
        'Dia 13': ['rev_sem2'],
        'Dia 14': ['rest'],
    }
};

const DailySchedule = ({ progress, toggleCheck, updateQuestionMetrics, notes, setNotes }) => {
    const { activeSchedule, filteredSubjects, loading: scheduleLoading } = useSchedules();
    const [selectedWeek, setSelectedWeek] = useState('week1');
    const [selectedDay, setSelectedDay] = useState('Dia 01');
    const [expandedCard, setExpandedCard] = useState(null);

    // Generate dynamic schedule based on active schedule topics
    const dynamicSchedule = useMemo(() => {
        if (!activeSchedule?.topicIds || activeSchedule.topicIds.length === 0) {
            return SCHEDULE;
        }
        return generateDynamicSchedule(activeSchedule.topicIds, SUBJECTS);
    }, [activeSchedule?.topicIds]);

    // Available weeks list
    const weeks = useMemo(() => Object.keys(dynamicSchedule).sort(), [dynamicSchedule]);

    // Ensure selected week exists
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
        setSelectedDay(days[0]);
    }, [selectedWeek, days]);

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
    const currentDayTopics = SUBJECTS.flatMap(s => s.topics).filter(t => currentDayTopicsIds.includes(t.id));

    // Calculate daily progress
    const totalTasks = currentDayTopics.length * 3;
    let completedTasks = 0;
    currentDayTopics.forEach(t => {
        if (progress[t.id]?.read) completedTasks++;
        if (progress[t.id]?.reviewed) completedTasks++;
        const qState = progress[t.id]?.questions;
        if (qState === true || qState?.completed) completedTasks++;
    });
    const dailyProgressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cronograma Semanal</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
                        {activeSchedule ? (
                            <>Semana {selectedWeek.replace('week', '')}: {getWeekDescription(dynamicSchedule, selectedWeek, SUBJECTS)}</>
                        ) : (
                            'Selecione um cronograma para ver seu plano de estudos'
                        )}
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full xl:w-auto">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto no-scrollbar w-full xl:w-auto">
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
                    </div>
                </div>
            </div>

            {/* Daily Progress Bar */}
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

            <div className="grid gap-4">
                {currentDayTopics.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 border-dashed transition-colors">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-slate-300 dark:text-slate-600" size={32} />
                        </div>
                        <h3 className="text-slate-500 dark:text-slate-400 font-medium">Nenhum estudo programado para este dia.</h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500">Aproveite para descansar ou revisar!</p>
                    </div>
                ) : (
                    currentDayTopics.map((topic) => {
                        const isExpanded = expandedCard === topic.id;
                        const topicProgress = progress[topic.id] || {};
                        const parentSubject = SUBJECTS.find(s => s.topics.find(t => t.id === topic.id));
                        const SubjectIcon = parentSubject ? (ICON_MAP[parentSubject.icon] || BookOpen) : BookOpen;

                        return (
                            <motion.div
                                key={topic.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                className={cn(
                                    "bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden group",
                                    isExpanded
                                        ? "border-blue-200 dark:border-blue-800 shadow-xl ring-2 ring-blue-100 dark:ring-blue-900/50"
                                        : "border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md"
                                )}
                            >
                                <div
                                    onClick={() => setExpandedCard(isExpanded ? null : topic.id)}
                                    className="p-6 flex items-center justify-between cursor-pointer"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                                            topicProgress.read && topicProgress.reviewed && topicProgress.questions
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                                : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-blue-600 dark:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-100 dark:group-hover:border-blue-800"
                                        )}>
                                            {topicProgress.read && topicProgress.reviewed && topicProgress.questions
                                                ? <CheckCircle2 size={24} />
                                                : <SubjectIcon size={24} className={parentSubject?.color} />
                                            }
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    "text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                                                    parentSubject ? `${parentSubject.bgLight} ${parentSubject.color} border-transparent` : "bg-slate-100 text-slate-500 border-slate-200"
                                                )}>
                                                    {parentSubject?.title}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{topic.title}</h3>
                                        </div>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                    >
                                        <ChevronDown
                                            className={cn(
                                                "text-slate-300 dark:text-slate-600",
                                                isExpanded && "text-blue-500 dark:text-blue-400"
                                            )}
                                        />
                                    </motion.div>
                                </div>

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
                                                <div className="mt-6 mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
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
                    })
                )}
            </div>
        </div>
    );
};

export default DailySchedule;
