import React, { useState, memo } from 'react';
import {
    Flame,
    History,
    Menu
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeTabs } from '@/components/ui/theme-tabs';
import { ScheduleSwitcher } from './ScheduleManager';
import BackupManager from './BackupManager';

const Header = memo(({ togglePomodoro, userStats, setOpen, setShowTimeMachine }) => {
    const [showBackup, setShowBackup] = useState(false);
    const { user } = useAuth();

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <>
            <header className="h-16 glass-header flex items-center justify-between px-4 md:px-8 animate-slide-down">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setOpen(true)}
                        className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        <Menu size={24} />
                    </button>
                    <h2 className="hidden md:block text-base md:text-lg font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">{getGreeting()}</span>{' '}
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-bold">
                            Dr. {userStats.name || 'Thiago'}
                        </span>
                    </h2>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <ScheduleSwitcher />
                    <ThemeTabs />

                    <button
                        onClick={() => setShowTimeMachine(true)}
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-200/50 dark:border-indigo-700/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer"
                        title="Máquina do Tempo"
                    >
                        <History size={18} />
                    </button>

                    {/* Animated Streak Badge */}
                    <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 px-4 py-2 rounded-xl border border-orange-200/50 dark:border-orange-800/50 shadow-sm hover:shadow-md hover:shadow-orange-500/10 transition-all duration-300 group">
                        <div className="relative">
                            <Flame className="text-orange-500 group-hover:animate-wiggle transition-all" size={18} />
                            <div className="absolute inset-0 text-orange-400 animate-ping opacity-30">
                                <Flame size={18} />
                            </div>
                        </div>
                        <span className="font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent text-sm">
                            {userStats.streak} Dias
                        </span>
                    </div>

                    {/* Pomodoro Button */}
                    <button
                        onClick={togglePomodoro}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 hover:from-red-600 hover:to-rose-700 dark:hover:from-red-500 dark:hover:to-rose-600 flex items-center justify-center transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 group hover:scale-105 active:scale-95"
                        title="Pomodoro Timer"
                    >
                        <div className="relative">
                            <svg viewBox="0 0 24 24" className="w-5 h-5">
                                <defs>
                                    <linearGradient id="tomatoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <ellipse cx="12" cy="13" rx="9" ry="8" fill="white" />
                                <ellipse cx="9" cy="11" rx="3" ry="2" fill="url(#tomatoGrad)" opacity="0.6" />
                                <path d="M12 5 L12 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M12 6 Q8 4 7 6" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                <path d="M12 6 Q16 4 17 6" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                <path d="M12 5 Q12 3 14 2" stroke="#16a34a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 bg-white/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </button>

                    {/* Profile Button */}
                    <button
                        onClick={() => setShowBackup(true)}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 border border-blue-200/50 dark:border-blue-700/50 shadow-sm hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden"
                        title="Perfil e Dados"
                    >
                        {userStats.avatar ? (
                            <img src={userStats.avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <span className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                                {user?.email ? user.email[0].toUpperCase() : 'T'}
                            </span>
                        )}
                    </button>
                </div>
            </header>
            {showBackup && <BackupManager onClose={() => setShowBackup(false)} />}
        </>
    );
});

Header.displayName = 'Header';

export default Header;
