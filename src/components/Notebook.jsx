import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, BookOpen, Save, FileText, Download, Type, AlignLeft, Bold, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ICON_MAP } from '../lib/icons';
import { useSubjects } from '../hooks/useStudyData';

import ReactQuill, { Quill } from 'react-quill-new';
import 'quill/dist/quill.snow.css';

// Custom Font Size and Family Configuration
const fontSizeArr = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '60px', '72px'];
const fontFamilyArr = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Trebuchet MS', 'Garamond', 'Impact'];

const Size = Quill.import('attributors/style/size');
Size.whitelist = fontSizeArr;
Quill.register(Size, true);

const Font = Quill.import('attributors/style/font');
Font.whitelist = fontFamilyArr;
Quill.register(Font, true);

const Notebook = ({ notes, setNotes, isSaving, forceSave }) => {
    const { subjects } = useSubjects();
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const [selectedSubtopicIndex, setSelectedSubtopicIndex] = useState(null);

    const [expandedSubject, setExpandedSubject] = useState(null);
    const [expandedTopic, setExpandedTopic] = useState(null);

    const getNoteContent = (note) => {
        if (!note) return '';
        if (typeof note === 'object') return note.content || '';
        return note;
    };

    const handleNoteChange = (content) => {
        if (!selectedTopicId || selectedSubtopicIndex === null) return;

        const key = `${selectedTopicId}_${selectedSubtopicIndex}`;
        setNotes(prev => ({
            ...prev,
            [key]: {
                content: content,
                updated_at: new Date().toISOString()
            }
        }));
    };

    const selectedTopic = subjects.flatMap(s => s.topics).find(t => t.id === selectedTopicId);
    const selectedSubject = subjects.find(s => s.topics.some(t => t.id === selectedTopicId));
    const selectedSubtopic = selectedTopic?.subtopics[selectedSubtopicIndex];
    const noteKey = selectedTopicId && selectedSubtopicIndex !== null ? `${selectedTopicId}_${selectedSubtopicIndex}` : null;
    const currentNoteContent = getNoteContent(notes[noteKey]);

    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'font': fontFamilyArr }],
            [{ 'size': fontSizeArr }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'blockquote', 'code-block'],
            ['clean']
        ],
        clipboard: {
            matchVisual: false
        }
    }), []);

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] gap-4 animate-fade-in">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-72 h-[40vh] md:h-full glass-panel rounded-2xl overflow-hidden flex flex-col flex-shrink-0 transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                        Matérias & Tópicos
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {subjects.map(subject => {
                        const isSubjectExpanded = expandedSubject === subject.id;
                        return (
                            <div key={subject.id} className="rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedSubject(isSubjectExpanded ? null : subject.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 text-sm font-bold transition-colors rounded-lg smooth-transition",
                                        isSubjectExpanded
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const Icon = ICON_MAP[subject.icon] || BookOpen;
                                            return <Icon size={16} className={isSubjectExpanded ? subject.color : "text-slate-400"} />;
                                        })()}
                                        <span>{subject.title}</span>
                                    </div>
                                    <ChevronRight size={16} className={cn("transition-transform", isSubjectExpanded && "rotate-90")} />
                                </button>

                                {isSubjectExpanded && (
                                    <div className="pl-3 pr-2 py-1 space-y-1">
                                        {subject.topics.map(topic => {
                                            const isTopicExpanded = expandedTopic === topic.id;
                                            return (
                                                <div key={topic.id}>
                                                    <button
                                                        onClick={() => setExpandedTopic(isTopicExpanded ? null : topic.id)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-2 text-xs font-medium rounded-lg transition-colors smooth-transition",
                                                            isTopicExpanded
                                                                ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                        )}
                                                    >
                                                        <span>{topic.title}</span>
                                                        <ChevronRight size={14} className={cn("transition-transform", isTopicExpanded && "rotate-90")} />
                                                    </button>

                                                    {isTopicExpanded && (
                                                        <div className="pl-3 py-1 space-y-0.5 border-l border-slate-100 dark:border-slate-700 ml-2 mt-1">
                                                            {topic.subtopics.map((subtopic, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => {
                                                                        setSelectedTopicId(topic.id);
                                                                        setSelectedSubtopicIndex(index);
                                                                    }}
                                                                    className={cn(
                                                                        "w-full text-left p-2 text-[11px] rounded-md transition-all truncate flex items-center gap-2",
                                                                        selectedTopicId === topic.id && selectedSubtopicIndex === index
                                                                            ? "bg-blue-600 dark:bg-blue-600 text-white shadow-sm font-medium"
                                                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                                                        selectedTopicId === topic.id && selectedSubtopicIndex === index ? "bg-white" : "bg-slate-300 dark:bg-slate-600"
                                                                    )} />
                                                                    <span className="truncate">{subtopic}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div >

            {/* Editor Area */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm transition-colors smooth-transition">
                {selectedSubtopic ? (
                    <>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">{selectedSubject?.title}</span>
                                    <ChevronRight size={12} />
                                    <span>{selectedTopic?.title}</span>
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <FileText size={20} className="text-slate-400 dark:text-slate-500" />
                                    {selectedSubtopic}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                                {isSaving ? (
                                    <span className="flex items-center gap-1 text-orange-500 animate-pulse font-medium">
                                        <Save size={14} /> Salvando...
                                    </span>
                                ) : (
                                    <button
                                        onClick={forceSave}
                                        className="flex items-center gap-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded transition-colors"
                                        title="Clique para salvar agora"
                                    >
                                        <Save size={14} /> Salvo
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (window.confirm('Tem certeza que deseja limpar esta anotação? Isso não pode ser desfeito.')) {
                                            handleNoteChange('');
                                        }
                                    }}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                                    title="Limpar anotação"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        const element = document.createElement("a");
                                        const file = new Blob([currentNoteContent.replace(/<[^>]*>?/gm, '') || ''], { type: 'text/plain' });
                                        element.href = URL.createObjectURL(file);
                                        element.download = `${selectedTopic?.title} - ${selectedSubtopic}.txt`;
                                        document.body.appendChild(element);
                                        element.click();
                                    }}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    title="Baixar anotação"
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-900 relative flex flex-col overflow-hidden">
                            <ReactQuill
                                key={noteKey} // Forces remount when switching topics
                                theme="snow"
                                defaultValue={currentNoteContent}
                                onChange={handleNoteChange}
                                modules={modules}
                                className="h-full flex flex-col dark:text-slate-200"
                            />
                        </div>

                        {/* Status Bar */}
                        <div className="h-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                            <div className="flex items-center gap-4">
                                <span>
                                    {(currentNoteContent.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).filter(w => w.length > 0).length || 0)} Palavras
                                </span>
                                <span>
                                    {(currentNoteContent.replace(/<[^>]*>?/gm, '').length || 0)} Caracteres
                                </span>
                            </div>
                            <div>
                                {selectedSubtopic}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <BookOpen size={32} className="opacity-20 dark:opacity-30" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">Selecione um subtópico</h3>
                        <p className="text-sm max-w-xs mt-2 text-slate-500 dark:text-slate-400">Navegue pelas matérias e tópicos na barra lateral para encontrar o ponto específico que deseja estudar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notebook;
