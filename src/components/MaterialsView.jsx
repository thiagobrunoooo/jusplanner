import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder } from 'lucide-react';
import { SUBJECTS } from '../data/subjects';
import SubjectResources from './SubjectResources';
import { ICON_MAP } from '../lib/icons';
import { BookOpen } from 'lucide-react';

const MaterialsView = ({ materials, addMaterial, deleteMaterial }) => {
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [selectedContext, setSelectedContext] = useState({ subjectId: SUBJECTS[0].id, topicId: null });

    const toggleSubject = (subjectId) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [subjectId]: !prev[subjectId]
        }));
    };

    const handleSelect = (subjectId, topicId = null) => {
        setSelectedContext({ subjectId, topicId });
    };

    const selectedSubject = SUBJECTS.find(s => s.id === selectedContext.subjectId);
    const selectedTopic = selectedContext.topicId
        ? selectedSubject?.topics.find(t => t.id === selectedContext.topicId)
        : null;

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950 gap-6 p-6">
            {/* Sidebar for Materials */}
            <div className="w-80 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <FolderOpen className="text-blue-600 dark:text-blue-400" />
                        Navegação
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {SUBJECTS.map(subject => (
                        <div key={subject.id} className="space-y-1">
                            <button
                                onClick={() => {
                                    toggleSubject(subject.id);
                                    handleSelect(subject.id);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-2xl text-sm font-medium transition-colors ${selectedContext.subjectId === subject.id && !selectedContext.topicId
                                    ? `${subject.bgLight} ${subject.color}`
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const Icon = ICON_MAP[subject.icon] || BookOpen;
                                        return <Icon size={18} className={selectedContext.subjectId === subject.id ? subject.color : "text-slate-400"} />;
                                    })()}
                                    <span className="truncate">{subject.title}</span>
                                </div>
                                {expandedSubjects[subject.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>

                            {expandedSubjects[subject.id] && (
                                <div className="pl-6 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
                                    {subject.topics.map(topic => (
                                        <button
                                            key={topic.id}
                                            onClick={() => handleSelect(subject.id, topic.id)}
                                            className={`w-full flex items-center gap-2 p-2 rounded-xl text-sm transition-colors ${selectedContext.topicId === topic.id
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <Folder size={14} />
                                            <span className="truncate text-left">{topic.title}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {selectedSubject?.title}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-2">
                            <FolderOpen size={16} />
                            {selectedTopic ? selectedTopic.title : 'Materiais Gerais'}
                        </p>
                    </div>

                    <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <SubjectResources
                            subjectId={selectedContext.subjectId}
                            topicId={selectedContext.topicId}
                            materials={materials}
                            addMaterial={addMaterial}
                            deleteMaterial={deleteMaterial}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialsView;
