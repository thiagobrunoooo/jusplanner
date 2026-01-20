import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Plus, Check, ChevronDown, Calendar, Trash2, Loader2,
    Settings2, GripVertical, RotateCcw, ChevronUp, ChevronRight, AlertTriangle
} from 'lucide-react';
import { useSubjects } from '../hooks/useSubjects.jsx';
import { useSchedules } from '../hooks/useSchedules';

// Dias da semana
const WEEKDAYS = [
    { id: 1, name: 'Seg', fullName: 'Segunda' },
    { id: 2, name: 'Ter', fullName: 'Terça' },
    { id: 3, name: 'Qua', fullName: 'Quarta' },
    { id: 4, name: 'Qui', fullName: 'Quinta' },
    { id: 5, name: 'Sex', fullName: 'Sexta' },
    { id: 6, name: 'Sáb', fullName: 'Sábado' },
    { id: 7, name: 'Dom', fullName: 'Domingo' },
];

// Opções de revisão
const REVIEW_OPTIONS = [
    { value: null, label: 'Sem revisão automática' },
    { value: 5, label: 'A cada 5 dias' },
    { value: 7, label: 'A cada 7 dias (semanal)' },
    { value: 10, label: 'A cada 10 dias' },
    { value: 14, label: 'A cada 14 dias (quinzenal)' },
];

// Modal para criar/editar cronograma
export function ScheduleModal({ isOpen, onClose, editSchedule = null }) {
    const { subjects, loading: subjectsLoading } = useSubjects();
    const { createSchedule, updateSchedule } = useSchedules();

    // Estado básico
    const [name, setName] = useState('');
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Estado de personalização
    const [studyDaysPerWeek, setStudyDaysPerWeek] = useState(6);
    const [restDays, setRestDays] = useState([7]); // Domingo por padrão
    const [subjectWeights, setSubjectWeights] = useState({});
    const [subjectOrder, setSubjectOrder] = useState([]);
    const [reviewEveryNDays, setReviewEveryNDays] = useState(null);
    const [topicsPerDay, setTopicsPerDay] = useState(2);

    // Inicializar estado quando modal abre
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            if (editSchedule) {
                setName(editSchedule.name || '');
                setSelectedTopics(editSchedule.topicIds || []);
                const settings = editSchedule.settings || {};
                setStudyDaysPerWeek(settings.studyDaysPerWeek || 6);
                setRestDays(settings.restDays || [7]);
                setSubjectWeights(settings.subjectWeights || {});
                setSubjectOrder(settings.subjectOrder || []);
                setReviewEveryNDays(settings.reviewEveryNDays || null);
                setTopicsPerDay(settings.topicsPerDay || 2);
            } else {
                // Reset para valores padrão
                setName('');
                setSelectedTopics([]);
                setStudyDaysPerWeek(6);
                setRestDays([7]);
                setSubjectWeights({});
                setSubjectOrder([]);
                setReviewEveryNDays(null);
                setTopicsPerDay(2);
            }
        }
        return () => setMounted(false);
    }, [isOpen, editSchedule]);

    // Inicializar ordem das matérias quando subjects carregam
    useEffect(() => {
        if (subjects.length > 0 && subjectOrder.length === 0) {
            setSubjectOrder(subjects.map(s => s.id));
        }
    }, [subjects, subjectOrder.length]);

    const toggleSubject = (subjectId) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [subjectId]: !prev[subjectId]
        }));
    };

    const toggleTopic = (topicId) => {
        setSelectedTopics(prev =>
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId]
        );
    };

    const toggleAllInSubject = (subject) => {
        const topicIds = subject.topics.map(t => t.id);
        const allSelected = topicIds.every(id => selectedTopics.includes(id));

        if (allSelected) {
            setSelectedTopics(prev => prev.filter(id => !topicIds.includes(id)));
        } else {
            setSelectedTopics(prev => [...new Set([...prev, ...topicIds])]);
        }
    };

    const selectAll = () => {
        const allIds = subjects.flatMap(s => s.topics.map(t => t.id));
        setSelectedTopics(allIds);
    };

    const selectNone = () => {
        setSelectedTopics([]);
    };

    const toggleRestDay = (dayId) => {
        setRestDays(prev => {
            if (prev.includes(dayId)) {
                return prev.filter(d => d !== dayId);
            }
            return [...prev, dayId];
        });
    };

    const updateWeight = (subjectId, weight) => {
        setSubjectWeights(prev => ({
            ...prev,
            [subjectId]: weight
        }));
    };

    const moveSubject = (subjectId, direction) => {
        const currentIndex = subjectOrder.indexOf(subjectId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= subjectOrder.length) return;

        const newOrder = [...subjectOrder];
        [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
        setSubjectOrder(newOrder);
    };

    const handleSave = async () => {
        if (!name.trim() || selectedTopics.length === 0) return;

        setSaving(true);
        const settings = {
            studyDaysPerWeek,
            restDays,
            subjectWeights,
            subjectOrder,
            reviewEveryNDays,
            topicsPerDay
        };

        try {
            if (editSchedule) {
                await updateSchedule(editSchedule.id, {
                    name: name.trim(),
                    topicIds: selectedTopics,
                    settings
                });
            } else {
                await createSchedule(name.trim(), selectedTopics, false, settings);
            }
            onClose();
        } finally {
            setSaving(false);
        }
    };

    // Ordenar subjects pela ordem definida
    const orderedSubjects = [...subjects].sort((a, b) => {
        const indexA = subjectOrder.indexOf(a.id);
        const indexB = subjectOrder.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <AnimatePresence>
            <motion.div
                key="modal-backdrop"
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                style={{ zIndex: 9999 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-500 to-purple-600">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {editSchedule ? 'Editar Cronograma' : 'Novo Cronograma'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Nome */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Nome do Cronograma
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Monitoria Adm II/III"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Configurações Avançadas Toggle */}
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        >
                            <Settings2 size={16} />
                            Configurações Avançadas
                            <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Configurações Avançadas */}
                        <AnimatePresence>
                            {showAdvanced && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                        {/* Tópicos por Dia */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Tópicos por Dia
                                            </label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4].map(n => (
                                                    <button
                                                        key={n}
                                                        onClick={() => setTopicsPerDay(n)}
                                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${topicsPerDay === n
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Dias de Descanso */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Dias de Descanso
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {WEEKDAYS.map(day => (
                                                    <button
                                                        key={day.id}
                                                        onClick={() => toggleRestDay(day.id)}
                                                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${restDays.includes(day.id)
                                                            ? 'bg-orange-500 text-white'
                                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        {day.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {7 - restDays.length} dias de estudo por semana
                                            </p>
                                        </div>

                                        {/* Blocos de Revisão */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Blocos de Revisão
                                            </label>
                                            <select
                                                value={reviewEveryNDays || ''}
                                                onChange={(e) => setReviewEveryNDays(e.target.value ? Number(e.target.value) : null)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {REVIEW_OPTIONS.map(opt => (
                                                    <option key={opt.value || 'null'} value={opt.value || ''}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Seletor de Tópicos com Peso e Ordem */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Selecione os Tópicos ({selectedTopics.length} selecionados)
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={selectAll}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Selecionar Todos
                                    </button>
                                    <span className="text-slate-300">|</span>
                                    <button
                                        onClick={selectNone}
                                        className="text-xs text-slate-500 hover:underline"
                                    >
                                        Limpar
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {subjectsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
                                    </div>
                                ) : orderedSubjects.map((subject, index) => {
                                    const topicIds = subject.topics.map(t => t.id);
                                    const selectedCount = topicIds.filter(id => selectedTopics.includes(id)).length;
                                    const allSelected = selectedCount === topicIds.length;
                                    const someSelected = selectedCount > 0 && !allSelected;
                                    const isExpanded = expandedSubjects[subject.id];
                                    const weight = subjectWeights[subject.id] || 1;

                                    return (
                                        <div
                                            key={subject.id}
                                            className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
                                        >
                                            {/* Subject header */}
                                            <div className={`flex items-center gap-2 p-3 ${subject.bgLight} dark:bg-slate-800/30`}>
                                                {/* Ordem controls */}
                                                <div className="flex flex-col">
                                                    <button
                                                        onClick={() => moveSubject(subject.id, 'up')}
                                                        disabled={index === 0}
                                                        className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                                    >
                                                        <ChevronUp size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => moveSubject(subject.id, 'down')}
                                                        disabled={index === orderedSubjects.length - 1}
                                                        className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                                    >
                                                        <ChevronDown size={14} />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => toggleAllInSubject(subject)}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${allSelected
                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                        : someSelected
                                                            ? 'bg-indigo-200 border-indigo-400'
                                                            : 'border-slate-300 dark:border-slate-600'
                                                        }`}
                                                >
                                                    {allSelected && <Check size={14} />}
                                                </button>

                                                <div
                                                    onClick={() => toggleSubject(subject.id)}
                                                    className="flex-1 flex items-center gap-2 cursor-pointer"
                                                >
                                                    <span className={`font-medium ${subject.color}`}>
                                                        {subject.title}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        ({selectedCount}/{topicIds.length})
                                                    </span>
                                                </div>

                                                {/* Weight selector */}
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-slate-400">Peso:</span>
                                                    <select
                                                        value={weight}
                                                        onChange={(e) => updateWeight(subject.id, Number(e.target.value))}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                    >
                                                        <option value={1}>1x</option>
                                                        <option value={2}>2x</option>
                                                        <option value={3}>3x</option>
                                                    </select>
                                                </div>

                                                <button
                                                    onClick={() => toggleSubject(subject.id)}
                                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                                >
                                                    <ChevronDown
                                                        size={18}
                                                        className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                            </div>

                                            {/* Topics list */}
                                            {isExpanded && (
                                                <div className="p-3 pt-0 space-y-1 bg-white dark:bg-slate-900">
                                                    {subject.topics.map(topic => {
                                                        const isSelected = selectedTopics.includes(topic.id);
                                                        return (
                                                            <div
                                                                key={topic.id}
                                                                onClick={() => toggleTopic(topic.id)}
                                                                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                            >
                                                                <div
                                                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isSelected
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                        : 'border-slate-300 dark:border-slate-600'
                                                                        }`}
                                                                >
                                                                    {isSelected && <Check size={12} />}
                                                                </div>
                                                                <span
                                                                    className={`text-sm ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                                                                >
                                                                    {topic.title}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!name.trim() || selectedTopics.length === 0 || saving}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            <Plus size={18} />
                            {saving ? 'Salvando...' : (editSchedule ? 'Salvar' : 'Criar Cronograma')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}

// Switcher de cronograma ativo
export function ScheduleSwitcher() {
    const { schedules, activeSchedule, setActiveSchedule, deleteSchedule, loading } = useSchedules();
    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // Schedule to confirm delete

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && !e.target.closest('.schedule-switcher')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    const handleEdit = (e, schedule) => {
        e.stopPropagation();
        setEditingSchedule(schedule);
        setShowModal(true);
        setIsOpen(false);
    };

    const handleDeleteClick = (e, schedule) => {
        e.stopPropagation();
        setConfirmDelete(schedule);
        setIsOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (confirmDelete) {
            await deleteSchedule(confirmDelete.id);
            setConfirmDelete(null);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingSchedule(null);
    };

    const handleNewSchedule = () => {
        setEditingSchedule(null);
        setShowModal(true);
        setIsOpen(false);
    };

    if (loading) {
        return (
            <div className="h-9 w-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        );
    }

    if (schedules.length === 0) {
        return (
            <>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 hover:scale-105 transition-all"
                >
                    <Plus size={16} />
                    <span className="text-sm font-medium">Criar Cronograma</span>
                </button>
                <ScheduleModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    editSchedule={editingSchedule}
                />
            </>
        );
    }

    return (
        <div className="relative schedule-switcher">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 hover:scale-105 transition-all"
            >
                <Calendar size={16} />
                <span className="text-sm font-medium max-w-32 truncate">
                    {activeSchedule?.name || 'Selecionar'}
                </span>
                <ChevronDown
                    size={16}
                    className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                        {schedules.map(schedule => (
                            <div
                                key={schedule.id}
                                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${schedule.id === activeSchedule?.id
                                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                <div
                                    onClick={() => {
                                        setActiveSchedule(schedule.id);
                                        setIsOpen(false);
                                    }}
                                    className="flex-1 flex items-center gap-2 cursor-pointer"
                                >
                                    {schedule.id === activeSchedule?.id && <Check size={14} />}
                                    <span className="text-sm font-medium truncate">
                                        {schedule.name}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {schedule.topicIds?.length || 0}
                                    </span>
                                </div>
                                {!schedule.is_preset && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => handleEdit(e, schedule)}
                                            className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded text-indigo-500 dark:text-indigo-400"
                                            title="Editar cronograma"
                                        >
                                            <Settings2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, schedule)}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                                            title="Excluir cronograma"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                        <button
                            onClick={handleNewSchedule}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            <Plus size={16} />
                            <span className="text-sm">Novo Cronograma</span>
                        </button>
                    </div>
                </div>
            )}

            <ScheduleModal
                isOpen={showModal}
                onClose={handleCloseModal}
                editSchedule={editingSchedule}
            />

            {/* Modal de Confirmação de Exclusão */}
            {confirmDelete && createPortal(
                <motion.div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    style={{ zIndex: 9999 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setConfirmDelete(null)}
                >
                    <motion.div
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 bg-gradient-to-r from-red-500 to-orange-500">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="text-white" size={24} />
                                <h2 className="text-xl font-bold text-white">Excluir Cronograma</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 dark:text-slate-300">
                                Tem certeza que deseja excluir o cronograma <strong className="text-slate-900 dark:text-white">"{confirmDelete.name}"</strong>?
                            </p>
                            <p className="text-sm text-slate-500 mt-2">
                                Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                            >
                                Excluir
                            </button>
                        </div>
                    </motion.div>
                </motion.div>,
                document.body
            )}
        </div>
    );
}

