import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, SidebarBody, SidebarLink } from './components/ui/sidebar';
import {
  BookOpen,
  Calendar,
  LayoutDashboard,
  Trophy,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  MoreVertical,
  Flame,
  Target,
  Brain,
  NotebookPen,
  BarChart2,
  Scale,
  Landmark,
  Building2,
  Gavel,
  ScrollText,
  Briefcase,
  FolderOpen,
  Book,
  Sparkles,
  Database,
  History, // Import History icon
  Menu,
  Settings as SettingsIcon
} from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './contexts/AuthContext';
import { ThemeTabs } from '@/components/ui/theme-tabs';
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
  BarChart,
  Bar,
  Legend,
  ComposedChart
} from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 h-screen overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="whitespace-pre-wrap bg-white p-4 rounded border border-red-200 text-sm font-mono">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

import { AuthProvider } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { SUBJECTS } from './data/subjects';
import Notebook from './components/Notebook';
import SubjectResources from './components/SubjectResources';
import MaterialsView from './components/MaterialsView';
import Assistant from './components/Assistant';
import VadeMecum from './components/VadeMecum';
import TimeMachine from './components/TimeMachine'; // Import TimeMachine
import Settings from './components/Settings'; // Import Settings
import { ScheduleSwitcher } from './components/ScheduleManager';
import { InitialScheduleSelector } from './components/InitialScheduleSelector';
import { ICON_MAP } from './lib/icons';
import { generateDynamicSchedule, getWeekDescription } from './lib/scheduleGenerator';

import { useProfileData, useDailyHistory, useProgressData, useStudyTime, useNotes, useMaterials, useSubjects } from './hooks/useStudyData';
import { ScheduleProvider, useSchedules } from './hooks/useSchedules';

// Suppress Recharts warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (/defaultProps/.test(args[0]) || /width\(.*\) and height\(.*\) of chart/.test(args[0])) {
    return;
  }
  originalConsoleError(...args);
};

// --- MOCK DATA ---
// SUBJECTS moved to src/data/subjects.js

// Schedule: Mapping weeks -> days -> Topic IDs
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
  },
  'week3': {
    'Dia 15': ['civ_contratos_geral', 'const_legislativo'],
    'Dia 16': ['adm_licitacoes1', 'pen_iter_concurso'],
    'Dia 17': ['proc_fase_postulatoria', 'trab_verbas'],
    'Dia 18': ['civ_contratos_especie1', 'const_poderes'],
    'Dia 19': ['adm_contratos', 'pen_penas'],
    'Dia 20': ['rev_sem3'],
    'Dia 21': ['rest'],
  },
  'week4': {
    'Dia 22': ['civ_contratos_especie2', 'const_funcoes'],
    'Dia 23': ['adm_agentes', 'pen_execucao'],
    'Dia 24': ['proc_defesa', 'trab_jornada'],
    'Dia 25': ['civ_resp_civil', 'const_controle_geral'],
    'Dia 26': ['adm_servicos', 'pen_crimes_especie'],
    'Dia 27': ['rev_sem4'],
    'Dia 28': ['rest'],
  },
  'week5': {
    'Dia 29': ['proc_provas', 'trab_justa_causa'],
    'Dia 30': ['const_controle_concentrado', 'civ_revisao_sem5'],
    'Dia 31': ['adm_resp_civil', 'pen_patrimonio'],
    'Dia 32': ['proc_sentenca', 'trab_rescisao_verbas'],
    'Dia 33': ['pen_dignidade_adm', 'adm_intervencao'],
    'Dia 34': ['rev_sem5'],
    'Dia 35': ['rest'],
  },
  'week6': {
    'Dia 36': ['proc_recursos1'],
    'Dia 37': ['proc_recursos2', 'proc_tutelas_rev'],
    'Dia 38': ['const_rev_controle', 'pen_rev_calculo'],
    'Dia 39': ['trab_prescricao', 'trab_rev_prazos'],
    'Dia 40': ['rev_simulado_final'],
    'Dia 41': ['rev_analise_erros'],
    'Dia 42': ['rest'],
  }
};

const INITIAL_STATS = {
  xp: 0,
  level: 0,
  streak: 0,
  questionsToday: 0,
  accuracy: 0, // percentage
};

// --- COMPONENTS ---

// Old Sidebar component removed





import BackupManager from './components/BackupManager';

const Header = ({ togglePomodoro, userStats, setOpen, setShowTimeMachine }) => {
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
              {/* Tomato body */}
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="tomatoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Main tomato body */}
                <ellipse cx="12" cy="13" rx="9" ry="8" fill="white" />
                {/* Highlight */}
                <ellipse cx="9" cy="11" rx="3" ry="2" fill="url(#tomatoGrad)" opacity="0.6" />
                {/* Stem */}
                <path d="M12 5 L12 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                {/* Leaves */}
                <path d="M12 6 Q8 4 7 6" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M12 6 Q16 4 17 6" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                {/* Center leaf */}
                <path d="M12 5 Q12 3 14 2" stroke="#16a34a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
              {/* Glow pulse */}
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
};

const Dashboard = ({ progress, dailyHistory, studyTime }) => {
  const { filteredSubjects, activeSchedule } = useSchedules();
  const { dynamicSchedule } = useMemo(() => {
    // Re-generate schedule here or pass it down. 
    // Ideally should be passed down, but for now we regenerate to access days calculation
    // Se filteredSubjects estiver vazio (novo usuário sem cronograma), garante array vazio
    const topics = activeSchedule ? activeSchedule.topicIds : [];
    // Only generate if we have subjects
    if (!filteredSubjects || filteredSubjects.length === 0) return { dynamicSchedule: {} };

    // We need the full schedule structure to count days
    return { dynamicSchedule: generateDynamicSchedule(topics, SUBJECTS) };
  }, [activeSchedule, filteredSubjects]);

  const stats = useMemo(() => {
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalTopics = 0;
    let topicsStudied = 0;
    let totalDays = 0;
    let currentDay = 0;

    // Use filteredSubjects se houver cronograma ativo, senão usa todos (apenas para fallback, mas idealmente sempre terá cronograma ou nada)
    const subjectsToUse = activeSchedule && filteredSubjects.length > 0 ? filteredSubjects : SUBJECTS;

    // Lista de IDs de tópicos válidos para este cronograma
    const validTopicIds = new Set(subjectsToUse.flatMap(s => s.topics.map(t => t.id)));

    // Calculate Total Study Time (Filtered)
    const totalMinutes = studyTime
      ? Object.entries(studyTime)
        .filter(([subjectId]) => subjectsToUse.some(s => s.id === subjectId))
        .reduce((acc, [_, curr]) => acc + curr, 0) / 60
      : 0;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const subjectCounts = {};

    // Initialize subject counts for filtered subjects
    subjectsToUse.forEach(s => subjectCounts[s.title] = { count: 0, color: '#94a3b8' });

    // Assign colors to subjects for the pie chart
    const colors = ['#4f46e5', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];
    subjectsToUse.forEach((s, i) => {
      if (subjectCounts[s.title]) {
        subjectCounts[s.title].color = colors[i % colors.length];
      }
    });

    Object.entries(progress).forEach(([topicId, topicData]) => {
      // Filter by valid topics
      if (!validTopicIds.has(topicId)) return;

      if (topicData.questions && typeof topicData.questions === 'object') {
        const qTotal = topicData.questions.total || 0;
        const qCorrect = topicData.questions.correct || 0;

        totalQuestions += qTotal;
        totalCorrect += qCorrect;

        // Find subject for this topic
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

    // --- NEW METRICS CALCULATIONS ---
    // 1. Total Topics (Filtered)
    totalTopics = subjectsToUse.reduce((acc, s) => acc + s.topics.length, 0);

    // 2. Topics Studied (Filtered)
    topicsStudied = Object.entries(progress).filter(([tId, p]) => validTopicIds.has(tId) && p.read).length;

    // 3. Total Days (Count days in DYNAMIC SCHEDULE)
    totalDays = 0;
    if (dynamicSchedule) {
      Object.values(dynamicSchedule).forEach(week => {
        totalDays += Object.keys(week).length;
      });
    }

    // 4. Current Day (Find the first day with uncompleted topics in DYNAMIC SCHEDULE)
    currentDay = 1;
    let daysCounted = 0;
    let foundCurrent = false;

    if (dynamicSchedule) {
      // Flatten schedule to iterate days in order
      const weeks = Object.keys(dynamicSchedule).sort(); // week1, week2...
      for (const week of weeks) {
        const days = Object.keys(dynamicSchedule[week]).sort();
        for (const day of days) {
          if (dynamicSchedule[week][day]) {
            daysCounted++;
            const dayTopics = dynamicSchedule[week][day];
            // Check if all topics in this day are studied
            const isDayComplete = dayTopics.every(tId => progress[tId]?.read);

            if (!isDayComplete && !foundCurrent) {
              currentDay = daysCounted;
              foundCurrent = true;
            }
          }
        }
      }
    }
    if (!foundCurrent && daysCounted > 0) currentDay = daysCounted; // All done
    if (daysCounted === 0) currentDay = 0; // Empty schedule

    // 5. Next Goal (Find the first uncompleted topic in DYNAMIC SCHEDULE)
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
              // Ignore non-topic IDs like 'rest' or revision markers locally if needed, 
              // but generateDynamicSchedule returns valid topicIDs mostly.
              // Check if it is a real topic in our list
              if (!validTopicIds.has(tId)) continue;

              const topicData = progress[tId] || {};

              // Check completion status
              const isRead = topicData.read;
              const isReviewed = topicData.reviewed;
              const isQuestions = topicData.questions === true || topicData.questions?.completed;

              if (!isRead || !isReviewed || !isQuestions) {
                // Found our next goal!
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

    // Se não encontrou meta mas tem cronograma vazio ou concluído
    if (!foundGoal && totalTopics > 0 && topicsStudied < totalTopics) {
      nextGoal = { title: 'Continuar Estudos', progress: 0 };
    }

    const planProgress = totalTopics > 0 ? Math.round((topicsStudied / totalTopics) * 100) : 0;

    // Evitar divisão por zero se schedule vazio
    const dayProgress = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0;

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

  // Real Weekly Data
  const weeklyChartData = useMemo(() => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 (Sun) - 6 (Sat)

    // Adjust to make Monday index 0, Sunday index 6
    const adjustedDayIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

    // Calculate the date of the Monday of the current week
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - adjustedDayIndex);

    return days.map((dayName, index) => {
      const date = new Date(mondayDate);
      date.setDate(mondayDate.getDate() + index);
      const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD

      const entry = dailyHistory[dateStr];
      let count = 0;
      if (typeof entry === 'number') {
        count = entry;
      } else if (entry) {
        count = entry.questions || 0;
      }

      // Fallback: If count is 0 for today, try to calculate from progress updated_at
      const isToday = dateStr === new Date().toLocaleDateString('en-CA');
      if (count === 0 && isToday) {
        const todayISO = dateStr; // YYYY-MM-DD
        Object.values(progress).forEach(p => {
          // Check if topic was updated today (in local time)
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

  // Animation variants for stagger effect
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
          {/* Animated gradient overlay */}
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

            {/* Decorative Background Element - Static for performance */}
            <div className="absolute -right-8 -bottom-8 opacity-[0.07] dark:opacity-[0.15] pointer-events-none">
              <Calendar size={160} strokeWidth={1} />
            </div>

            {/* Glow effect - Static for performance */}
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
          {/* Animated gradient overlay */}
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

            {/* Decorative Background Element - Static for performance */}
            <div className="absolute -right-8 -bottom-8 opacity-[0.07] dark:opacity-[0.15] pointer-events-none">
              <BookOpen size={160} strokeWidth={1} />
            </div>

            {/* Glow effect - Static for performance */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/20 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        </motion.div>
      </motion.div>

      {/* SECTION 2: KEY METRICS - Glassmorphism Cards */}
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
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/5 dark:to-purple-400/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2.5 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-xl text-indigo-600 dark:text-indigo-400"
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                  transition={{ duration: 0.5 }}
                >
                  <Brain size={22} />
                </motion.div>
                <h3 className="text-slate-600 dark:text-slate-300 font-bold text-sm">Questões</h3>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <motion.p
                  className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 150 }}
                >
                  {stats.totalQuestions}
                </motion.p>
                <p className="text-xs text-slate-400 mt-1">Respondidas</p>
              </div>
              <div className="h-10 w-20">
                {/* Animated Sparkline */}
                <div className="flex items-end justify-between h-full gap-0.5">
                  {[40, 60, 45, 70, 50, 80].map((h, i) => (
                    <motion.div
                      key={i}
                      className="w-full bg-gradient-to-t from-indigo-500 to-purple-400 dark:from-indigo-600 dark:to-purple-500 rounded-t-sm"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${h}%`, opacity: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1.1 }}
                      transition={{
                        delay: 0.4 + (i * 0.08),
                        duration: 0.6,
                        type: "spring",
                        stiffness: 100
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Taxa de Acerto */}
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
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/5 dark:to-amber-400/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className={cn(
                    "p-2.5 rounded-xl",
                    stats.accuracy >= 70
                      ? "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-600 dark:text-orange-400"
                  )}
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                  transition={{ duration: 0.5 }}
                >
                  <Target size={22} />
                </motion.div>
                <h3 className="text-slate-600 dark:text-slate-300 font-bold text-sm">Taxa de Acerto</h3>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <motion.p
                  className={cn(
                    "text-3xl font-bold bg-clip-text text-transparent",
                    stats.accuracy >= 70
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400"
                      : "bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-400 dark:to-amber-400"
                  )}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                >
                  {stats.accuracy}%
                </motion.p>
                <p className="text-xs text-slate-400 mt-1">Média geral</p>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                  <motion.circle
                    cx="28" cy="28" r="22"
                    stroke="url(#accuracyGradient)"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={138.2}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 138.2 }}
                    animate={{ strokeDashoffset: 138.2 - (138.2 * stats.accuracy) / 100 }}
                    transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
                  />
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={stats.accuracy >= 70 ? "#10b981" : "#f97316"} />
                      <stop offset="100%" stopColor={stats.accuracy >= 70 ? "#14b8a6" : "#f59e0b"} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
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
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-400/5 dark:to-orange-400/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2.5 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 rounded-xl text-yellow-600 dark:text-yellow-500"
                  whileHover={{ rotate: [0, -15, 15, 0], scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                >
                  <Trophy size={22} />
                </motion.div>
                <h3 className="text-slate-600 dark:text-slate-300 font-bold text-sm">Próxima Meta</h3>
              </div>
            </div>
            <div>
              <motion.p
                className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1"
                title={stats.nextGoal.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                {stats.nextGoal.title}
              </motion.p>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-500 dark:text-slate-400">Progresso</span>
                  <motion.span
                    className="font-bold bg-gradient-to-r from-yellow-600 to-orange-500 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {stats.nextGoal.progress}%
                  </motion.span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.nextGoal.progress}%` }}
                    transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Desempenho Semanal</h3>
          <div className="h-64 w-full min-h-[250px]">
            {weeklyChartData.every(d => d.questoes === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <BarChart2 size={48} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">Nenhuma atividade registrada nesta semana</p>
                <p className="text-xs mt-1 opacity-70">Responda questões para ver seu progresso!</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyChartData}>
                  <defs>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    allowDecimals={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'rgba(255,255,255,0.95)'
                    }}
                    itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                    labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: 4 }}
                    cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Bar
                    dataKey="questoes"
                    fill="url(#colorArea)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="questoes"
                    stroke="url(#colorLine)"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#fff', strokeWidth: 2, stroke: '#8b5cf6' }}
                    activeDot={{ r: 7, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm smooth-transition animate-slide-up" style={{ animationDelay: '0.7s' }}>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Distribuição por Matéria</h3>
          <div className="h-64 w-full min-h-[250px]">
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
                  itemStyle={{ color: '#1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {stats.pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-xs text-slate-500 dark:text-slate-400">{entry.name}</span>
              </div>
            ))}
            {stats.pieData.length === 0 && (
              <span className="text-xs text-slate-400">Nenhum dado registrado</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

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
      e.target.blur(); // Trigger blur to commit
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

const DailySchedule = ({ progress, toggleCheck, updateQuestionMetrics, notes, setNotes }) => {
  const { activeSchedule, filteredSubjects, loading: scheduleLoading } = useSchedules();
  const [selectedWeek, setSelectedWeek] = useState('week1');
  const [selectedDay, setSelectedDay] = useState('Dia 01');
  const [expandedCard, setExpandedCard] = useState(null);

  // Gera cronograma dinâmico baseado nos tópicos do schedule ativo
  const dynamicSchedule = useMemo(() => {
    if (!activeSchedule?.topicIds || activeSchedule.topicIds.length === 0) {
      return SCHEDULE; // Fallback para o schedule estático
    }
    return generateDynamicSchedule(activeSchedule.topicIds, SUBJECTS);
  }, [activeSchedule?.topicIds]);

  // Lista de semanas disponíveis
  const weeks = useMemo(() => Object.keys(dynamicSchedule).sort(), [dynamicSchedule]);

  // Garante que a semana selecionada existe
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
  const totalTasks = currentDayTopics.length * 3; // 3 tasks per topic (read, review, questions)
  let completedTasks = 0;
  currentDayTopics.forEach(t => {
    if (progress[t.id]?.read) completedTasks++;
    if (progress[t.id]?.reviewed) completedTasks++;
    // Check for object or legacy boolean
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

    // Check if all are currently completed
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
      // Ensure subtopics is an array
      const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
      totalSubtopics += subtopics.length;

      const topicData = progress[topic.id];
      if (topicData?.subtopics_progress) {
        Object.values(topicData.subtopics_progress).forEach(isCompleted => {
          if (isCompleted) completedSubtopics++;
        });
      }
    });

    return totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Edital & Matérias</h2>
          <p className="text-slate-500 dark:text-slate-400">Acompanhe seu progresso detalhado por ponto do edital</p>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredSubjects.map((subject) => {
          const isExpanded = expandedSubject === subject.id;
          const progressPct = calculateSubjectProgress(subject);
          const IconComponent = ICON_MAP[subject.icon] || BookOpen;

          return (
            <motion.div
              key={subject.id}
              layout
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-shadow duration-300 hover:shadow-lg group"
            >
              <div className="p-1">
                <button
                  onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-5 rounded-xl transition-colors",
                    isExpanded ? "bg-slate-50 dark:bg-slate-800/50" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <motion.div
                      animate={{ scale: isExpanded ? 1.05 : 1 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                        progressPct === 100 ? "bg-green-500 text-white" :
                          isExpanded ? `${subject.bg_color || subject.bgColor} text-white shadow-md` : `bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ${subject.color}`
                      )}>
                      {progressPct === 100 ? <CheckCircle2 size={28} /> : <IconComponent size={28} />}
                    </motion.div>
                    <div className="text-left">
                      <span className="block font-bold text-slate-800 dark:text-slate-100 text-xl mb-1">{subject.title}</span>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{subject.topics.length} tópicos</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className={cn(
                          "font-bold",
                          progressPct === 100 ? "text-green-600 dark:text-green-400" : subject.color
                        )}>{progressPct}% Concluído</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden md:block w-32">
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={cn("h-full rounded-full", progressPct === 100 ? "bg-green-500" : (subject.bg_color || subject.bgColor))}
                        />
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                        isExpanded ? `bg-white dark:bg-slate-800 ${subject.color} shadow-sm` : "text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400"
                      )}>
                      <ChevronRight size={20} />
                    </motion.div>
                  </div>
                </button>
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
                    <div className="border-t border-slate-100 dark:border-slate-800">
                      <div className="p-2">
                        {subject.topics.map((topic, index) => {
                          const topicData = progress[topic.id] || {};
                          const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
                          const completedCount = Object.values(topicData.subtopics_progress || {}).filter(Boolean).length;
                          const isTopicCompleted = completedCount === subtopics.length && subtopics.length > 0;

                          return (
                            <motion.div
                              key={topic.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05, duration: 0.3 }}
                              className={cn(
                                "mb-2 rounded-xl border transition-all overflow-hidden",
                                isTopicCompleted ? "bg-green-50/30 dark:bg-green-900/10 border-green-100 dark:border-green-900/30" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                              )}
                            >
                              <div className="p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => toggleTopic(topic.id, subtopics.length)}
                                    className={cn(
                                      "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                                      isTopicCompleted
                                        ? "bg-green-500 border-green-500 text-white"
                                        : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent hover:border-blue-400 dark:hover:border-blue-400"
                                    )}
                                  >
                                    <CheckCircle2 size={14} />
                                  </motion.button>
                                  {topic.title}
                                </h4>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                                  {completedCount}/{subtopics.length}
                                </span>
                              </div>

                              <div className="p-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {subtopics.map((sub, idx) => {
                                  const isSubCompleted = topicData.subtopics_progress?.[idx] || false;
                                  return (
                                    <motion.button
                                      key={idx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: (index * 0.05) + (idx * 0.03), duration: 0.25 }}
                                      whileHover={{ scale: 1.02, x: 4 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => toggleSubtopic(topic.id, idx)}
                                      className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg text-sm text-left transition-all border",
                                        isSubCompleted
                                          ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300"
                                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm"
                                      )}
                                    >
                                      <motion.div
                                        animate={{
                                          scale: isSubCompleted ? [1, 1.2, 1] : 1,
                                          backgroundColor: isSubCompleted ? "#22c55e" : "transparent"
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={cn(
                                          "mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                                          isSubCompleted
                                            ? "bg-green-500 border-green-500 text-white"
                                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent"
                                        )}>
                                        <CheckCircle2 size={12} />
                                      </motion.div>
                                      <span className={cn("leading-relaxed", isSubCompleted && "line-through opacity-70")}>
                                        {sub}
                                      </span>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
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

const PerformanceAnalytics = ({ studyTime }) => {
  const [progress] = useProgressData({});
  const { filteredSubjects, activeSchedule } = useSchedules();

  // Use filteredSubjects se houver cronograma ativo, senão usa todos
  const subjectsToUse = activeSchedule && filteredSubjects.length > 0 ? filteredSubjects : SUBJECTS;

  // Calculate Global Stats
  const globalStats = useMemo(() => {
    let totalQuestions = 0;
    let totalCorrect = 0;

    // Apenas considera os tópicos do cronograma ativo
    const topicIds = subjectsToUse.flatMap(s => s.topics.map(t => t.id));

    Object.entries(progress).forEach(([topicId, topic]) => {
      if (topicIds.includes(topicId) && topic.questions && typeof topic.questions === 'object') {
        totalQuestions += (topic.questions.total || 0);
        totalCorrect += (topic.questions.correct || 0);
      }
    });

    return {
      totalQuestions,
      totalCorrect,
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    };
  }, [progress, subjectsToUse]);

  // Calculate Subject Stats
  const subjectStats = useMemo(() => {
    return subjectsToUse.map(subject => {
      let subjectQuestions = 0;
      let subjectCorrect = 0;

      subject.topics.forEach(topic => {
        const topicData = progress[topic.id];
        if (topicData?.questions && typeof topicData.questions === 'object') {
          subjectQuestions += (topicData.questions.total || 0);
          subjectCorrect += (topicData.questions.correct || 0);
        }
      });

      return {
        name: subject.title,
        shortName: subject.id.toUpperCase().slice(0, 3),
        total: subjectQuestions,
        correct: subjectCorrect,
        accuracy: subjectQuestions > 0 ? Math.round((subjectCorrect / subjectQuestions) * 100) : 0,
        errorRate: subjectQuestions > 0 ? 100 - Math.round((subjectCorrect / subjectQuestions) * 100) : 0
      };
    }).sort((a, b) => b.accuracy - a.accuracy);
  }, [progress, subjectsToUse]);

  // Get Topic Breakdown (Weakest first)
  const topicBreakdown = useMemo(() => {
    const topics = [];
    subjectsToUse.forEach(subject => {
      subject.topics.forEach(topic => {
        const topicData = progress[topic.id];
        if (topicData?.questions && typeof topicData.questions === 'object' && topicData.questions.total > 0) {
          topics.push({
            subject: subject.title,
            topic: topic.title,
            total: topicData.questions.total,
            correct: topicData.questions.correct,
            accuracy: Math.round((topicData.questions.correct / topicData.questions.total) * 100)
          });
        }
      });
    });
    return topics.sort((a, b) => a.accuracy - b.accuracy);
  }, [progress, subjectsToUse]);

  // Calculate Study Time Data
  const studyTimeData = useMemo(() => {
    if (!studyTime) return [];

    // Pega apenas os IDs de subjects do cronograma ativo
    const subjectIds = subjectsToUse.map(s => s.id);

    return Object.entries(studyTime)
      .filter(([subjectId]) => subjectIds.includes(subjectId))
      .map(([subjectId, seconds]) => {
        const subject = subjectsToUse.find(s => s.id === subjectId);
        return {
          name: subject ? subject.title : 'Outros',
          value: Math.round(seconds / 60), // Convert to minutes
          color: subject ? (subject.id === 'civil' ? '#4f46e5' : subject.id === 'penal' ? '#ef4444' : '#10b981') : '#94a3b8' // Simplified colors
        };
      }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [studyTime]);

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Análise de Desempenho</h2>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Questões Realizadas</h3>
            <Brain className="text-blue-500 opacity-20" size={24} />
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{globalStats.totalQuestions}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Acertos Totais</h3>
            <CheckCircle2 className="text-green-500 opacity-20" size={24} />
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{globalStats.totalCorrect}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Aproveitamento Global</h3>
            <Target className="text-orange-500 opacity-20" size={24} />
          </div>
          <p className={cn(
            "text-3xl font-bold",
            globalStats.accuracy >= 70 ? "text-green-600 dark:text-green-400" : "text-orange-500 dark:text-orange-400"
          )}>{globalStats.accuracy}%</p>
        </div>
      </div>

      {/* Subject Performance Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Desempenho por Matéria (%)</h3>
        <div className="h-80 w-full min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectStats} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="shortName" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={50} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar dataKey="accuracy" name="Acertos (%)" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} barSize={20} />
              <Bar dataKey="errorRate" name="Erros (%)" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Study Time Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Clock size={20} className="text-blue-500" />
          Tempo de Estudo por Matéria
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-64 w-full min-h-[250px]">
            {studyTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studyTimeData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {studyTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatDuration(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Clock size={48} className="mb-2 opacity-20" />
                <p>Sem dados de tempo ainda</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {studyTimeData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || '#6366f1' }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{formatDuration(item.value)}</span>
              </div>
            ))}
            {studyTimeData.length === 0 && (
              <p className="text-center text-slate-500 text-sm">
                Use o Pomodoro selecionando uma matéria para registrar seu tempo de estudo líquido.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Topic Breakdown - Grouped by Subject */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Target size={20} className="text-blue-500" />
            Detalhamento por Matéria
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Clique para expandir e ver desempenho por tópico</p>
        </div>

        {subjectStats.some(s => s.total > 0) ? (
          <div className="p-6 space-y-3">
            {subjectStats.map((subject, idx) => (
              <SubjectPerformanceCard
                key={subject.name}
                subject={subject}
                progress={progress}
                subjectsToUse={subjectsToUse}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart2 size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Sem dados suficientes</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Realize questões para visualizar sua análise detalhada de desempenho por matéria e tópico.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const SubjectPerformanceCard = ({ subject, progress, subjectsToUse }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get topics for this subject
  const subjectObj = subjectsToUse.find(s => s.title === subject.name);
  const subjectTopics = subjectObj?.topics.map(topic => {
    const topicData = progress[topic.id];
    if (topicData?.questions && typeof topicData.questions === 'object' && topicData.questions.total > 0) {
      return {
        title: topic.title,
        total: topicData.questions.total,
        correct: topicData.questions.correct,
        accuracy: Math.round((topicData.questions.correct / topicData.questions.total) * 100)
      };
    }
    return null;
  }).filter(Boolean) || [];

  const hasData = subject.total > 0;

  if (!hasData) return null;

  return (
    <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-sm">
      {/* Subject Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={cn(
            "w-3 h-3 rounded-full",
            subject.accuracy >= 70 ? "bg-green-500" :
              subject.accuracy >= 50 ? "bg-yellow-500" : "bg-red-500"
          )} />
          <span className="font-bold text-slate-800 dark:text-slate-100 text-left">{subject.name}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className={cn(
            "text-xl font-bold",
            subject.accuracy >= 70 ? "text-green-600 dark:text-green-400" :
              subject.accuracy >= 50 ? "text-yellow-600 dark:text-yellow-400" :
                "text-red-600 dark:text-red-400"
          )}>
            {subject.accuracy}%
          </span>
          <ChevronDown
            size={20}
            className={cn(
              "text-slate-400 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Subject Summary */}
      <div className="px-4 pb-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{subject.correct} acertos</span>
        <span>{subject.total} total</span>
      </div>

      {/* Expanded Topics */}
      {isExpanded && subjectTopics.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span>Desempenho por Tópico</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          {subjectTopics.map((topic, topicIdx) => (
            <div key={topicIdx} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {topic.title}
                </span>
                <span className={cn(
                  "text-sm font-bold",
                  topic.accuracy >= 70 ? "text-green-600 dark:text-green-400" :
                    topic.accuracy >= 50 ? "text-yellow-600 dark:text-yellow-400" :
                      "text-red-600 dark:text-red-400"
                )}>
                  {topic.accuracy}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    topic.accuracy >= 70 ? "bg-green-500" :
                      topic.accuracy >= 50 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${topic.accuracy}%` }}
                />
              </div>

              <div className="flex items-center justify-end text-[10px] text-slate-400">
                <span>{topic.correct}/{topic.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const DEFAULT_STATS = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActivity: null,
  name: 'Thiago', // Default name
  avatar: null
};

function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [showTimeMachine, setShowTimeMachine] = useState(false);
  const [open, setOpen] = useState(false);

  // --- TEMPORARY RESET FUNCTION ---
  useEffect(() => {
    window.resetAppData = async () => {
      console.log("Resetting data (UPDATE strategy)...");
      window.isResetting = true; // Flag to prevent hooks from re-saving to localStorage
      const results = [];

      try {
        // 1. Topic Progress (Reset to false/0)
        try {
          const { error } = await supabase.from('topic_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
          if (error) throw error;
          results.push("Progress: OK");
        } catch (e) { console.error("Progress reset failed:", e); results.push("Progress: Failed"); }

        // 2. Daily History (Delete all rows)
        try {
          const { error } = await supabase.from('daily_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          results.push("History: OK");
        } catch (e) { console.error("History reset failed:", e); results.push("History: Failed"); }

        // 3. Study Time (Delete all rows)
        try {
          const { error } = await supabase.from('study_time').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          results.push("StudyTime: OK");
        } catch (e) { console.error("StudyTime reset failed:", e); results.push("StudyTime: Failed"); }

        // 4. Notes (Delete all rows)
        try {
          const { error } = await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          results.push("Notes: OK");
        } catch (e) { console.error("Notes reset failed:", e); results.push("Notes: Failed"); }

        // 5. Materials (Delete all rows)
        try {
          const { error } = await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          results.push("Materials: OK");
        } catch (e) { console.error("Materials delete failed:", e); results.push("Materials: Failed"); }

        // 6. Profile (Reset stats)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('profiles').update({
              xp: 0, level: 1, streak: 0, last_activity: null
            }).eq('id', user.id);
            results.push("Profile: OK");
          }
        } catch (e) { console.error("Profile update failed:", e); results.push("Profile: Failed"); }

        localStorage.clear();
        console.log("Reset Results:", results);

        // Wait a bit to see logs then reload
        setTimeout(() => window.location.reload(), 1000);
        return results.join(", ");
      } catch (err) {
        console.error("Global Reset Error:", err);
        return "Global Error";
      }
    };
  }, []);

  // Shared State with Supabase Sync
  const [progress, setProgress, logQuestionSession] = useProgressData({});

  const [dailyHistory, setDailyHistory] = useDailyHistory({});

  const [userStats, setUserStats, saveProfile] = useProfileData(DEFAULT_STATS);

  // StudyTime (Now Synced!)
  const [studyTime, setStudyTime, logSession] = useStudyTime({});

  // Notes (Synced)
  const [notes, setNotes, isSaving, forceSave] = useNotes({});

  // Materials (Synced)
  const { materials, addMaterial, deleteMaterial } = useMaterials([]);

  // Persistence Effects (LocalStorage is now handled inside the hooks)
  // We only keep studyTime here - REMOVED manual effect

  // XP Logic
  const addXp = (amount) => {
    setUserStats(prev => {
      const newXp = Math.max(0, prev.xp + amount); // Prevent negative XP
      const newLevel = Math.floor(newXp / 1000);

      return {
        ...prev,
        xp: newXp,
        level: newLevel
      };
    });
  };

  const updateStudyTime = (subjectId, seconds) => {
    setStudyTime(prev => {
      const currentSeconds = prev[subjectId] || 0;
      return {
        ...prev,
        [subjectId]: currentSeconds + seconds
      };
    });
    // Add XP for studying (e.g., 10 XP per minute)
    if (seconds >= 60) {
      addXp(Math.floor(seconds / 60) * 10);
      logSession(subjectId, seconds); // Log the session
    }
  };

  // Streak Logic
  const checkStreak = () => {
    setUserStats(prev => {
      const today = new Date().toLocaleDateString('en-CA');
      const lastActivity = prev.lastActivity;

      // If already active today, do nothing
      if (lastActivity === today) return prev;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');

      let newStreak = prev.streak;

      if (lastActivity === yesterdayStr) {
        // Continued streak
        newStreak += 1;
      } else {
        // Broken streak (or first day)
        newStreak = 1;
      }

      return {
        ...prev,
        streak: newStreak,
        lastActivity: today
      };
    });
  };

  // Shared Handlers
  const toggleCheck = (topicId, type) => {
    setProgress(prev => {
      const currentTopic = prev[topicId] || {};
      const newValue = !currentTopic[type];

      // XP Rewards
      if (newValue) {
        checkStreak(); // Update streak on activity
        if (type === 'read') addXp(50);
        if (type === 'reviewed') addXp(30);
      } else {
        // Optional: Remove XP if unchecked? 
        // For now, let's keep it simple and only add. 
        // Or better, subtract to prevent farming by toggling.
        if (type === 'read') addXp(-50);
        if (type === 'reviewed') addXp(-30);
      }

      return {
        ...prev,
        [topicId]: {
          ...currentTopic,
          [type]: newValue,
          updated_at: new Date().toISOString()
        }
      };
    });
  };

  const updateQuestionMetrics = (topicId, field, value) => {
    const numValue = parseInt(value) || 0;

    // Track daily history delta
    if (field === 'total') {
      const currentTotal = progress[topicId]?.questions?.total || 0;
      const delta = numValue - currentTotal;

      if (delta !== 0) {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        setDailyHistory(prev => ({
          ...prev,
          [today]: Math.max(0, (prev[today] || 0) + delta)
        }));

        // XP Reward for Questions (10 XP per question)
        addXp(delta * 10);
        checkStreak(); // Update streak on activity

        // Log Question Session (if delta is non-zero)
        if (delta !== 0) {
          // Find Subject ID
          let subjectId = 'unknown';
          for (const s of SUBJECTS) {
            if (s.topics.find(t => t.id === topicId)) {
              subjectId = s.id;
              break;
            }
          }

          // Log the session (even if negative, to represent correction)
          logQuestionSession(subjectId, topicId, delta, 0);
        }
      }
    }

    setProgress(prev => {
      const currentTopic = prev[topicId] || {};
      const currentQuestions = currentTopic.questions || {};

      return {
        ...prev,
        [topicId]: {
          ...currentTopic,
          questions: {
            ...currentQuestions,
            [field]: numValue,
            // Auto-mark as completed if total > 0
            completed: field === 'total' && numValue > 0 ? true : currentQuestions.completed
          },
          updated_at: new Date().toISOString()
        }
      };
    });
  };

  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'schedule', icon: <Calendar size={20} />, label: 'Cronograma' },
    { id: 'notebook', icon: <NotebookPen size={20} />, label: 'Caderno' },
    { id: 'assistant', icon: <Sparkles size={20} />, label: 'JusIA' }, // New Tab
    { id: 'performance', icon: <BarChart2 size={20} />, label: 'Desempenho' },
    { id: 'materials', icon: <FolderOpen size={20} />, label: 'Materiais' },
    { id: 'vademecum', icon: <Book size={20} />, label: 'Vade Mecum' },
    { id: 'subjects', icon: <BookOpen size={20} />, label: 'Edital & Matérias' },
    { id: 'questions', icon: <Brain size={20} />, label: 'Questões' },
    { id: 'settings', icon: <SettingsIcon size={20} />, label: 'Configurações' },
  ];

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row w-full overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex items-center gap-2.5 px-2 py-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className={cn("font-bold text-xl text-slate-900 dark:text-white tracking-tight transition-opacity duration-200", open ? "opacity-100" : "opacity-0 hidden")}>
                JusPlanner
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-1.5">
              {menuItems.map((item) => (
                <SidebarLink
                  key={item.id}
                  link={{
                    label: item.label,
                    href: "#",
                    icon: item.icon
                  }}
                  onClick={() => {
                    if (item.id === 'timemachine') {
                      setShowTimeMachine(true);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  active={activeTab === item.id}
                />
              ))}
            </div>
          </div>

          <div className="p-2">
            <div className={cn("bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 text-white transition-all duration-300 shadow-lg", open ? "block" : "hidden")}>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-yellow-400" size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Nível {userStats.level}</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all" style={{ width: `${(userStats.xp % 1000) / 10}%` }}></div>
              </div>
              <p className="text-xs text-slate-300">{userStats.xp % 1000} / 1000 XP</p>
            </div>
            <div className={cn("flex justify-center", open ? "hidden" : "block")}>
              <Trophy className="text-yellow-400" size={24} />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header togglePomodoro={() => setIsPomodoroOpen(true)} userStats={userStats} setOpen={setOpen} setShowTimeMachine={setShowTimeMachine} />

        <main className="flex-1 p-6 md:p-8 w-full overflow-y-auto">
          <div key={activeTab} className="animate-tab-enter space-y-6">
            {activeTab === 'dashboard' && <Dashboard progress={progress} dailyHistory={dailyHistory} studyTime={studyTime} />}
            {activeTab === 'schedule' && (
              <DailySchedule
                progress={progress}
                toggleCheck={toggleCheck}
                updateQuestionMetrics={updateQuestionMetrics}
                notes={notes}
                setNotes={setNotes}
              />
            )}
            {activeTab === 'notebook' && <Notebook notes={notes} setNotes={setNotes} isSaving={isSaving} forceSave={forceSave} />}
            {activeTab === 'assistant' && <Assistant />}
            {activeTab === 'performance' && <PerformanceAnalytics studyTime={studyTime} />}
            {activeTab === 'subjects' && <SubjectTree />}
            {activeTab === 'materials' && (
              <MaterialsView
                materials={materials}
                addMaterial={addMaterial}
                deleteMaterial={deleteMaterial}
              />
            )}
            {activeTab === 'vademecum' && <VadeMecum />}
            {
              activeTab === 'questions' && (
                <div className="max-w-5xl mx-auto flex flex-col items-center justify-center h-96 text-slate-400">
                  <Brain size={64} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium">Banco de Questões em desenvolvimento...</p>
                </div>
              )
            }
            {activeTab === 'settings' && (
              <Settings
                userName={userStats.name || 'Thiago'}
                setUserName={(name) => setUserStats(prev => ({ ...prev, name, updated_at: new Date().toISOString() }))}
                userAvatar={userStats.avatar}
                setUserAvatar={(avatar) => setUserStats(prev => ({ ...prev, avatar, updated_at: new Date().toISOString() }))}
                onManualSave={async () => {
                  try {
                    // Direct update for reliability
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    if (!currentUser) throw new Error('Usuário não autenticado');

                    const { error: updateError } = await supabase
                      .from('profiles')
                      .update({
                        avatar: userStats.avatar,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', currentUser.id);

                    if (updateError) throw updateError;

                    alert('Foto de perfil salva com sucesso!');
                  } catch (e) {
                    console.error('Erro ao salvar:', e);
                    alert('Erro ao salvar: ' + e.message);
                  }
                }}
                setShowBackup={() => setShowBackup(true)}
                onReset={() => {
                  if (window.confirm('TEM CERTEZA? Isso apagará TODO o seu progresso, notas e histórico para sempre.')) {
                    if (window.resetAppData) window.resetAppData();
                  }
                }}
              />
            )}
          </div>
        </main>
      </div>

      <PomodoroModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        onUpdateStudyTime={updateStudyTime}
      />

      {showTimeMachine && <TimeMachine onClose={() => setShowTimeMachine(false)} />}

      <InitialScheduleSelector />

    </div>
  );
}

const AppWithAuth = () => (
  <AuthProvider>
    <ScheduleProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ScheduleProvider>
  </AuthProvider>
);

export default AppWithAuth;


