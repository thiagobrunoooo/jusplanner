import React, { useState, useMemo } from 'react';
import {
    Clock,
    CheckCircle2,
    Brain,
    Target,
    ChevronDown,
    BarChart2
} from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useSchedules } from '../hooks/useSchedules';
import { useProgressData } from '../hooks/useStudyData';
import { SUBJECTS } from '../data/subjects';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const SubjectPerformanceCard = ({ subject, progress, subjectsToUse }) => {
    const [isExpanded, setIsExpanded] = useState(false);

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

const PerformanceAnalytics = ({ studyTime }) => {
    const [progress] = useProgressData({});
    const { filteredSubjects, activeSchedule } = useSchedules();

    const subjectsToUse = activeSchedule && filteredSubjects.length > 0 ? filteredSubjects : SUBJECTS;

    // Calculate Global Stats
    const globalStats = useMemo(() => {
        let totalQuestions = 0;
        let totalCorrect = 0;

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

    // Calculate Study Time Data
    const studyTimeData = useMemo(() => {
        if (!studyTime) return [];

        const subjectIds = subjectsToUse.map(s => s.id);

        return Object.entries(studyTime)
            .filter(([subjectId]) => subjectIds.includes(subjectId))
            .map(([subjectId, seconds]) => {
                const subject = subjectsToUse.find(s => s.id === subjectId);
                return {
                    name: subject ? subject.title : 'Outros',
                    value: Math.round(seconds / 60),
                    color: subject ? (subject.id === 'civil' ? '#4f46e5' : subject.id === 'penal' ? '#ef4444' : '#10b981') : '#94a3b8'
                };
            }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    }, [studyTime, subjectsToUse]);

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

export default PerformanceAnalytics;
