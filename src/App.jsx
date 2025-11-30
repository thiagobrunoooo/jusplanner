import React, { useState, useEffect, useMemo } from 'react';
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
  Menu
} from 'lucide-react';
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
import { ICON_MAP } from './lib/icons';

import { useProfileData, useDailyHistory, useProgressData, useStudyTime, useNotes, useMaterials, useSubjects } from './hooks/useStudyData';

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
import { useAuth } from './contexts/AuthContext';

const Header = ({ togglePomodoro, userStats, setOpen, setShowTimeMachine }) => {
  const [showBackup, setShowBackup] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <header className="h-16 glass-header flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setOpen(true)}
            className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <h2 className="hidden md:block text-base md:text-lg font-semibold text-slate-900 dark:text-white">Bom dia Dr. Thiago</h2>
        </div>

        <div className="flex items-center gap-2 md:gap-5">
          <ThemeTabs />

          <button
            onClick={() => setShowTimeMachine(true)}
            className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all cursor-pointer"
            title="Máquina do Tempo"
          >
            <History size={18} />
          </button>

          <div className="hidden md:flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-900/30">
            <Flame className="text-orange-500" size={16} />
            <span className="font-bold text-orange-700 dark:text-orange-400 text-sm">{userStats.streak} Dias</span>
          </div>

          <button
            onClick={togglePomodoro}
            className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 flex items-center justify-center transition-all shadow-sm border border-red-100 dark:border-red-900/30 group hover:scale-105"
            title="Pomodoro Timer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-red-500 transition-transform"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-4.48 10-10 10s-10-4-10-10c0-5.52 4.48-10 10-10 5.52 0 10 4.48 10 10z" fill="#ef4444" stroke="none" />
              <path d="M12 2a3 3 0 0 0-3 3" stroke="#166534" />
              <path d="M12 2a3 3 0 0 1 3 3" stroke="#166534" />
              <path d="M12 2v4" stroke="#166534" />
              <path d="M16 5c-1 0-2 1-2 1" stroke="#166534" />
            </svg>
          </button>

          <button
            onClick={() => setShowBackup(true)}
            className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm hover:scale-105 transition-transform cursor-pointer"
            title="Perfil e Dados"
          >
            {user?.email ? user.email[0].toUpperCase() : 'T'}
          </button>
        </div>
      </header>
      {showBackup && <BackupManager onClose={() => setShowBackup(false)} />}
    </>
  );
};

const Dashboard = ({ progress, dailyHistory, studyTime }) => {
  const stats = useMemo(() => {
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalTopics = 0;
    let topicsStudied = 0;
    let totalDays = 0;
    let currentDay = 0;

    // Calculate Total Study Time
    const totalMinutes = studyTime ? Object.values(studyTime).reduce((acc, curr) => acc + curr, 0) / 60 : 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const subjectCounts = {};

    // Initialize subject counts
    SUBJECTS.forEach(s => subjectCounts[s.title] = { count: 0, color: '#94a3b8' });

    // Assign colors to subjects for the pie chart
    const colors = ['#4f46e5', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];
    SUBJECTS.forEach((s, i) => {
      if (subjectCounts[s.title]) {
        subjectCounts[s.title].color = colors[i % colors.length];
      }
    });

    Object.entries(progress).forEach(([topicId, topicData]) => {
      if (topicData.questions && typeof topicData.questions === 'object') {
        const qTotal = topicData.questions.total || 0;
        const qCorrect = topicData.questions.correct || 0;

        totalQuestions += qTotal;
        totalCorrect += qCorrect;

        // Find subject for this topic
        const subject = SUBJECTS.find(s => s.topics.find(t => t.id === topicId));
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
    // 1. Total Topics
    totalTopics = SUBJECTS.reduce((acc, s) => acc + s.topics.length, 0);

    // 2. Topics Studied (Count topics with at least 'read' marked as true)
    // Filter by valid topics in SUBJECTS to avoid counting "ghost" or legacy topics
    const validTopicIds = new Set(SUBJECTS.flatMap(s => s.topics.map(t => t.id)));
    topicsStudied = Object.entries(progress).filter(([tId, p]) => validTopicIds.has(tId) && p.read).length;

    // 3. Total Days (Count days in SCHEDULE)
    totalDays = 0;
    Object.values(SCHEDULE).forEach(week => {
      totalDays += Object.keys(week).length;
    });

    // 4. Current Day (Find the first day with uncompleted topics)
    currentDay = 1;
    let daysCounted = 0;
    let foundCurrent = false;

    // Flatten schedule to iterate days in order
    const weeks = Object.keys(SCHEDULE).sort(); // week1, week2...
    for (const week of weeks) {
      const days = Object.keys(SCHEDULE[week]).sort();
      for (const day of days) {
        if (SCHEDULE[week][day]) {
          daysCounted++;
          const dayTopics = SCHEDULE[week][day];
          // Check if all topics in this day are studied
          const isDayComplete = dayTopics.every(tId => progress[tId]?.read);

          if (!isDayComplete && !foundCurrent) {
            currentDay = daysCounted;
            foundCurrent = true;
          }
        }
      }
    }
    if (!foundCurrent && daysCounted > 0) currentDay = daysCounted; // All done

    // 5. Next Goal (Find the first uncompleted topic)
    let nextGoal = { title: 'Tudo Concluído!', progress: 100 };
    let foundGoal = false;

    for (const week of weeks) {
      if (foundGoal) break;
      const days = Object.keys(SCHEDULE[week]).sort();
      for (const day of days) {
        if (SCHEDULE[week][day]) {
          const dayTopicsIds = SCHEDULE[week][day];
          for (const tId of dayTopicsIds) {
            // Skip revision/rest days for goal setting if they are just strings like 'rev_sem1'
            // Assuming we only track progress on actual topics from SUBJECTS
            const topicData = progress[tId] || {};

            // Check completion status
            const isRead = topicData.read;
            const isReviewed = topicData.reviewed;
            const isQuestions = topicData.questions === true || topicData.questions?.completed;

            if (!isRead || !isReviewed || !isQuestions) {
              // Found our next goal!
              const topicObj = SUBJECTS.flatMap(s => s.topics).find(t => t.id === tId);
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

    const planProgress = totalTopics > 0 ? Math.round((topicsStudied / totalTopics) * 100) : 0;
    const dayProgress = totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0; // Just a rough progress of days

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
  }, [progress, studyTime]);

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SECTION 1: PROGRESS OVERVIEW (New Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Dia Atual */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-900 dark:to-slate-900 rounded-3xl p-1 shadow-lg shadow-blue-200/50 dark:shadow-none group hover:scale-[1.01] smooth-transition animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white dark:bg-slate-950/90 rounded-[22px] p-6 h-full flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  <Calendar size={20} />
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Dia Atual</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-800 dark:text-white tracking-tight">
                  {stats.currentDay}
                </span>
                <span className="text-xl text-slate-400 font-medium">/{stats.totalDays}</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 w-32 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.round((stats.currentDay / stats.totalDays) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {Math.round((stats.currentDay / stats.totalDays) * 100)}%
                </span>
              </div>
            </div>

            {/* Decorative Background Element */}
            <div className="absolute -right-6 -bottom-6 opacity-5 dark:opacity-10 pointer-events-none">
              <Calendar size={140} />
            </div>
          </div>
        </div>

        {/* Card 2: Tópicos Estudados */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-900 dark:to-slate-900 rounded-3xl p-1 shadow-lg shadow-emerald-200/50 dark:shadow-none group hover:scale-[1.01] smooth-transition animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white dark:bg-slate-950/90 rounded-[22px] p-6 h-full flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Tópicos Estudados</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-800 dark:text-white tracking-tight">
                  {stats.topicsStudied}
                </span>
                <span className="text-xl text-slate-400 font-medium">/{stats.totalTopics}</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 w-32 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${stats.planProgress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.planProgress}%
                </span>
              </div>
            </div>

            {/* Decorative Background Element */}
            <div className="absolute -right-6 -bottom-6 opacity-5 dark:opacity-10 pointer-events-none">
              <BookOpen size={140} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: KEY METRICS (Restored & Enhanced) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric 0: Tempo Líquido (New) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md smooth-transition group animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Clock size={22} />
              </div>
              <h3 className="text-slate-600 dark:text-slate-300 font-bold">Tempo Líquido</h3>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.formattedTime}</p>
            <p className="text-xs text-slate-400 mt-1">Total acumulado</p>
          </div>
        </div>

        {/* Metric 1: Questões */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md smooth-transition group animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Brain size={22} />
              </div>
              <h3 className="text-slate-600 dark:text-slate-300 font-bold">Questões Totais</h3>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalQuestions}</p>
              <p className="text-xs text-slate-400 mt-1">Respondidas até agora</p>
            </div>
            <div className="h-10 w-20">
              {/* Mini Sparkline Placeholder */}
              <div className="flex items-end justify-between h-full gap-1">
                {[40, 60, 45, 70, 50, 80].map((h, i) => (
                  <div key={i} className="w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Taxa de Acerto */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md smooth-transition group animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                <Target size={22} />
              </div>
              <h3 className="text-slate-600 dark:text-slate-300 font-bold">Taxa de Acerto</h3>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className={cn(
                "text-3xl font-bold",
                stats.accuracy >= 70 ? "text-green-600 dark:text-green-400" : "text-orange-500 dark:text-orange-400"
              )}>{stats.accuracy}%</p>
              <p className="text-xs text-slate-400 mt-1">Média de desempenho</p>
            </div>
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * stats.accuracy) / 100} className={stats.accuracy >= 70 ? "text-green-500" : "text-orange-500"} strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Metric 3: Próxima Meta */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md smooth-transition group animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
                <Trophy size={22} />
              </div>
              <h3 className="text-slate-600 dark:text-slate-300 font-bold">Próxima Meta</h3>
            </div>
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1" title={stats.nextGoal.title}>
              {stats.nextGoal.title}
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-500 dark:text-slate-400">Progresso</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.nextGoal.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-yellow-400 h-full rounded-full animate-pulse transition-all duration-1000 ease-out"
                  style={{ width: `${stats.nextGoal.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm smooth-transition animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Desempenho Semanal (Real)</h3>
          <div className="h-64 w-full min-h-[250px]">
            {weeklyChartData.every(d => d.questoes === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <BarChart2 size={48} className="mb-3 opacity-20" />
                <p className="text-sm font-medium">Nenhuma atividade registrada nesta semana</p>
                <p className="text-xs mt-1 opacity-70">Responda questões para ver seu progresso!</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyChartData}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b' }}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="questoes"
                    stroke="url(#colorUv)"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#1e1b4b', strokeWidth: 3, stroke: '#8b5cf6' }}
                    activeDot={{ r: 8, fill: '#8b5cf6', stroke: '#fff' }}
                  />
                </LineChart>
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
    </div>
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
  const [selectedWeek, setSelectedWeek] = useState('week1');
  const [selectedDay, setSelectedDay] = useState('Dia 01');
  const [expandedCard, setExpandedCard] = useState(null);

  const days = useMemo(() => Object.keys(SCHEDULE[selectedWeek]).sort(), [selectedWeek]);

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

  const currentDayTopicsIds = SCHEDULE[selectedWeek]?.[selectedDay] || [];
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
            {selectedWeek === 'week1' && 'Semana 01: Fundamentos e Teoria Geral'}
            {selectedWeek === 'week2' && 'Semana 02: Obrigações, Atos e Excludentes'}
            {selectedWeek === 'week3' && 'Semana 03: Contratos, Licitações e Procedimento'}
            {selectedWeek === 'week4' && 'Semana 04: Contratos II, Agentes e Processo'}
            {selectedWeek === 'week5' && 'Semana 05: Provas, Recursos e Crimes Específicos'}
            {selectedWeek === 'week6' && 'Semana 06: Recursos Cíveis e Refinamento Final'}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full xl:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto no-scrollbar w-full xl:w-auto">
            <div className="flex min-w-max">
              <button
                onClick={() => setSelectedWeek('week1')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedWeek === 'week1' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Semana 1
              </button>
              <button
                onClick={() => setSelectedWeek('week2')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedWeek === 'week2' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Semana 2
              </button>
              <button
                onClick={() => setSelectedWeek('week3')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedWeek === 'week3' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Semana 3
              </button>
              <button
                onClick={() => setSelectedWeek('week4')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedWeek === 'week4' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Semana 4
              </button>
              <button
                onClick={() => setSelectedWeek('week5')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedWeek === 'week5' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Semana 5
              </button>
              <button
                onClick={() => setSelectedWeek('week6')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  selectedWeek === 'week6' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Semana 6
              </button>
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
              <div
                key={topic.id}
                className={cn(
                  "bg-white dark:bg-slate-900 rounded-2xl border smooth-transition overflow-hidden group animate-slide-up",
                  isExpanded ? "border-blue-200 dark:border-blue-800 shadow-lg ring-1 ring-blue-100 dark:ring-blue-900" : "border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm"
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
                  <ChevronDown
                    className={cn("text-slate-300 dark:text-slate-600 transition-transform duration-300", isExpanded && "rotate-180 text-blue-500 dark:text-blue-400")}
                  />
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-0 border-t border-slate-50 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">

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
                )}
              </div>
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
  const { subjects, loading } = useSubjects();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando edital...</div>;
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
        {subjects.map((subject) => {
          const isExpanded = expandedSubject === subject.id;
          const progressPct = calculateSubjectProgress(subject);
          const IconComponent = ICON_MAP[subject.icon] || BookOpen;

          return (
            <div key={subject.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-lg group">
              <div className="p-1">
                <button
                  onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-5 rounded-xl transition-colors",
                    isExpanded ? "bg-slate-50 dark:bg-slate-800/50" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                      progressPct === 100 ? "bg-green-500 text-white" :
                        isExpanded ? `${subject.bg_color || subject.bgColor} text-white shadow-md` : `bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ${subject.color}`
                    )}>
                      {progressPct === 100 ? <CheckCircle2 size={28} /> : <IconComponent size={28} />}
                    </div>
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
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", progressPct === 100 ? "bg-green-500" : (subject.bg_color || subject.bgColor))}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      isExpanded ? `bg-white dark:bg-slate-800 ${subject.color} rotate-90 shadow-sm` : "text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400"
                    )}>
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800">
                  <div className="p-2">
                    {subject.topics.map((topic, index) => {
                      const topicData = progress[topic.id] || {};
                      const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];
                      const completedCount = Object.values(topicData.subtopics_progress || {}).filter(Boolean).length;
                      const isTopicCompleted = completedCount === subtopics.length && subtopics.length > 0;

                      return (
                        <div key={topic.id} className={cn(
                          "mb-2 rounded-xl border transition-all overflow-hidden",
                          isTopicCompleted ? "bg-green-50/30 dark:bg-green-900/10 border-green-100 dark:border-green-900/30" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                        )}>
                          <div className="p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3">
                              <button
                                onClick={() => toggleTopic(topic.id, subtopics.length)}
                                className={cn(
                                  "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                                  isTopicCompleted
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent hover:border-blue-400 dark:hover:border-blue-400"
                                )}
                              >
                                <CheckCircle2 size={14} />
                              </button>
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
                                <button
                                  key={idx}
                                  onClick={() => toggleSubtopic(topic.id, idx)}
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg text-sm text-left transition-all border",
                                    isSubCompleted
                                      ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300"
                                      : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm"
                                  )}
                                >
                                  <div className={cn(
                                    "mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                                    isSubCompleted
                                      ? "bg-green-500 border-green-500 text-white"
                                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent"
                                  )}>
                                    <CheckCircle2 size={12} />
                                  </div>
                                  <span className={cn("leading-relaxed", isSubCompleted && "line-through opacity-70")}>
                                    {sub}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


const PomodoroModal = ({ isOpen, onClose, onUpdateStudyTime }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMinutes, setEditMinutes] = useState('25');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [startTime, setStartTime] = useState(null);

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
    } else {
      // Revert if invalid
      setEditMinutes(Math.floor(timeLeft / 60).toString());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTimeSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-96 shadow-2xl transform transition-all scale-100 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">Foco Total</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <RotateCcw size={20} className="rotate-45" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Matéria (Opcional)
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={isActive}
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sem matéria específica</option>
            {SUBJECTS.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        <div className="text-center mb-8">
          {isEditing ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              <input
                type="number"
                value={editMinutes}
                onChange={(e) => setEditMinutes(e.target.value)}
                onBlur={handleTimeSubmit}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-7xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tighter w-40 text-center bg-slate-50 dark:bg-slate-800 border-b-4 border-blue-500 outline-none rounded-lg"
              />
              <span className="text-2xl font-bold text-slate-400 mt-4">min</span>
            </div>
          ) : (
            <div
              onClick={handleTimeClick}
              className={cn(
                "text-7xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tighter cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors select-none",
                isActive && "cursor-default hover:text-slate-800 dark:hover:text-slate-100"
              )}
              title={!isActive ? "Clique para editar o tempo" : ""}
            >
              {formatTime(timeLeft)}
            </div>
          )}
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {isEditing ? 'Pressione Enter para salvar' : 'Hora de estudar!'}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95",
              isActive ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>
          <button
            onClick={() => {
              setIsActive(false);
              // Reset to the last set custom time or default 25
              const currentMins = parseInt(editMinutes) || 25;
              setTimeLeft(currentMins * 60);
            }}
            className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PerformanceAnalytics = ({ studyTime }) => {
  const [progress] = useProgressData({});

  // Calculate Global Stats
  const globalStats = useMemo(() => {
    let totalQuestions = 0;
    let totalCorrect = 0;

    Object.values(progress).forEach(topic => {
      if (topic.questions && typeof topic.questions === 'object') {
        totalQuestions += (topic.questions.total || 0);
        totalCorrect += (topic.questions.correct || 0);
      }
    });

    return {
      totalQuestions,
      totalCorrect,
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    };
  }, [progress]);

  // Calculate Subject Stats
  const subjectStats = useMemo(() => {
    return SUBJECTS.map(subject => {
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
  }, [progress]);

  // Get Topic Breakdown (Weakest first)
  const topicBreakdown = useMemo(() => {
    const topics = [];
    SUBJECTS.forEach(subject => {
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
  }, [progress]);

  // Calculate Study Time Data
  const studyTimeData = useMemo(() => {
    if (!studyTime) return [];

    return Object.entries(studyTime).map(([subjectId, seconds]) => {
      const subject = SUBJECTS.find(s => s.id === subjectId);
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
            {subjectStats.map((subject, idx) => {
              // Get topics for this subject
              const subjectObj = SUBJECTS.find(s => s.title === subject.name);
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

              const [isExpanded, setIsExpanded] = useState(false);
              const hasData = subject.total > 0;

              if (!hasData) return null;

              return (
                <div
                  key={idx}
                  className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-sm"
                >
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
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="text-slate-300 dark:text-slate-600" size={32} />
            </div>
            <h3 className="text-slate-400 dark:text-slate-500 font-medium mb-2">Nenhum dado registrado ainda</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Comece a resolver questões no Cronograma para ver suas estatísticas aqui!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const DEFAULT_STATS = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActivity: null
};

function App() {
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

  const [userStats, setUserStats] = useProfileData(DEFAULT_STATS);

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
  ];

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row w-full overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex items-center gap-2.5 px-2 py-5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                J
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
          </div>
        </main>
      </div>

      <PomodoroModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        onUpdateStudyTime={updateStudyTime}
      />

      {showTimeMachine && <TimeMachine onClose={() => setShowTimeMachine(false)} />}

    </div>
  );
}

const AppWithAuth = () => (
  <AuthProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </AuthProvider>
);

export default AppWithAuth;


