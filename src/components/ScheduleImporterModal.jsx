import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    FileText,
    Sparkles,
    Check,
    AlertCircle,
    Calendar,
    BookOpen,
    Layers,
    ChevronDown,
    ChevronRight,
    ArrowRight,
    Loader2,
    Plus,
    Trash2,
    RotateCcw,
    Zap,
    HelpCircle,
    Edit3,
    ArrowUp,
    ArrowDown,
    PlusCircle,
    Coffee,
    BookMarked,
    CalendarPlus,
    Tag,
    Pencil
} from 'lucide-react';
import { useSubjects } from '../hooks/useSubjects.jsx';
import { useSchedules } from '../hooks/useSchedules';
import {
    parseTextToSchedule,
    parseEditalLocally,
    generateScheduleFromEditalWithAI,
    generateUniqueId,
    findMatchingSubject,
    normalizeString
} from '../lib/scheduleImporter';
import { ICON_MAP } from '../lib/icons';

const WEEKDAYS = [
    { id: 1, name: 'Seg' },
    { id: 2, name: 'Ter' },
    { id: 3, name: 'Qua' },
    { id: 4, name: 'Qui' },
    { id: 5, name: 'Sex' },
    { id: 6, name: 'Sáb' },
    { id: 7, name: 'Dom' },
];

const SAMPLE_WEEKDAYS = `SEMANA 1
Segunda: Direito Constitucional - Teoria da Constituição e Controle, Direito Civil - Pessoas
Terça: Direito Administrativo - Princípios e Regime Jurídico, Direito Penal - Teoria do Crime
Quarta: Direito Processual Civil - Normas Fundamentais, Direito do Trabalho - Relação de Emprego
Quinta: Direito Constitucional - Direitos Fundamentais (Art. 5º), Direito Civil - Negócio Jurídico
Sexta: Direito Administrativo - Atos Administrativos, Direito Penal - Fato Típico e Ilicitude
Sábado: Revisão Semanal
Domingo: Descanso

SEMANA 2
Segunda: Direito Constitucional - Remédios Constitucionais, Direito Civil - Obrigações e Contratos
Terça: Direito Administrativo - Poderes da Administração, Direito Penal - Culpabilidade e Penas
Quarta: Direito Processual Civil - Competência e Sujeitos, Direito do Trabalho - Remuneração e Salário
Quinta: Direito Constitucional - Organização do Estado, Direito Civil - Responsabilidade Civil
Sexta: Direito Administrativo - Licitações Lei 14.133, Direito Penal - Crimes contra o Patrimônio
Sábado: Simulado e Questões
Domingo: Descanso`;

const SAMPLE_DAY_NUMBERS = `Dia 01: Direito Constitucional - Teoria da Constituição, Direito Civil - Pessoas
Dia 02: Direito Administrativo - Princípios, Direito Penal - Princípios Penais
Dia 03: Direito Processual Civil - Normas Fundamentais, Direito do Trabalho - Relação de Trabalho
Dia 04: Direito Constitucional - Artigo 5º da CF, Direito Civil - Fatos Jurídicos
Dia 05: Direito Administrativo - Atos Administrativos, Direito Penal - Teoria do Delito
Dia 06: Revisão Semanal
Dia 07: Descanso
Dia 08: Direito Constitucional - Organização dos Poderes, Direito Civil - Obrigações
Dia 09: Direito Administrativo - Licitações, Direito Penal - Crimes contra a Pessoa
Dia 10: Direito Processual Civil - Petição Inicial, Direito do Trabalho - Rescisão Contratual
Dia 11: Direito Tributário - Sistema Tributário Nacional, Direito Civil - Contratos em Espécie
Dia 12: Direito Administrativo - Bens Públicos, Direito Penal - Crimes contra o Patrimônio
Dia 13: Revisão Semanal
Dia 14: Descanso`;

const SAMPLE_BULLET_LIST = `Semana 1:
- Direito Constitucional: Teoria da Constituição
- Direito Administrativo: Regime Jurídico e Princípios
- Direito Penal: Princípios e Aplicação da Lei Penal
- Direito Civil: Personalidade e Bens
- Direito Processual Civil: Jurisdição e Ação
- Revisão Semanal
- Descanso

Semana 2:
- Direito Constitucional: Direitos Individuais (Art. 5º)
- Direito Administrativo: Atos Administrativos
- Direito Penal: Tipicidade e Antijuridicidade
- Direito Civil: Validade do Negócio Jurídico
- Direito do Trabalho: Contrato Individual de Trabalho
- Revisão Semanal
- Descanso`;

const SAMPLE_EDITAL = `DIREITO CONSTITUCIONAL:
1. Teoria da Constituição e Controle de Constitucionalidade.
2. Direitos e Garantias Fundamentais: Direitos individuais e coletivos (Art. 5º da CF).
3. Organização do Estado: Competências da União, Estados e Municípios.
4. Poder Legislativo, Poder Executivo e Poder Judiciário.
5. Funções Essenciais à Justiça: Ministério Público e Advocacia Pública.

DIREITO ADMINISTRATIVO:
1. Princípios fundamentais da Administração Pública.
2. Regime Jurídico Administrativo.
3. Atos Administrativos: conceito, requisitos, atributos, anulação e revogação.
4. Poderes Administrativos: Poder de Polícia, Disciplinar, Regulamentar e Hierárquico.
5. Licitações e Contratos Públicos (Lei nº 14.133/2021).
6. Agentes Públicos e Responsabilidade Civil do Estado.

DIREITO PENAL:
1. Princípios fundamentais do Direito Penal.
2. Teoria do Delito: Fato Típico, Ilicitude e Culpabilidade.
3. Concurso de Pessoas e Concurso de Crimes.
4. Crimes contra a Vida e contra o Patrimônio.
5. Crimes contra a Administração Pública.`;

export default function ScheduleImporterModal({ isOpen, onClose }) {
    const { subjects, addMultipleSubjectsAndTopics } = useSubjects();
    const { createSchedule, setActiveSchedule } = useSchedules();

    // Abas: 'text' (cronograma pronto) | 'edital' (gerar de edital) | 'preview' (ajustes finais)
    const [activeTab, setActiveTab] = useState('text');
    const [scheduleName, setScheduleName] = useState('');

    // Estado para texto livre / cronograma pronto
    const [rawText, setRawText] = useState('');

    // Estado para gerador via Edital
    const [editalText, setEditalText] = useState('');
    const [weeksCount, setWeeksCount] = useState(8);
    const [studyDaysPerWeek, setStudyDaysPerWeek] = useState(6);
    const [topicsPerDay, setTopicsPerDay] = useState(2);
    const [restDays, setRestDays] = useState([7]);

    // Estado de resultado e processamento
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');
    const [parsedResult, setParsedResult] = useState(null);

    // Estado da prévia editável
    const [previewSchedule, setPreviewSchedule] = useState({});
    const [selectedPreviewWeek, setSelectedPreviewWeek] = useState('week1');
    const [saving, setSaving] = useState(false);

    // Estados de edição interativa da prévia
    const [editingTopic, setEditingTopic] = useState(null);
    const [addingToDay, setAddingToDay] = useState(null);
    const [newTopicSubject, setNewTopicSubject] = useState('');
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [isCustomSubject, setIsCustomSubject] = useState(false);

    // Reseta o modal para o estado inicial sempre que for aberto
    useEffect(() => {
        if (isOpen) {
            setActiveTab('text');
            setScheduleName('');
            setRawText('');
            setEditalText('');
            setWeeksCount(8);
            setStudyDaysPerWeek(6);
            setTopicsPerDay(2);
            setRestDays([7]);
            setParsedResult(null);
            setPreviewSchedule({});
            setSelectedPreviewWeek('week1');
            setError('');
            setLoading(false);
            setSaving(false);
            setEditingTopic(null);
            setAddingToDay(null);
            setNewTopicSubject('');
            setNewTopicTitle('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleRestDayToggle = (dayId) => {
        setRestDays(prev =>
            prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
        );
    };

    // Processa texto livre (localmente com custo zero)
    const handleParseText = () => {
        setError('');
        if (!rawText.trim()) {
            setError('Cole o texto do cronograma para continuar.');
            return;
        }

        const result = parseTextToSchedule(rawText, subjects);
        if (!result.success) {
            setError(result.error || 'Erro ao processar texto.');
            return;
        }

        setParsedResult(result);
        setPreviewSchedule(result.scheduleStructure);
        if (!scheduleName.trim()) {
            setScheduleName(`Cronograma Importado ${new Date().toLocaleDateString('pt-BR')}`);
        }
        const weeks = Object.keys(result.scheduleStructure);
        if (weeks.length > 0) setSelectedPreviewWeek(weeks[0]);
        setActiveTab('preview');
    };

    // Gera a partir do edital (Local ou com IA)
    const handleGenerateFromEdital = async (useAI = false) => {
        setError('');
        if (!editalText.trim()) {
            setError('Cole o conteúdo programático do edital para continuar.');
            return;
        }

        setLoading(true);
        setLoadingMessage(useAI ? 'JusIA analisando edital e montando cronograma...' : 'Processando tópicos do edital...');

        try {
            const options = {
                weeksCount,
                studyDaysPerWeek,
                topicsPerDay,
                restDays,
                examName: scheduleName.trim() || 'Concurso / OAB'
            };

            let result;
            if (useAI) {
                result = await generateScheduleFromEditalWithAI(editalText, options, subjects);
            } else {
                result = parseEditalLocally(editalText, options, subjects);
            }

            if (!result.success) {
                setError(result.error || 'Erro ao gerar cronograma a partir do edital.');
                setLoading(false);
                return;
            }

            setParsedResult(result);
            setPreviewSchedule(result.scheduleStructure);
            if (!scheduleName.trim()) {
                setScheduleName(`Edital ${new Date().toLocaleDateString('pt-BR')}`);
            }
            const weeks = Object.keys(result.scheduleStructure);
            if (weeks.length > 0) setSelectedPreviewWeek(weeks[0]);
            setActiveTab('preview');
        } catch (err) {
            console.error("Erro na geração:", err);
            setError('Ocorreu um erro ao processar. Tente novamente ou use o modo local.');
        } finally {
            setLoading(false);
        }
    };

    // Helper: Todas as matérias disponíveis para seleção
    const allAvailableSubjects = [
        ...subjects,
        ...(parsedResult?.newSubjects || [])
    ].reduce((acc, current) => {
        if (current && current.title && !acc.some(item => normalizeString(item.title) === normalizeString(current.title))) {
            acc.push(current);
        }
        return acc;
    }, []);

    // Helper: Obtém informações completas de exibição de um tópico por ID com alto contraste e harmonia de cores
    const getTopicDisplayInfo = (topicId) => {
        if (topicId === 'rest') {
            return {
                id: 'rest',
                isRest: true,
                isReview: false,
                subjectTitle: 'Descanso',
                topicTitle: 'Dia Livre / Descanso Programado',
                rowBg: 'bg-amber-500/10 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-900/60',
                badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
                titleColor: 'text-amber-950 dark:text-amber-200'
            };
        }
        if (topicId === 'review') {
            return {
                id: 'review',
                isRest: false,
                isReview: true,
                subjectTitle: 'Revisão',
                topicTitle: 'Revisão Geral e Resolução de Questões',
                rowBg: 'bg-purple-500/10 dark:bg-purple-950/30 border-purple-300/80 dark:border-purple-900/60',
                badgeBg: 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
                titleColor: 'text-purple-950 dark:text-purple-200'
            };
        }

        // Helper para mapear cores harmônicas por nome de matéria
        const getSubjectColors = (title = '') => {
            const t = normalizeString(title);
            if (t.includes('constitu')) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800/80';
            if (t.includes('civil') || t.includes('lindb')) return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800/80';
            if (t.includes('penal')) return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/80';
            if (t.includes('admin')) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/80';
            if (t.includes('portug') || t.includes('lingua') || t.includes('redac')) return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/80';
            if (t.includes('process') || t.includes('proc')) return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800/80';
            if (t.includes('trabalho') || t.includes('tribut')) return 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/80 dark:text-teal-300 dark:border-teal-800/80';
            if (t.includes('legisla') || t.includes('especial') || t.includes('etica')) return 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/80 dark:text-violet-300 dark:border-violet-800/80';
            return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
        };

        // 1. Matérias do app
        for (const s of subjects) {
            const t = s.topics?.find(top => top.id === topicId);
            if (t) {
                return {
                    id: topicId,
                    isRest: false,
                    isReview: false,
                    subjectId: s.id,
                    subjectTitle: s.title,
                    topicTitle: t.title,
                    rowBg: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500',
                    badgeBg: getSubjectColors(s.title),
                    titleColor: 'text-slate-900 dark:text-slate-100'
                };
            }
        }

        // 2. Novas matérias geradas no parse
        if (parsedResult?.newSubjects) {
            for (const ns of parsedResult.newSubjects) {
                const t = ns.topics?.find(top => top.id === topicId);
                if (t) {
                    return {
                        id: topicId,
                        isRest: false,
                        isReview: false,
                        subjectId: ns.id,
                        subjectTitle: ns.title,
                        topicTitle: t.title,
                        rowBg: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500',
                        badgeBg: getSubjectColors(ns.title),
                        titleColor: 'text-slate-900 dark:text-slate-100'
                    };
                }
            }
        }

        // 3. Matérias atualizadas
        if (parsedResult?.updatedSubjects) {
            for (const us of parsedResult.updatedSubjects) {
                const t = us.topics?.find(top => top.id === topicId);
                if (t) {
                    return {
                        id: topicId,
                        isRest: false,
                        isReview: false,
                        subjectId: us.id,
                        subjectTitle: us.title,
                        topicTitle: t.title,
                        rowBg: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500',
                        badgeBg: getSubjectColors(us.title),
                        titleColor: 'text-slate-900 dark:text-slate-100'
                    };
                }
            }
        }

        return {
            id: topicId,
            isRest: false,
            isReview: false,
            subjectTitle: 'Geral',
            topicTitle: topicId,
            rowBg: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
            badgeBg: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
            titleColor: 'text-slate-900 dark:text-slate-100'
        };
    };

    // Remove um tópico de um dia
    const handleRemoveTopicFromPreview = (weekKey, dayKey, topicIndex) => {
        setPreviewSchedule(prev => {
            const week = { ...prev[weekKey] };
            const currentDay = [...(week[dayKey] || [])];
            currentDay.splice(topicIndex, 1);
            if (currentDay.length === 0) {
                currentDay.push('rest');
            }
            return {
                ...prev,
                [weekKey]: {
                    ...week,
                    [dayKey]: currentDay
                }
            };
        });
    };

    // Move um tópico para cima ou para baixo dentro do dia
    const handleMoveTopic = (weekKey, dayKey, topicIndex, direction) => {
        setPreviewSchedule(prev => {
            const week = { ...(prev[weekKey] || {}) };
            const currentDay = [...(week[dayKey] || [])];
            const targetIndex = direction === 'up' ? topicIndex - 1 : topicIndex + 1;
            if (targetIndex < 0 || targetIndex >= currentDay.length) return prev;

            const temp = currentDay[topicIndex];
            currentDay[topicIndex] = currentDay[targetIndex];
            currentDay[targetIndex] = temp;

            return {
                ...prev,
                [weekKey]: {
                    ...week,
                    [dayKey]: currentDay
                }
            };
        });
    };

    // Define dia inteiro como Descanso ou Revisão
    const handleSetDayQuickType = (weekKey, dayKey, type) => {
        setPreviewSchedule(prev => ({
            ...prev,
            [weekKey]: {
                ...prev[weekKey],
                [dayKey]: [type]
            }
        }));
    };

    // Remove um dia da semana
    const handleRemoveDay = (weekKey, dayKey) => {
        setPreviewSchedule(prev => {
            const week = { ...(prev[weekKey] || {}) };
            delete week[dayKey];
            return {
                ...prev,
                [weekKey]: week
            };
        });
    };

    // Adiciona um novo dia na semana
    const handleAddDayToWeek = (weekKey) => {
        setPreviewSchedule(prev => {
            const week = { ...(prev[weekKey] || {}) };
            let maxDay = 0;
            Object.values(prev).forEach(w => {
                Object.keys(w).forEach(dk => {
                    const match = dk.match(/\d+/);
                    if (match) maxDay = Math.max(maxDay, parseInt(match[0], 10));
                });
            });
            const nextDayNum = maxDay + 1;
            const newDayKey = `Dia ${String(nextDayNum).padStart(2, '0')}`;
            week[newDayKey] = ['rest'];

            return {
                ...prev,
                [weekKey]: week
            };
        });
    };

    // Adiciona uma nova semana completa
    const handleAddWeek = () => {
        const currentWeeks = Object.keys(previewSchedule);
        const nextWeekNum = currentWeeks.length + 1;
        const newWeekKey = `week${nextWeekNum}`;

        let maxDay = 0;
        Object.values(previewSchedule).forEach(w => {
            Object.keys(w).forEach(dk => {
                const match = dk.match(/\d+/);
                if (match) maxDay = Math.max(maxDay, parseInt(match[0], 10));
            });
        });

        const newDays = {};
        for (let i = 1; i <= 7; i++) {
            const dayNum = maxDay + i;
            const dayKey = `Dia ${String(dayNum).padStart(2, '0')}`;
            newDays[dayKey] = i === 7 ? ['rest'] : ['review'];
        }

        setPreviewSchedule(prev => ({
            ...prev,
            [newWeekKey]: newDays
        }));
        setSelectedPreviewWeek(newWeekKey);
    };

    // Remove uma semana
    const handleRemoveWeek = (weekKey) => {
        const weeks = Object.keys(previewSchedule);
        if (weeks.length <= 1) return;

        setPreviewSchedule(prev => {
            const copy = { ...prev };
            delete copy[weekKey];
            return copy;
        });

        const remaining = weeks.filter(k => k !== weekKey);
        if (remaining.length > 0) setSelectedPreviewWeek(remaining[0]);
    };

    // Inicia edição de um tópico
    const handleStartEditTopic = (topicId, weekKey, dayKey, index) => {
        const info = getTopicDisplayInfo(topicId);
        setEditingTopic({
            id: topicId,
            subjectTitle: info.subjectTitle,
            topicTitle: info.topicTitle,
            weekKey,
            dayKey,
            index
        });
    };

    // Salva alteração de um tópico
    const handleSaveTopicEdit = () => {
        if (!editingTopic || !editingTopic.topicTitle.trim()) return;
        const { id, topicTitle, subjectTitle, weekKey, dayKey, index } = editingTopic;

        // Se era descanso/revisão e o usuário mudou o texto para matéria real, cria tópico novo
        if (id === 'rest' || id === 'review') {
            const newId = generateUniqueId('top');
            const targetSubjTitle = subjectTitle.trim() || 'Geral';

            setParsedResult(prev => {
                const base = prev || { newSubjects: [], updatedSubjects: [], scheduleStructure: {} };
                const newSubjs = [...(base.newSubjects || [])];
                const updatedSubjs = [...(base.updatedSubjects || [])];

                let targetSubj = newSubjs.find(s => normalizeString(s.title) === normalizeString(targetSubjTitle)) ||
                    updatedSubjs.find(s => normalizeString(s.title) === normalizeString(targetSubjTitle)) ||
                    subjects.find(s => normalizeString(s.title) === normalizeString(targetSubjTitle));

                if (targetSubj) {
                    if (!targetSubj.topics) targetSubj.topics = [];
                    targetSubj.topics.push({
                        id: newId,
                        title: topicTitle.trim(),
                        subtopics: [topicTitle.trim()],
                        isNewlyCreated: true
                    });
                    if (!newSubjs.includes(targetSubj) && !updatedSubjs.includes(targetSubj)) {
                        updatedSubjs.push({ ...targetSubj });
                    }
                } else {
                    newSubjs.push({
                        id: generateUniqueId('subj'),
                        title: targetSubjTitle,
                        color: 'text-indigo-600',
                        bgColor: 'bg-indigo-600',
                        bgLight: 'bg-indigo-50',
                        icon: 'BookOpen',
                        topics: [{
                            id: newId,
                            title: topicTitle.trim(),
                            subtopics: [topicTitle.trim()],
                            isNewlyCreated: true
                        }],
                        isNewlyCreated: true
                    });
                }

                return { ...base, newSubjects: newSubjs, updatedSubjects: updatedSubjs };
            });

            // Atualiza a posição do array do dia com o novo ID
            setPreviewSchedule(prev => {
                const week = { ...(prev[weekKey] || {}) };
                const currentDay = [...(week[dayKey] || [])];
                currentDay[index] = newId;
                return { ...prev, [weekKey]: { ...week, [dayKey]: currentDay } };
            });

            setEditingTopic(null);
            return;
        }

        // Atualiza nos newSubjects ou updatedSubjects do parsedResult
        setParsedResult(prev => {
            if (!prev) return prev;
            const newSubjs = [...(prev.newSubjects || [])];
            let found = false;

            for (const s of newSubjs) {
                const t = s.topics?.find(top => top.id === id);
                if (t) {
                    t.title = topicTitle.trim();
                    if (subjectTitle.trim()) s.title = subjectTitle.trim();
                    found = true;
                    break;
                }
            }

            const updatedSubjs = [...(prev.updatedSubjects || [])];
            if (!found) {
                for (const s of updatedSubjs) {
                    const t = s.topics?.find(top => top.id === id);
                    if (t) {
                        t.title = topicTitle.trim();
                        if (subjectTitle.trim()) s.title = subjectTitle.trim();
                        found = true;
                        break;
                    }
                }
            }

            return {
                ...prev,
                newSubjects: newSubjs,
                updatedSubjects: updatedSubjs
            };
        });

        setEditingTopic(null);
    };

    // Adiciona novo tópico em um dia específico
    const handleAddNewTopicToDay = (weekKey, dayKey) => {
        if (!newTopicTitle.trim()) return;

        const subTitle = newTopicSubject.trim() || 'Geral';
        const topTitle = newTopicTitle.trim();
        const newTopicId = generateUniqueId('top');

        setParsedResult(prev => {
            const base = prev || { newSubjects: [], updatedSubjects: [], scheduleStructure: {} };
            const newSubjs = [...(base.newSubjects || [])];
            const updatedSubjs = [...(base.updatedSubjects || [])];

            let targetSubj = newSubjs.find(s => normalizeString(s.title) === normalizeString(subTitle)) ||
                updatedSubjs.find(s => normalizeString(s.title) === normalizeString(subTitle)) ||
                subjects.find(s => normalizeString(s.title) === normalizeString(subTitle));

            if (targetSubj) {
                if (!targetSubj.topics) targetSubj.topics = [];
                targetSubj.topics.push({
                    id: newTopicId,
                    title: topTitle,
                    subtopics: [topTitle],
                    isNewlyCreated: true
                });
                if (!newSubjs.includes(targetSubj) && !updatedSubjs.includes(targetSubj)) {
                    updatedSubjs.push({ ...targetSubj });
                }
            } else {
                newSubjs.push({
                    id: generateUniqueId('subj'),
                    title: subTitle,
                    color: 'text-indigo-600',
                    bgColor: 'bg-indigo-600',
                    bgLight: 'bg-indigo-50',
                    icon: 'BookOpen',
                    topics: [{
                        id: newTopicId,
                        title: topTitle,
                        subtopics: [topTitle],
                        isNewlyCreated: true
                    }],
                    isNewlyCreated: true
                });
            }

            return {
                ...base,
                newSubjects: newSubjs,
                updatedSubjects: updatedSubjs
            };
        });

        setPreviewSchedule(prev => {
            const week = { ...(prev[weekKey] || {}) };
            let currentDayTopics = [...(week[dayKey] || [])];
            currentDayTopics = currentDayTopics.filter(id => id !== 'rest');
            currentDayTopics.push(newTopicId);

            return {
                ...prev,
                [weekKey]: {
                    ...week,
                    [dayKey]: currentDayTopics
                }
            };
        });

        setAddingToDay(null);
        setNewTopicTitle('');
        setNewTopicSubject('');
        setIsCustomSubject(false);
    };

    // Adiciona descanso ou revisão rápida ao dia
    const handleAddQuickBlock = (weekKey, dayKey, type) => {
        setPreviewSchedule(prev => {
            const week = { ...(prev[weekKey] || {}) };
            let currentDayTopics = [...(week[dayKey] || [])];
            if (type === 'rest') {
                currentDayTopics = ['rest'];
            } else if (type === 'review') {
                currentDayTopics = currentDayTopics.filter(id => id !== 'rest');
                currentDayTopics.push('review');
            }

            return {
                ...prev,
                [weekKey]: {
                    ...week,
                    [dayKey]: currentDayTopics
                }
            };
        });
        setAddingToDay(null);
    };

    // Salva o cronograma importado no sistema
    const handleSaveAndActivate = async () => {
        const finalName = scheduleName.trim() || 'Meu Cronograma Personalizado';
        setSaving(true);
        setError('');

        try {
            // 1. Se houver novas matérias ou tópicos, salva no useSubjects
            if (parsedResult) {
                const { newSubjects = [], updatedSubjects = [] } = parsedResult;
                if (newSubjects.length > 0 || updatedSubjects.length > 0) {
                    await addMultipleSubjectsAndTopics(newSubjects, updatedSubjects);
                }
            }

            // 2. Extrai topicIds de toda a grade customizada
            const allTopicIds = [];
            Object.values(previewSchedule).forEach(w => {
                Object.values(w).forEach(d => {
                    if (Array.isArray(d)) {
                        d.forEach(id => {
                            if (id && id !== 'rest' && id !== 'review') {
                                allTopicIds.push(id);
                            }
                        });
                    }
                });
            });

            const uniqueTopicIds = [...new Set(allTopicIds)];

            // 3. Cria o novo cronograma com a grade customizada e ativa
            const settings = {
                customSchedule: previewSchedule,
                isCustomized: true,
                studyDaysPerWeek,
                restDays,
                topicsPerDay
            };

            const newSchedule = await createSchedule(finalName, uniqueTopicIds, false, settings);

            if (newSchedule && newSchedule.id) {
                await setActiveSchedule(newSchedule.id);
            }

            onClose();
        } catch (err) {
            console.error("Erro ao salvar cronograma:", err);
            setError('Erro ao salvar cronograma. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const previewWeeks = Object.keys(previewSchedule);

    return createPortal(
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
                                <Zap className="text-amber-300" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Importar ou Criar Cronograma</h2>
                                <p className="text-xs text-blue-100/90">
                                    Monte seu plano automático a partir de texto, edital ou com assistência de IA
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950 p-2 gap-2">
                        <button
                            onClick={() => setActiveTab('text')}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'text'
                                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-850'
                                }`}
                        >
                            <FileText size={18} />
                            <span>1. Cronograma Pronto</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('edital')}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'edital'
                                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-850'
                                }`}
                        >
                            <Sparkles size={18} />
                            <span>2. Gerar do Edital</span>
                        </button>

                        {previewWeeks.length > 0 && (
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'preview'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-850'
                                    }`}
                            >
                                <Layers size={18} />
                                <span>3. Prévia & Edição</span>
                            </button>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
                                <AlertCircle size={20} className="flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* TAB 1: CRONOGRAMA PRONTO */}
                        {activeTab === 'text' && (
                            <div className="space-y-5 animate-fade-in">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            Nome do Cronograma
                                        </label>
                                        <span className="text-xs text-slate-400">Opcional</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={scheduleName}
                                        onChange={(e) => setScheduleName(e.target.value)}
                                        placeholder="Ex: Reta Final TJ-SP ou Cronograma 60 Dias"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            Cole seu cronograma (Texto livre, Dias, Semanas, Marcadores ou Tabelas)
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="text-xs text-slate-400 self-center mr-1">Modelos:</span>
                                            <button
                                                type="button"
                                                onClick={() => setRawText(SAMPLE_WEEKDAYS)}
                                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg transition-colors border border-blue-200/50 dark:border-blue-800/50"
                                            >
                                                📅 Dias da Semana
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRawText(SAMPLE_DAY_NUMBERS)}
                                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg transition-colors border border-blue-200/50 dark:border-blue-800/50"
                                            >
                                                🔢 Dia 1, 2, 3...
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRawText(SAMPLE_BULLET_LIST)}
                                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg transition-colors border border-blue-200/50 dark:border-blue-800/50"
                                            >
                                                📋 Lista com Marcadores
                                            </button>
                                        </div>
                                    </div>

                                    <textarea
                                        rows={10}
                                        value={rawText}
                                        onChange={(e) => setRawText(e.target.value)}
                                        placeholder={`Cole seu cronograma aqui em qualquer formato...\n\nExemplos aceitos automaticamente:\n• SEMANA 1\n  Segunda: Direito Constitucional - Teoria da CF\n  Terça: Direito Penal - Princípios\n  Quarta: Descanso\n\n• Dia 1: Constitucional: Art. 5º / Dia 2: Penal\n\n• Semana 1\n  - Direito Civil (Pessoas)\n  - Direito Processual Civil (Normas)`}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 leading-relaxed"
                                    />

                                    <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1">
                                        <p className="font-semibold flex items-center gap-1.5">
                                            <Zap size={14} className="text-amber-500 flex-shrink-0" />
                                            <span>Detecção Semântica Automática de Palavras-Chave:</span>
                                        </p>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                            O sistema reconhece palavras como <strong>Semana / Week / 1ª Semana</strong> para dividir blocos semanais, <strong>Dia 1 / D01 / Segunda / Terça</strong> para dias, <strong>Descanso / Folga / Livre</strong> para pausas, e <strong>Revisão / Simulado</strong> para revisões periódicas.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={handleParseText}
                                        disabled={!rawText.trim()}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-md transition-all flex items-center gap-2"
                                    >
                                        <span>Processar Cronograma</span>
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: GERAR DO EDITAL */}
                        {activeTab === 'edital' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                                        Nome do Exame / Concurso
                                    </label>
                                    <input
                                        type="text"
                                        value={scheduleName}
                                        onChange={(e) => setScheduleName(e.target.value)}
                                        placeholder="Ex: Concurso TJ-SP ou Exame OAB"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                            Duração (Semanas)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="2"
                                                max="30"
                                                value={weeksCount}
                                                onChange={(e) => setWeeksCount(Math.max(2, parseInt(e.target.value) || 2))}
                                                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                            Tópicos por Dia
                                        </label>
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4].map(n => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => setTopicsPerDay(n)}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${topicsPerDay === n
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                        }`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                            Dias de Estudo
                                        </label>
                                        <select
                                            value={studyDaysPerWeek}
                                            onChange={(e) => setStudyDaysPerWeek(Number(e.target.value))}
                                            className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 outline-none"
                                        >
                                            <option value={5}>5 dias por semana</option>
                                            <option value={6}>6 dias por semana</option>
                                            <option value={7}>7 dias por semana</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-3 pt-2">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                            Dias de Descanso Semanal
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {WEEKDAYS.map(day => (
                                                <button
                                                    key={day.id}
                                                    type="button"
                                                    onClick={() => handleRestDayToggle(day.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${restDays.includes(day.id)
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                        }`}
                                                >
                                                    {day.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            Conteúdo Programático do Edital
                                        </label>
                                        <button
                                            onClick={() => setEditalText(SAMPLE_EDITAL)}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                            Carregar Exemplo de Edital
                                        </button>
                                    </div>
                                    <textarea
                                        rows={8}
                                        value={editalText}
                                        onChange={(e) => setEditalText(e.target.value)}
                                        placeholder={`Cole o conteúdo programático aqui...\nExemplo:\nDIREITO CONSTITUCIONAL:\n1. Teoria da Constituição.\n2. Direitos Fundamentais (Art. 5º)...\n\nDIREITO PENAL:\n1. Fato Típico...`}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 leading-relaxed"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        Gere gratuitamente com o algoritmo local ou use a JusIA (Gemini) se configurada.
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => handleGenerateFromEdital(false)}
                                            disabled={loading || !editalText.trim()}
                                            className="flex-1 sm:flex-none px-5 py-3 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl font-medium text-sm transition-all"
                                        >
                                            Gerar Localmente (Grátis)
                                        </button>
                                        <button
                                            onClick={() => handleGenerateFromEdital(true)}
                                            disabled={loading || !editalText.trim()}
                                            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-sm shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    <span>{loadingMessage || 'Gerando...'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={16} />
                                                    <span>Gerar com JusIA</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: PRÉVIA E EDIÇÃO INTERATIVA */}
                        {activeTab === 'preview' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Nome do Cronograma Editável */}
                                <div className="p-4 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex-1">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                                            Nome do Cronograma
                                        </label>
                                        <input
                                            type="text"
                                            value={scheduleName}
                                            onChange={(e) => setScheduleName(e.target.value)}
                                            placeholder="Nome do Cronograma"
                                            className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button
                                            type="button"
                                            onClick={handleAddWeek}
                                            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200/80 dark:border-blue-800/80 flex items-center gap-1.5 transition-colors shadow-sm"
                                        >
                                            <CalendarPlus size={15} />
                                            <span>+ Nova Semana</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Resumo de Estatísticas */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl">
                                        <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Semanas</span>
                                        <span className="text-xl font-bold text-blue-800 dark:text-blue-200">{previewWeeks.length}</span>
                                    </div>
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
                                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Total de Dias</span>
                                        <span className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                                            {Object.values(previewSchedule).reduce((sum, w) => sum + Object.keys(w).length, 0)}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-xl">
                                        <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">Itens no Plano</span>
                                        <span className="text-xl font-bold text-purple-800 dark:text-purple-200">
                                            {Object.values(previewSchedule).reduce((sum, w) => sum + Object.values(w).reduce((s, d) => s + (Array.isArray(d) ? d.length : 0), 0), 0)}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                                        <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Novas Matérias</span>
                                        <span className="text-xl font-bold text-amber-800 dark:text-amber-200">{parsedResult?.newSubjects?.length || 0}</span>
                                    </div>
                                </div>

                                {/* Novas matérias detectadas */}
                                {parsedResult?.newSubjects?.length > 0 && (
                                    <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-2xl">
                                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <BookOpen size={14} />
                                            Novas Matérias que serão cadastradas:
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {parsedResult.newSubjects.map(ns => (
                                                <span
                                                    key={ns.id}
                                                    className="px-3 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-semibold text-amber-900 dark:text-amber-200 shadow-sm"
                                                >
                                                    {ns.title} ({ns.topics?.length || 0} tópicos)
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Seletor de Semanas com Ação de Exclusão */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {previewWeeks.map((week, idx) => (
                                        <div key={week} className="flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPreviewWeek(week)}
                                                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${selectedPreviewWeek === week
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                    }`}
                                            >
                                                <span>Semana {idx + 1}</span>
                                                {selectedPreviewWeek === week && previewWeeks.length > 1 && (
                                                    <span
                                                        onClick={(e) => {
                                                             e.stopPropagation();
                                                             handleRemoveWeek(week);
                                                        }}
                                                        className="p-0.5 hover:bg-red-500 rounded text-white/80 hover:text-white transition-colors"
                                                        title="Excluir semana"
                                                    >
                                                        <Trash2 size={12} />
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleAddWeek}
                                        className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                                        title="Adicionar nova semana"
                                    >
                                        <Plus size={14} />
                                        <span>Semana</span>
                                    </button>
                                </div>

                                {/* Grade de Dias da Semana Selecionada */}
                                <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
                                    {previewSchedule[selectedPreviewWeek] && Object.entries(previewSchedule[selectedPreviewWeek]).map(([dayKey, dayTopicIds]) => (
                                        <div
                                            key={dayKey}
                                            className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                                        >
                                            {/* Cabeçalho do Dia com Ações Rápidas */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                        {dayKey}
                                                    </span>
                                                    <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-full border border-slate-300 dark:border-slate-700">
                                                        {dayTopicIds.length} {dayTopicIds.length === 1 ? 'item' : 'itens'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetDayQuickType(selectedPreviewWeek, dayKey, 'rest')}
                                                        className="px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1 shadow-sm"
                                                        title="Definir dia todo como Descanso"
                                                    >
                                                        <Coffee size={12} />
                                                        <span>Descanso</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetDayQuickType(selectedPreviewWeek, dayKey, 'review')}
                                                        className="px-2.5 py-1 text-[11px] font-bold text-purple-800 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1 shadow-sm"
                                                        title="Definir dia todo como Revisão"
                                                    >
                                                        <RotateCcw size={12} />
                                                        <span>Revisão</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveDay(selectedPreviewWeek, dayKey)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                                        title="Remover este dia"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Lista de Tópicos do Dia */}
                                            <div className="space-y-2">
                                                {dayTopicIds.map((topicId, idx) => {
                                                    const info = getTopicDisplayInfo(topicId);

                                                    return (
                                                        <div
                                                            key={`${topicId}-${idx}`}
                                                            className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all shadow-sm ${info.rowBg}`}
                                                        >
                                                            <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${info.badgeBg}`}>
                                                                    {info.subjectTitle}
                                                                </span>
                                                                <span className={`font-medium truncate leading-tight ${info.titleColor}`}>
                                                                    {info.topicTitle}
                                                                </span>
                                                            </div>

                                                            {/* Botões de Ação do Tópico */}
                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                {idx > 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMoveTopic(selectedPreviewWeek, dayKey, idx, 'up')}
                                                                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                        title="Mover para cima"
                                                                    >
                                                                        <ArrowUp size={13} />
                                                                    </button>
                                                                )}
                                                                {idx < dayTopicIds.length - 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleMoveTopic(selectedPreviewWeek, dayKey, idx, 'down')}
                                                                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                        title="Mover para baixo"
                                                                    >
                                                                        <ArrowDown size={13} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartEditTopic(topicId, selectedPreviewWeek, dayKey, idx)}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                    title="Editar conteúdo"
                                                                >
                                                                    <Edit3 size={13} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveTopicFromPreview(selectedPreviewWeek, dayKey, idx)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                                                    title="Remover do dia"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Painel Inline de Adição em um Dia */}
                                            {addingToDay?.weekKey === selectedPreviewWeek && addingToDay?.dayKey === dayKey ? (
                                                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-300 dark:border-blue-700 space-y-3 animate-fade-in shadow-md">
                                                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center justify-between">
                                                        <span>Adicionar Item ao {dayKey}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAddingToDay(null)}
                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                                                                Matéria
                                                            </label>
                                                            {isCustomSubject ? (
                                                                <div className="flex gap-1.5">
                                                                    <input
                                                                        type="text"
                                                                        value={newTopicSubject}
                                                                        onChange={(e) => setNewTopicSubject(e.target.value)}
                                                                        placeholder="Nome da Nova Matéria"
                                                                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                                                                        autoFocus
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setIsCustomSubject(false)}
                                                                        className="px-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-700 rounded-lg"
                                                                    >
                                                                        Lista
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <select
                                                                    value={newTopicSubject}
                                                                    onChange={(e) => {
                                                                        if (e.target.value === '__NEW__') {
                                                                            setIsCustomSubject(true);
                                                                            setNewTopicSubject('');
                                                                        } else {
                                                                            setNewTopicSubject(e.target.value);
                                                                        }
                                                                    }}
                                                                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                                                                >
                                                                    <option value="">Selecione a Matéria...</option>
                                                                    {allAvailableSubjects.map(s => (
                                                                        <option key={s.id || s.title} value={s.title}>
                                                                            {s.title}
                                                                        </option>
                                                                    ))}
                                                                    <option value="__NEW__">+ Criar Nova Matéria...</option>
                                                                </select>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                                                                Tópico / Assunto
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={newTopicTitle}
                                                                onChange={(e) => setNewTopicTitle(e.target.value)}
                                                                placeholder="Ex: Teoria do Delito ou Art. 5º"
                                                                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddQuickBlock(selectedPreviewWeek, dayKey, 'rest')}
                                                                className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 transition-colors"
                                                            >
                                                                + Descanso
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddQuickBlock(selectedPreviewWeek, dayKey, 'review')}
                                                                className="px-2.5 py-1 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 transition-colors"
                                                            >
                                                                + Revisão
                                                            </button>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setAddingToDay(null)}
                                                                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddNewTopicToDay(selectedPreviewWeek, dayKey)}
                                                                disabled={!newTopicTitle.trim()}
                                                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                                                            >
                                                                Adicionar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAddingToDay({ weekKey: selectedPreviewWeek, dayKey });
                                                        setNewTopicSubject('');
                                                        setNewTopicTitle('');
                                                        setIsCustomSubject(false);
                                                    }}
                                                    className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                                >
                                                    <Plus size={13} />
                                                    <span>Adicionar Item ao Dia</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Botão de Adicionar Novo Dia na Semana */}
                                    <button
                                        type="button"
                                        onClick={() => handleAddDayToWeek(selectedPreviewWeek)}
                                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                                    >
                                        <PlusCircle size={15} />
                                        <span>+ Adicionar Novo Dia nesta Semana</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal / Card de Edição de Tópico */}
                    <AnimatePresence>
                        {editingTopic && (
                            <motion.div
                                className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setEditingTopic(null)}
                            >
                                <motion.div
                                    className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 space-y-4"
                                    initial={{ scale: 0.95, y: 10 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.95, y: 10 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                            <Edit3 size={16} className="text-blue-600 dark:text-blue-400" />
                                            <span>Editar Conteúdo de Estudo</span>
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTopic(null)}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                                Matéria / Disciplina
                                            </label>
                                            <input
                                                type="text"
                                                value={editingTopic.subjectTitle}
                                                onChange={(e) => setEditingTopic(prev => ({ ...prev, subjectTitle: e.target.value }))}
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                                Título do Tópico / Detalhes
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={editingTopic.topicTitle}
                                                onChange={(e) => setEditingTopic(prev => ({ ...prev, topicTitle: e.target.value }))}
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setEditingTopic(null)}
                                            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveTopicEdit}
                                            disabled={!editingTopic.topicTitle.trim()}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                                        >
                                            <Check size={14} />
                                            <span>Salvar Alterações</span>
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
                            >
                                Fechar
                            </button>
                            {activeTab === 'preview' && (
                                <button
                                    onClick={() => setActiveTab('text')}
                                    className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                    <RotateCcw size={14} />
                                    <span>Voltar e Reimportar</span>
                                </button>
                            )}
                        </div>

                        {activeTab === 'preview' ? (
                            <button
                                onClick={handleSaveAndActivate}
                                disabled={saving}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Salvando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        <span>Salvar e Ativar Cronograma</span>
                                    </>
                                )}
                            </button>
                        ) : null}
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}


