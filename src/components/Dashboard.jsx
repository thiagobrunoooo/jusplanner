import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    Clock,
    CheckCircle2,
    Brain,
    Target,
    Pin,
    PinOff,
    Trash2,
    Plus,
    StickyNote,
    Check,
    Pencil,
    X,
    Bell,
    ListTodo,
    CheckCheck,
    Sparkles,
    ClipboardList,
    AlertCircle,
    LayoutGrid,
    List,
    Flame
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { useSchedules } from '../hooks/useSchedules';
import { SUBJECTS } from '../data/subjects';
import { generateDynamicSchedule, resolveScheduleStructure } from '../lib/scheduleGenerator';
import { useReminders } from '../hooks/useReminders';



const Dashboard = ({ progress = {}, dailyHistory = {}, studyTime = {}, userStats = {}, onNavigate }) => {
    const { filteredSubjects, activeSchedule } = useSchedules();
    const { todayReminders, pendingCount, addReminder, updateReminder, toggleDone, togglePin, deleteReminder } = useReminders();
    const [newReminderText, setNewReminderText] = useState('');
    const [reminderColor, setReminderColor] = useState('amber');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [editingColor, setEditingColor] = useState('amber');
    const [isAddingReminder, setIsAddingReminder] = useState(false);
    const [reminderFilter, setReminderFilter] = useState('all'); // 'all' | 'pending' | 'done'

    const PRIORITY_OPTIONS = useMemo(() => [
        { id: 'amber', label: 'Importante', icon: '⭐', bg: 'bg-amber-400', activeClass: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-600' },
        { id: 'red', label: 'Urgente', icon: '🚨', bg: 'bg-rose-500', activeClass: 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-600' },
        { id: 'blue', label: 'Normal', icon: '📘', bg: 'bg-blue-500', activeClass: 'bg-blue-100 text-blue-900 border-blue-400 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-600' },
        { id: 'green', label: 'Metas', icon: '🎯', bg: 'bg-emerald-500', activeClass: 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-600' },
        { id: 'purple', label: 'Estudo', icon: '⚖️', bg: 'bg-violet-500', activeClass: 'bg-violet-100 text-violet-900 border-violet-400 dark:bg-violet-950/80 dark:text-violet-200 dark:border-violet-600' },
    ], []);

    const [viewMode, setViewMode] = useState(() => {
        try {
            return localStorage.getItem('jusplanner_reminders_view_mode') || 'grid';
        } catch {
            return 'grid';
        }
    });

    const handleSetViewMode = (mode) => {
        setViewMode(mode);
        try {
            localStorage.setItem('jusplanner_reminders_view_mode', mode);
        } catch (e) {
            console.error(e);
        }
    };

    // Helper: relative time ago
    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'agora';
        if (diffMin < 60) return `${diffMin}min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH}h`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return `${diffD}d`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    // Filtered reminders based on active tab
    const filteredReminders = useMemo(() => {
        if (reminderFilter === 'pending') return todayReminders.filter(r => !r.is_done);
        if (reminderFilter === 'done') return todayReminders.filter(r => r.is_done);
        return todayReminders;
    }, [todayReminders, reminderFilter]);

    const doneCount = useMemo(() => todayReminders.filter(r => r.is_done).length, [todayReminders]);

    // Calculate dynamic schedule based on active schedule or fallback to default
    const dynamicSchedule = useMemo(() => {
        const subjectsToUse = filteredSubjects.length > 0 ? filteredSubjects : SUBJECTS;

        if (!activeSchedule) {
            const allTopicIds = subjectsToUse.flatMap(s => s.topics.map(t => t.id));
            return generateDynamicSchedule(allTopicIds, subjectsToUse);
        }

        return resolveScheduleStructure(activeSchedule, subjectsToUse);
    }, [activeSchedule, filteredSubjects]);

    // Calculate Stats with real progress & active schedule
    const stats = useMemo(() => {
        const subjectsToUse = filteredSubjects.length > 0 ? filteredSubjects : SUBJECTS;
        const validTopicIds = new Set(subjectsToUse.flatMap(s => s.topics.map(t => t.id)));

        let totalQuestions = 0;
        let totalCorrect = 0;
        let topicsStudied = 0;
        let totalTopics = 0;

        const totalMinutes = studyTime
            ? Object.entries(studyTime)
                .filter(([tId]) => validTopicIds.has(tId))
                .reduce((acc, [_, curr]) => acc + curr, 0) / 60
            : 0;

        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        const subjectCounts = {};
        subjectsToUse.forEach(s => subjectCounts[s.title] = { count: 0, color: '#94a3b8' });

        const colors = ['#4f46e5', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];
        subjectsToUse.forEach((s, i) => {
            if (subjectCounts[s.title]) {
                subjectCounts[s.title].color = colors[i % colors.length];
            }
        });

        Object.entries(progress).forEach(([topicId, topicData]) => {
            if (!validTopicIds.has(topicId)) return;

            if (topicData.questions && typeof topicData.questions === 'object') {
                const qTotal = topicData.questions.total || 0;
                const qCorrect = topicData.questions.correct || 0;

                totalQuestions += qTotal;
                totalCorrect += qCorrect;

                const subject = subjectsToUse.find(s => s.topics.find(t => t.id === topicId));
                if (subject && subjectCounts[subject.title]) {
                    subjectCounts[subject.title].count += qTotal;
                }
            }
        });

        const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        const pieData = Object.entries(subjectCounts)
            .filter(([_, data]) => data.count > 0)
            .map(([name, data]) => ({
                name,
                value: data.count,
                color: data.color
            }));

        totalTopics = subjectsToUse.reduce((acc, s) => acc + s.topics.length, 0);
        topicsStudied = Object.entries(progress).filter(([tId, p]) => validTopicIds.has(tId) && p.read).length;

        // Natural key sort
        const sortNatural = (arr) => [...arr].sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        let activeWeekKey = 'week1';
        let activeDayKey = 'Dia 01';
        let activeWeekNum = 1;
        let activeDayNum = 1;
        let todayTopicsList = [];
        let isTodayRest = false;
        let isTodayReview = false;
        let todayCompletedTasks = 0;
        let todayTotalTasks = 0;
        let totalDaysCount = 0;
        let currentDayIndexInTotal = 1;

        if (dynamicSchedule && typeof dynamicSchedule === 'object') {
            const sortedWeeks = sortNatural(Object.keys(dynamicSchedule));
            let foundIncomplete = false;
            let dayCounter = 0;

            for (const wKey of sortedWeeks) {
                const wDays = dynamicSchedule[wKey];
                if (!wDays || typeof wDays !== 'object') continue;
                const sortedDays = sortNatural(Object.keys(wDays));

                for (const dKey of sortedDays) {
                    dayCounter++;
                    const rawIds = wDays[dKey] || [];
                    const studyIds = rawIds.filter(id => id !== 'rest' && id !== 'review');

                    if (studyIds.length === 0) {
                        if (!foundIncomplete) {
                            activeWeekKey = wKey;
                            activeDayKey = dKey;
                            currentDayIndexInTotal = dayCounter;
                            foundIncomplete = true;
                        }
                        continue;
                    }

                    const isDone = studyIds.every(id => {
                        const p = progress?.[id];
                        return Boolean(p?.read || p?.is_read || p?.reviewed || p?.is_reviewed || p?.questions?.completed || (p?.questions?.total && p.questions.total > 0));
                    });

                    if (!isDone && !foundIncomplete) {
                        activeWeekKey = wKey;
                        activeDayKey = dKey;
                        currentDayIndexInTotal = dayCounter;
                        foundIncomplete = true;
                    }
                }
            }

            totalDaysCount = dayCounter;
            if (!foundIncomplete && sortedWeeks.length > 0) {
                activeWeekKey = sortedWeeks[sortedWeeks.length - 1];
                const daysInLastWeek = sortNatural(Object.keys(dynamicSchedule[activeWeekKey] || {}));
                if (daysInLastWeek.length > 0) {
                    activeDayKey = daysInLastWeek[daysInLastWeek.length - 1];
                    currentDayIndexInTotal = totalDaysCount;
                }
            }

            activeWeekNum = parseInt(activeWeekKey.replace(/\D/g, '')) || 1;
            activeDayNum = parseInt(activeDayKey.replace(/\D/g, '')) || 1;

            const dayRawIds = dynamicSchedule[activeWeekKey]?.[activeDayKey] || [];
            isTodayRest = dayRawIds.length === 1 && dayRawIds[0] === 'rest';
            isTodayReview = dayRawIds.length === 1 && dayRawIds[0] === 'review';

            const allTopics = subjectsToUse.flatMap(s => s.topics.map(t => ({ ...t, subjectTitle: s.title, subjectColor: s.color, subjectBgLight: s.bgLight })));
            todayTopicsList = dayRawIds
                .filter(id => id !== 'rest' && id !== 'review')
                .map(id => allTopics.find(t => t.id === id))
                .filter(Boolean);

            todayTotalTasks = todayTopicsList.length * 3;
            todayTopicsList.forEach(t => {
                const p = progress?.[t.id];
                if (p?.read || p?.is_read) todayCompletedTasks++;
                if (p?.reviewed || p?.is_reviewed) todayCompletedTasks++;
                if (p?.questions?.completed || (p?.questions?.total && p.questions.total > 0) || p?.questions === true) todayCompletedTasks++;
            });
        }

        const todayProgress = todayTotalTasks > 0
            ? Math.round((todayCompletedTasks / todayTotalTasks) * 100)
            : (isTodayRest || isTodayReview ? 100 : 0);

        const planProgress = totalTopics > 0 ? Math.round((topicsStudied / totalTopics) * 100) : 0;

        return {
            totalQuestions,
            totalCorrect,
            accuracy,
            pieData,
            totalTopics,
            topicsStudied,
            totalDays: totalDaysCount || 60,
            currentDay: currentDayIndexInTotal || 1,
            planProgress,
            formattedTime,
            todayStudy: {
                weekKey: activeWeekKey,
                dayKey: activeDayKey,
                weekNum: activeWeekNum,
                dayNum: activeDayNum,
                topics: todayTopicsList,
                isRest: isTodayRest,
                isReview: isTodayReview,
                totalTasks: todayTotalTasks,
                completedTasks: todayCompletedTasks,
                progress: todayProgress
            }
        };
    }, [progress, studyTime, filteredSubjects, activeSchedule, dynamicSchedule]);

    const { chartData: weeklyChartData, totalLast7Days, avgLast7Days } = useMemo(() => {
        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const fullDaysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        const list = [];
        let total = 0;

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
            const dayOfWeekShort = daysOfWeek[date.getDay()];
            const dayOfWeekFull = fullDaysOfWeek[date.getDay()];
            const dayMonth = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

            // Label exibido no eixo X
            let label = `${dayOfWeekShort} ${dayMonth}`;
            let fullTitle = `${dayOfWeekFull}, ${dayMonth}`;
            if (i === 0) {
                label = 'Hoje';
                fullTitle = `Hoje (${dayOfWeekFull}, ${dayMonth})`;
            } else if (i === 1) {
                label = 'Ontem';
                fullTitle = `Ontem (${dayOfWeekFull}, ${dayMonth})`;
            }

            // 1. Busca no dailyHistory
            const entry = dailyHistory[dateStr];
            let count = 0;
            if (typeof entry === 'number' && !isNaN(entry)) {
                count = entry;
            } else if (entry && typeof entry === 'object') {
                count = Number(entry.questions || entry.questions_count || 0) || 0;
            } else if (typeof entry === 'string') {
                count = parseInt(entry, 10) || 0;
            }

            // 2. Busca e valida no progresso de tópicos timestampados para este dia
            let progressCountForDay = 0;
            Object.values(progress || {}).forEach(p => {
                if (!p) return;
                const q = p.questions;
                const qTotal = typeof q === 'object' ? Number(q.total || 0) : (q === true ? 1 : 0);

                // Verifica se há registro timestampado neste dia
                const completedDate = q?.completed_date;
                const lastCompleted = q?.last_completed_at || p.updated_at;
                const historyCount = p.questions_history?.[dateStr];

                if (historyCount !== undefined && historyCount !== null) {
                    progressCountForDay += Number(historyCount) || 0;
                } else if (completedDate === dateStr) {
                    progressCountForDay += qTotal;
                } else if (lastCompleted && lastCompleted.startsWith(dateStr) && qTotal > 0) {
                    progressCountForDay += qTotal;
                }
            });

            const finalCount = Math.max(count, progressCountForDay);
            total += finalCount;

            list.push({
                name: label,
                fullTitle: fullTitle,
                dateStr: dateStr,
                questoes: finalCount
            });
        }

        return {
            chartData: list,
            totalLast7Days: total,
            avgLast7Days: Math.round(total / 7)
        };
    }, [dailyHistory, progress]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.05
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
                mass: 0.8
            }
        }
    };

    const metricCardVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 120,
                damping: 12
            }
        }
    };

    return (
        <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* SECTION 1: PROGRESS OVERVIEW - 3 Cards lado a lado */}
            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6" variants={containerVariants}>
                {/* Card 1: Dia Atual */}
                <motion.div
                    variants={cardVariants}
                    whileHover={{
                        scale: 1.02,
                        y: -4,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-700 rounded-3xl p-[2px] shadow-xl shadow-blue-500/20 dark:shadow-indigo-500/10 group cursor-pointer overflow-hidden flex flex-col"
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />

                    <div className="bg-white dark:bg-slate-950/95 rounded-[22px] p-5 lg:p-6 h-full flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2.5 mb-2.5">
                                <motion.div
                                    className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Calendar size={20} />
                                </motion.div>
                                <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-wider">Dia Atual</h3>
                            </div>
                            <div className="flex items-baseline gap-1.5 mt-1">
                                <motion.span
                                    className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                                >
                                    {stats.currentDay}
                                </motion.span>
                                <span className="text-xl text-slate-400 font-medium">/{stats.totalDays}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-2 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between relative z-10">
                            <div className="h-2 flex-1 max-w-[120px] bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden shadow-inner mr-2.5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.round((stats.currentDay / stats.totalDays) * 100)}%` }}
                                    transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                                />
                            </div>
                            <motion.span
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                {Math.round((stats.currentDay / stats.totalDays) * 100)}% concluído
                            </motion.span>
                        </div>

                        <div className="absolute -right-6 -bottom-6 opacity-[0.06] dark:opacity-[0.12] pointer-events-none">
                            <Calendar size={120} strokeWidth={1} />
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-blue-500/20 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                    </div>
                </motion.div>

                {/* Card 2: Tópicos Estudados */}
                <motion.div
                    variants={cardVariants}
                    whileHover={{
                        scale: 1.02,
                        y: -4,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="relative bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-700 rounded-3xl p-[2px] shadow-xl shadow-emerald-500/20 dark:shadow-teal-500/10 group cursor-pointer overflow-hidden flex flex-col"
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />

                    <div className="bg-white dark:bg-slate-950/95 rounded-[22px] p-5 lg:p-6 h-full flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2.5 mb-2.5">
                                <motion.div
                                    className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-sm"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <BookOpen size={20} />
                                </motion.div>
                                <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-wider">Tópicos Estudados</h3>
                            </div>
                            <div className="flex items-baseline gap-1.5 mt-1">
                                <motion.span
                                    className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent tracking-tight"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.3 }}
                                >
                                    {stats.topicsStudied}
                                </motion.span>
                                <span className="text-xl text-slate-400 font-medium">/{stats.totalTopics}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-2 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between relative z-10">
                            <div className="h-2 flex-1 max-w-[120px] bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden shadow-inner mr-2.5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.planProgress}%` }}
                                    transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 }}
                                />
                            </div>
                            <motion.span
                                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                {stats.planProgress}% da grade
                            </motion.span>
                        </div>

                        <div className="absolute -right-6 -bottom-6 opacity-[0.06] dark:opacity-[0.12] pointer-events-none">
                            <BookOpen size={120} strokeWidth={1} />
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-emerald-500/20 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
                    </div>
                </motion.div>

                {/* Card 3: Estudar Hoje (Substituindo a Próxima Meta e integrado ao Cronograma) */}
                <motion.div
                    variants={cardVariants}
                    onClick={() => onNavigate?.('schedule')}
                    whileHover={{
                        scale: 1.02,
                        y: -4,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-indigo-600 dark:from-amber-600 dark:via-orange-600 dark:to-indigo-700 rounded-3xl p-[2px] shadow-xl shadow-orange-500/20 dark:shadow-orange-500/10 group cursor-pointer overflow-hidden flex flex-col"
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />

                    <div className="bg-white dark:bg-slate-950/95 rounded-[22px] p-5 lg:p-6 h-full flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-xl text-amber-600 dark:text-amber-400 shadow-sm"
                                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Target size={20} />
                                    </motion.div>
                                    <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-wider">Estudar Hoje</h3>
                                </div>

                                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 flex-shrink-0">
                                    <span>Abrir</span>
                                    <span>→</span>
                                </span>
                            </div>

                            {/* Conteúdo: apenas os assuntos do dia */}
                            <div className="space-y-2 mt-2">
                                {stats.todayStudy.isRest ? (
                                    <div className="py-1">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                            <span>☕ Dia de Descanso</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">Recarregue as energias para o próximo ciclo</p>
                                    </div>
                                ) : stats.todayStudy.isReview ? (
                                    <div className="py-1">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                            <span>🔄 Revisão e Questões</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">Consolidação da memória e treino</p>
                                    </div>
                                ) : stats.todayStudy.topics.length > 0 ? (
                                    <div className="space-y-2">
                                        {stats.todayStudy.topics.slice(0, 3).map((topic) => (
                                            <div key={topic.id} className="flex items-center gap-2 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                                    {topic.title}
                                                </span>
                                            </div>
                                        ))}
                                        {stats.todayStudy.topics.length > 3 && (
                                            <p className="text-[11px] font-semibold text-slate-400 pl-3.5">
                                                + {stats.todayStudy.topics.length - 3} outros assuntos hoje
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-1">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Plano Pronto para Estudar</p>
                                        <p className="text-[11px] text-slate-400">Clique para abrir sua grade diária</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="absolute -right-6 -bottom-6 opacity-[0.06] dark:opacity-[0.12] pointer-events-none">
                            <Target size={120} strokeWidth={1} />
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-orange-500/20 dark:bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
                    </div>
                </motion.div>
            </motion.div>

            {/* SECTION 2: KEY METRICS (4 CARDS) */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                variants={containerVariants}
            >
                {/* Metric 0: Tempo Líquido */}
                <motion.div
                    variants={metricCardVariants}
                    whileHover={{
                        scale: 1.03,
                        y: -6,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-md hover:shadow-xl group cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/5 dark:to-indigo-400/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-xl text-blue-600 dark:text-blue-400 shadow-xs"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Clock size={22} />
                                </motion.div>
                                <h3 className="text-slate-600 dark:text-slate-300 font-bold text-sm">Tempo Líquido</h3>
                            </div>
                        </div>
                        <div>
                            <motion.p
                                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                            >
                                {stats.formattedTime}
                            </motion.p>
                            <p className="text-xs text-slate-400 mt-1">Total acumulado</p>
                        </div>
                    </div>
                </motion.div>

                {/* Metric 1: Questões */}
                <motion.div
                    variants={metricCardVariants}
                    whileHover={{
                        scale: 1.03,
                        y: -6,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-md hover:shadow-xl group cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/5 dark:to-pink-400/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="p-2.5 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-xl text-purple-600 dark:text-purple-400 shadow-xs"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Brain size={22} />
                                </motion.div>
                                <h3 className="text-slate-600 dark:text-slate-300 font-bold text-sm">Questões</h3>
                            </div>
                        </div>
                        <div>
                            <motion.p
                                className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, type: "spring", stiffness: 100 }}
                            >
                                {stats.totalQuestions}
                            </motion.p>
                            <p className="text-xs text-slate-400 mt-1">Total realizadas</p>
                        </div>
                    </div>
                </motion.div>

                {/* Metric 2: Aproveitamento */}
                <motion.div
                    variants={metricCardVariants}
                    whileHover={{
                        scale: 1.03,
                        y: -6,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-md hover:shadow-xl group cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/5 dark:to-emerald-400/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-xl text-green-600 dark:text-green-400 shadow-xs"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <CheckCircle2 size={22} />
                                </motion.div>
                                <h3 className="text-slate-600 dark:text-slate-300 font-bold text-sm">Aproveitamento</h3>
                            </div>
                        </div>
                        <div>
                            <motion.p
                                className={cn(
                                    "text-3xl font-bold bg-clip-text text-transparent",
                                    stats.accuracy >= 70
                                        ? "bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400"
                                        : "bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-400 dark:to-amber-400"
                                )}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                            >
                                {stats.accuracy}%
                            </motion.p>
                            <p className="text-xs text-slate-400 mt-1">Taxa de acertos</p>
                        </div>
                    </div>
                </motion.div>

                {/* Metric 3: Acertos Líquidos (Total de questões acertadas) */}
                <motion.div
                    variants={metricCardVariants}
                    whileHover={{
                        scale: 1.03,
                        y: -6,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-md hover:shadow-xl group cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 dark:from-teal-400/5 dark:to-emerald-400/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="p-2.5 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 rounded-xl text-teal-600 dark:text-teal-400 shadow-xs"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <CheckCheck size={22} />
                                </motion.div>
                                <h3 className="text-slate-600 dark:text-slate-300 font-bold text-sm">Acertos Líquidos</h3>
                            </div>
                        </div>
                        <div>
                            <motion.p
                                className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45, type: "spring", stiffness: 100 }}
                            >
                                {stats.totalCorrect}
                            </motion.p>
                            <p className="text-xs text-slate-400 mt-1">Respostas corretas</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* SECTION 3: CHARTS + AVISOS */}
            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={containerVariants}>
                {/* Weekly Activity Chart (Últimos 7 Dias) */}
                <motion.div
                    variants={cardVariants}
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors flex flex-col justify-between"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Questões nos Últimos 7 Dias</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Histórico diário contínuo de resolução</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                                {totalLast7Days} {totalLast7Days === 1 ? 'questão' : 'questões'}
                            </span>
                            {totalLast7Days > 0 && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline-block">
                                    • Média {avgLast7Days}/dia
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="h-64 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#94a3b8" allowDecimals={false} />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900/95 text-white dark:bg-slate-800/95 p-3 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-sm">
                                                    <p className="font-semibold text-slate-300 mb-1">{data.fullTitle}</p>
                                                    <p className="text-base font-bold text-indigo-400 flex items-center gap-1.5">
                                                        <span>🎯 {data.questoes}</span>
                                                        <span className="text-xs font-normal text-slate-300">{data.questoes === 1 ? 'questão feita' : 'questões feitas'}</span>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="questoes"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Subject Distribution Pie Chart */}
                <motion.div
                    variants={cardVariants}
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors"
                >
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Questões por Matéria</h3>
                    <div className="h-64 w-full min-h-[250px]">
                        {stats.pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Brain size={48} className="mb-2 opacity-20" />
                                <p>Sem dados de questões ainda</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 📌 Quadro de Avisos — Redesigned */}
                <motion.div
                    variants={cardVariants}
                    className="relative lg:col-span-2"
                >
                    <div className="relative h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-md overflow-hidden transition-colors flex flex-col">

                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-amber-500/10 to-orange-500/20 dark:from-amber-500/20 dark:to-orange-500/30 rounded-xl border border-amber-500/20">
                                        <Bell size={20} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Quadro de Avisos</h3>
                                            {todayReminders.some(r => r.is_pinned) && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/80 shadow-xs">
                                                    <Pin size={10} className="fill-amber-500 text-amber-600" />
                                                    <span>Destaques</span>
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {todayReminders.length === 0 ? 'Nenhum aviso no mural' : `${pendingCount} pendente${pendingCount !== 1 ? 's' : ''} · ${doneCount} concluído${doneCount !== 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* + Novo Aviso Button */}
                                    <motion.button
                                        type="button"
                                        onClick={() => setIsAddingReminder(prev => !prev)}
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm",
                                            isAddingReminder
                                                ? "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                                                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20"
                                        )}
                                        title={isAddingReminder ? 'Fechar formulário' : 'Criar novo aviso'}
                                    >
                                        {isAddingReminder ? <X size={15} /> : <Plus size={15} />}
                                        <span>{isAddingReminder ? 'Fechar' : 'Novo Aviso'}</span>
                                    </motion.button>

                                    {/* View Mode Toggle */}
                                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                                        <button
                                            type="button"
                                            onClick={() => handleSetViewMode('grid')}
                                            className={cn(
                                                "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                                                viewMode === 'grid'
                                                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                            )}
                                            title="Modo Mural de Post-its"
                                        >
                                            <LayoutGrid size={15} />
                                            <span className="hidden sm:inline text-[11px]">Mural</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSetViewMode('list')}
                                            className={cn(
                                                "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all",
                                                viewMode === 'list'
                                                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                            )}
                                            title="Modo Lista Compacta"
                                        >
                                            <List size={15} />
                                            <span className="hidden sm:inline text-[11px]">Lista</span>
                                        </button>
                                    </div>

                                    {pendingCount > 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="relative"
                                        >
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            <span className="min-w-[26px] h-[26px] flex items-center justify-center px-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-md shadow-amber-500/25">
                                                {pendingCount}
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                {[
                                    { id: 'all', label: 'Todos', icon: ListTodo, count: todayReminders.length },
                                    { id: 'pending', label: 'Pendentes', icon: AlertCircle, count: pendingCount },
                                    { id: 'done', label: 'Concluídos', icon: CheckCheck, count: doneCount },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setReminderFilter(tab.id)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                                            reminderFilter === tab.id
                                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                        )}
                                    >
                                        <tab.icon size={14} />
                                        <span>{tab.label}</span>
                                        {tab.count > 0 && (
                                            <span className={cn(
                                                "min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold rounded-full",
                                                reminderFilter === tab.id
                                                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                            )}>{tab.count}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Collapsible Panel for Adding New Reminder & Suggestions */}
                        <AnimatePresence>
                            {isAddingReminder && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="overflow-hidden bg-gradient-to-b from-amber-50/50 to-white dark:from-slate-800/80 dark:to-slate-900 border-y border-amber-200/70 dark:border-slate-800 px-6 py-4 space-y-3"
                                >
                                    {/* Quick Suggestion Chips */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
                                            <Sparkles size={12} className="text-amber-500" />
                                            <span>Sugestões Rápidas:</span>
                                        </span>
                                        {[
                                            { label: '📖 20 arts. CF/88', text: 'Ler 20 artigos da Constituição Federal', color: 'blue' },
                                            { label: '⚖️ Súmulas STF/STJ', text: 'Revisar últimas súmulas do STF e STJ', color: 'purple' },
                                            { label: '🎯 30 Questões', text: 'Resolver bloco de 30 questões comentadas', color: 'green' },
                                            { label: '📝 Redação / Peça', text: 'Elaborar 1 peça prática / redação jurídica', color: 'amber' },
                                            { label: '🚨 Simulado Semanal', text: 'Realizar simulado cronometrado de fim de semana', color: 'red' },
                                        ].map((preset, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setNewReminderText(preset.text);
                                                    setReminderColor(preset.color);
                                                }}
                                                className="px-2.5 py-1 bg-white hover:bg-amber-100/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-amber-800 dark:text-slate-200 dark:hover:text-amber-200 text-[11px] font-medium rounded-lg border border-slate-200/80 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 whitespace-nowrap transition-all shadow-2xs flex-shrink-0"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Quick Add Form with Explicit Classification */}
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (newReminderText.trim()) {
                                                addReminder({ content: newReminderText, color: reminderColor });
                                                setNewReminderText('');
                                                setIsAddingReminder(false);
                                            }
                                        }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={newReminderText}
                                                    onChange={(e) => setNewReminderText(e.target.value)}
                                                    placeholder="Escreva um novo aviso no mural (Ex: Revisar súmulas vinculantes)..."
                                                    autoFocus
                                                    className="w-full pl-4 pr-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-2xs"
                                                />
                                            </div>
                                            <motion.button
                                                type="submit"
                                                disabled={!newReminderText.trim()}
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.96 }}
                                                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-25 disabled:hover:from-amber-500 disabled:hover:to-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 flex-shrink-0"
                                            >
                                                <Plus size={16} />
                                                <span>Adicionar</span>
                                            </motion.button>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingReminder(false)}
                                                className="px-3 py-2.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>

                                        {/* Classification / Priority Selector Pills */}
                                        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex-shrink-0">
                                                Classificação:
                                            </span>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {PRIORITY_OPTIONS.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => setReminderColor(opt.id)}
                                                        className={cn(
                                                            "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border",
                                                            reminderColor === opt.id
                                                                ? `${opt.activeClass} shadow-xs font-bold scale-[1.03]`
                                                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                        )}
                                                    >
                                                        <span className={cn("w-2 h-2 rounded-full", opt.bg)} />
                                                        <span>{opt.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Content Area (Mural vs Lista) */}
                        <div className="flex-1 max-h-[420px] overflow-y-auto p-4 sm:p-6">
                            {filteredReminders.length === 0 ? (
                                <div className="py-10 px-6 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center mb-4 shadow-inner">
                                        {reminderFilter === 'done'
                                            ? <CheckCheck size={28} className="text-amber-500/70" />
                                            : reminderFilter === 'pending'
                                                ? <ClipboardList size={28} className="text-amber-500/70" />
                                                : <Sparkles size={28} className="text-amber-500/70" />
                                        }
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        {reminderFilter === 'done'
                                            ? 'Nenhum aviso concluído'
                                            : reminderFilter === 'pending'
                                                ? 'Tudo em dia! 🎉'
                                                : 'Mural limpo e pronto para novos avisos'
                                        }
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                                        {reminderFilter === 'pending'
                                            ? 'Todos os avisos foram concluídos com sucesso.'
                                            : 'Nenhum aviso pendente. Clique abaixo para fixar um novo aviso no mural.'
                                        }
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingReminder(true)}
                                        className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                                    >
                                        <Plus size={15} />
                                        <span>Criar Novo Aviso</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* 📌 MODO MURAL DE POST-ITS (GRID VIEW - PROPORTIONAL SQUARE POST-ITS) */}
                                    {viewMode === 'grid' && (
                                        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,240px))] gap-4 pb-3 justify-start">
                                            {/* Subtle + Add Post-it card in Grid */}
                                            {!isAddingReminder && (
                                                <motion.button
                                                    type="button"
                                                    onClick={() => setIsAddingReminder(true)}
                                                    whileHover={{ scale: 1.02, borderColor: 'rgb(245, 158, 11)' }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 aspect-square min-h-[190px] max-w-[240px] w-full flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all group p-4"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-slate-200/70 dark:bg-slate-700/60 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 flex items-center justify-center transition-colors">
                                                        <Plus size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-300">Novo Post-it</span>
                                                    <span className="text-[10px] text-slate-400 text-center">Clique para fixar um aviso</span>
                                                </motion.button>
                                            )}
                                            <AnimatePresence mode="popLayout">
                                                {filteredReminders.map((reminder, index) => {
                                                    const colorConfig = {
                                                        amber: {
                                                            label: 'Importante',
                                                            cardBg: 'bg-gradient-to-br from-amber-50/90 via-amber-100/50 to-amber-100/80 dark:from-slate-800 dark:via-slate-800/95 dark:to-amber-950/40 border-amber-300/80 dark:border-amber-500/40',
                                                            tapeBg: 'bg-amber-200/60 dark:bg-amber-400/20 border-amber-300/60',
                                                            badge: 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200',
                                                            dot: 'bg-amber-500',
                                                            textColor: 'text-amber-950 dark:text-amber-100'
                                                        },
                                                        red: {
                                                            label: 'Urgente',
                                                            cardBg: 'bg-gradient-to-br from-rose-50/90 via-rose-100/50 to-rose-100/80 dark:from-slate-800 dark:via-slate-800/95 dark:to-rose-950/40 border-rose-300/80 dark:border-rose-500/40',
                                                            tapeBg: 'bg-rose-200/60 dark:bg-rose-400/20 border-rose-300/60',
                                                            badge: 'bg-rose-200/80 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200',
                                                            dot: 'bg-rose-500',
                                                            textColor: 'text-rose-950 dark:text-rose-100'
                                                        },
                                                        blue: {
                                                            label: 'Normal',
                                                            cardBg: 'bg-gradient-to-br from-sky-50/90 via-blue-100/50 to-blue-100/80 dark:from-slate-800 dark:via-slate-800/95 dark:to-blue-950/40 border-blue-300/80 dark:border-blue-500/40',
                                                            tapeBg: 'bg-blue-200/60 dark:bg-blue-400/20 border-blue-300/60',
                                                            badge: 'bg-blue-200/80 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200',
                                                            dot: 'bg-blue-500',
                                                            textColor: 'text-blue-950 dark:text-blue-100'
                                                        },
                                                        green: {
                                                            label: 'Metas',
                                                            cardBg: 'bg-gradient-to-br from-emerald-50/90 via-emerald-100/50 to-emerald-100/80 dark:from-slate-800 dark:via-slate-800/95 dark:to-emerald-950/40 border-emerald-300/80 dark:border-emerald-500/40',
                                                            tapeBg: 'bg-emerald-200/60 dark:bg-emerald-400/20 border-emerald-300/60',
                                                            badge: 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200',
                                                            dot: 'bg-emerald-500',
                                                            textColor: 'text-emerald-950 dark:text-emerald-100'
                                                        },
                                                        purple: {
                                                            label: 'Estudo',
                                                            cardBg: 'bg-gradient-to-br from-purple-50/90 via-violet-100/50 to-violet-100/80 dark:from-slate-800 dark:via-slate-800/95 dark:to-violet-950/40 border-purple-300/80 dark:border-purple-500/40',
                                                            tapeBg: 'bg-purple-200/60 dark:bg-purple-400/20 border-purple-300/60',
                                                            badge: 'bg-purple-200/80 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200',
                                                            dot: 'bg-violet-500',
                                                            textColor: 'text-purple-950 dark:text-purple-100'
                                                        },
                                                    };
                                                    const config = colorConfig[reminder.color] || colorConfig.amber;
                                                    const isEditingThis = editingId === reminder.id;
                                                    const rotations = ['rotate-[-0.8deg]', 'rotate-[0.7deg]', 'rotate-[-0.5deg]', 'rotate-[0.8deg]', 'rotate-[-0.6deg]', 'rotate-[0.5deg]'];
                                                    const rotationClass = rotations[index % rotations.length];

                                                    return (
                                                        <motion.div
                                                            key={reminder.id}
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.85, y: -10 }}
                                                            transition={{ type: 'spring', stiffness: 350, damping: 25, delay: index * 0.02 }}
                                                            className={cn(
                                                                "relative group rounded-2xl p-4 border shadow-sm transition-all duration-200 flex flex-col justify-between hover:rotate-0 hover:scale-[1.03] hover:shadow-md aspect-square min-h-[190px] max-w-[240px] w-full",
                                                                config.cardBg,
                                                                rotationClass,
                                                                reminder.is_pinned && 'ring-2 ring-amber-400/70 dark:ring-amber-500/50 shadow-md',
                                                                reminder.is_done && 'opacity-60 grayscale-[30%]'
                                                            )}
                                                        >
                                                            {/* Washi Tape Effect on Top */}
                                                            <div className={cn(
                                                                "absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 rounded-xs border shadow-2xs backdrop-blur-xs transform rotate-[-1deg] pointer-events-none z-10",
                                                                config.tapeBg
                                                            )} />

                                                            {/* Pin Badge on Pinned Post-its */}
                                                            {reminder.is_pinned && (
                                                                <div className="absolute -top-2.5 left-3 z-20 flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-200 dark:bg-amber-900/90 px-2 py-0.5 rounded-full border border-amber-400/80 dark:border-amber-600 shadow-xs">
                                                                    <Pin size={10} className="fill-amber-600 text-amber-700" />
                                                                    <span>Fixado</span>
                                                                </div>
                                                            )}

                                                            {/* Top action row */}
                                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                                <motion.button
                                                                    onClick={() => toggleDone(reminder.id)}
                                                                    whileHover={{ scale: 1.15 }}
                                                                    whileTap={{ scale: 0.85 }}
                                                                    className={cn(
                                                                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                                                        reminder.is_done
                                                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                                                            : 'border-slate-400/70 dark:border-slate-500 hover:border-emerald-500 bg-white/80 dark:bg-slate-900/80'
                                                                    )}
                                                                    title={reminder.is_done ? 'Marcar como pendente' : 'Concluir aviso'}
                                                                >
                                                                    {reminder.is_done && <Check size={12} strokeWidth={3} />}
                                                                </motion.button>

                                                                {!isEditingThis && (
                                                                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingId(reminder.id);
                                                                                setEditingText(reminder.content);
                                                                                setEditingColor(reminder.color || 'amber');
                                                                            }}
                                                                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white/80 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                            title="Editar"
                                                                        >
                                                                            <Pencil size={13} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => togglePin(reminder.id)}
                                                                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-white/80 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                            title={reminder.is_pinned ? 'Desafixar' : 'Fixar no topo'}
                                                                        >
                                                                            {reminder.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => deleteReminder(reminder.id)}
                                                                            className="p-1 text-slate-500 hover:text-red-600 hover:bg-white/80 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                            title="Excluir"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Post-it Body */}
                                                            <div className="flex-1 my-1 flex items-center overflow-hidden">
                                                                {isEditingThis ? (
                                                                    <form
                                                                        className="w-full space-y-1.5"
                                                                        onSubmit={(e) => {
                                                                            e.preventDefault();
                                                                            if (editingText.trim()) {
                                                                                updateReminder(reminder.id, {
                                                                                    content: editingText.trim(),
                                                                                    color: editingColor || reminder.color
                                                                                });
                                                                            }
                                                                            setEditingId(null);
                                                                        }}
                                                                    >
                                                                        <textarea
                                                                            rows={2}
                                                                            value={editingText}
                                                                            onChange={(e) => setEditingText(e.target.value)}
                                                                            autoFocus
                                                                            className="w-full p-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-slate-100 resize-none"
                                                                            onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                                                                        />
                                                                        {/* Classification selector during edit */}
                                                                        <div className="flex items-center gap-1 flex-wrap">
                                                                            {PRIORITY_OPTIONS.map((opt) => (
                                                                                <button
                                                                                    key={opt.id}
                                                                                    type="button"
                                                                                    onClick={() => setEditingColor(opt.id)}
                                                                                    className={cn(
                                                                                        "px-1 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 border transition-all",
                                                                                        (editingColor || reminder.color) === opt.id
                                                                                            ? `${opt.activeClass} ring-1 ring-amber-500/50`
                                                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                                                                    )}
                                                                                >
                                                                                    <span className={cn("w-1.5 h-1.5 rounded-full", opt.bg)} />
                                                                                    <span>{opt.label}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                        <div className="flex justify-end gap-1 pt-0.5">
                                                                            <button type="button" onClick={() => setEditingId(null)} className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">Cancelar</button>
                                                                            <button type="submit" className="px-2 py-0.5 text-[10px] bg-emerald-600 text-white font-bold rounded-md shadow-xs">Salvar</button>
                                                                        </div>
                                                                    </form>
                                                                ) : (
                                                                    <p className={cn(
                                                                        "text-xs font-semibold leading-relaxed break-words line-clamp-5 w-full",
                                                                        config.textColor,
                                                                        reminder.is_done && 'line-through text-slate-400 dark:text-slate-500'
                                                                    )}>
                                                                        {reminder.content}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Post-it Footer */}
                                                            <div className="flex items-center justify-between pt-1.5 border-t border-black/5 dark:border-white/5">
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                                                    config.badge
                                                                )}>
                                                                    <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                                                                    {config.label}
                                                                </span>
                                                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                                    {timeAgo(reminder.created_at)}
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* 📋 MODO LISTA CLEAN (COMPACT LIST VIEW) */}
                                    {viewMode === 'list' && (
                                        <div className="space-y-1.5">
                                            <AnimatePresence mode="popLayout">
                                                {filteredReminders.map((reminder, index) => {
                                                    const colorConfig = {
                                                        amber: { dot: 'bg-amber-500', label: 'Importante', border: 'border-l-amber-400', bg: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20' },
                                                        red: { dot: 'bg-rose-500', label: 'Urgente', border: 'border-l-rose-400', bg: 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' },
                                                        blue: { dot: 'bg-blue-500', label: 'Normal', border: 'border-l-blue-400', bg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20' },
                                                        green: { dot: 'bg-emerald-500', label: 'Metas', border: 'border-l-emerald-400', bg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20' },
                                                        purple: { dot: 'bg-violet-500', label: 'Estudo', border: 'border-l-violet-400', bg: 'hover:bg-violet-50/50 dark:hover:bg-violet-950/20' },
                                                    };
                                                    const config = colorConfig[reminder.color] || colorConfig.amber;
                                                    const isEditingThis = editingId === reminder.id;

                                                    return (
                                                        <motion.div
                                                            key={reminder.id}
                                                            layout
                                                            initial={{ opacity: 0, y: -6 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, x: -20, height: 0, overflow: 'hidden' }}
                                                            transition={{ type: 'spring', stiffness: 400, damping: 30, delay: index * 0.02 }}
                                                            className={cn(
                                                                "px-3.5 py-2.5 flex items-start gap-3 group rounded-xl border border-slate-200/70 dark:border-slate-800 border-l-[4px] transition-all bg-white dark:bg-slate-800/70 shadow-2xs",
                                                                config.border,
                                                                config.bg,
                                                                reminder.is_pinned && 'ring-1 ring-amber-400/50 dark:ring-amber-500/30',
                                                                reminder.is_done && 'opacity-50'
                                                            )}
                                                        >
                                                            {/* Check button */}
                                                            <motion.button
                                                                onClick={() => toggleDone(reminder.id)}
                                                                whileHover={{ scale: 1.2 }}
                                                                whileTap={{ scale: 0.8 }}
                                                                className={cn(
                                                                    "mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                                                    reminder.is_done
                                                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                                                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                                                                )}
                                                            >
                                                                {reminder.is_done && <Check size={12} strokeWidth={3} />}
                                                            </motion.button>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                {isEditingThis ? (
                                                                    <form
                                                                        className="space-y-2"
                                                                        onSubmit={(e) => {
                                                                            e.preventDefault();
                                                                            if (editingText.trim()) {
                                                                                updateReminder(reminder.id, {
                                                                                    content: editingText.trim(),
                                                                                    color: editingColor || reminder.color
                                                                                });
                                                                            }
                                                                            setEditingId(null);
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-1.5">
                                                                            <input
                                                                                type="text"
                                                                                value={editingText}
                                                                                onChange={(e) => setEditingText(e.target.value)}
                                                                                autoFocus
                                                                                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                                                                                onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                                                                            />
                                                                            <button type="submit" className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"><Check size={15} /></button>
                                                                            <button type="button" onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={15} /></button>
                                                                        </div>
                                                                        {/* Classification selector in list edit */}
                                                                        <div className="flex items-center gap-1 flex-wrap">
                                                                            {PRIORITY_OPTIONS.map((opt) => (
                                                                                <button
                                                                                    key={opt.id}
                                                                                    type="button"
                                                                                    onClick={() => setEditingColor(opt.id)}
                                                                                    className={cn(
                                                                                        "px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border transition-all",
                                                                                        (editingColor || reminder.color) === opt.id
                                                                                            ? `${opt.activeClass} ring-1 ring-amber-500/50`
                                                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                                                                    )}
                                                                                >
                                                                                    <span className={cn("w-1.5 h-1.5 rounded-full", opt.bg)} />
                                                                                    <span>{opt.label}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </form>
                                                                ) : (
                                                                    <>
                                                                        <p className={cn(
                                                                            "text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed break-words",
                                                                            reminder.is_done && 'line-through text-slate-400 dark:text-slate-500'
                                                                        )}>
                                                                            {reminder.content}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider',
                                                                                reminder.color === 'red' && 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
                                                                                reminder.color === 'amber' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                                                                                reminder.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                                                                                reminder.color === 'green' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                                                                                reminder.color === 'purple' && 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
                                                                            )}>
                                                                                <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
                                                                                {config.label}
                                                                            </span>
                                                                            {reminder.is_pinned && (
                                                                                <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                                                                                    <Pin size={9} className="fill-amber-500" /> Fixado
                                                                                </span>
                                                                            )}
                                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                                {timeAgo(reminder.created_at)}
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Action buttons */}
                                                            {!isEditingThis && (
                                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-start">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingId(reminder.id);
                                                                            setEditingText(reminder.content);
                                                                            setEditingColor(reminder.color || 'amber');
                                                                        }}
                                                                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                                                                        title="Editar"
                                                                    >
                                                                        <Pencil size={13} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => togglePin(reminder.id)}
                                                                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
                                                                        title={reminder.is_pinned ? 'Desafixar' : 'Fixar'}
                                                                    >
                                                                        {reminder.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => deleteReminder(reminder.id)}
                                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                                                        title="Excluir"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                                {/* Add button in List Mode */}
                                                {!isAddingReminder && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddingReminder(true)}
                                                        className="w-full py-2.5 px-3.5 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60 rounded-xl text-xs font-semibold text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-50/40 dark:bg-slate-800/20 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <Plus size={14} />
                                                        <span>Adicionar novo aviso</span>
                                                    </button>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer stats & gamified progress slogan */}
                        {todayReminders.length > 0 && (
                            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-2">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="h-2 w-28 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${todayReminders.length > 0 ? (doneCount / todayReminders.length) * 100 : 0}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {Math.round(todayReminders.length > 0 ? (doneCount / todayReminders.length) * 100 : 0)}% concluído
                                    </span>
                                </div>

                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    {doneCount === todayReminders.length ? (
                                        <motion.span
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                                        >
                                            <Sparkles size={14} className="text-amber-500" />
                                            <span>Mural 100% cumprido! Parabéns! 🏆</span>
                                        </motion.span>
                                    ) : doneCount >= todayReminders.length / 2 ? (
                                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                            <Flame size={14} />
                                            <span>Mais da metade concluída! Falta pouco! 🔥</span>
                                        </span>
                                    ) : (
                                        <span>Foco nas metas do dia! 🚀</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;
