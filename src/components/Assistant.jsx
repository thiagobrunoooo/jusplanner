import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, BookOpen, CircleHelp, FileText, Paperclip, X } from 'lucide-react';
import { sendMessageToGemini } from '../lib/gemini';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

const Assistant = () => {
    const [messages, setMessages] = useState([
        {
            role: 'model',
            content: 'Olá, Dr. Thiago! Sou o JusIA, seu assistente jurídico pessoal. Como posso ajudar nos seus estudos hoje? Posso criar questões, explicar conceitos ou resumir matérias.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeDocument, setActiveDocument] = useState(null); // { name: string, content: string }
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setActiveDocument({
                name: file.name,
                content: event.target?.result
            });
        };
        reader.readAsText(file);
    };

    const removeDocument = () => {
        setActiveDocument(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            // Filter out the initial greeting from history as Gemini requires history to start with user
            const history = messages.slice(1).map(m => ({
                role: m.role,
                content: m.content
            }));

            let finalPrompt = input;
            if (activeDocument) {
                finalPrompt = `Use o seguinte documento como base principal para sua resposta:\n\n--- INÍCIO DO DOCUMENTO ---\n${activeDocument.content}\n--- FIM DO DOCUMENTO ---\n\nPergunta do usuário: ${input}`;
            }

            // We send the modified prompt to Gemini, but the UI shows the original input
            // To make history consistent for the model, we might need to adjust, but for now
            // let's send the full context in this turn.
            // Note: If we want the model to "remember" the doc for future turns without re-sending,
            // we'd need to inject it into history or system prompt.
            // For simplicity/robustness in this "one-off" context style:
            const responseText = await sendMessageToGemini(finalPrompt, history);

            setMessages(prev => [...prev, {
                role: 'model',
                content: responseText
            }]);
        } catch (err) {
            console.error("[JusIA Error]", err);
            setError(`Erro: ${err.message || "Não foi possível conectar ao JusIA"}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickAction = (action) => {
        let prompt = "";
        switch (action) {
            case 'explain':
                prompt = "Explique o conceito de [TEMA] de forma didática.";
                break;
            case 'question':
                prompt = "Crie uma questão inédita estilo OAB sobre [TEMA] com gabarito comentado.";
                break;
            case 'summarize':
                prompt = "Faça um resumo esquemático sobre [TEMA].";
                break;
            default:
                return;
        }
        setInput(prompt);
    };

    const formatInline = (text) => {
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part}</strong>;
            }
            return part;
        });
    };

    const formatMessage = (content) => {
        const parts = [];
        const lines = content.split('\n');
        let currentList = [];
        let listType = 'disc'; // 'disc' or 'decimal'
        let inCodeBlock = false;
        let codeBlockContent = [];

        const flushList = (index) => {
            if (currentList.length > 0) {
                const ListTag = listType === 'decimal' ? 'ol' : 'ul';
                const listClass = listType === 'decimal' ? 'list-decimal' : 'list-disc';
                parts.push(
                    <ListTag key={`list-${index}`} className={`${listClass} pl-4 space-y-1 mb-3 text-slate-700 dark:text-slate-300`}>
                        {currentList.map((item, i) => <li key={i}>{formatInline(item)}</li>)}
                    </ListTag>
                );
                currentList = [];
            }
        };

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            // Code Block Handling
            if (trimmedLine.startsWith('```')) {
                if (inCodeBlock) {
                    parts.push(
                        <div key={`code-${index}`} className="bg-slate-950 text-slate-50 p-3 rounded-lg my-2 overflow-x-auto text-xs font-mono">
                            {codeBlockContent.join('\n')}
                        </div>
                    );
                    codeBlockContent = [];
                    inCodeBlock = false;
                } else {
                    flushList(index);
                    inCodeBlock = true;
                }
                return;
            }

            if (inCodeBlock) {
                codeBlockContent.push(line);
                return;
            }

            // Bullet List Handling (* or -)
            if (trimmedLine.match(/^[\*\-]\s/)) {
                if (currentList.length > 0 && listType === 'decimal') {
                    flushList(index);
                }
                listType = 'disc';
                currentList.push(trimmedLine.replace(/^[\*\-]\s/, ''));
                return;
            }

            // Numbered List Handling (1., 2., etc.)
            if (trimmedLine.match(/^\d+\.\s/)) {
                if (currentList.length > 0 && listType === 'disc') {
                    flushList(index);
                }
                listType = 'decimal';
                currentList.push(trimmedLine.replace(/^\d+\.\s/, ''));
                return;
            }

            // Flush List if we hit a non-list line (and it's not empty)
            if (trimmedLine) {
                flushList(index);
            }

            // Empty lines
            if (!trimmedLine) return;

            // Regular Paragraph
            parts.push(
                <p key={`p-${index}`} className="mb-3 leading-relaxed text-slate-700 dark:text-slate-300">
                    {formatInline(line)}
                </p>
            );
        });

        flushList('end');

        return parts;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                    <Sparkles className="text-white" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">JusIA</h2>
                    <p className="text-slate-500 dark:text-slate-400">Seu assistente jurídico com Inteligência Artificial</p>
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 glass-panel shadow-xl">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex gap-3 max-w-[80%]",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                                msg.role === 'user'
                                    ? "bg-blue-600 text-white"
                                    : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                            )}>
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>

                            <div className={cn(
                                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden",
                                msg.role === 'user'
                                    ? "bg-blue-600 text-white rounded-tr-none"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700"
                            )}>
                                {msg.role === 'user' ? (
                                    <p>{msg.content}</p>
                                ) : (
                                    formatMessage(msg.content)
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 mr-auto max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                                <Loader2 className="animate-spin text-indigo-500" size={16} />
                                <span className="text-sm text-slate-500 dark:text-slate-400">JusIA está digitando...</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex justify-center my-4">
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50">
                    {/* Active Document Indicator */}
                    {activeDocument && (
                        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg mb-2 border border-indigo-100 dark:border-indigo-900/50">
                            <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                                <FileText size={14} />
                                <span className="font-medium truncate max-w-[200px]">{activeDocument.name}</span>
                                <span className="text-xs opacity-70">(Contexto Ativo)</span>
                            </div>
                            <button
                                onClick={removeDocument}
                                className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            onClick={() => handleQuickAction('explain')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors whitespace-nowrap"
                        >
                            <BookOpen size={14} />
                            Explicar Conceito
                        </button>
                        <button
                            onClick={() => handleQuickAction('question')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap"
                        >
                            <CircleHelp size={14} />
                            Criar Questão
                        </button>
                        <button
                            onClick={() => handleQuickAction('summarize')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap"
                        >
                            <FileText size={14} />
                            Resumir Tópico
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".txt,.md"
                            onChange={handleFileUpload}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                            title="Anexar documento de texto"
                        >
                            <Paperclip size={18} />
                        </Button>
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite sua dúvida jurídica..."
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                        >
                            <Send size={18} />
                        </Button>
                    </div>
                    <p className="text-xs text-center text-slate-400 mt-2">
                        O JusIA pode cometer erros. Verifique as informações importantes.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default Assistant;
