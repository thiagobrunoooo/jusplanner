import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Pencil,
    Trash2,
    ChevronDown,
    ChevronRight,
    X,
    Save,
    RotateCcw,
    BookOpen,
    GripVertical,
    Check,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { useSubjects } from '../hooks/useSubjects.jsx';
import { ICON_MAP } from '../lib/icons';

// Cores disponíveis para matérias
const COLORS = [
    { name: 'Azul', color: 'text-blue-600', bgColor: 'bg-blue-600', bgLight: 'bg-blue-50' },
    { name: 'Âmbar', color: 'text-amber-500', bgColor: 'bg-amber-500', bgLight: 'bg-amber-50' },
    { name: 'Slate', color: 'text-slate-600', bgColor: 'bg-slate-600', bgLight: 'bg-slate-50' },
    { name: 'Vermelho', color: 'text-red-600', bgColor: 'bg-red-600', bgLight: 'bg-red-50' },
    { name: 'Indigo', color: 'text-indigo-600', bgColor: 'bg-indigo-600', bgLight: 'bg-indigo-50' },
    { name: 'Cyan', color: 'text-cyan-600', bgColor: 'bg-cyan-600', bgLight: 'bg-cyan-50' },
    { name: 'Esmeralda', color: 'text-emerald-500', bgColor: 'bg-emerald-500', bgLight: 'bg-emerald-50' },
    { name: 'Roxo', color: 'text-purple-600', bgColor: 'bg-purple-600', bgLight: 'bg-purple-50' },
    { name: 'Rosa', color: 'text-pink-500', bgColor: 'bg-pink-500', bgLight: 'bg-pink-50' },
    { name: 'Laranja', color: 'text-orange-500', bgColor: 'bg-orange-500', bgLight: 'bg-orange-50' },
];

// Ícones disponíveis
const ICONS = ['Scale', 'Landmark', 'Building2', 'Gavel', 'ScrollText', 'Briefcase', 'BookOpen', 'RotateCcw', 'FileText', 'Users', 'Shield', 'Globe'];

// Toast Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const Icon = type === 'success' ? Check : type === 'error' ? AlertTriangle : BookOpen;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 ${bgColor} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[100]`}
        >
            <Icon size={20} />
            <span className="font-medium">{message}</span>
        </motion.div>
    );
};

// Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', danger = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                        <AlertTriangle size={24} className={danger ? 'text-red-600' : 'text-blue-600'} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {title}
                    </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                    {message}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${danger
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        <Trash2 size={18} />
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Modal de edição de matéria (MELHORADO)
const SubjectModal = ({ isOpen, onClose, subject, onSave, existingTitles = [] }) => {
    const [title, setTitle] = useState('');
    const [selectedColor, setSelectedColor] = useState(0);
    const [selectedIcon, setSelectedIcon] = useState('BookOpen');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle(subject?.title || '');
            setSelectedColor(
                subject ? COLORS.findIndex(c => c.color === subject?.color) : 0
            );
            setSelectedIcon(subject?.icon || 'BookOpen');
            setError('');
            setSaving(false);
        }
    }, [isOpen, subject]);

    const handleSave = async () => {
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setError('Nome da matéria é obrigatório');
            return;
        }

        // Check for duplicate titles (excluding current subject when editing)
        const isDuplicate = existingTitles.some(
            t => t.toLowerCase() === trimmedTitle.toLowerCase() &&
                (!subject || t.toLowerCase() !== subject.title.toLowerCase())
        );

        if (isDuplicate) {
            setError('Já existe uma matéria com este nome');
            return;
        }

        setSaving(true);
        const color = COLORS[selectedColor];

        try {
            await onSave({
                title: trimmedTitle,
                color: color.color,
                bgColor: color.bgColor,
                bgLight: color.bgLight,
                icon: selectedIcon
            });
            onClose();
        } catch (err) {
            setError('Erro ao salvar. Tente novamente.');
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const PreviewIcon = ICON_MAP[selectedIcon] || BookOpen;
    const previewColor = COLORS[selectedColor] || COLORS[0];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {subject ? 'Editar Matéria' : 'Nova Matéria'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Preview da matéria */}
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium uppercase tracking-wide">
                        Preview
                    </p>
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl ${previewColor.bgLight} flex items-center justify-center transition-all duration-200`}>
                            <PreviewIcon size={28} className={previewColor.color} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                                {title || 'Nome da Matéria'}
                            </h4>
                            <p className="text-sm text-slate-500">0 tópicos</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Nome da Matéria
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setError('');
                            }}
                            placeholder="Ex: Direito Civil"
                            className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
                                } bg-white dark:bg-slate-800 focus:ring-2 outline-none transition-all`}
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                <AlertTriangle size={14} />
                                {error}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Cor
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((color, index) => (
                                <button
                                    key={color.name}
                                    onClick={() => setSelectedColor(index)}
                                    className={`w-10 h-10 rounded-lg ${color.bgColor} transition-all duration-200 ${selectedColor === index
                                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                                            : 'hover:scale-105'
                                        }`}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Ícone
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {ICONS.map((iconName) => {
                                const IconComponent = ICON_MAP[iconName] || BookOpen;
                                return (
                                    <button
                                        key={iconName}
                                        onClick={() => setSelectedIcon(iconName)}
                                        className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all duration-200 ${selectedIcon === iconName
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 scale-110'
                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105'
                                            }`}
                                    >
                                        <IconComponent size={20} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || saving}
                        className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Salvar
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Modal de edição de tópico (MELHORADO)
const TopicModal = ({ isOpen, onClose, topic, onSave }) => {
    const [title, setTitle] = useState('');
    const [subtopics, setSubtopics] = useState([]);
    const [newSubtopic, setNewSubtopic] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingSubtopic, setEditingSubtopic] = useState(null);
    const [editingValue, setEditingValue] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle(topic?.title || '');
            setSubtopics(topic?.subtopics || []);
            setNewSubtopic('');
            setSaving(false);
            setEditingSubtopic(null);
            setEditingValue('');
        }
    }, [isOpen, topic]);

    const handleAddSubtopic = () => {
        const trimmed = newSubtopic.trim();
        if (trimmed && !subtopics.includes(trimmed)) {
            setSubtopics([...subtopics, trimmed]);
            setNewSubtopic('');
        }
    };

    const handleRemoveSubtopic = (index) => {
        setSubtopics(subtopics.filter((_, i) => i !== index));
    };

    const handleEditSubtopic = (index) => {
        setEditingSubtopic(index);
        setEditingValue(subtopics[index]);
    };

    const handleSaveSubtopicEdit = () => {
        if (editingSubtopic !== null && editingValue.trim()) {
            const updated = [...subtopics];
            updated[editingSubtopic] = editingValue.trim();
            setSubtopics(updated);
        }
        setEditingSubtopic(null);
        setEditingValue('');
    };

    const handleSave = async () => {
        if (!title.trim()) return;

        setSaving(true);
        try {
            await onSave({
                title: title.trim(),
                subtopics: subtopics.filter(s => s.trim())
            });
            onClose();
        } catch (err) {
            setSaving(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubtopic();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {topic ? 'Editar Tópico' : 'Novo Tópico'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5 flex-1 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Título do Tópico
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Negócio Jurídico"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Subtópicos ({subtopics.length})
                        </label>

                        {/* Input para adicionar subtópico */}
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newSubtopic}
                                onChange={(e) => setNewSubtopic(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Adicionar subtópico..."
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                            />
                            <button
                                onClick={handleAddSubtopic}
                                disabled={!newSubtopic.trim()}
                                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* Lista de subtópicos */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            <AnimatePresence mode="popLayout">
                                {subtopics.map((sub, index) => (
                                    <motion.div
                                        key={`${sub}-${index}`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl group"
                                    >
                                        {editingSubtopic === index ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    onBlur={handleSaveSubtopicEdit}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSaveSubtopicEdit()}
                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-blue-400 bg-white dark:bg-slate-800 text-sm outline-none"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleSaveSubtopicEdit}
                                                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-600"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">
                                                    {sub}
                                                </span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditSubtopic(index)}
                                                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveSubtopic(index)}
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {subtopics.length === 0 && (
                                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                                    Nenhum subtópico adicionado
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || saving}
                        className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Salvar
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Componente principal do editor
export default function SubjectsEditor() {
    const {
        subjects,
        loading,
        isCustomized,
        addSubject,
        updateSubject,
        deleteSubject,
        addTopic,
        updateTopic,
        deleteTopic,
        resetToDefaults,
        initializeFromDefaults
    } = useSubjects();

    const [expandedSubject, setExpandedSubject] = useState(null);
    const [subjectModal, setSubjectModal] = useState({ open: false, subject: null });
    const [topicModal, setTopicModal] = useState({ open: false, subjectId: null, topic: null });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, data: null });
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleSaveSubject = async (data) => {
        try {
            if (subjectModal.subject) {
                await updateSubject(subjectModal.subject.id, data);
                showToast('Matéria atualizada com sucesso!');
            } else {
                await addSubject({
                    ...data,
                    topics: []
                });
                showToast('Matéria criada com sucesso!');
            }
        } catch (err) {
            showToast('Erro ao salvar matéria', 'error');
            throw err;
        }
    };

    const handleSaveTopic = async (data) => {
        try {
            if (topicModal.topic) {
                await updateTopic(topicModal.subjectId, topicModal.topic.id, data);
                showToast('Tópico atualizado com sucesso!');
            } else {
                await addTopic(topicModal.subjectId, data);
                showToast('Tópico criado com sucesso!');
            }
        } catch (err) {
            showToast('Erro ao salvar tópico', 'error');
            throw err;
        }
    };

    const handleDeleteSubject = (subject) => {
        setConfirmDialog({
            open: true,
            type: 'subject',
            data: subject
        });
    };

    const handleDeleteTopic = (subjectId, topic) => {
        setConfirmDialog({
            open: true,
            type: 'topic',
            data: { subjectId, topic }
        });
    };

    const confirmDelete = async () => {
        try {
            if (confirmDialog.type === 'subject') {
                await deleteSubject(confirmDialog.data.id);
                showToast('Matéria excluída com sucesso!');
            } else if (confirmDialog.type === 'topic') {
                await deleteTopic(confirmDialog.data.subjectId, confirmDialog.data.topic.id);
                showToast('Tópico excluído com sucesso!');
            } else if (confirmDialog.type === 'reset') {
                await resetToDefaults();
                showToast('Matérias resetadas para o padrão!');
            }
        } catch (err) {
            showToast('Erro ao excluir', 'error');
        }
        setConfirmDialog({ open: false, type: null, data: null });
    };

    const handleReset = () => {
        setConfirmDialog({
            open: true,
            type: 'reset',
            data: null
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    const existingTitles = subjects.map(s => s.title);

    return (
        <div className="space-y-6">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        Gerenciar Matérias
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isCustomized ? 'Você está usando matérias personalizadas' : 'Usando matérias padrão'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {isCustomized && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium transition-colors"
                        >
                            <RotateCcw size={18} />
                            Resetar
                        </button>
                    )}
                    <button
                        onClick={() => setSubjectModal({ open: true, subject: null })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
                    >
                        <Plus size={18} />
                        Nova Matéria
                    </button>
                </div>
            </div>

            {/* Lista de Matérias */}
            <div className="space-y-3">
                {subjects.map((subject) => {
                    const IconComponent = ICON_MAP[subject.icon] || BookOpen;
                    const isExpanded = expandedSubject === subject.id;

                    return (
                        <motion.div
                            key={subject.id}
                            layout
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Header da Matéria */}
                            <div className="p-4 flex items-center gap-4">
                                <button className="cursor-grab text-slate-400 hover:text-slate-600 transition-colors">
                                    <GripVertical size={20} />
                                </button>

                                <div className={`w-12 h-12 rounded-xl ${subject.bgLight} flex items-center justify-center`}>
                                    <IconComponent size={24} className={subject.color} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                        {subject.title}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {subject.topics.length} tópicos
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setSubjectModal({ open: true, subject })}
                                        className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-blue-600 transition-colors"
                                        title="Editar matéria"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSubject(subject)}
                                        className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-slate-500 hover:text-red-500 transition-colors"
                                        title="Excluir matéria"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                                        className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown size={20} />
                                        </motion.div>
                                    </button>
                                </div>
                            </div>

                            {/* Lista de Tópicos */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-t border-slate-100 dark:border-slate-800"
                                    >
                                        <div className="p-4 space-y-2">
                                            {subject.topics.map((topic) => (
                                                <div
                                                    key={topic.id}
                                                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                                                            {topic.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {topic.subtopics?.length || 0} subtópicos
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => setTopicModal({ open: true, subjectId: subject.id, topic })}
                                                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTopic(subject.id, topic)}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => setTopicModal({ open: true, subjectId: subject.id, topic: null })}
                                                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
                                            >
                                                <Plus size={18} />
                                                Adicionar Tópico
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Modais */}
            <AnimatePresence>
                <SubjectModal
                    isOpen={subjectModal.open}
                    onClose={() => setSubjectModal({ open: false, subject: null })}
                    subject={subjectModal.subject}
                    onSave={handleSaveSubject}
                    existingTitles={existingTitles}
                />
            </AnimatePresence>

            <AnimatePresence>
                <TopicModal
                    isOpen={topicModal.open}
                    onClose={() => setTopicModal({ open: false, subjectId: null, topic: null })}
                    topic={topicModal.topic}
                    onSave={handleSaveTopic}
                />
            </AnimatePresence>

            {/* Confirmation Dialog */}
            <AnimatePresence>
                <ConfirmDialog
                    isOpen={confirmDialog.open}
                    onClose={() => setConfirmDialog({ open: false, type: null, data: null })}
                    onConfirm={confirmDelete}
                    title={
                        confirmDialog.type === 'subject' ? 'Excluir Matéria?' :
                            confirmDialog.type === 'topic' ? 'Excluir Tópico?' :
                                'Resetar Matérias?'
                    }
                    message={
                        confirmDialog.type === 'subject'
                            ? `Tem certeza que deseja excluir "${confirmDialog.data?.title}"? Todos os tópicos serão removidos.`
                            : confirmDialog.type === 'topic'
                                ? `Tem certeza que deseja excluir o tópico "${confirmDialog.data?.topic?.title}"?`
                                : 'Todas as suas matérias personalizadas serão removidas e o banco padrão será restaurado.'
                    }
                    confirmText={confirmDialog.type === 'reset' ? 'Resetar' : 'Excluir'}
                    danger={true}
                />
            </AnimatePresence>
        </div>
    );
}
