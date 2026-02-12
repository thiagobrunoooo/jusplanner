import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    CheckCircle2,
    Circle,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSchedules } from '../hooks/useSchedules';
import { useProgressData } from '../hooks/useStudyData';
import { ICON_MAP } from '../lib/icons';



const SubjectTree = () => {
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [progress, updateProgress] = useProgressData({});
    const { filteredSubjects, activeSchedule, loading } = useSchedules();

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Carregando edital...</div>;
    }

    if (!activeSchedule) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                    Nenhum cronograma selecionado. Crie um cronograma primeiro.
                </p>
            </div>
        );
    }

    const toggleSubtopic = (topicId, subtopicIndex) => {
        const topicData = progress[topicId] || {};
        const currentSubtopics = topicData.subtopics_progress || {};
        const currentStatus = currentSubtopics[subtopicIndex] || false;

        const newSubtopics = {
            ...currentSubtopics,
            [subtopicIndex]: !currentStatus
        };

        updateProgress(prev => ({
            ...prev,
            [topicId]: {
                ...prev[topicId],
                subtopics_progress: newSubtopics,
                updated_at: new Date().toISOString()
            }
        }));
    };

    const toggleTopic = (topicId, subtopicsCount) => {
        const topicData = progress[topicId] || {};
        const currentSubtopics = topicData.subtopics_progress || {};

        const allCompleted = Array.from({ length: subtopicsCount }).every((_, idx) => currentSubtopics[idx]);

        const newSubtopics = {};
        for (let i = 0; i < subtopicsCount; i++) {
            newSubtopics[i] = !allCompleted;
        }

        updateProgress(prev => ({
            ...prev,
            [topicId]: {
                ...prev[topicId],
                subtopics_progress: newSubtopics,
                updated_at: new Date().toISOString()
            }
        }));
    };

    const calculateSubjectProgress = (subject) => {
        let totalSubtopics = 0;
        let completedSubtopics = 0;

        subject.topics.forEach(topic => {
            const subtopicsCount = topic.subtopics?.length || 0;
            totalSubtopics += subtopicsCount;

            const topicData = progress[topic.id];
            if (topicData?.subtopics_progress) {
                completedSubtopics += Object.values(topicData.subtopics_progress).filter(Boolean).length;
            }
        });

        return totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Edital & Matérias</h2>
                <p className="text-slate-500 dark:text-slate-400">Acompanhe seu progresso detalhado por subtópico</p>
            </div>

            <div className="space-y-4">
                {filteredSubjects.map(subject => {
                    const isExpanded = expandedSubject === subject.id;
                    const subjectProgress = calculateSubjectProgress(subject);
                    const SubjectIcon = ICON_MAP[subject.icon] || BookOpen;

                    return (
                        <motion.div
                            key={subject.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm"
                            layout
                        >
                            {/* Subject Header */}
                            <button
                                onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                        subject.bgLight,
                                        subject.color
                                    )}>
                                        <SubjectIcon size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{subject.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{subject.topics.length} tópicos</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className={cn(
                                            "text-xl font-bold",
                                            subjectProgress >= 70 ? "text-green-600 dark:text-green-400" :
                                                subjectProgress >= 30 ? "text-yellow-600 dark:text-yellow-400" :
                                                    "text-slate-400"
                                        )}>
                                            {subjectProgress}%
                                        </span>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRight className="text-slate-400" size={20} />
                                    </motion.div>
                                </div>
                            </button>

                            {/* Subject Topics */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                                            {subject.topics.map(topic => {
                                                const topicData = progress[topic.id] || {};
                                                const subtopicsProgress = topicData.subtopics_progress || {};
                                                const subtopicsCount = topic.subtopics?.length || 0;
                                                const completedCount = Object.values(subtopicsProgress).filter(Boolean).length;
                                                const topicPercent = subtopicsCount > 0 ? Math.round((completedCount / subtopicsCount) * 100) : 0;

                                                return (
                                                    <div key={topic.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                                                        {/* Topic Header */}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => toggleTopic(topic.id, subtopicsCount)}
                                                                    className={cn(
                                                                        "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                                                                        topicPercent === 100
                                                                            ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                                                                            : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                                                    )}
                                                                >
                                                                    {topicPercent === 100 ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                                                </button>
                                                                <h4 className="font-medium text-slate-700 dark:text-slate-200">{topic.title}</h4>
                                                            </div>
                                                            <span className={cn(
                                                                "text-sm font-bold",
                                                                topicPercent >= 70 ? "text-green-600 dark:text-green-400" :
                                                                    topicPercent > 0 ? "text-yellow-600 dark:text-yellow-400" :
                                                                        "text-slate-400"
                                                            )}>
                                                                {topicPercent}%
                                                            </span>
                                                        </div>

                                                        {/* Subtopics */}
                                                        <div className="space-y-2 pl-9">
                                                            {topic.subtopics?.map((subtopic, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => toggleSubtopic(topic.id, idx)}
                                                                    className="flex items-center gap-2 w-full text-left group"
                                                                >
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded flex items-center justify-center transition-colors",
                                                                        subtopicsProgress[idx]
                                                                            ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                                                                            : "bg-slate-200 dark:bg-slate-700 text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-500"
                                                                    )}>
                                                                        {subtopicsProgress[idx] ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                                                    </div>
                                                                    <span className={cn(
                                                                        "text-sm transition-colors",
                                                                        subtopicsProgress[idx]
                                                                            ? "text-slate-500 dark:text-slate-500 line-through"
                                                                            : "text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                                                    )}>
                                                                        {subtopic}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default SubjectTree;
