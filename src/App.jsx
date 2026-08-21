import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from './components/ui/sidebar';
import {
  BookOpen,
  Calendar,
  LayoutDashboard,
  Trophy,
  Brain,
  NotebookPen,
  BarChart2,
  FolderOpen,
  Book,
  Sparkles,
  Settings as SettingsIcon
} from 'lucide-react';
import { cn } from './lib/utils';
import LoginScreen from './components/LoginScreen';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { SUBJECTS } from './data/subjects';

// Extracted Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DailySchedule from './components/DailySchedule';
import SubjectTree from './components/SubjectTree';
import PomodoroModal from './components/PomodoroModal';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import { DashboardSkeleton, ScheduleSkeleton, PerformanceSkeleton, SubjectTreeSkeleton } from './components/ui/skeleton';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded Components (loaded on demand)
const Notebook = React.lazy(() => import('./components/Notebook'));
const SubjectResources = React.lazy(() => import('./components/SubjectResources'));
const MaterialsView = React.lazy(() => import('./components/MaterialsView'));
const Assistant = React.lazy(() => import('./components/Assistant'));
const VadeMecum = React.lazy(() => import('./components/VadeMecum'));
const TimeMachine = React.lazy(() => import('./components/TimeMachine'));
const Settings = React.lazy(() => import('./components/Settings'));
import { InitialScheduleSelector } from './components/InitialScheduleSelector';

import { useProfileData, useDailyHistory, useProgressData, useStudyTime, useNotes, useMaterials } from './hooks/useStudyData';
import { ScheduleProvider } from './hooks/useSchedules';
import { SubjectsProvider } from './hooks/useSubjects.jsx';





// --- CONSTANTS ---
const DEFAULT_STATS = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActivity: null,
  name: 'Thiago',
  avatar: null
};

// --- MAIN APP COMPONENT ---
function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [showTimeMachine, setShowTimeMachine] = useState(false);
  const [open, setOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Simulate initial data loading effect
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // --- TEMPORARY RESET FUNCTION ---
  useEffect(() => {
    window.resetAppData = async () => {

      window.isResetting = true;
      const results = [];

      try {
        try {
          const { error } = await supabase.from('topic_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          results.push("Progress: OK");
        } catch (e) { console.error("Progress reset failed:", e); results.push("Progress: Failed"); }

        try {
          const { error } = await supabase.from('daily_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          results.push("History: OK");
        } catch (e) { console.error("History reset failed:", e); results.push("History: Failed"); }

        try {
          const { error } = await supabase.from('study_time').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          results.push("StudyTime: OK");
        } catch (e) { console.error("StudyTime reset failed:", e); results.push("StudyTime: Failed"); }

        try {
          const { error } = await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          results.push("Notes: OK");
        } catch (e) { console.error("Notes reset failed:", e); results.push("Notes: Failed"); }

        try {
          const { error } = await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          results.push("Materials: OK");
        } catch (e) { console.error("Materials delete failed:", e); results.push("Materials: Failed"); }

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
  const [studyTime, setStudyTime, logSession] = useStudyTime({});
  const [notes, setNotes, isSaving, forceSave] = useNotes({});
  const { materials, addMaterial, deleteMaterial } = useMaterials([]);

  // XP Logic
  const addXp = (amount) => {
    setUserStats(prev => {
      const newXp = Math.max(0, prev.xp + amount);
      const newLevel = Math.floor(newXp / 1000);

      return {
        ...prev,
        xp: newXp,
        level: newLevel
      };
    });
  };

  // Update study time - memoized
  const updateStudyTime = useCallback((subjectId, seconds) => {
    setStudyTime(prev => {
      const currentSeconds = prev[subjectId] || 0;
      return {
        ...prev,
        [subjectId]: currentSeconds + seconds
      };
    });
    if (seconds >= 60) {
      addXp(Math.floor(seconds / 60) * 10);
      logSession(subjectId, seconds);
    }
  }, [setStudyTime, logSession]);

  // Streak Logic
  const checkStreak = () => {
    setUserStats(prev => {
      const today = new Date().toLocaleDateString('en-CA');
      const lastActivity = prev.lastActivity;

      if (lastActivity === today) return prev;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');

      let newStreak = prev.streak;

      if (lastActivity === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }

      return {
        ...prev,
        streak: newStreak,
        lastActivity: today
      };
    });
  };

  // Shared Handlers - memoized to prevent child re-renders
  const toggleCheck = useCallback((topicId, type) => {
    const today = new Date().toLocaleDateString('en-CA');
    setProgress(prev => {
      const currentTopic = prev[topicId] || {};
      const currentVal = type === 'questions'
        ? (typeof currentTopic.questions === 'object' ? Boolean(currentTopic.questions.completed) : Boolean(currentTopic.questions))
        : Boolean(currentTopic[type]);

      const newValue = !currentVal;

      if (newValue) {
        checkStreak();
        if (type === 'read') addXp(50);
        if (type === 'reviewed') addXp(30);
        if (type === 'questions') addXp(40);
      } else {
        if (type === 'read') addXp(-50);
        if (type === 'reviewed') addXp(-30);
        if (type === 'questions') addXp(-40);
      }

      if (type === 'questions') {
        const prevQuestions = typeof currentTopic.questions === 'object' ? currentTopic.questions : {};
        const qTotal = prevQuestions.total || 0;
        const delta = newValue ? (qTotal > 0 ? qTotal : 1) : -(qTotal > 0 ? qTotal : 1);

        setDailyHistory(prevHist => {
          const prevEntry = prevHist[today];
          let count = 0;
          if (typeof prevEntry === 'number' && !isNaN(prevEntry)) count = prevEntry;
          else if (prevEntry && typeof prevEntry === 'object') count = Number(prevEntry.questions || prevEntry.questions_count || 0) || 0;
          else if (typeof prevEntry === 'string') count = parseInt(prevEntry, 10) || 0;

          const newCount = Math.max(0, count + delta);
          if (prevEntry && typeof prevEntry === 'object') {
            return { ...prevHist, [today]: { ...prevEntry, questions: newCount } };
          }
          return { ...prevHist, [today]: { questions: newCount, time: 0, xp: 0 } };
        });

        return {
          ...prev,
          [topicId]: {
            ...currentTopic,
            questions: {
              ...prevQuestions,
              completed: newValue,
              total: prevQuestions.total || (newValue ? 1 : 0),
              completed_date: today,
              last_completed_at: new Date().toISOString()
            },
            questions_history: {
              ...(currentTopic.questions_history || {}),
              [today]: newValue ? (prevQuestions.total || 1) : 0
            },
            updated_at: new Date().toISOString()
          }
        };
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
  }, [setProgress, setDailyHistory]);

  const updateQuestionMetrics = useCallback((topicId, field, value) => {
    const numValue = parseInt(value, 10) || 0;
    const today = new Date().toLocaleDateString('en-CA');

    if (field === 'total') {
      const currentTotal = progress[topicId]?.questions?.total || 0;
      const delta = numValue - currentTotal;

      if (delta !== 0) {
        setDailyHistory(prev => {
          const prevEntry = prev[today];
          let currentQuestions = 0;
          if (typeof prevEntry === 'number' && !isNaN(prevEntry)) currentQuestions = prevEntry;
          else if (prevEntry && typeof prevEntry === 'object') currentQuestions = Number(prevEntry.questions || prevEntry.questions_count || 0) || 0;
          else if (typeof prevEntry === 'string') currentQuestions = parseInt(prevEntry, 10) || 0;

          const newQuestions = Math.max(0, currentQuestions + delta);
          if (prevEntry && typeof prevEntry === 'object') {
            return {
              ...prev,
              [today]: {
                ...prevEntry,
                questions: newQuestions
              }
            };
          }
          return {
            ...prev,
            [today]: {
              questions: newQuestions,
              time: 0,
              xp: 0
            }
          };
        });

        addXp(delta * 10);
        checkStreak();

        if (delta > 0) {
          let subjectId = 'unknown';
          for (const s of SUBJECTS) {
            if (s.topics?.find(t => t.id === topicId)) {
              subjectId = s.id;
              break;
            }
          }
          logQuestionSession(subjectId, topicId, delta, 0);
        }
      }
    }

    setProgress(prev => {
      const currentTopic = prev[topicId] || {};
      const currentQuestions = typeof currentTopic.questions === 'object' ? currentTopic.questions : {};

      return {
        ...prev,
        [topicId]: {
          ...currentTopic,
          questions: {
            ...currentQuestions,
            [field]: numValue,
            completed: field === 'total' ? numValue > 0 : currentQuestions.completed,
            completed_date: today,
            last_completed_at: new Date().toISOString()
          },
          questions_history: {
            ...(currentTopic.questions_history || {}),
            [today]: field === 'total' ? numValue : (currentTopic.questions_history?.[today] || numValue)
          },
          updated_at: new Date().toISOString()
        }
      };
    });
  }, [progress, setProgress, setDailyHistory, logQuestionSession]);

  const menuItems = useMemo(() => [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'schedule', icon: <Calendar size={20} />, label: 'Cronograma' },
    { id: 'notebook', icon: <NotebookPen size={20} />, label: 'Caderno' },
    { id: 'assistant', icon: <Sparkles size={20} />, label: 'JusIA' },
    { id: 'performance', icon: <BarChart2 size={20} />, label: 'Desempenho' },
    { id: 'materials', icon: <FolderOpen size={20} />, label: 'Materiais' },
    { id: 'vademecum', icon: <Book size={20} />, label: 'Vade Mecum' },
    { id: 'subjects', icon: <BookOpen size={20} />, label: 'Edital & Matérias' },
    { id: 'questions', icon: <Brain size={20} />, label: 'Questões' },
    { id: 'settings', icon: <SettingsIcon size={20} />, label: 'Configurações' },
  ], []);

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row w-full overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-6">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className={cn("flex items-center py-3.5 transition-all duration-200", open ? "gap-2.5 px-2" : "justify-center px-0")}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className={cn("font-bold text-lg text-slate-900 dark:text-white tracking-tight transition-opacity duration-200", open ? "opacity-100" : "opacity-0 hidden")}>
                JusPlanner
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-1">
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

          <div className="p-1">
            <div className={cn("bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-xl p-3.5 text-white transition-all duration-300 shadow-lg", open ? "block" : "hidden")}>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-yellow-400" size={16} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Nível {userStats.level}</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all" style={{ width: `${(userStats.xp % 1000) / 10}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-300">{userStats.xp % 1000} / 1000 XP</p>
            </div>
            <div className={cn("flex justify-center", open ? "hidden" : "block")}>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shadow-xs" title={`Nível ${userStats.level} • ${userStats.xp % 1000} XP`}>
                <Trophy className="text-yellow-400" size={18} />
              </div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header togglePomodoro={() => setIsPomodoroOpen(true)} userStats={userStats} setOpen={setOpen} setShowTimeMachine={setShowTimeMachine} />

        <main className="flex-1 p-6 md:p-8 w-full overflow-y-auto">
          <div key={activeTab} className="animate-tab-enter space-y-6">
            {activeTab === 'dashboard' && (
              isInitialLoading ? <DashboardSkeleton /> : <Dashboard progress={progress} dailyHistory={dailyHistory} studyTime={studyTime} userStats={userStats} onNavigate={setActiveTab} />
            )}
            {activeTab === 'schedule' && (
              isInitialLoading ? <ScheduleSkeleton /> : (
                <DailySchedule
                  progress={progress}
                  toggleCheck={toggleCheck}
                  updateQuestionMetrics={updateQuestionMetrics}
                  notes={notes}
                  setNotes={setNotes}
                />
              )
            )}
            {activeTab === 'notebook' && (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
                <Notebook notes={notes} setNotes={setNotes} isSaving={isSaving} forceSave={forceSave} />
              </React.Suspense>
            )}
            {activeTab === 'assistant' && (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
                <Assistant />
              </React.Suspense>
            )}
            {activeTab === 'performance' && (
              isInitialLoading ? <PerformanceSkeleton /> : <PerformanceAnalytics studyTime={studyTime} />
            )}
            {activeTab === 'subjects' && (
              isInitialLoading ? <SubjectTreeSkeleton /> : <SubjectTree />
            )}
            {activeTab === 'materials' && (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
                <MaterialsView
                  materials={materials}
                  addMaterial={addMaterial}
                  deleteMaterial={deleteMaterial}
                />
              </React.Suspense>
            )}
            {activeTab === 'vademecum' && (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
                <VadeMecum />
              </React.Suspense>
            )}
            {
              activeTab === 'questions' && (
                <div className="max-w-5xl mx-auto flex flex-col items-center justify-center h-96 text-slate-400">
                  <Brain size={64} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium">Banco de Questões em desenvolvimento...</p>
                </div>
              )
            }
            {activeTab === 'settings' && (
              <React.Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
                <Settings
                  userName={userStats.name || 'Thiago'}
                  setUserName={(name) => setUserStats(prev => ({ ...prev, name, updated_at: new Date().toISOString() }))}
                  userAvatar={userStats.avatar}
                  setUserAvatar={(avatar) => setUserStats(prev => ({ ...prev, avatar, updated_at: new Date().toISOString() }))}
                  onManualSave={async () => {
                    try {
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
                  setShowBackup={() => { }}
                  onReset={() => {
                    if (window.confirm('TEM CERTEZA? Isso apagará TODO o seu progresso, notas e histórico para sempre.')) {
                      if (window.resetAppData) window.resetAppData();
                    }
                  }}
                />
              </React.Suspense>
            )}
          </div>
        </main>
      </div>

      <PomodoroModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        onUpdateStudyTime={updateStudyTime}
      />

      {showTimeMachine && (
        <React.Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>}>
          <TimeMachine onClose={() => setShowTimeMachine(false)} />
        </React.Suspense>
      )}

      <InitialScheduleSelector />

    </div>
  );
}

const AppWithAuth = () => (
  <AuthProvider>
    <SubjectsProvider>
      <ScheduleProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ScheduleProvider>
    </SubjectsProvider>
  </AuthProvider>
);

export default AppWithAuth;
