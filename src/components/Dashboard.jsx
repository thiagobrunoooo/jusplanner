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
import { generateDynamicSchedule } from '../lib/scheduleGenerator';
import { useReminders } from '../hooks/useReminders';



const Dashboard = ({ progress, dailyHistory, studyTime }) => {
    const { filteredSubjects, activeSchedule } = useSchedules();
    const { todayReminders, pendingCount, addReminder, updateReminder, toggleDone, togglePin, deleteReminder } = useReminders();
    const [newReminderText, setNewReminderText] = useState('');
    const [reminderColor, setReminderColor] = useState('blue');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [reminderFilter, setReminderFilter] = useState('all'); // 'all' | 'pending' | 'done'

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
    const { dynamicSchedule } = useMemo(() => {
        const topics = activeSchedule ? activeSchedule.topicIds : [];
        if (!filteredSubjects || filteredSubjects.length === 0) return { dynamicSchedule: {} };
        const settings = activeSchedule?.settings || {};
        return { dynamicSchedule: generateDynamicSchedule(topics, filteredSubjects.length > 0 ? filteredSubjects : SUBJECTS, settings) };
    }, [activeSchedule, filteredSubjects]);

    const stats = useMemo(() => {
        let totalQuestions = 0;
        let totalCorrect = 0;
        let totalTopics = 0;
        let topicsStudied = 0;
        let totalDays = 0;
        let currentDay = 0;

        const subjectsToUse = activeSchedule && filteredSubjects.length > 0 ? filteredSubjects : SUBJECTS;
        const validTopicIds = new Set(subjectsToUse.flatMap(s => s.topics.map(t => t.id)));

        const totalMinutes = studyTime
            ? Object.entries(studyTime)
                .filter(([subjectId]) => subjectsToUse.some(s => s.id === subjectId))
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

        totalDays = 0;
        if (dynamicSchedule) {
            Object.values(dynamicSchedule).forEach(week => {
                totalDays += Object.keys(week).length;
            });
        }

        currentDay = 1;
        let daysCounted = 0;
        let foundCurrent = false;

        if (dynamicSchedule) {
            const weeks = Object.keys(dynamicSchedule).sort();
            for (const week of weeks) {
                const days = Object.keys(dynamicSchedule[week]).sort();
                for (const day of days) {
                    if (dynamicSchedule[week][day]) {
                        daysCounted++;
                        const dayTopics = dynamicSchedule[week][day];
                        const isDayComplete = dayTopics.every(tId => progress[tId]?.read);

                        if (!isDayComplete && !foundCurrent) {
                            currentDay = daysCounted;
                            foundCurrent = true;
                        }
                    }
                }
            }
        }
        if (!foundCurrent && daysCounted > 0) currentDay = daysCounted;
        if (daysCounted === 0) currentDay = 0;

        let nextGoal = { title: 'Tudo Concluído!', progress: 100 };
        let foundGoal = false;

        if (dynamicSchedule) {
            const weeks = Object.keys(dynamicSchedule).sort();
            for (const week of weeks) {
                if (foundGoal) break;
                const days = Object.keys(dynamicSchedule[week]).sort();
                for (const day of days) {
                    if (dynamicSchedule[week][day]) {
                        const dayTopicsIds = dynamicSchedule[week][day];
                        for (const tId of dayTopicsIds) {
                            if (!validTopicIds.has(tId)) continue;

                            const topicData = progress[tId] || {};
                            const isRead = topicData.read;
                            const isReviewed = topicData.reviewed;
                            const isQuestions = topicData.questions === true || topicData.questions?.completed;

                            if (!isRead || !isReviewed || !isQuestions) {
                                const topicObj = subjectsToUse.flatMap(s => s.topics).find(t => t.id === tId);
                                if (topicObj) {
                                    let stepsCompleted = 0;
                                    if (isRead) stepsCompleted++;
                                    if (isReviewed) stepsCompleted++;
                                    if (isQuestions) stepsCompleted++;

                                    nextGoal = {
                                        title: topicObj.title,
                                        progress: Math.round((stepsCompleted / 3) * 100)
                                    };
                                    foundGoal = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (foundGoal) break;
                }
            }
        }

        if (!foundGoal && totalTopics > 0 && topicsStudied < totalTopics) {
            nextGoal = { title: 'Continuar Estudos', progress: 0 };
        }

        const planProgress = totalTopics > 0 ? Math.round((topicsStudied / totalTopics) * 100) : 0;

        return {
            totalQuestions,
            accuracy,
            pieData,
            totalTopics,
            topicsStudied,
            totalDays,
            currentDay,
            planProgress,
            nextGoal,
            formattedTime
        };
    }, [progress, studyTime, filteredSubjects, activeSchedule, dynamicSchedule]);

    const weeklyChartData = useMemo(() => {
        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
        const today = new Date();
        const currentDayIndex = today.getDay();
        const adjustedDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
        const mondayDate = new Date(today);
        mondayDate.setDate(today.getDate() - adjustedDayIndex);

        return days.map((dayName, index) => {
            const date = new Date(mondayDate);
            date.setDate(mondayDate.getDate() + index);
            const dateStr = date.toLocaleDateString('en-CA');

            const entry = dailyHistory[dateStr];
            let count = 0;
            if (typeof entry === 'number') {
                count = entry;
            } else if (entry) {
                count = entry.questions || 0;
            }

            const isToday = dateStr === new Date().toLocaleDateString('en-CA');
            if (count === 0 && isToday) {
                const todayISO = dateStr;
                Object.values(progress).forEach(p => {
                    if (p.updated_at) {
                        const pDate = new Date(p.updated_at);
                        const pDateStr = pDate.toLocaleDateString('en-CA');
                        if (pDateStr === todayISO) {
                            count += (p.questions?.total || 0);
                        }
                    }
                });
            }

            return {
                name: dayName,
                questoes: count
            };
        });
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
            {/* SECTION 1: PROGRESS OVERVIEW - Premium Cards */}
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" variants={containerVariants}>
                {/* Card 1: Dia Atual */}
                <motion.div
                    variants={cardVariants}
                    whileHover={{
                        scale: 1.02,
                        y: -4,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-700 rounded-3xl p-[2px] shadow-xl shadow-blue-500/20 dark:shadow-indigo-500/10 group cursor-pointer overflow-hidden"
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />

                    <div className="bg-white dark:bg-slate-950/95 rounded-[22px] p-6 h-full flex items-center justify-between relative overflow-hidden backdrop-blur-sm">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <motion.div
                                    className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Calendar size={22} />
                                </motion.div>
                                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Dia Atual</h3>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <motion.span
                                    className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                                >
                                    {stats.currentDay}
                                </motion.span>
                                <span className="text-2xl text-slate-400 font-medium">/{stats.totalDays}</span>
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="h-2.5 w-36 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.round((stats.currentDay / stats.totalDays) * 100)}%` }}
                                        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                                    />
                                </div>
                                <motion.span
                                    className="text-sm font-bold text-blue-600 dark:text-blue-400"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {Math.round((stats.currentDay / stats.totalDays) * 100)}%
                                </motion.span>
                            </div>
                        </div>

                        <div className="absolute -right-8 -bottom-8 opacity-[0.07] dark:opacity-[0.15] pointer-events-none">
                            <Calendar size={160} strokeWidth={1} />
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
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
                    className="relative bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-700 rounded-3xl p-[2px] shadow-xl shadow-emerald-500/20 dark:shadow-teal-500/10 group cursor-pointer overflow-hidden"
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />

                    <div className="bg-white dark:bg-slate-950/95 rounded-[22px] p-6 h-full flex items-center justify-between relative overflow-hidden backdrop-blur-sm">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <motion.div
                                    className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-sm"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <BookOpen size={22} />
                                </motion.div>
                                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Tópicos Estudados</h3>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <motion.span
                                    className="text-6xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent tracking-tight"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.3 }}
                                >
                                    {stats.topicsStudied}
                                </motion.span>
                                <span className="text-2xl text-slate-400 font-medium">/{stats.totalTopics}</span>
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="h-2.5 w-36 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.planProgress}%` }}
                                        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 }}
                                    />
                                </div>
                                <motion.span
                                    className="text-sm font-bold text-emerald-600 dark:text-emerald-400"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    {stats.planProgress}%
                                </motion.span>
                            </div>
                        </div>

                        <div className="absolute -right-8 -bottom-8 opacity-[0.07] dark:opacity-[0.15] pointer-events-none">
                            <BookOpen size={160} strokeWidth={1} />
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/20 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
                    </div>
                </motion.div>
            </motion.div>

            {/* SECTION 2: KEY METRICS */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-4 gap-5"
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
                                    className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-xl text-blue-600 dark:text-blue-400"
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
                                    className="p-2.5 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-xl text-purple-600 dark:text-purple-400"
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
                                    className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-xl text-green-600 dark:text-green-400"
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

                {/* Metric 3: Próxima Meta */}
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
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-400/5 dark:to-red-400/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="p-2.5 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 rounded-xl text-orange-600 dark:text-orange-400"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Target size={22} />
                                </motion.div>
                                <h3 className="text-slate-600 dark:text-slate-300 font-bold text-sm">Próxima Meta</h3>
                            </div>
                        </div>
                        <div>
                            <motion.p
                                className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45, type: "spring", stiffness: 100 }}
                                title={stats.nextGoal.title}
                            >
                                {stats.nextGoal.title}
                            </motion.p>
                            <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.nextGoal.progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{stats.nextGoal.progress}% concluído</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* SECTION 3: CHARTS + AVISOS */}
            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={containerVariants}>
                {/* Weekly Activity Chart */}
                <motion.div
                    variants={cardVariants}
                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors"
                >
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Questões na Semana</h3>
                    <div className="h-64 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="questoes"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: '#4f46e5' }}
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
                        <div className="px-6 pt-6 pb-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-xl">
                                        <Bell size={20} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Quadro de Avisos</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                            {todayReminders.length === 0 ? 'Nenhum aviso' : `${pendingCount} pendente${pendingCount !== 1 ? 's' : ''} · ${doneCount} concluído${doneCount !== 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                </div>
                                {pendingCount > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="relative"
                                    >
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <span className="min-w-[28px] h-[28px] flex items-center justify-center px-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-md shadow-amber-500/25">
                                            {pendingCount}
                                        </span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
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
                                                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
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

                        {/* Quick Add */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (newReminderText.trim()) {
                                    addReminder({ content: newReminderText, color: reminderColor });
                                    setNewReminderText('');
                                }
                            }}
                            className="px-6 pb-4 flex items-center gap-2"
                        >
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={newReminderText}
                                    onChange={(e) => setNewReminderText(e.target.value)}
                                    placeholder="Adicionar novo aviso..."
                                    className="w-full pl-4 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-1 p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                {[{ c: 'blue', bg: 'bg-blue-400' }, { c: 'amber', bg: 'bg-amber-400' }, { c: 'red', bg: 'bg-rose-400' }, { c: 'green', bg: 'bg-emerald-400' }, { c: 'purple', bg: 'bg-violet-400' }].map(({ c, bg }) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setReminderColor(c)}
                                        className={cn(
                                            "w-5 h-5 rounded-full transition-all",
                                            bg,
                                            reminderColor === c ? 'ring-2 ring-offset-2 ring-amber-500 dark:ring-offset-slate-900 scale-110' : 'opacity-35 hover:opacity-70'
                                        )}
                                        title={c === 'red' ? 'Urgente' : c === 'amber' ? 'Importante' : c === 'blue' ? 'Normal' : c === 'green' ? 'Concluído' : 'Pessoal'}
                                    />
                                ))}
                            </div>
                            <motion.button
                                type="submit"
                                disabled={!newReminderText.trim()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-25 disabled:hover:from-amber-500 disabled:hover:to-orange-500 text-white rounded-xl transition-all shadow-md shadow-amber-500/20"
                            >
                                <Plus size={18} />
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <div className="mx-6 border-t border-slate-100 dark:border-slate-800" />

                        {/* List */}
                        <div className="flex-1 max-h-[340px] overflow-y-auto">
                            {filteredReminders.length === 0 ? (
                                <div className="py-10 px-6 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center mb-4">
                                        {reminderFilter === 'done'
                                            ? <CheckCheck size={28} className="text-amber-400/60" />
                                            : reminderFilter === 'pending'
                                                ? <ClipboardList size={28} className="text-amber-400/60" />
                                                : <Sparkles size={28} className="text-amber-400/60" />
                                        }
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {reminderFilter === 'done'
                                            ? 'Nenhum aviso concluído'
                                            : reminderFilter === 'pending'
                                                ? 'Tudo em dia! 🎉'
                                                : 'Nenhum aviso ainda'
                                        }
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        {reminderFilter === 'pending'
                                            ? 'Todos os avisos foram concluídos.'
                                            : 'Adicione um aviso no campo acima.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredReminders.map((reminder, index) => {
                                        const colorConfig = {
                                            blue: { dot: 'bg-blue-400', label: 'Normal', border: 'border-l-blue-400', bg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20' },
                                            amber: { dot: 'bg-amber-500', label: 'Importante', border: 'border-l-amber-400', bg: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20' },
                                            red: { dot: 'bg-rose-500', label: 'Urgente', border: 'border-l-rose-400', bg: 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20' },
                                            green: { dot: 'bg-emerald-400', label: 'Pessoal', border: 'border-l-emerald-400', bg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20' },
                                            purple: { dot: 'bg-violet-400', label: 'Estudo', border: 'border-l-violet-400', bg: 'hover:bg-violet-50/50 dark:hover:bg-violet-950/20' },
                                        };
                                        const config = colorConfig[reminder.color] || colorConfig.blue;
                                        const isEditingThis = editingId === reminder.id;

                                        return (
                                            <motion.div
                                                key={reminder.id}
                                                layout
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20, height: 0, overflow: 'hidden' }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 30, delay: index * 0.03 }}
                                                className={cn(
                                                    "mx-3 my-1 px-4 py-3 flex items-start gap-3 group rounded-xl border-l-[3px] transition-all",
                                                    config.border,
                                                    config.bg,
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
                                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                                                            : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-400'
                                                    )}
                                                >
                                                    {reminder.is_done && <Check size={12} strokeWidth={3} />}
                                                </motion.button>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    {isEditingThis ? (
                                                        <form
                                                            className="flex items-center gap-1.5"
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                if (editingText.trim()) updateReminder(reminder.id, { content: editingText.trim() });
                                                                setEditingId(null);
                                                            }}
                                                        >
                                                            <input
                                                                type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)}
                                                                autoFocus
                                                                className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-800 dark:text-slate-200"
                                                                onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                                                            />
                                                            <button type="submit" className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"><Check size={16} /></button>
                                                            <button type="button" onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={16} /></button>
                                                        </form>
                                                    ) : (
                                                        <>
                                                            <p className={cn(
                                                                "text-sm text-slate-800 dark:text-slate-200 leading-relaxed break-words",
                                                                reminder.is_done && 'line-through text-slate-400 dark:text-slate-500'
                                                            )}>
                                                                {reminder.content}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
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
                                                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 dark:text-amber-400 font-medium">
                                                                        <Pin size={10} /> Fixado
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
                                                            onClick={() => { setEditingId(reminder.id); setEditingText(reminder.content); }}
                                                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => togglePin(reminder.id)}
                                                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
                                                            title={reminder.is_pinned ? 'Desafixar' : 'Fixar'}
                                                        >
                                                            {reminder.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteReminder(reminder.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer stats */}
                        {todayReminders.length > 0 && (
                            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${todayReminders.length > 0 ? (doneCount / todayReminders.length) * 100 : 0}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                        {Math.round(todayReminders.length > 0 ? (doneCount / todayReminders.length) * 100 : 0)}% concluído
                                    </span>
                                </div>
                                {doneCount > 0 && doneCount === todayReminders.length && (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-xs font-bold text-emerald-500 flex items-center gap-1"
                                    >
                                        <Sparkles size={14} /> Tudo feito!
                                    </motion.span>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;
