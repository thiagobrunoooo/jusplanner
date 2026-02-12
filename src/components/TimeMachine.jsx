import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Trophy, ChevronLeft, ChevronRight, X, BookOpen, Brain } from 'lucide-react';
import { useDailyHistory } from '../hooks/useStudyData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECTS } from '../data/subjects';
import { cn } from '../lib/utils';

const TimeMachine = ({ onClose }) => {
    const { user } = useAuth();
    const [history] = useDailyHistory();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [questionSessions, setQuestionSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    // Helper to format date key YYYY-MM-DD
    const formatDateKey = (date) => {
        return date.toLocaleDateString('en-CA');
    };

    const selectedKey = formatDateKey(selectedDate);
    const dayData = history[selectedKey] || { questions: 0, time: 0, xp: 0 };

    // Fetch sessions for selected date
    useEffect(() => {
        const fetchSessions = async () => {
            if (!user) return;
            setLoadingSessions(true);
            try {
                const start = new Date(selectedDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(selectedDate);
                end.setHours(23, 59, 59, 999);

                // 1. Study Sessions
                const { data: studyData, error: studyError } = await supabase
                    .from('study_sessions')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString())
                    .order('created_at', { ascending: false });

                if (studyError) throw studyError;
                setSessions(studyData || []);

                // 2. Question Sessions

                const { data: qData, error: qError } = await supabase
                    .from('question_sessions')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString())
                    .order('created_at', { ascending: false });

                if (qError) throw qError;

                setQuestionSessions(qData || []);

            } catch (err) {
                console.error("Error fetching sessions:", err);
            } finally {
                setLoadingSessions(false);
            }
        };
        fetchSessions();
    }, [selectedDate, user]);

    // Calendar Logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days, firstDay } = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

    const changeMonth = (delta) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentMonth(newDate);
    };

    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const hasData = (day) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const key = formatDateKey(date);
        return history[key] && (history[key].questions > 0 || history[key].time > 0);
    };

    const getSubjectName = (id) => {
        const subj = SUBJECTS.find(s => s.id === id);
        return subj ? subj.title : 'Matéria Desconhecida';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row h-[650px] animate-scale-in">

                {/* Left Panel: Calendar */}
                <div className="w-full md:w-5/12 p-6 border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <CalendarIcon className="text-indigo-600 dark:text-indigo-400" />
                            Máquina do Tempo
                        </h2>
                        <button onClick={onClose} className="md:hidden text-slate-400">
                            <X />
                        </button>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-lg text-slate-700 dark:text-slate-200 capitalize">
                            {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                            <div key={`header-${i}`} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 flex-1 content-start">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: days }).map((_, i) => {
                            const day = i + 1;
                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const isSelected = isSameDay(date, selectedDate);
                            const dataExists = hasData(day);
                            const isFuture = date > new Date();

                            return (
                                <button
                                    key={day}
                                    onClick={() => !isFuture && setSelectedDate(date)}
                                    disabled={isFuture}
                                    className={`
                                        h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all relative
                                        ${isSelected
                                            ? 'bg-indigo-600 text-white shadow-md scale-105'
                                            : isFuture
                                                ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                                        }
                                    `}
                                >
                                    {day}
                                    {dataExists && !isSelected && (
                                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-green-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel: Stats & Sessions */}
                <div className="w-full md:w-7/12 p-0 bg-white dark:bg-slate-900 flex flex-col relative">
                    <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hidden md:block z-10">
                        <X />
                    </button>

                    <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Resumo do Dia</h3>
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white capitalize">
                                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h2>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Questões</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">{dayData.questions}</p>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Tempo</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">
                                    {Math.floor(dayData.time / 60)}h {dayData.time % 60}m
                                </p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">XP</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">{dayData.xp}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Sessions List */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">

                        {/* Study Sessions */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock size={16} />
                                Sessões de Estudo
                            </h3>

                            {loadingSessions ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : sessions.length > 0 ? (
                                <div className="space-y-3">
                                    {sessions.map((session) => (
                                        <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
                                                    <BookOpen size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                        {getSubjectName(session.subject_id)}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(session.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                                                    {Math.floor(session.duration_seconds / 60)}m
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 opacity-50">
                                    <p className="text-sm text-slate-400">Nenhuma sessão de estudo.</p>
                                </div>
                            )}
                        </div>

                        {/* Question Sessions */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Brain size={16} />
                                Questões Realizadas
                            </h3>

                            {loadingSessions ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : questionSessions.length > 0 ? (
                                <div className="space-y-3">
                                    {questionSessions.map((session) => (
                                        <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                                    session.questions_count > 0 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                                )}>
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                                        {SUBJECTS.find(s => s.id === session.subject_id)?.title || 'Questões'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "font-bold text-sm",
                                                session.questions_count > 0 ? "text-slate-800 dark:text-slate-100" : "text-red-500 dark:text-red-400"
                                            )}>
                                                {session.questions_count > 0 ? `${session.questions_count} questões` : `Correção: ${session.questions_count}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 opacity-50">
                                    <p className="text-sm text-slate-400">Nenhuma questão realizada.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeMachine;
