import React, { useState } from 'react';
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
    GripVertical
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
];

// Ícones disponíveis
const ICONS = ['Scale', 'Landmark', 'Building2', 'Gavel', 'ScrollText', 'Briefcase', 'BookOpen', 'RotateCcw'];

// Modal de edição de matéria
const SubjectModal = ({ isOpen, onClose, subject, onSave }) => {
    const [title, setTitle] = useState(subject?.title || '');
    const [selectedColor, setSelectedColor] = useState(
        COLORS.findIndex(c => c.color === subject?.color) || 0
    );
    const [selectedIcon, setSelectedIcon] = useState(subject?.icon || 'BookOpen');

    const handleSave = () => {
        const color = COLORS[selectedColor];
        onSave({
            title,
            color: color.color,
            bgColor: color.bgColor,
            bgLight: color.bgLight,
            icon: selectedIcon
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {subject ? 'Editar Matéria' : 'Nova Matéria'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Nome da Matéria
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Direito Civil"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
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
                                    className={`w-10 h-10 rounded-lg ${color.bgColor} ${selectedColor === index ? 'ring-2 ring-offset-2 ring-blue-500' : ''
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
                                        className={`w-10 h-10 rounded-lg border flex items-center justify-center ${selectedIcon === iconName
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        Salvar
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Modal de edição de tópico
const TopicModal = ({ isOpen, onClose, topic, onSave }) => {
    const [title, setTitle] = useState(topic?.title || '');
    const [subtopics, setSubtopics] = useState(topic?.subtopics?.join('\n') || '');

    const handleSave = () => {
        onSave({
            title,
            subtopics: subtopics.split('\n').filter(s => s.trim())
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {topic ? 'Editar Tópico' : 'Novo Tópico'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Título do Tópico
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Negócio Jurídico"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Subtópicos (um por linha)
                        </label>
                        <textarea
                            value={subtopics}
                            onChange={(e) => setSubtopics(e.target.value)}
                            placeholder="Fatos Jurídicos&#10;Escada Ponteana&#10;Representação"
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        Salvar
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
    const [confirmReset, setConfirmReset] = useState(false);

    const handleSaveSubject = async (data) => {
        if (subjectModal.subject) {
            await updateSubject(subjectModal.subject.id, data);
        } else {
            await addSubject({
                ...data,
                topics: []
            });
        }
    };

    const handleSaveTopic = async (data) => {
        if (topicModal.topic) {
            await updateTopic(topicModal.subjectId, topicModal.topic.id, data);
        } else {
            await addTopic(topicModal.subjectId, data);
        }
    };

    const handleDeleteSubject = async (subjectId) => {
        if (confirm('Tem certeza que deseja excluir esta matéria? Todos os tópicos serão removidos.')) {
            await deleteSubject(subjectId);
        }
    };

    const handleDeleteTopic = async (subjectId, topicId) => {
        if (confirm('Tem certeza que deseja excluir este tópico?')) {
            await deleteTopic(subjectId, topicId);
        }
    };

    const handleReset = async () => {
        await resetToDefaults();
        setConfirmReset(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                            onClick={() => setConfirmReset(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium"
                        >
                            <RotateCcw size={18} />
                            Resetar
                        </button>
                    )}
                    <button
                        onClick={() => setSubjectModal({ open: true, subject: null })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium"
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
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                        >
                            {/* Header da Matéria */}
                            <div className="p-4 flex items-center gap-4">
                                <button className="cursor-grab text-slate-400 hover:text-slate-600">
                                    <GripVertical size={20} />
                                </button>

                                <div className={`w-10 h-10 rounded-xl ${subject.bgLight} flex items-center justify-center`}>
                                    <IconComponent size={20} className={subject.color} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                        {subject.title}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {subject.topics.length} tópicos
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSubjectModal({ open: true, subject })}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                                        title="Editar matéria"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSubject(subject.id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                                        title="Excluir matéria"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                    >
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
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
                                        className="border-t border-slate-100 dark:border-slate-800"
                                    >
                                        <div className="p-4 space-y-2">
                                            {subject.topics.map((topic) => (
                                                <div
                                                    key={topic.id}
                                                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                                                            {topic.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {topic.subtopics?.length || 0} subtópicos
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setTopicModal({ open: true, subjectId: subject.id, topic })}
                                                            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTopic(subject.id, topic.id)}
                                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => setTopicModal({ open: true, subjectId: subject.id, topic: null })}
                                                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
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
            <SubjectModal
                isOpen={subjectModal.open}
                onClose={() => setSubjectModal({ open: false, subject: null })}
                subject={subjectModal.subject}
                onSave={handleSaveSubject}
            />

            <TopicModal
                isOpen={topicModal.open}
                onClose={() => setTopicModal({ open: false, subjectId: null, topic: null })}
                topic={topicModal.topic}
                onSave={handleSaveTopic}
            />

            {/* Modal de confirmação de reset */}
            {confirmReset && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                    >
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                            Resetar Matérias?
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Todas as suas matérias personalizadas serão removidas e o banco padrão será restaurado.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmReset(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
                            >
                                Resetar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
