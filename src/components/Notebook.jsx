import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronRight, ChevronDown, BookOpen, Save, FileText, Download, Type, AlignLeft, AlignCenter, AlignRight, Bold, Trash2, Clock, Search, X, Eye, PenLine, LayoutTemplate } from 'lucide-react';
import { cn } from '../lib/utils';
import { ICON_MAP } from '../lib/icons';
import { useSubjects } from '../hooks/useSubjects.jsx';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [isReadingMode, setIsReadingMode] = useState(false);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);

    const LEGAL_TEMPLATES = useMemo(() => [
        {
            emoji: '📝',
            title: 'Resumo de Artigo',
            desc: 'Estrutura para resumir artigos de lei',
            html: `<h2>📝 Resumo de Artigo</h2><p><br></p><h3>📌 Dispositivo Legal</h3><p><strong>Lei/Código:</strong> </p><p><strong>Artigo:</strong> </p><p><strong>Capítulo/Seção:</strong> </p><p><br></p><h3>📖 Texto do Artigo</h3><blockquote><em>Colar aqui o texto integral do artigo...</em></blockquote><p><br></p><h3>🔍 Análise</h3><p><strong>Objetivo da norma:</strong> </p><p><strong>Sujeito ativo:</strong> </p><p><strong>Sujeito passivo:</strong> </p><p><strong>Requisitos:</strong> </p><ul><li><br></li></ul><p><br></p><h3>⚖️ Jurisprudência Relacionada</h3><ul><li><br></li></ul><p><br></p><h3>📎 Observações</h3><p><br></p>`
        },
        {
            emoji: '🗺️',
            title: 'Mapa de Tópico',
            desc: 'Visão geral de um tema jurídico',
            html: `<h2>🗺️ Mapa de Tópico</h2><p><br></p><h3>1. Conceito</h3><p><br></p><h3>2. Natureza Jurídica</h3><p><br></p><h3>3. Fundamento Legal</h3><ul><li><br></li></ul><h3>4. Características</h3><ul><li><br></li></ul><h3>5. Classificação</h3><ul><li><br></li></ul><h3>6. Efeitos Jurídicos</h3><p><br></p><h3>7. Exceções / Particularidades</h3><p><br></p><h3>8. Pontos de Atenção para Prova</h3><ul><li data-list="unchecked"><br></li><li data-list="unchecked"><br></li></ul>`
        },
        {
            emoji: '⚖️',
            title: 'Tabela Comparativa',
            desc: 'Comparar institutos ou posições',
            html: `<h2>⚖️ Tabela Comparativa</h2><p><br></p><p><strong>Tema:</strong> </p><p><br></p><table><thead><tr><th>Critério</th><th>Posição A</th><th>Posição B</th></tr></thead><tbody><tr><td>Conceito</td><td></td><td></td></tr><tr><td>Fundamento Legal</td><td></td><td></td></tr><tr><td>Requisitos</td><td></td><td></td></tr><tr><td>Efeitos</td><td></td><td></td></tr><tr><td>Adotado por</td><td></td><td></td></tr></tbody></table><p><br></p><h3>📎 Conclusão</h3><p><br></p>`
        },
        {
            emoji: '📚',
            title: 'Fichamento de Jurisprudência',
            desc: 'Fichar decisões judiciais',
            html: `<h2>📚 Fichamento de Jurisprudência</h2><p><br></p><h3>📋 Identificação</h3><p><strong>Tribunal:</strong> </p><p><strong>Órgão julgador:</strong> </p><p><strong>Relator:</strong> </p><p><strong>Número do processo:</strong> </p><p><strong>Data do julgamento:</strong> </p><p><br></p><h3>📌 Ementa</h3><blockquote><em>Colar a ementa aqui...</em></blockquote><p><br></p><h3>⚖️ Tese Jurídica</h3><p><br></p><h3>📖 Fundamentos</h3><ol><li><br></li></ol><h3>🔗 Precedentes Citados</h3><ul><li><br></li></ul><h3>💡 Relevância para o Estudo</h3><p><br></p>`
        },
        {
            emoji: '📊',
            title: 'Quadro Sinóptico',
            desc: 'Resumo estruturado por tópicos',
            html: `<h2>📊 Quadro Sinóptico</h2><p><br></p><p><strong>Matéria:</strong> </p><p><strong>Tema:</strong> </p><p><br></p><h3>I. Introdução</h3><p><br></p><h3>II. Pontos Principais</h3><ol><li><strong>Ponto 1:</strong> </li><li><strong>Ponto 2:</strong> </li><li><strong>Ponto 3:</strong> </li></ol><h3>III. Detalhamento</h3><h4>A)</h4><p><br></p><h4>B)</h4><p><br></p><h4>C)</h4><p><br></p><h3>IV. Palavras-chave</h3><p><br></p><h3>V. Questões Frequentes</h3><ul><li data-list="unchecked"><br></li><li data-list="unchecked"><br></li></ul>`
        }
    ], []);

    // Normalize text for accent-insensitive search
    const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // Filter subjects/topics/subtopics based on search
    const filteredSubjects = useMemo(() => {
        if (!searchQuery.trim()) return subjects;
        const q = normalize(searchQuery);
        return subjects.map(subject => {
            const subjectMatches = normalize(subject.title).includes(q);
            const filteredTopics = subject.topics.map(topic => {
                const topicMatches = normalize(topic.title).includes(q);
                const filteredSubtopics = topic.subtopics
                    .map((st, idx) => ({ name: st, originalIndex: idx }))
                    .filter(st => subjectMatches || topicMatches || normalize(st.name).includes(q));
                return { ...topic, filteredSubtopics, topicMatches };
            }).filter(topic => topic.topicMatches || topic.filteredSubtopics.length > 0);
            return { ...subject, topics: filteredTopics, subjectMatches };
        }).filter(s => s.subjectMatches || s.topics.length > 0);
    }, [subjects, searchQuery]);

    // Ref to the ReactQuill component and tracking the current note key
    const quillRef = useRef(null);
    const currentNoteKeyRef = useRef(null);
    const isSettingContentRef = useRef(false);
    const debounceTimerRef = useRef(null);
    const pendingContentRef = useRef(null);
    const editorContainerRef = useRef(null);

    const getNoteContent = (note) => {
        if (!note) return '';
        if (typeof note === 'object') return note.content || '';
        return note;
    };

    // Properly extract plain text from HTML (strips tags AND decodes entities)
    const getPlainText = (html) => {
        if (!html) return '';
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    };

    // Format the last edited timestamp as relative time
    const formatLastEdited = (isoString) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return 'Editado agora';
        if (diffMin < 60) return `Editado há ${diffMin} min`;
        if (diffHours < 24) return `Editado há ${diffHours}h`;
        if (diffDays < 7) return `Editado há ${diffDays}d`;
        return `Editado em ${date.toLocaleDateString('pt-BR')}`;
    };

    // Flush any pending debounced content immediately
    const flushPendingContent = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        if (pendingContentRef.current) {
            const { key, content } = pendingContentRef.current;
            pendingContentRef.current = null;
            setNotes(prev => ({
                ...prev,
                [key]: {
                    content: content,
                    updated_at: new Date().toISOString()
                }
            }));
        }
    }, [setNotes]);

    const handleNoteChange = useCallback((content) => {
        // Ignore changes triggered by programmatic setContents
        if (isSettingContentRef.current) return;
        const key = currentNoteKeyRef.current;
        if (!key) return;

        // Store pending content and debounce the state update
        pendingContentRef.current = { key, content };

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            if (pendingContentRef.current) {
                const { key: k, content: c } = pendingContentRef.current;
                pendingContentRef.current = null;
                setNotes(prev => ({
                    ...prev,
                    [k]: {
                        content: c,
                        updated_at: new Date().toISOString()
                    }
                }));
            }
            debounceTimerRef.current = null;
        }, 500);
    }, [setNotes]);

    // Flush pending content on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (pendingContentRef.current) {
                const { key, content } = pendingContentRef.current;
                pendingContentRef.current = null;
                setNotes(prev => ({
                    ...prev,
                    [key]: {
                        content: content,
                        updated_at: new Date().toISOString()
                    }
                }));
            }
        };
    }, [setNotes]);

    const selectedTopic = subjects.flatMap(s => s.topics).find(t => t.id === selectedTopicId);
    const selectedSubject = subjects.find(s => s.topics.some(t => t.id === selectedTopicId));
    const selectedSubtopic = selectedTopic?.subtopics[selectedSubtopicIndex];
    const noteKey = selectedTopicId && selectedSubtopicIndex !== null ? `${selectedTopicId}_${selectedSubtopicIndex}` : null;
    const currentNoteContent = getNoteContent(notes[noteKey]);

    // Update editor content when switching notes (without remounting)
    useEffect(() => {
        if (noteKey === currentNoteKeyRef.current) return;
        // Flush any pending debounced edits before switching
        flushPendingContent();
        currentNoteKeyRef.current = noteKey;

        const editor = quillRef.current?.getEditor?.();
        const container = editorContainerRef.current;

        // Fade out
        if (container) {
            container.style.opacity = '0';
        }

        setTimeout(() => {
            if (editor && noteKey) {
                const content = getNoteContent(notes[noteKey]);
                isSettingContentRef.current = true;
                if (content) {
                    editor.clipboard.dangerouslyPasteHTML(content);
                } else {
                    editor.setText('');
                }
                editor.setSelection(0, 0);
                isSettingContentRef.current = false;
            } else if (editor && !noteKey) {
                isSettingContentRef.current = true;
                editor.setText('');
                isSettingContentRef.current = false;
            }

            // Fade in
            if (container) {
                container.style.opacity = '1';
            }
        }, 100);
    }, [noteKey, notes]);

    // Image resize state
    const [resizingImage, setResizingImage] = useState(null);
    const [resizePosition, setResizePosition] = useState({ top: 0, left: 0 });

    // Handle image paste from clipboard
    useEffect(() => {
        const timerId = setTimeout(() => {
            const editor = quillRef.current?.getEditor?.();
            if (!editor) return;
            const editorRoot = editor.root;

            const handlePaste = (e) => {
                const clipboardData = e.clipboardData;
                if (!clipboardData?.items) return;

                for (const item of clipboardData.items) {
                    if (item.type.startsWith('image/')) {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = item.getAsFile();
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                                const range = editor.getSelection(true);
                                editor.insertEmbed(range.index, 'image', ev.target.result);
                                editor.setSelection(range.index + 1);
                            };
                            reader.readAsDataURL(file);
                        }
                        break;
                    }
                }
            };

            editorRoot.addEventListener('paste', handlePaste);
            // Store cleanup ref
            editorRoot._pasteCleanup = () => editorRoot.removeEventListener('paste', handlePaste);
        }, 500);

        return () => {
            clearTimeout(timerId);
            const editor = quillRef.current?.getEditor?.();
            if (editor?.root?._pasteCleanup) editor.root._pasteCleanup();
        };
    }, []);

    // Handle image click for resize (event delegation on container)
    const handleEditorContainerClick = useCallback((e) => {
        if (e.target.tagName === 'IMG' && e.target.closest('.ql-editor')) {
            const container = editorContainerRef.current;
            if (container) {
                container.querySelectorAll('.ql-image-selected').forEach(img => img.classList.remove('ql-image-selected'));
            }
            e.target.classList.add('ql-image-selected');
            setResizingImage(e.target);
            updateImageOverlayPosition(e.target);
        } else if (!e.target.closest('.image-resize-toolbar') && !e.target.closest('.image-resize-handle')) {
            const container = editorContainerRef.current;
            if (container) {
                container.querySelectorAll('.ql-image-selected').forEach(img => img.classList.remove('ql-image-selected'));
            }
            setResizingImage(null);
        }
    }, []);

    const updateImageOverlayPosition = useCallback((img) => {
        const rect = img.getBoundingClientRect();
        const containerRect = editorContainerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
        setResizePosition({
            top: rect.top - containerRect.top,
            left: rect.left - containerRect.left,
            width: rect.width,
            height: rect.height
        });
    }, []);

    // Drag-to-resize handler
    const handleResizeDragStart = useCallback((e, handle) => {
        e.preventDefault();
        e.stopPropagation();
        if (!resizingImage) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = resizingImage.offsetWidth;
        const startHeight = resizingImage.offsetHeight;
        const aspectRatio = startWidth / startHeight;

        const onMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            let newWidth = startWidth;

            if (handle.includes('e')) newWidth = startWidth + dx;
            else if (handle.includes('w')) newWidth = startWidth - dx;
            else newWidth = startWidth + (dy * aspectRatio * (handle.includes('s') ? 1 : -1));

            newWidth = Math.max(50, Math.min(newWidth, editorContainerRef.current?.offsetWidth || 800));
            resizingImage.style.width = `${newWidth}px`;
            resizingImage.style.height = 'auto';
            updateImageOverlayPosition(resizingImage);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            const editor = quillRef.current?.getEditor?.();
            if (editor) handleNoteChange(editor.root.innerHTML);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [resizingImage, updateImageOverlayPosition, handleNoteChange]);

    // Image alignment handler
    const handleImageAlign = useCallback((align) => {
        if (!resizingImage) return;
        // Find the parent block element (p, div)
        const parent = resizingImage.closest('p') || resizingImage.parentElement;
        if (parent) {
            if (align === 'left') {
                resizingImage.style.float = 'left';
                resizingImage.style.marginRight = '1em';
                resizingImage.style.marginLeft = '0';
            } else if (align === 'right') {
                resizingImage.style.float = 'right';
                resizingImage.style.marginLeft = '1em';
                resizingImage.style.marginRight = '0';
            } else {
                resizingImage.style.float = 'none';
                resizingImage.style.marginLeft = 'auto';
                resizingImage.style.marginRight = 'auto';
            }
        }
        const editor = quillRef.current?.getEditor?.();
        if (editor) handleNoteChange(editor.root.innerHTML);
    }, [resizingImage, handleNoteChange]);

    // Insert template at cursor
    const insertTemplate = useCallback((templateHtml) => {
        const editor = quillRef.current?.getEditor?.();
        if (!editor) return;
        const range = editor.getSelection(true);
        // Use clipboard.dangerouslyPasteHTML to insert formatted content
        editor.clipboard.dangerouslyPasteHTML(range.index, templateHtml);
        setShowTemplateMenu(false);
        // Trigger save
        setTimeout(() => handleNoteChange(editor.root.innerHTML), 100);
    }, [handleNoteChange]);

    // Custom image upload handler
    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/png, image/jpeg, image/gif, image/webp');
        input.click();
        input.onchange = () => {
            const file = input.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const editor = quillRef.current?.getEditor?.();
                    if (editor) {
                        const range = editor.getSelection(true);
                        editor.insertEmbed(range.index, 'image', e.target.result);
                        editor.setSelection(range.index + 1);
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    }, []);

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }, { 'size': fontSizeArr }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['link', 'image', 'blockquote', 'code-block'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        },
        clipboard: {
            matchVisual: false
        }
    }), [imageHandler]);

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] gap-4 animate-fade-in">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-72 h-[40vh] md:h-full glass-panel rounded-2xl overflow-hidden flex flex-col flex-shrink-0 transition-colors">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                        Matérias & Tópicos
                    </h3>
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredSubjects.map(subject => {
                        const isSubjectExpanded = searchQuery ? true : expandedSubject === subject.id;
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
                                            const isTopicExpanded = searchQuery ? true : expandedTopic === topic.id;
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
                                                            {(searchQuery ? topic.filteredSubtopics || [] : topic.subtopics.map((st, idx) => ({ name: st, originalIndex: idx }))).map((subtopicData) => {
                                                                const subtopic = typeof subtopicData === 'string' ? subtopicData : subtopicData.name;
                                                                const index = typeof subtopicData === 'string' ? topic.subtopics.indexOf(subtopicData) : subtopicData.originalIndex;
                                                                const hasNote = (() => {
                                                                    const nk = `${topic.id}_${index}`;
                                                                    const note = notes[nk];
                                                                    if (!note) return false;
                                                                    const content = typeof note === 'object' ? note.content : note;
                                                                    return content && getPlainText(content).trim().length > 0;
                                                                })();
                                                                const isSelected = selectedTopicId === topic.id && selectedSubtopicIndex === index;
                                                                return (
                                                                    <button
                                                                        key={index}
                                                                        onClick={() => {
                                                                            setSelectedTopicId(topic.id);
                                                                            setSelectedSubtopicIndex(index);
                                                                        }}
                                                                        className={cn(
                                                                            "w-full text-left p-2 text-[11px] rounded-md transition-all truncate flex items-center gap-2",
                                                                            isSelected
                                                                                ? "bg-blue-600 dark:bg-blue-600 text-white shadow-sm font-medium"
                                                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                                        )}
                                                                    >
                                                                        <div className={cn(
                                                                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                                                            isSelected
                                                                                ? "bg-white"
                                                                                : hasNote
                                                                                    ? "bg-emerald-500 dark:bg-emerald-400"
                                                                                    : "bg-slate-300 dark:bg-slate-600"
                                                                        )} />
                                                                        <span className="truncate">{subtopic}</span>
                                                                        {hasNote && !isSelected && (
                                                                            <FileText size={10} className="ml-auto flex-shrink-0 text-emerald-500 dark:text-emerald-400 opacity-60" />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
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
                                <button
                                    onClick={() => setIsReadingMode(prev => !prev)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        isReadingMode
                                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                    title={isReadingMode ? "Voltar para edição" : "Modo leitura"}
                                >
                                    {isReadingMode ? <PenLine size={14} /> : <Eye size={14} />}
                                    {isReadingMode ? 'Editar' : 'Leitura'}
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowTemplateMenu(prev => !prev)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                        title="Inserir template"
                                    >
                                        <LayoutTemplate size={14} />
                                        Template
                                    </button>
                                    {showTemplateMenu && (
                                        <div className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Templates Jurídicos</p>
                                                <p className="text-[10px] text-slate-400">Insere estrutura pré-formatada no cursor</p>
                                            </div>
                                            {LEGAL_TEMPLATES.map((tpl, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => insertTemplate(tpl.html)}
                                                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-start gap-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                                                >
                                                    <span className="text-lg leading-none mt-0.5">{tpl.emoji}</span>
                                                    <div>
                                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{tpl.title}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{tpl.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
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

                        <div
                            ref={editorContainerRef}
                            onClick={handleEditorContainerClick}
                            className={cn(
                                "flex-1 bg-white dark:bg-slate-900 relative flex flex-col overflow-hidden note-transition",
                                isReadingMode && "reading-mode"
                            )}
                        >
                            <ReactQuill
                                ref={quillRef}
                                theme="snow"
                                defaultValue={currentNoteContent}
                                onChange={handleNoteChange}
                                modules={modules}
                                readOnly={isReadingMode}
                                className={cn(
                                    "h-full flex flex-col dark:text-slate-200",
                                    isReadingMode && "ql-reading-mode"
                                )}
                            />
                            {resizingImage && (
                                <>
                                    {/* Drag handles */}
                                    {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(handle => {
                                        const style = {};
                                        if (handle.includes('n')) style.top = `${resizePosition.top - 4}px`;
                                        if (handle.includes('s')) style.top = `${resizePosition.top + resizePosition.height - 4}px`;
                                        if (handle.includes('e')) style.left = `${resizePosition.left + resizePosition.width - 4}px`;
                                        if (handle.includes('w')) style.left = `${resizePosition.left - 4}px`;
                                        if (handle === 'n' || handle === 's') style.left = `${resizePosition.left + resizePosition.width / 2 - 4}px`;
                                        if (handle === 'e' || handle === 'w') style.top = `${resizePosition.top + resizePosition.height / 2 - 4}px`;
                                        const cursors = { nw: 'nwse', ne: 'nesw', sw: 'nesw', se: 'nwse', n: 'ns', s: 'ns', e: 'ew', w: 'ew' };
                                        return (
                                            <div
                                                key={handle}
                                                className="image-resize-handle absolute w-2 h-2 bg-blue-500 border border-white rounded-sm z-50"
                                                style={{ ...style, cursor: `${cursors[handle]}-resize` }}
                                                onMouseDown={(e) => handleResizeDragStart(e, handle)}
                                            />
                                        );
                                    })}
                                    {/* Toolbar */}
                                    <div
                                        className="image-resize-toolbar absolute z-50 flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-1 py-0.5"
                                        style={{
                                            top: `${resizePosition.top - 4}px`,
                                            left: `${resizePosition.left + resizePosition.width / 2}px`,
                                            transform: 'translate(-50%, -100%) translateY(-4px)'
                                        }}
                                    >
                                        <button onClick={(e) => { e.stopPropagation(); handleImageAlign('left'); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" title="Esquerda"><AlignLeft size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleImageAlign('center'); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" title="Centro"><AlignCenter size={14} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleImageAlign('right'); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" title="Direita"><AlignRight size={14} /></button>
                                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-0.5" />
                                        {[25, 50, 75, 100].map(pct => (
                                            <button
                                                key={pct}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    resizingImage.style.width = `${pct}%`;
                                                    resizingImage.style.float = 'none';
                                                    resizingImage.style.marginLeft = pct < 100 ? 'auto' : '0';
                                                    resizingImage.style.marginRight = pct < 100 ? 'auto' : '0';
                                                    updateImageOverlayPosition(resizingImage);
                                                    const editor = quillRef.current?.getEditor?.();
                                                    if (editor) handleNoteChange(editor.root.innerHTML);
                                                }}
                                                className="px-1.5 py-0.5 text-[10px] font-medium rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-slate-500 dark:text-slate-400 transition-colors"
                                            >
                                                {pct}%
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Status Bar */}
                        <div className="h-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                            <div className="flex items-center gap-4">
                                <span>
                                    {(() => {
                                        const text = getPlainText(currentNoteContent).trim();
                                        return text.length > 0 ? text.split(/\s+/).length : 0;
                                    })()} Palavras
                                </span>
                                <span>
                                    {getPlainText(currentNoteContent).length} Caracteres
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {notes[noteKey]?.updated_at && (
                                    <span className="flex items-center gap-1 normal-case">
                                        <Clock size={10} />
                                        {formatLastEdited(notes[noteKey].updated_at)}
                                    </span>
                                )}
                                <span>{selectedSubtopic}</span>
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
