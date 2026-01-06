import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, ChevronDown, Calendar, Trash2 } from 'lucide-react';
import { SUBJECTS } from '../data/subjects';
import { useSchedules } from '../hooks/useSchedules';

// Modal para criar/editar cronograma
export function ScheduleModal({ isOpen, onClose, editSchedule = null }) {
    const { createSchedule, updateScheduleTopics } = useSchedules();
    const [name, setName] = useState(editSchedule?.name || '');
    const [selectedTopics, setSelectedTopics] = useState(
        editSchedule?.topicIds || []
    );
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

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
        const allIds = SUBJECTS.flatMap(s => s.topics.map(t => t.id));
        setSelectedTopics(allIds);
    };

    const selectNone = () => {
        setSelectedTopics([]);
    };

    const handleSave = async () => {
        if (!name.trim() || selectedTopics.length === 0) return;

        setSaving(true);
        try {
            if (editSchedule) {
                await updateScheduleTopics(editSchedule.id, selectedTopics);
            } else {
                await createSchedule(name.trim(), selectedTopics);
            }
            onClose();
        } finally {
            setSaving(false);
        }
    };

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
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
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

                        {/* Seletor de topicos */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Selecione os Topicos ({selectedTopics.length} selecionados)
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
                                {SUBJECTS.map(subject => {
                                    const topicIds = subject.topics.map(t => t.id);
                                    const selectedCount = topicIds.filter(id => selectedTopics.includes(id)).length;
                                    const allSelected = selectedCount === topicIds.length;
                                    const someSelected = selectedCount > 0 && !allSelected;
                                    const isExpanded = expandedSubjects[subject.id];

                                    return (
                                        <div
                                            key={subject.id}
                                            className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
                                        >
                                            {/* Subject header */}
                                            <div className={`flex items-center gap-3 p-3 ${subject.bgLight} dark:bg-slate-800/30`}>
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

    // Render modal in a portal to escape parent positioning
    return createPortal(modalContent, document.body);
}

// Switcher de cronograma ativo
export function ScheduleSwitcher() {
    const { schedules, activeSchedule, setActiveSchedule, deleteSchedule, loading } = useSchedules();
    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && !e.target.closest('.schedule-switcher')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

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
                    onClose={() => setShowModal(false)}
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
                <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                        {schedules.map(schedule => (
                            <div
                                key={schedule.id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${schedule.id === activeSchedule?.id
                                        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                <div
                                    onClick={() => {
                                        setActiveSchedule(schedule.id);
                                        setIsOpen(false);
                                    }}
                                    className="flex-1 flex items-center gap-2"
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
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Excluir este cronograma?')) {
                                                deleteSchedule(schedule.id);
                                            }
                                        }}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowModal(true);
                            }}
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
                onClose={() => setShowModal(false)}
            />
        </div>
    );
}
