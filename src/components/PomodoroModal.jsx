import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Play,
    Pause,
    RotateCcw,
    ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSchedules } from '../hooks/useSchedules';
import { SUBJECTS } from '../data/subjects';



const PomodoroModal = ({ isOpen, onClose, onUpdateStudyTime }) => {
    const { filteredSubjects, activeSchedule } = useSchedules();
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [totalTime, setTotalTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editMinutes, setEditMinutes] = useState('25');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [startTime, setStartTime] = useState(null);

    const subjectsToUse = activeSchedule && filteredSubjects.length > 0 ? filteredSubjects : SUBJECTS;

    // Quick presets
    const presets = [
        { label: '15m', minutes: 15 },
        { label: '25m', minutes: 25 },
        { label: '45m', minutes: 45 },
        { label: '60m', minutes: 60 },
    ];

    // Calculate progress percentage
    const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
    const circumference = 2 * Math.PI * 120;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    // Track elapsed time when active
    useEffect(() => {
        let interval = null;
        if (isActive) {
            if (!startTime) setStartTime(Date.now());

            interval = setInterval(() => {
                if (timeLeft > 0) {
                    setTimeLeft(timeLeft - 1);
                } else {
                    setIsActive(false);
                    // Timer finished naturally
                    if (selectedSubject && startTime) {
                        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                        onUpdateStudyTime(selectedSubject, elapsedSeconds);
                        setStartTime(null);
                    }
                }
            }, 1000);
        } else {
            // Timer paused or stopped
            if (startTime && selectedSubject) {
                const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                if (elapsedSeconds > 0) {
                    onUpdateStudyTime(selectedSubject, elapsedSeconds);
                }
            }
            setStartTime(null);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, selectedSubject, startTime, onUpdateStudyTime]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTimeClick = () => {
        if (!isActive) {
            setIsEditing(true);
            setEditMinutes(Math.floor(timeLeft / 60).toString());
        }
    };

    const handleTimeSubmit = () => {
        setIsEditing(false);
        const mins = parseInt(editMinutes);
        if (!isNaN(mins) && mins > 0) {
            setTimeLeft(mins * 60);
            setTotalTime(mins * 60);
        } else {
            setEditMinutes(Math.floor(timeLeft / 60).toString());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleTimeSubmit();
        }
    };

    const handlePreset = (minutes) => {
        if (!isActive) {
            setTimeLeft(minutes * 60);
            setTotalTime(minutes * 60);
            setEditMinutes(minutes.toString());
        }
    };

    const handleReset = () => {
        setIsActive(false);
        const currentMins = parseInt(editMinutes) || 25;
        setTimeLeft(currentMins * 60);
        setTotalTime(currentMins * 60);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300
                        }}
                        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden"
                    >
                        {/* Header with gradient */}
                        <div className="relative px-8 pt-8 pb-4">
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-500/10 via-orange-500/5 to-transparent dark:from-red-500/20 dark:via-orange-500/10 pointer-events-none" />

                            <div className="relative flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                                        <Clock size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">Pomodoro</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Foco Total</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    <RotateCcw size={18} className="rotate-45" />
                                </motion.button>
                            </div>
                        </div>

                        <div className="px-8 pb-8">
                            {/* Subject Selector */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Matéria (Opcional)
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        disabled={isActive}
                                        className="w-full p-3 pl-4 pr-10 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Sem matéria específica</option>
                                        {subjectsToUse.map(s => (
                                            <option key={s.id} value={s.id}>{s.title}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Timer Circle */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative">
                                    {/* Background glow when active */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-full blur-2xl" />
                                    )}

                                    {/* Progress Ring */}
                                    <svg className="w-64 h-64 transform -rotate-90">
                                        {/* Background circle */}
                                        <circle
                                            cx="128"
                                            cy="128"
                                            r="120"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            className="text-slate-100 dark:text-slate-800"
                                        />
                                        {/* Progress circle */}
                                        <motion.circle
                                            cx="128"
                                            cy="128"
                                            r="120"
                                            stroke="url(#pomodoroGradient)"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            initial={{ strokeDashoffset: circumference }}
                                            animate={{ strokeDashoffset }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                        />
                                        <defs>
                                            <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ef4444" />
                                                <stop offset="50%" stopColor="#f97316" />
                                                <stop offset="100%" stopColor="#eab308" />
                                            </linearGradient>
                                        </defs>
                                    </svg>

                                    {/* Time Display */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        {isEditing ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={editMinutes}
                                                    onChange={(e) => setEditMinutes(e.target.value)}
                                                    onBlur={handleTimeSubmit}
                                                    onKeyDown={handleKeyDown}
                                                    autoFocus
                                                    className="text-5xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight w-24 text-center bg-transparent border-b-2 border-red-500 outline-none"
                                                />
                                                <span className="text-xl font-medium text-slate-400 mt-2">min</span>
                                            </div>
                                        ) : (
                                            <motion.div
                                                onClick={handleTimeClick}
                                                whileHover={!isActive ? { scale: 1.05 } : {}}
                                                className={cn(
                                                    "text-5xl font-bold font-mono tracking-tight transition-colors select-none",
                                                    isActive
                                                        ? "text-slate-800 dark:text-slate-100 cursor-default"
                                                        : "text-slate-800 dark:text-slate-100 cursor-pointer hover:text-red-500 dark:hover:text-red-400"
                                                )}
                                                title={!isActive ? "Clique para editar" : ""}
                                            >
                                                {formatTime(timeLeft)}
                                            </motion.div>
                                        )}
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                            {isActive ? '🔥 Focado' : isEditing ? 'Enter para salvar' : 'Clique para editar'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div className="flex justify-center gap-2 mb-6">
                                {presets.map((preset) => (
                                    <motion.button
                                        key={preset.minutes}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handlePreset(preset.minutes)}
                                        disabled={isActive}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                            parseInt(editMinutes) === preset.minutes
                                                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md shadow-red-500/25"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                                            isActive && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {preset.label}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Control Buttons */}
                            <div className="flex justify-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsActive(!isActive)}
                                    className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all",
                                        isActive
                                            ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40"
                                            : "bg-gradient-to-br from-red-500 to-orange-500 shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40"
                                    )}
                                >
                                    {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05, rotate: -15 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleReset}
                                    className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-md"
                                >
                                    <RotateCcw size={24} />
                                </motion.button>
                            </div>

                            {/* Progress indicator */}
                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500" />
                                <span>{Math.round(progressPercent)}% concluído</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PomodoroModal;
