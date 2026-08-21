// =========================================================================
// JusPlanner: Módulo Universal de Importação e Parsing Inteligente de Cronogramas
// Suporta:
// 1. Detecção Inteligente de Blocos (Bloco 1: Matéria (Tópico), Matéria - Tópico, etc.)
// 2. Detecção de Semanas (🟢 SEMANA 1, Semana 01, 1ª Semana, etc.)
// 3. Detecção de Dias (Dia 1 (Segunda - 26/08), Dia 01:, Segunda:, etc.)
// 4. Mapeamento Automático de Ramos do Direito (Dir. Civil -> Direito Civil, Proc. Penal -> Direito Processual Penal, etc.)
// 5. Categorização de Revisões, Simulados e Questões
// 6. Parser de Editais e Divisão Automática Local / IA
// =========================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

// Paletas de cores para matérias
const SUBJECT_COLORS = [
    { color: 'text-indigo-600', bgColor: 'bg-indigo-600', bgLight: 'bg-indigo-50' },
    { color: 'text-blue-600', bgColor: 'bg-blue-600', bgLight: 'bg-blue-50' },
    { color: 'text-purple-600', bgColor: 'bg-purple-600', bgLight: 'bg-purple-50' },
    { color: 'text-emerald-600', bgColor: 'bg-emerald-600', bgLight: 'bg-emerald-50' },
    { color: 'text-amber-500', bgColor: 'bg-amber-500', bgLight: 'bg-amber-50' },
    { color: 'text-cyan-600', bgColor: 'bg-cyan-600', bgLight: 'bg-cyan-50' },
    { color: 'text-red-600', bgColor: 'bg-red-600', bgLight: 'bg-red-50' },
    { color: 'text-pink-500', bgColor: 'bg-pink-500', bgLight: 'bg-pink-50' },
    { color: 'text-violet-600', bgColor: 'bg-violet-600', bgLight: 'bg-violet-50' },
    { color: 'text-teal-600', bgColor: 'bg-teal-600', bgLight: 'bg-teal-50' },
];

const ICONS = ['BookOpen', 'Scale', 'Landmark', 'Gavel', 'ScrollText', 'Briefcase', 'Shield', 'Globe', 'CheckCircle', 'FileText'];

// Dicionário canônico de ramos jurídicos e matérias
// NOTA CRUCIAL: Matérias Processuais DEVEM vir ANTES das matérias de Direito Material para evitar falso-positivo em prefixos/substrings.
export const KNOWN_BRANCHES = [
    {
        canonical: 'Direito Processual Civil',
        aliases: [
            'direito processual civil',
            'dir processual civil',
            'dir. processual civil',
            'processual civil',
            'processo civil',
            'direito processo civil',
            'dir processo civil',
            'dir. processo civil',
            'proc civil',
            'proc. civil',
            'proc.civil',
            'dpc',
            'cpc',
            'codigo de processo civil',
            'código de processo civil'
        ]
    },
    {
        canonical: 'Direito Processual Penal',
        aliases: [
            'direito processual penal',
            'dir processual penal',
            'dir. processual penal',
            'processual penal',
            'processo penal',
            'direito processo penal',
            'dir processo penal',
            'dir. processo penal',
            'proc penal',
            'proc. penal',
            'proc.penal',
            'dpp',
            'cpp',
            'codigo de processo penal',
            'código de processo penal'
        ]
    },
    {
        canonical: 'Direito Processual do Trabalho',
        aliases: [
            'direito processual do trabalho',
            'dir processual do trabalho',
            'dir. processual do trabalho',
            'processo do trabalho',
            'processual do trabalho',
            'proc do trabalho',
            'proc. do trabalho',
            'proc trabalho',
            'proc. trabalho',
            'dpt',
            'processo trabalhista',
            'processual trabalhista'
        ]
    },
    {
        canonical: 'Direito Civil',
        aliases: [
            'direito civil',
            'dir civil',
            'dir. civil',
            'civil',
            'cc',
            'codigo civil',
            'código civil'
        ]
    },
    {
        canonical: 'Direito Penal',
        aliases: [
            'direito penal',
            'dir penal',
            'dir. penal',
            'penal',
            'cp',
            'codigo penal',
            'código penal'
        ]
    },
    {
        canonical: 'Direito do Trabalho',
        aliases: [
            'direito do trabalho',
            'dir do trabalho',
            'dir. do trabalho',
            'trabalho',
            'clt',
            'trabalhista',
            'direito trabalhista'
        ]
    },
    {
        canonical: 'Direito Constitucional',
        aliases: [
            'direito constitucional',
            'dir constitucional',
            'dir. constitucional',
            'constitucional',
            'const',
            'const.',
            'cf',
            'cf/88',
            'cf88'
        ]
    },
    {
        canonical: 'Direito Administrativo',
        aliases: [
            'direito administrativo',
            'dir administrativo',
            'dir. administrativo',
            'dir adm',
            'dir. adm',
            'administrativo',
            'adm',
            'adm.'
        ]
    },
    {
        canonical: 'Direito Tributário',
        aliases: [
            'direito tributario',
            'dir tributario',
            'dir. tributario',
            'direito tributário',
            'dir. tributário',
            'tributario',
            'tributário',
            'ctn'
        ]
    },
    {
        canonical: 'Direito Empresarial',
        aliases: [
            'direito empresarial',
            'dir empresarial',
            'dir. empresarial',
            'empresarial',
            'comercial',
            'direito comercial'
        ]
    },
    {
        canonical: 'Direito Eleitoral',
        aliases: ['direito eleitoral', 'dir eleitoral', 'dir. eleitoral', 'eleitoral']
    },
    {
        canonical: 'Direito Ambiental',
        aliases: ['direito ambiental', 'dir ambiental', 'dir. ambiental', 'ambiental']
    },
    {
        canonical: 'Direito do Consumidor',
        aliases: ['direito do consumidor', 'dir do consumidor', 'dir. consumidor', 'consumidor', 'cdc']
    },
    {
        canonical: 'Direitos Humanos',
        aliases: ['direitos humanos', 'dir humanos', 'dir. humanos', 'humanos', 'dh']
    },
    {
        canonical: 'Direito Previdenciário',
        aliases: ['direito previdenciario', 'dir previdenciario', 'dir. previdenciario', 'direito previdenciário', 'previdenciario', 'previdenciário']
    },
    {
        canonical: 'Redação Oficial',
        aliases: ['redacao oficial', 'redação oficial', 'manual da presidencia', 'manual de redacao']
    },
    {
        canonical: 'Língua Portuguesa',
        aliases: ['lingua portuguesa', 'língua portuguesa', 'portugues', 'português', 'gramatica', 'gramática']
    },
    {
        canonical: 'Legislação Especial',
        aliases: ['legislacao especial', 'legislação especial', 'leis especiais', 'leis penais especiais', 'legislacao institucional', 'leis extravagantes', 'legislacao estadual', 'legislação estadual', 'legislacao local']
    },
    {
        canonical: 'Raciocínio Lógico',
        aliases: ['raciocinio logico', 'raciocínio lógico', 'raciocinio logico matematico', 'rlm', 'matematica', 'matemática']
    },
    {
        canonical: 'Informática',
        aliases: ['informatica', 'informática', 'tecnologia da informacao', 'ti']
    },
    {
        canonical: 'Ética e Estatuto OAB',
        aliases: ['etica', 'ética', 'estatuto da oab', 'deontologia', 'codigo de etica', 'código de ética']
    },
    {
        canonical: 'Revisão e Questões',
        aliases: ['revisao e questoes', 'revisão e questões', 'revisoes', 'revisões', 'questoes', 'questões', 'simulados', 'treino']
    }
];

// Normaliza string (remove acentos, minúsculas, pontuação e espaços extras)
export function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Gera ID único
export function generateUniqueId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// Converte numeral romano para número inteiro (ex: "III" -> 3)
function romanToInt(roman) {
    if (!roman) return null;
    const str = roman.toUpperCase().trim();
    const romanMap = { I: 1, V: 5, X: 10, L: 50, C: 100 };
    let total = 0;
    let prev = 0;
    for (let i = str.length - 1; i >= 0; i--) {
        const current = romanMap[str[i]];
        if (!current) return null;
        if (current >= prev) {
            total += current;
        } else {
            total -= current;
        }
        prev = current;
    }
    return total > 0 && total <= 52 ? total : null;
}

// Resolve o nome canônico de uma matéria
export function resolveCanonicalSubject(rawSubject, existingSubjects = []) {
    if (!rawSubject) return 'Geral';
    const norm = normalizeString(rawSubject);
    if (!norm) return 'Geral';

    const isTargetProc = /\b(processual|processo|proc|dpc|cpc|dpp|cpp|dpt)\b/.test(norm);

    // 1. Procura primeiro nos ramos canônicos (específicos processuais vêm primeiro)
    for (const b of KNOWN_BRANCHES) {
        for (const alias of b.aliases) {
            const normAlias = normalizeString(alias);
            const isAliasProc = /\b(processual|processo|proc|dpc|cpc|dpp|cpp|dpt)\b/.test(normAlias);
            if (isTargetProc !== isAliasProc) continue;

            if (norm === normAlias || norm.startsWith(normAlias) || (normAlias.length > 4 && norm.includes(normAlias))) {
                const existing = findMatchingSubject(b.canonical, existingSubjects);
                return existing ? existing.title : b.canonical;
            }
        }
    }

    // 2. Procura nas matérias já cadastradas do usuário
    const matched = findMatchingSubject(rawSubject, existingSubjects);
    if (matched) return matched.title;

    return rawSubject.trim();
}

// Helper: Tenta casar uma matéria com matérias existentes com distinção estrita entre Material e Processual
export function findMatchingSubject(subjectName, existingSubjects = []) {
    if (!subjectName || !Array.isArray(existingSubjects) || existingSubjects.length === 0) return null;
    const normalizedTarget = normalizeString(subjectName);
    if (!normalizedTarget) return null;

    const isTargetProc = /\b(processual|processo|proc|dpc|cpc|dpp|cpp|dpt)\b/.test(normalizedTarget);

    // 1. Exact match de título
    for (const subj of existingSubjects) {
        const normTitle = normalizeString(subj.title);
        if (normTitle === normalizedTarget) {
            return subj;
        }
    }

    // 2. Exact match de ID canônico ou apelido conhecido
    const targetBranch = KNOWN_BRANCHES.find(b =>
        normalizeString(b.canonical) === normalizedTarget ||
        b.aliases.some(a => normalizeString(a) === normalizedTarget)
    );

    if (targetBranch) {
        for (const subj of existingSubjects) {
            const normTitle = normalizeString(subj.title);
            const isSubjProc = /\b(processual|processo|proc|dpc|cpc|dpp|cpp|dpt)\b/.test(normTitle);
            if (isTargetProc !== isSubjProc) continue;

            const subjMatchesCanonical = normalizeString(targetBranch.canonical) === normTitle ||
                targetBranch.aliases.some(a => normalizeString(a) === normTitle);

            if (subjMatchesCanonical) {
                return subj;
            }
        }
    }

    // 3. Match sem prefixo "direito" (ex: "processual civil" === "processual civil" ou "processo civil")
    const targetWithoutDireito = normalizedTarget.replace(/^direito\s+/, '').trim();
    for (const subj of existingSubjects) {
        const normTitle = normalizeString(subj.title);
        const isSubjProc = /\b(processual|processo|proc|dpc|cpc|dpp|cpp|dpt)\b/.test(normTitle);
        if (isTargetProc !== isSubjProc) continue;

        const normWithoutDireito = normTitle.replace(/^direito\s+/, '').trim();
        if (normWithoutDireito === targetWithoutDireito) {
            return subj;
        }
    }

    // 4. Substring Match com guarda obrigatória de ramo processual
    for (const subj of existingSubjects) {
        const normTitle = normalizeString(subj.title);
        const isSubjProc = /\b(processual|processo|proc|dpc|cpc|dpp|cpp|dpt)\b/.test(normTitle);
        // NUNCA casar matéria processual com matéria de direito material (ex: Processo Civil nunca pode casar com Direito Civil)
        if (isTargetProc !== isSubjProc) continue;

        const normWithoutDireito = normTitle.replace(/^direito\s+/, '').trim();
        if (normalizedTarget.length > 3 && (normTitle.includes(normalizedTarget) || normalizedTarget.includes(normWithoutDireito) || normWithoutDireito.includes(targetWithoutDireito))) {
            return subj;
        }
    }

    return null;
}

// Helper: Tenta casar um tópico informado pelo usuário com os tópicos existentes
export function findMatchingTopic(topicName, subject) {
    if (!topicName || !subject || !subject.topics) return null;
    const normalizedTarget = normalizeString(topicName);

    for (const topic of subject.topics) {
        const normTitle = normalizeString(topic.title);
        if (normTitle === normalizedTarget) return topic;
        if (normalizedTarget.length > 4 && (normTitle.includes(normalizedTarget) || normalizedTarget.includes(normTitle))) {
            return topic;
        }
    }

    return null;
}

// Detecta se uma linha é cabeçalho de SEMANA (ex: "🟢 SEMANA 1 (Dias 1 a 5)", "Semana 2:", "1ª Semana")
function detectWeekHeader(line) {
    if (!line) return null;
    const clean = line.trim();

    // "SEMANA 1", "Semana 01", "Week 1", "Sem 1", "🟢 SEMANA 1"
    const weekMatch = clean.match(/(?:semana|week|sem\.?)\s*(\d+)/i);
    if (weekMatch) {
        return parseInt(weekMatch[1], 10);
    }

    // "1ª Semana", "2a Semana", "1º Semana"
    const ordinalMatch = clean.match(/(\d+)\s*[ªºaao]\s*(?:semana|week|sem)/i);
    if (ordinalMatch) {
        return parseInt(ordinalMatch[1], 10);
    }

    // Numeral Romano: "Semana I", "Semana II", "Semana IV"
    const romanMatch = clean.match(/(?:semana|week|sem\.?)\s+([IVXLCDMivxlcdm]+)\b/i);
    if (romanMatch) {
        const val = romanToInt(romanMatch[1]);
        if (val) return val;
    }

    return null;
}

// Detecta se uma linha é cabeçalho de DIA (ex: "Dia 1 (Segunda - 26/08)", "Dia 01:", "D1", "Segunda:")
function detectDayHeader(line) {
    if (!line) return null;
    const clean = line.trim();

    // 1. "Dia 1 (Segunda - 26/08)", "Dia 01:", "Day 1", "D1", "D01"
    const dayMatch = clean.match(/^(?:[-*•\s]*)?(?:dia|day|d)\s*(\d+)\s*(?:\([^\)]*\))?[:\s-]*(.*)/i);
    if (dayMatch) {
        const dayNum = parseInt(dayMatch[1], 10);
        let remaining = (dayMatch[2] || '').trim();

        // Se remaining começar com '(' ou for apenas metadata de dia da semana/data, desconsidera
        if (
            remaining.startsWith('(') ||
            remaining.endsWith(')') ||
            /^(?:segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo|\d{1,2}[\/\-]\d{1,2}|véspera|vespera)/i.test(remaining)
        ) {
            // Verifica se contém matérias ou dois pontos / hífens com conteúdo real de estudo
            if (!remaining.includes(':') && !remaining.includes(' - ') && !KNOWN_BRANCHES.some(b => b.aliases.some(a => remaining.toLowerCase().includes(a)))) {
                remaining = '';
            }
        }

        return {
            dayNum,
            dayType: 'numeric',
            remainingContent: remaining
        };
    }

    // 2. Dias da Semana por extenso no início da linha
    const weekdayPatterns = [
        { regex: /^(?:[-*•\s]*)?(?:segunda(?:-feira)?|seg)\s*(?:\([^\)]*\))?[\s:.-]*(.*)/i, dayOffset: 1 },
        { regex: /^(?:[-*•\s]*)?(?:terca(?:-feira)?|terça(?:-feira)?|ter)\s*(?:\([^\)]*\))?[\s:.-]*(.*)/i, dayOffset: 2 },
        { regex: /^(?:[-*•\s]*)?(?:quarta(?:-feira)?|qua)\s*(?:\([^\)]*\))?[\s:.-]*(.*)/i, dayOffset: 3 },
        { regex: /^(?:[-*•\s]*)?(?:quinta(?:-feira)?|qui)\s*(?:\([^\)]*\))?[\s:.-]*(.*)/i, dayOffset: 4 },
        { regex: /^(?:[-*•\s]*)?(?:sexta(?:-feira)?|sex)\s*(?:\([^\)]*\))?[\s:.-]*(.*)/i, dayOffset: 5 },
        { regex: /^(?:[-*•\s]*)?(?:sabado|sábado|sab)\s*(?:\([^\)]*\))?[\s:.-]*(.*)/i, dayOffset: 6 },
        { regex: /^(?:[-*•\s]*)?(?:domingo|dom)\s*(?:\([^\)]*\))?[\s:.-]*(.*)/i, dayOffset: 7 },
    ];

    for (const wp of weekdayPatterns) {
        const match = clean.match(wp.regex);
        if (match) {
            let remaining = (match[1] || '').trim();
            if (
                remaining.startsWith('(') ||
                remaining.endsWith(')') ||
                /^(?:\d{1,2}[\/\-]\d{1,2}|véspera|vespera)/i.test(remaining)
            ) {
                if (!remaining.includes(':') && !remaining.includes(' - ') && !KNOWN_BRANCHES.some(b => b.aliases.some(a => remaining.toLowerCase().includes(a)))) {
                    remaining = '';
                }
            }
            return {
                dayOffset: wp.dayOffset,
                dayType: 'weekday',
                remainingContent: remaining
            };
        }
    }

    return null;
}


// Analisa uma linha de conteúdo de estudo (ex: "Bloco 1: Português (Compreensão de textos).")
function parseContentBlock(line, existingSubjects = []) {
    let clean = line.trim();
    if (!clean) return null;

    // Remove prefixos como "Bloco 1:", "Blocos 1 e 2:", "Item 1:", "1.", "- ", "• "
    clean = clean.replace(/^(?:blocos?\s*[\d\se,]+\s*[:\-\—\–]?|item\s*\d+\s*[:\-\—\–]?|[-*•\d+.)\s]+)/i, '').trim();
    if (!clean) return null;

    // Se for apenas metadado entre parênteses como "(Segunda - 04/11)" ou data, ignora
    if (clean.startsWith('(') && clean.endsWith(')')) {
        const inner = clean.substring(1, clean.length - 1).trim();
        const normInner = normalizeString(inner);
        if (
            normInner.startsWith('segunda') ||
            normInner.startsWith('terca') ||
            normInner.startsWith('terça') ||
            normInner.startsWith('quarta') ||
            normInner.startsWith('quinta') ||
            normInner.startsWith('sexta') ||
            normInner.startsWith('sabado') ||
            normInner.startsWith('sábado') ||
            normInner.startsWith('domingo') ||
            normInner.startsWith('vespera') ||
            normInner.startsWith('véspera') ||
            normInner.startsWith('dias')
        ) {
            return null;
        }
    }

    const normClean = normalizeString(clean);

    // 1. Descanso
    if (normClean === 'descanso' || normClean === 'folga' || normClean === 'livre' || normClean === 'day off') {
        return { isRest: true, subjectName: 'Descanso', topicName: 'Descanso' };
    }


    // 2. Revisão, Simulados e Questões
    const isReviewKeyword = (
        normClean.includes('revisao geral') ||
        normClean.includes('revisao ativa') ||
        normClean.includes('revisao local') ||
        normClean.startsWith('revisao') ||
        normClean.startsWith('simulado') ||
        normClean.startsWith('bateria de questoes') ||
        normClean.startsWith('resolucao exclusiva') ||
        normClean.startsWith('resolucao de questoes') ||
        normClean.startsWith('decoreba') ||
        normClean.startsWith('estudo leve')
    );

    if (isReviewKeyword) {
        // Se especificar matéria: "Revisão Ativa (Lei Seca) - Dir. Civil (LINDB e Parte Geral)"
        if (clean.includes(' - ')) {
            const parts = clean.split(' - ');
            const p2Subj = resolveCanonicalSubject(parts[1], existingSubjects);
            if (p2Subj !== parts[1].trim() && KNOWN_BRANCHES.some(b => b.canonical === p2Subj)) {
                let topicDetail = parts[1];
                const subFirstParen = parts[1].indexOf('(');
                const subLastParen = parts[1].lastIndexOf(')');
                if (subFirstParen > 0 && subLastParen > subFirstParen) {
                    topicDetail = parts[1].substring(subFirstParen + 1, subLastParen).trim();
                }
                return {
                    subjectName: p2Subj,
                    topicName: `${parts[0].trim()}: ${topicDetail}`.replace(/\.$/, ''),
                    isReview: true
                };
            }
        }

        return {
            subjectName: 'Revisão e Questões',
            topicName: clean.replace(/\.$/, '').trim(),
            isReview: true
        };
    }

    // 3. Padrão Clássico: "Matéria (Tópico com detalhes)."
    // ex: "Português (Compreensão e interpretação de textos)." ou "Dir. Civil (LINDB, parte inicial)."
    const firstParen = clean.indexOf('(');
    const lastParen = clean.lastIndexOf(')');
    if (firstParen > 0 && lastParen > firstParen) {
        const rawSubj = clean.substring(0, firstParen).trim();
        const rawTopic = clean.substring(firstParen + 1, lastParen).trim();
        if (rawSubj && rawTopic) {
            return {
                subjectName: resolveCanonicalSubject(rawSubj, existingSubjects),
                topicName: rawTopic.replace(/\.$/, '').trim(),
                isReview: false
            };
        }
    }

    // 4. Padrão Separador: "Matéria - Tópico" ou "Matéria: Tópico"
    const sepMatch = clean.match(/^([A-ZÁ-Úa-z0-9\s.,]+?)\s*[:\-\—\–]\s*(.+)$/);
    if (sepMatch) {
        const rawSubj = sepMatch[1].trim();
        const rawTopic = sepMatch[2].trim();
        return {
            subjectName: resolveCanonicalSubject(rawSubj, existingSubjects),
            topicName: rawTopic.replace(/\.$/, '').trim(),
            isReview: false
        };
    }

    // 5. Padrão Ramo no início do texto sem delimitador
    for (const b of KNOWN_BRANCHES) {
        for (const alias of b.aliases) {
            const normAlias = normalizeString(alias);
            if (normClean.startsWith(normAlias)) {
                const rest = clean.substring(alias.length).replace(/^[:\s\-—–]+/, '').trim();
                return {
                    subjectName: b.canonical,
                    topicName: rest || b.canonical,
                    isReview: false
                };
            }
        }
    }

    // 6. Tópico isolado
    return {
        subjectName: 'Geral',
        topicName: clean.replace(/\.$/, '').trim(),
        isReview: false
    };
}

// =========================================================================
// 1. PARSER PRINCIPAL DE TEXTO BASEADO EM PALAVRAS-CHAVE E ESTRUTURA
// =========================================================================

export function parseTextToSchedule(rawText, existingSubjects = []) {
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        return { success: false, error: 'O texto do cronograma está vazio.' };
    }

    const text = rawText.trim();

    // 1.1 JSON
    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
        try {
            const parsed = JSON.parse(text);
            return processJsonSchedule(parsed, existingSubjects);
        } catch {
            // Segue para parser semântico
        }
    }

    // 1.2 CSV / Tabela com separador
    if (text.includes(';') || (text.includes('\t') && text.includes('\n'))) {
        const csvResult = tryParseCsv(text, existingSubjects);
        if (csvResult.success && Object.keys(csvResult.scheduleStructure).length > 0) {
            return csvResult;
        }
    }

    // 1.3 Parser Semântico de Palavras-Chave e Blocos
    return parseKeywordDrivenSchedule(text, existingSubjects);
}

// Parser Semântico de Alta Precisão
function parseKeywordDrivenSchedule(text, existingSubjects) {
    const lines = text.split('\n');
    const scheduleStructure = {};
    const newSubjectsMap = new Map();
    const subjectsToUpdateMap = new Map();
    const allTopicIdsSet = new Set();

    let currentWeekNum = 1;
    let currentWeekKey = 'week1';
    let currentDayNum = 1;
    let currentDayKey = 'Dia 01';
    let hasFoundExplicitWeek = false;

    // Helper: Cria ou recupera matéria e tópico
    const getOrCreateSubjectAndTopic = (subjectName, topicName, subtopics = []) => {
        let subject = findMatchingSubject(subjectName, existingSubjects);
        let isNewSubject = false;

        let canonTitle = subjectName ? subjectName.trim() : 'Geral';
        const normSubj = normalizeString(subjectName || '');
        const matchedBranch = KNOWN_BRANCHES.find(b => b.aliases.some(a => normalizeString(a) === normSubj));
        if (matchedBranch) {
            canonTitle = matchedBranch.canonical;
        }

        if (!subject) {
            const key = normalizeString(canonTitle);
            if (newSubjectsMap.has(key)) {
                subject = newSubjectsMap.get(key);
            } else {
                const colorIndex = (existingSubjects.length + newSubjectsMap.size) % SUBJECT_COLORS.length;
                const iconIndex = (existingSubjects.length + newSubjectsMap.size) % ICONS.length;
                const chosenColor = SUBJECT_COLORS[colorIndex];

                subject = {
                    id: generateUniqueId('subj'),
                    title: canonTitle,
                    color: chosenColor.color,
                    bgColor: chosenColor.bgColor,
                    bgLight: chosenColor.bgLight,
                    icon: ICONS[iconIndex],
                    topics: [],
                    isNewlyCreated: true
                };
                newSubjectsMap.set(key, subject);
                isNewSubject = true;
            }
        }

        let topic = findMatchingTopic(topicName, subject);
        if (!topic) {
            topic = {
                id: generateUniqueId('top'),
                title: topicName.trim(),
                subtopics: subtopics.length > 0 ? subtopics : [topicName.trim()],
                isNewlyCreated: true
            };
            subject.topics.push(topic);

            if (!isNewSubject) {
                subjectsToUpdateMap.set(subject.id, subject);
            }
        }

        allTopicIdsSet.add(topic.id);
        return topic.id;
    };

    // Helper: Adiciona tópico ao dia atual
    const addTopicToCurrentDay = (topicId) => {
        if (!scheduleStructure[currentWeekKey]) {
            scheduleStructure[currentWeekKey] = {};
        }
        if (!scheduleStructure[currentWeekKey][currentDayKey]) {
            scheduleStructure[currentWeekKey][currentDayKey] = [];
        }

        if (topicId === 'rest') {
            scheduleStructure[currentWeekKey][currentDayKey] = ['rest'];
            return;
        }

        // Remove rest se novos tópicos forem adicionados
        scheduleStructure[currentWeekKey][currentDayKey] = scheduleStructure[currentWeekKey][currentDayKey].filter(id => id !== 'rest');
        scheduleStructure[currentWeekKey][currentDayKey].push(topicId);
    };

    for (let rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('//') || line.startsWith('<!--')) continue;

        // 1. VERIFICA SE É CABEÇALHO DE SEMANA (ex: "🟢 SEMANA 1 (Dias 1 a 5)")
        const weekNum = detectWeekHeader(line);
        if (weekNum !== null) {
            hasFoundExplicitWeek = true;
            currentWeekNum = weekNum;
            currentWeekKey = `week${currentWeekNum}`;
            if (!scheduleStructure[currentWeekKey]) {
                scheduleStructure[currentWeekKey] = {};
            }
            continue;
        }

        // 2. VERIFICA SE É CABEÇALHO DE DIA (ex: "Dia 1 (Segunda - 26/08)", "Dia 01:", "Segunda:")
        const dayHeader = detectDayHeader(line);
        if (dayHeader) {
            if (dayHeader.dayType === 'numeric') {
                currentDayNum = dayHeader.dayNum;
                if (!hasFoundExplicitWeek) {
                    currentWeekNum = Math.floor((currentDayNum - 1) / 7) + 1;
                    currentWeekKey = `week${currentWeekNum}`;
                }
            } else if (dayHeader.dayType === 'weekday') {
                const baseDay = (currentWeekNum - 1) * 7;
                currentDayNum = baseDay + dayHeader.dayOffset;
            }

            currentDayKey = `Dia ${String(currentDayNum).padStart(2, '0')}`;

            if (!scheduleStructure[currentWeekKey]) {
                scheduleStructure[currentWeekKey] = {};
            }
            if (!scheduleStructure[currentWeekKey][currentDayKey]) {
                scheduleStructure[currentWeekKey][currentDayKey] = [];
            }

            // Se na mesma linha do dia já houver conteúdo
            if (dayHeader.remainingContent) {
                const parsedContent = parseContentBlock(dayHeader.remainingContent, existingSubjects);
                if (parsedContent) {
                    if (parsedContent.isRest) {
                        addTopicToCurrentDay('rest');
                    } else {
                        const topicId = getOrCreateSubjectAndTopic(parsedContent.subjectName, parsedContent.topicName);
                        addTopicToCurrentDay(topicId);
                    }
                }
            }
            continue;
        }

        // 3. LINHAS DESCRITIVAS DE CONTEXTO (ex: "Nesta semana, você terminou todo o conteúdo inédito...")
        if (
            line.startsWith('Nesta semana') ||
            line.startsWith('Restante do tempo') ||
            line.startsWith('Obs:') ||
            line.startsWith('Nota:') ||
            line.startsWith('Atenção') ||
            line.startsWith('Dica') ||
            line.startsWith('Importante')
        ) {
            continue; // Ignora textos de conselho sem matérias
        }


        // 4. PARSE DE LINHA DE CONTEÚDO (Bloco 1, Bloco 2, Simulado 1, etc.)
        const parsedContent = parseContentBlock(line, existingSubjects);
        if (parsedContent) {
            if (parsedContent.isRest) {
                addTopicToCurrentDay('rest');
            } else {
                const topicId = getOrCreateSubjectAndTopic(parsedContent.subjectName, parsedContent.topicName);
                addTopicToCurrentDay(topicId);
            }
        }
    }

    const totalWeeks = Object.keys(scheduleStructure).length;
    const totalDays = Object.values(scheduleStructure).reduce((sum, w) => sum + Object.keys(w).length, 0);

    if (totalDays === 0) {
        return {
            success: false,
            error: 'Não foi possível identificar a estrutura do cronograma no texto colado. Verifique se há marcações de semanas ("Semana 1") e dias ("Dia 1").'
        };
    }

    return {
        success: true,
        scheduleStructure,
        newSubjects: Array.from(newSubjectsMap.values()),
        updatedSubjects: Array.from(subjectsToUpdateMap.values()),
        allTopicIds: Array.from(allTopicIdsSet),
        stats: {
            totalWeeks,
            totalDays,
            totalTopics: allTopicIdsSet.size,
            newSubjectsCount: newSubjectsMap.size
        }
    };
}

// Helper para CSV
function tryParseCsv(csvText, existingSubjects) {
    const lines = csvText.split('\n').filter(l => l.trim());
    if (lines.length < 2) return { success: false };

    const separator = csvText.includes(';') ? ';' : (csvText.includes('\t') ? '\t' : ',');
    const header = lines[0].split(separator).map(h => normalizeString(h));

    const weekIdx = header.findIndex(h => h.includes('semana') || h.includes('week'));
    const dayIdx = header.findIndex(h => h.includes('dia') || h.includes('day'));
    const subjIdx = header.findIndex(h => h.includes('materia') || h.includes('disciplina') || h.includes('subject'));
    const topIdx = header.findIndex(h => h.includes('topico') || h.includes('assunto') || h.includes('conteudo') || h.includes('topic'));

    if (topIdx === -1 && subjIdx === -1) return { success: false };

    const scheduleStructure = {};
    const newSubjectsMap = new Map();
    const subjectsToUpdateMap = new Map();
    const allTopicIdsSet = new Set();

    let autoDayNum = 1;

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(separator).map(c => c.trim().replace(/^["']|["']$/g, ''));
        const topName = topIdx !== -1 && row[topIdx] ? row[topIdx] : (subjIdx !== -1 ? row[subjIdx] : '');
        if (!topName) continue;

        const weekVal = weekIdx !== -1 && row[weekIdx] ? row[weekIdx].replace(/\D/g, '') : null;
        const dayVal = dayIdx !== -1 && row[dayIdx] ? row[dayIdx] : null;
        const subjName = subjIdx !== -1 ? row[subjIdx] : 'Geral';

        let weekNum = weekVal ? parseInt(weekVal, 10) : Math.floor((autoDayNum - 1) / 7) + 1;
        let weekKey = `week${weekNum}`;

        let dayKey = '';
        if (dayVal) {
            const numMatch = dayVal.match(/\d+/);
            if (numMatch) {
                dayKey = `Dia ${String(numMatch[0]).padStart(2, '0')}`;
            } else {
                dayKey = dayVal;
            }
        } else {
            dayKey = `Dia ${String(autoDayNum).padStart(2, '0')}`;
            autoDayNum++;
        }

        if (!scheduleStructure[weekKey]) scheduleStructure[weekKey] = {};
        if (!scheduleStructure[weekKey][dayKey]) scheduleStructure[weekKey][dayKey] = [];

        let subject = findMatchingSubject(subjName, existingSubjects);
        if (!subject) {
            const key = normalizeString(subjName);
            if (newSubjectsMap.has(key)) {
                subject = newSubjectsMap.get(key);
            } else {
                const colorIndex = (existingSubjects.length + newSubjectsMap.size) % SUBJECT_COLORS.length;
                const chosenColor = SUBJECT_COLORS[colorIndex];
                subject = {
                    id: generateUniqueId('subj'),
                    title: subjName,
                    color: chosenColor.color,
                    bgColor: chosenColor.bgColor,
                    bgLight: chosenColor.bgLight,
                    icon: 'BookOpen',
                    topics: [],
                    isNewlyCreated: true
                };
                newSubjectsMap.set(key, subject);
            }
        }

        let topic = findMatchingTopic(topName, subject);
        if (!topic) {
            topic = {
                id: generateUniqueId('top'),
                title: topName,
                subtopics: [topName],
                isNewlyCreated: true
            };
            subject.topics.push(topic);
            if (!subject.isNewlyCreated) {
                subjectsToUpdateMap.set(subject.id, subject);
            }
        }

        allTopicIdsSet.add(topic.id);
        scheduleStructure[weekKey][dayKey].push(topic.id);
    }

    return {
        success: true,
        scheduleStructure,
        newSubjects: Array.from(newSubjectsMap.values()),
        updatedSubjects: Array.from(subjectsToUpdateMap.values()),
        allTopicIds: Array.from(allTopicIdsSet),
        stats: {
            totalWeeks: Object.keys(scheduleStructure).length,
            totalDays: Object.values(scheduleStructure).reduce((s, w) => s + Object.keys(w).length, 0),
            totalTopics: allTopicIdsSet.size,
            newSubjectsCount: newSubjectsMap.size
        }
    };
}

// Helper para JSON
function processJsonSchedule(jsonData, existingSubjects) {
    if (typeof jsonData !== 'object' || !jsonData) return { success: false, error: 'JSON inválido.' };

    if (jsonData.week1 || (typeof jsonData === 'object' && Object.keys(jsonData).some(k => k.startsWith('week')))) {
        const allTopicIds = [];
        Object.values(jsonData).forEach(w => {
            Object.values(w).forEach(d => {
                if (Array.isArray(d)) allTopicIds.push(...d.filter(id => id !== 'rest' && id !== 'review'));
            });
        });

        return {
            success: true,
            scheduleStructure: jsonData,
            newSubjects: [],
            updatedSubjects: [],
            allTopicIds: [...new Set(allTopicIds)],
            stats: {
                totalWeeks: Object.keys(jsonData).length,
                totalDays: Object.values(jsonData).reduce((sum, w) => sum + Object.keys(w).length, 0),
                totalTopics: new Set(allTopicIds).size,
                newSubjectsCount: 0
            }
        };
    }

    return { success: false, error: 'Formato JSON não reconhecido.' };
}

// =========================================================================
// 2. GERADOR DE CRONOGRAMA A PARTIR DE EDITAL (LOCAL INTELIGENTE E VIA IA)
// =========================================================================

/**
 * Divide o texto do edital em seções por matéria e extrai seus tópicos com proteção a números de leis e artigos.
 */
function splitEditalIntoSubjectsAndTopics(text) {
    if (!text || !text.trim()) return [];

    const lines = text.split(/\r?\n/);
    const sections = [];
    let currentSubjectTitle = 'Conteúdo Programático';
    let currentLines = [];

    const subjectHeaderRegex = /^(?:(?:Item|Módulo|Bloco|Disciplina|Matéria)\s*\d*[\s:\-]*|\d+[\s.\-:]+)?\s*(DIREITO\s+[A-ZÁ-Ú\s]+|DIREITO\s+PROCESSUAL\s+[A-ZÁ-Ú\s]+|LEGISLAÇÃO\s+[A-ZÁ-Ú\s]+|LEGISLAÇÃO\s+ESPECIAL|LEGISLAÇÃO\s+INSTITUCIONAL|LEGISLAÇÃO\s+ESTADUAL|LÍNGUA\s+PORTUGUESA|PORTUGUÊS|INFORMÁTICA|RACIOCÍNIO\s+LÓGICO|ÉTICA\s+[A-ZÁ-Ú\s]*|NOÇÕES\s+DE\s+[A-ZÁ-Ú\s]+|CONHECIMENTOS\s+[A-ZÁ-Ú\s]+|DIREITOS\s+HUMANOS|CRIMINOLOGIA|MEDICINA\s+LEGAL|ADMINISTRAÇÃO\s+[A-ZÁ-Ú\s]*)[\s:]*$/i;

    for (let rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        // Cabeçalho de matéria em linha isolada
        const headerMatch = line.match(subjectHeaderRegex);
        const isAllUpperHeader = line.toUpperCase() === line && line.length >= 4 && line.length <= 55 && !line.match(/^\d+\.\d+/) && !line.includes(';') && !line.includes('/');

        if (headerMatch || isAllUpperHeader) {
            if (currentLines.length > 0) {
                sections.push({ subject: currentSubjectTitle, rawText: currentLines.join('\n') });
                currentLines = [];
            }
            currentSubjectTitle = (headerMatch ? headerMatch[1] : line).replace(/[:\-#]/g, '').trim();
            continue;
        }

        // Cabeçalho de matéria no início da linha seguido de dois-pontos (ex: "Legislação Especial: 1.Lei...")
        const inlineHeaderMatch = line.match(/^((?:DIREITO\s+[A-ZÁ-Úa-zá-ú\s]+|LEGISLAÇÃO\s+[A-ZÁ-Úa-zá-ú\s]+|LÍNGUA\s+PORTUGUESA|PORTUGUÊS|INFORMÁTICA|RACIOCÍNIO\s+LÓGICO|ÉTICA|CONHECIMENTOS\s+[A-ZÁ-Úa-zá-ú\s]+)):[\s]*(.+)$/i);
        if (inlineHeaderMatch) {
            if (currentLines.length > 0) {
                sections.push({ subject: currentSubjectTitle, rawText: currentLines.join('\n') });
                currentLines = [];
            }
            currentSubjectTitle = inlineHeaderMatch[1].trim();
            currentLines.push(inlineHeaderMatch[2].trim());
            continue;
        }

        currentLines.push(line);
    }

    if (currentLines.length > 0) {
        sections.push({ subject: currentSubjectTitle, rawText: currentLines.join('\n') });
    }

    const results = [];
    for (const sec of sections) {
        const rawTopics = extractTopicsFromSectionText(sec.rawText);
        if (rawTopics.length > 0) {
            results.push({
                title: sec.subject,
                topics: rawTopics
            });
        }
    }

    return results;
}

function extractTopicsFromSectionText(text) {
    if (!text || !text.trim()) return [];

    const cleanedText = text
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Regex para identificar limites de itens numerados (ex: "1. ", "1.1. ", "6. ", "8.Das", "1.Lei", etc.)
    // Ignora quando precedido por termos de legislação (ex: "nº 9.099/95", "Art. 1.015", etc.)
    const splitRegex = /(?:^|[\.\;\n\r]\s+|\s+)(\d+(?:\.\d+)*)\s*[\.\-\)]\s*|(?:^|[\.\;\n\r]\s+|\s+)(\d+\.[A-Za-zÁ-Úá-ú])/g;
    
    const matchPositions = [];
    let match;

    while ((match = splitRegex.exec(cleanedText)) !== null) {
        const fullMatch = match[0];
        const numStr = match[1] || match[2];
        const matchIndex = match.index;

        const prefixIndex = Math.max(0, matchIndex - 25);
        const textBefore = cleanedText.substring(prefixIndex, matchIndex).trim().toLowerCase();

        // Se for número de lei, decreto, súmula ou artigo, não divide como tópico
        const isLawNumber = /(?:n[º°\.]|lei|leis|artigo|artigos|art|arts|decreto|s[úu]mula|portaria|resolu[çc][ãa]o|lc|ec)\s*$/i.test(textBefore);
        const textAfter = cleanedText.substring(matchIndex, matchIndex + 25);
        const hasSlashYear = /\d+\/\d{2,4}/.test(textAfter.substring(0, 15));

        if (!isLawNumber && !hasSlashYear) {
            matchPositions.push({
                index: matchIndex,
                length: fullMatch.length,
                num: numStr
            });
        }
    }

    const tokens = [];

    if (matchPositions.length > 0) {
        for (let i = 0; i < matchPositions.length; i++) {
            const current = matchPositions[i];
            const startPos = current.index + current.length;
            const endPos = (i + 1 < matchPositions.length) ? matchPositions[i + 1].index : cleanedText.length;
            
            let topicText = cleanedText.substring(startPos, endPos).trim();
            topicText = cleanTopicTitle(topicText);
            if (topicText.length >= 2) {
                tokens.push({
                    title: topicText,
                    subtopics: [topicText]
                });
            }
        }

        // Tópico anterior ao primeiro número
        if (matchPositions[0].index > 0) {
            let prefixText = cleanedText.substring(0, matchPositions[0].index).trim();
            prefixText = cleanTopicTitle(prefixText);
            if (prefixText.length >= 3) {
                const subParts = prefixText.split(/[\;\.]\s+/).map(s => cleanTopicTitle(s)).filter(s => s.length >= 3);
                for (const p of subParts) {
                    tokens.unshift({
                        title: p,
                        subtopics: [p]
                    });
                }
            }
        }
    } else {
        // Sem números: divide por marcadores, ponto e vírgula ou pontos
        const parts = cleanedText.split(/(?:[\;\n\r]+|\s*[-•*]\s+|\.\s+(?=[A-ZÁ-Ú]))/).map(p => cleanTopicTitle(p)).filter(p => p.length >= 3);
        for (const p of parts) {
            tokens.push({
                title: p,
                subtopics: [p]
            });
        }
    }

    return tokens;
}

function cleanTopicTitle(str) {
    if (!str) return '';
    return str
        .replace(/^[\s.\-•*;,:\)]+/, '')
        .replace(/[\s.\-;,:]+$/, '')
        .trim();
}

export function parseEditalLocally(editalText, options = {}, existingSubjects = []) {
    const {
        weeksCount = 8,
        studyDaysPerWeek = 6,
        studyHoursPerDay = 4,
        restDays = [7],
        distributionMode = 'interleaved' // 'interleaved' | 'sequential'
    } = options;

    if (!editalText || !editalText.trim()) {
        return { success: false, error: 'Conteúdo do edital está vazio.' };
    }

    const subjectsFound = splitEditalIntoSubjectsAndTopics(editalText);

    if (subjectsFound.length === 0 || subjectsFound.every(s => s.topics.length === 0)) {
        return {
            success: false,
            error: 'Não foi possível identificar tópicos no texto do edital. Cole o conteúdo com títulos ou itens numerados.'
        };
    }

    const newSubjects = [];
    const updatedSubjects = [];
    const allTopicIds = [];
    const subjectBuckets = [];

    // Clona matérias existentes para evitar mutação in-place indesejada
    const clonedExistingSubjects = existingSubjects.map(s => ({
        ...s,
        topics: [...(s.topics || [])]
    }));

    subjectsFound.forEach((sf) => {
        let existing = findMatchingSubject(sf.title, clonedExistingSubjects);

        if (existing) {
            const newTopicsForExisting = [];
            const bucketTopics = [];
            sf.topics.forEach(t => {
                let existingTopic = findMatchingTopic(t.title, existing);
                if (!existingTopic) {
                    existingTopic = {
                        id: generateUniqueId('top'),
                        title: t.title,
                        subtopics: t.subtopics || [t.title],
                        isNewlyCreated: true
                    };
                    existing.topics.push(existingTopic);
                    newTopicsForExisting.push(existingTopic);
                }
                allTopicIds.push(existingTopic.id);
                bucketTopics.push({ ...existingTopic, subjectId: existing.id, subjectTitle: existing.title });
            });
            if (newTopicsForExisting.length > 0) {
                updatedSubjects.push(existing);
            }
            if (bucketTopics.length > 0) {
                subjectBuckets.push(bucketTopics);
            }
        } else {
            const colorIndex = (existingSubjects.length + newSubjects.length) % SUBJECT_COLORS.length;
            const chosenColor = SUBJECT_COLORS[colorIndex];
            const subjId = generateUniqueId('subj');

            const topicsForNewSubject = sf.topics.map(t => {
                const topObj = {
                    id: generateUniqueId('top'),
                    title: t.title,
                    subtopics: t.subtopics || [t.title],
                    isNewlyCreated: true
                };
                allTopicIds.push(topObj.id);
                return topObj;
            });

            const newSubj = {
                id: subjId,
                title: sf.title,
                color: chosenColor.color,
                bgColor: chosenColor.bgColor,
                bgLight: chosenColor.bgLight,
                icon: ICONS[newSubjects.length % ICONS.length],
                topics: topicsForNewSubject,
                isNewlyCreated: true
            };
            newSubjects.push(newSubj);

            subjectBuckets.push(topicsForNewSubject.map(t => ({ ...t, subjectId: subjId, subjectTitle: sf.title })));
        }
    });

    // Ordenação dos tópicos baseada em distributionMode
    let allTopicsList = [];
    if (distributionMode === 'sequential') {
        // Uma matéria por vez (Linear / Modular)
        allTopicsList = subjectBuckets.flat();
    } else if (distributionMode === 'moderate') {
        // Intercalado por blocos: estuda N tópicos de uma matéria, depois passa para a próxima (evita trocar a cada minuto)
        let hasMore = true;
        let round = 0;
        const blockSize = 3; // 3 tópicos seguidos da mesma matéria antes de ciclar
        while (hasMore) {
            hasMore = false;
            for (let b = 0; b < subjectBuckets.length; b++) {
                const startIdx = round * blockSize;
                const endIdx = startIdx + blockSize;
                if (startIdx < subjectBuckets[b].length) {
                    allTopicsList.push(...subjectBuckets[b].slice(startIdx, endIdx));
                    hasMore = true;
                }
            }
            round++;
        }
    } else {
        // Intercalado Máximo / Ciclo Rápido (Round-Robin de 1 em 1)
        let hasMore = true;
        let round = 0;
        while (hasMore) {
            hasMore = false;
            for (let b = 0; b < subjectBuckets.length; b++) {
                if (round < subjectBuckets[b].length) {
                    allTopicsList.push(subjectBuckets[b][round]);
                    hasMore = true;
                }
            }
            round++;
        }
    }

    // Distribuição dos tópicos nas semanas e dias
    const scheduleStructure = {};
    let dayIndex = 1;
    let topicIndex = 0;
    const restSet = new Set(restDays);
    
    // Cálculo de tópicos por dia dinâmico
    const totalStudyDays = weeksCount * (7 - restSet.size); // dias úteis reais por semana
    // Garante no mínimo 1 tópico por dia e arredonda para cima se sobrar tópicos
    const dynamicTopicsPerDay = Math.max(1, Math.ceil(allTopicsList.length / (totalStudyDays || 1)));

    for (let w = 1; w <= weeksCount; w++) {
        const weekKey = `week${w}`;
        scheduleStructure[weekKey] = {};

        for (let d = 1; d <= 7; d++) {
            const dayKey = `Dia ${String(dayIndex).padStart(2, '0')}`;
            dayIndex++;

            if (restSet.has(d) || d > studyDaysPerWeek) {
                scheduleStructure[weekKey][dayKey] = ['rest'];
                continue;
            }

            if (topicIndex >= allTopicsList.length) {
                scheduleStructure[weekKey][dayKey] = ['review'];
                continue;
            }

            const dayTopicIds = [];
            for (let t = 0; t < dynamicTopicsPerDay && topicIndex < allTopicsList.length; t++) {
                dayTopicIds.push(allTopicsList[topicIndex].id);
                topicIndex++;
            }

            scheduleStructure[weekKey][dayKey] = dayTopicIds.length > 0 ? dayTopicIds : ['review'];
        }
    }

    return {
        success: true,
        scheduleStructure,
        newSubjects,
        updatedSubjects,
        allTopicIds,
        stats: {
            totalWeeks: weeksCount,
            totalDays: weeksCount * 7,
            totalTopics: allTopicIds.length,
            newSubjectsCount: newSubjects.length
        }
    };
}

// =========================================================================
// 3. GERADOR COM IA (GEMINI) A PARTIR DE EDITAL
// =========================================================================

export async function generateScheduleFromEditalWithAI(editalText, options = {}, existingSubjects = []) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.info("Gemini API key não configurada. Executando parser local inteligente.");
        return parseEditalLocally(editalText, options, existingSubjects);
    }

    const {
        weeksCount = 8,
        studyDaysPerWeek = 6,
        studyHoursPerDay = 4,
        restDays = [7],
        distributionMode = 'interleaved',
        examName = 'Concurso / Exame'
    } = options;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const candidateModels = [
            'gemini-flash-lite-latest',
            'gemini-3.5-flash',
            'gemini-3-flash-preview',
            'gemini-flash-latest'
        ];

        let distributionInstruction = '';
        if (distributionMode === 'sequential') {
            distributionInstruction = 'LINEAR: Estude e esgote 100% de uma matéria antes de avançar para a próxima matéria.';
        } else if (distributionMode === 'moderate') {
            distributionInstruction = 'BLOCOS: Estude a mesma matéria por 2 ou 3 dias seguidos antes de trocar para uma matéria diferente.';
        } else {
            // 'interleaved' / default
            distributionInstruction = 'CICLO RÁPIDO (MAX INTERCALADO): Nunca estude a mesma matéria dois dias seguidos. Alterne matérias diferentes todos os dias para máxima rotação.';
        }

        const prompt = `Você é um coordenador pedagógico e especialista em preparação jurídica para concursos públicos e OAB no Brasil.
Analise o conteúdo programático do edital fornecido e crie uma matriz de estudos e um cronograma estruturado.

PARÂMETROS DO CRONOGRAMA:
- Nome do Exame: "${examName}"
- Duração total do plano: ${weeksCount} semanas
- Dias de estudo por semana: ${studyDaysPerWeek} dias
- Horas de estudo disponíveis por dia: ${studyHoursPerDay} horas
- Dias de descanso na semana: Índices [${restDays.join(', ')}] (1=Seg, 7=Dom)
- Distribuição: ${distributionInstruction}

REGRA MATEMÁTICA DE ESFORÇO DIÁRIO E DISTRIBUIÇÃO (MUITO IMPORTANTE):
1. Você não deve usar um número fixo de tópicos por dia. Distribua o conteúdo baseando-se no PESO (complexidade) e nas horas disponíveis (${studyHoursPerDay}h/dia).
2. CALIBRAGEM DE TEMPO: Assuma que um tópico médio/padrão de concurso leva cerca de 1.5 a 2 horas para ser estudado.
3. Isso significa que, se o aluno tem 4h por dia, o dia DEVE conter aproximadamente 2 a 3 tópicos. Se ele tem 6h, cerca de 3 a 4 tópicos, e assim por diante. Não coloque apenas 1 tópico por dia a menos que o aluno tenha selecionado apenas 2h/dia ou o tópico seja absurdamente gigantesco.
4. Se o aluno escolheu um ciclo intercalado, e o dia comporta mais de 1 tópico, insira tópicos de MATÉRIAS DIFERENTES no mesmo dia para manter a mente ativa.
5. Se um tópico for massivo (ex: Licitações, Controle de Constitucionalidade), FRACIONE-O no JSON em "Parte 1", "Parte 2", etc.

REGRAS DE CLASSIFICAÇÃO:
1. IDENTIFICAÇÃO DE MATÉRIAS: Textos em CAIXA ALTA ou destaque (ex: DIREITO CONSTITUCIONAL) representam a "Matéria" (Subjects).
2. IDENTIFICAÇÃO DE TÓPICOS: Os itens enumerados logo após representam os "Tópicos" (Topics).
3. CORRESPONDÊNCIA EXATA: Os nomes dos tópicos atribuídos aos dias no "schedule" DEVEM SER EXATAMENTE IDÊNTICOS aos "title" criados dentro da array de "topics". Se o nome divergir 1 letra, o sistema falhará.

CONTEÚDO DO EDITAL:
${editalText.substring(0, 15000)}

INSTRUÇÕES DE RESPOSTA:
Retorne ESTRITAMENTE um objeto JSON válido (sem textos explicativos antes ou depois), com a seguinte estrutura:
{
  "subjects": [
    {
      "title": "Nome da Matéria (ex: Direito Constitucional)",
      "topics": [
        {
          "title": "Título Claro do Tópico",
          "subtopics": ["Subtópico 1", "Subtópico 2"]
        }
      ]
    }
  ],
  "schedule": {
    "week1": {
      "Dia 01": ["Nome do Tópico 1", "Nome do Tópico 2"],
      "Dia 02": ["Nome do Tópico 3", "Nome do Tópico 4"],
      "Dia 07": ["rest"]
    }
  }
}

Use "rest" para dias de descanso e "review" para dias de revisão. ${distributionInstruction}`;

        let responseText = null;
        let lastError = null;

        for (const mName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({ model: mName });
                const result = await model.generateContent(prompt);
                responseText = result.response.text();
                if (responseText) break;
            } catch (err) {
                console.warn(`[JusIA Edital] Falha no modelo ${mName}, tentando próximo...`, err.message);
                lastError = err;
            }
        }

        if (!responseText) {
            throw lastError || new Error("Nenhum modelo da IA respondeu.");
        }

        let jsonString = responseText.trim();
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonString = jsonMatch[1].trim();
        }

        const parsedAI = JSON.parse(jsonString);

        if (!parsedAI.subjects || !parsedAI.schedule) {
            throw new Error("Estrutura retornada pela IA incompleta.");
        }

        const newSubjects = [];
        const updatedSubjects = [];
        const allTopicIds = [];
        const topicNameToIdMap = new Map();

        const clonedExistingSubjects = existingSubjects.map(s => ({
            ...s,
            topics: [...(s.topics || [])]
        }));

        parsedAI.subjects.forEach((aiSubject) => {
            let existing = findMatchingSubject(aiSubject.title, clonedExistingSubjects);

            if (existing) {
                const newTopics = [];
                aiSubject.topics.forEach(aiTop => {
                    let existingTopic = findMatchingTopic(aiTop.title, existing);
                    if (!existingTopic) {
                        existingTopic = {
                            id: generateUniqueId('top'),
                            title: aiTop.title,
                            subtopics: aiTop.subtopics || [aiTop.title],
                            isNewlyCreated: true
                        };
                        existing.topics.push(existingTopic);
                        newTopics.push(existingTopic);
                    }
                    allTopicIds.push(existingTopic.id);
                    topicNameToIdMap.set(normalizeString(aiTop.title), existingTopic.id);
                });
                if (newTopics.length > 0) updatedSubjects.push(existing);
            } else {
                const colorIndex = (existingSubjects.length + newSubjects.length) % SUBJECT_COLORS.length;
                const chosenColor = SUBJECT_COLORS[colorIndex];
                const subjId = generateUniqueId('subj');

                const topicsForNewSubject = aiSubject.topics.map(aiTop => {
                    const topObj = {
                        id: generateUniqueId('top'),
                        title: aiTop.title,
                        subtopics: aiTop.subtopics || [aiTop.title],
                        isNewlyCreated: true
                    };
                    allTopicIds.push(topObj.id);
                    topicNameToIdMap.set(normalizeString(aiTop.title), topObj.id);
                    return topObj;
                });

                const newSubj = {
                    id: subjId,
                    title: aiSubject.title,
                    color: chosenColor.color,
                    bgColor: chosenColor.bgColor,
                    bgLight: chosenColor.bgLight,
                    icon: ICONS[newSubjects.length % ICONS.length],
                    topics: topicsForNewSubject,
                    isNewlyCreated: true
                };
                newSubjects.push(newSubj);
            }
        });

        const finalScheduleStructure = {};
        Object.entries(parsedAI.schedule).forEach(([weekKey, daysObj]) => {
            finalScheduleStructure[weekKey] = {};
            Object.entries(daysObj).forEach(([dayKey, topicsList]) => {
                if (!Array.isArray(topicsList)) {
                    finalScheduleStructure[weekKey][dayKey] = ['rest'];
                    return;
                }
                const ids = topicsList.map(item => {
                    if (item === 'rest' || item === 'review') return item;
                    const norm = normalizeString(item);
                    return topicNameToIdMap.get(norm) || item;
                });
                finalScheduleStructure[weekKey][dayKey] = ids.length > 0 ? ids : ['rest'];
            });
        });

        return {
            success: true,
            scheduleStructure: finalScheduleStructure,
            newSubjects,
            updatedSubjects,
            allTopicIds,
            stats: {
                totalWeeks: Object.keys(finalScheduleStructure).length,
                totalDays: Object.values(finalScheduleStructure).reduce((s, w) => s + Object.keys(w).length, 0),
                totalTopics: allTopicIds.length,
                newSubjectsCount: newSubjects.length
            }
        };

    } catch (err) {
        console.warn("Falha no gerador via IA, acionando gerador local com fallback:", err);
        return parseEditalLocally(editalText, options, existingSubjects);
    }
}
