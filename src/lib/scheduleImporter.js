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
const KNOWN_BRANCHES = [
    { canonical: 'Direito Constitucional', aliases: ['direito constitucional', 'dir constitucional', 'dir. constitucional', 'constitucional', 'const', 'const.'] },
    { canonical: 'Direito Administrativo', aliases: ['direito administrativo', 'dir administrativo', 'dir. administrativo', 'dir adm', 'dir. adm', 'administrativo', 'adm', 'adm.'] },
    { canonical: 'Direito Penal', aliases: ['direito penal', 'dir penal', 'dir. penal', 'penal', 'cp'] },
    { canonical: 'Direito Processual Penal', aliases: ['direito processual penal', 'dir processual penal', 'dir. processual penal', 'processual penal', 'proc penal', 'proc. penal', 'processo penal', 'dpp', 'cpp'] },
    { canonical: 'Direito Civil', aliases: ['direito civil', 'dir civil', 'dir. civil', 'civil', 'cc'] },
    { canonical: 'Direito Processual Civil', aliases: ['direito processual civil', 'dir processual civil', 'dir. processual civil', 'processual civil', 'proc civil', 'proc. civil', 'processo civil', 'dpc', 'cpc'] },
    { canonical: 'Direito do Trabalho', aliases: ['direito do trabalho', 'dir do trabalho', 'dir. do trabalho', 'trabalho', 'clt', 'trabalhista', 'direito trabalhista'] },
    { canonical: 'Direito Processual do Trabalho', aliases: ['direito processual do trabalho', 'dir proc trabalho', 'dir. proc. trabalho', 'processo do trabalho', 'proc trabalho', 'proc. trabalho', 'dpt'] },
    { canonical: 'Direito Tributário', aliases: ['direito tributario', 'dir tributario', 'dir. tributario', 'direito tributário', 'dir. tributário', 'tributario', 'tributário', 'ctn'] },
    { canonical: 'Direito Empresarial', aliases: ['direito empresarial', 'dir empresarial', 'dir. empresarial', 'empresarial', 'comercial', 'direito comercial'] },
    { canonical: 'Direito Eleitoral', aliases: ['direito eleitoral', 'dir eleitoral', 'dir. eleitoral', 'eleitoral'] },
    { canonical: 'Direito Ambiental', aliases: ['direito ambiental', 'dir ambiental', 'dir. ambiental', 'ambiental'] },
    { canonical: 'Direito do Consumidor', aliases: ['direito do consumidor', 'dir do consumidor', 'dir. consumidor', 'consumidor', 'cdc'] },
    { canonical: 'Direitos Humanos', aliases: ['direitos humanos', 'dir humanos', 'dir. humanos', 'humanos', 'dh'] },
    { canonical: 'Direito Previdenciário', aliases: ['direito previdenciario', 'dir previdenciario', 'dir. previdenciario', 'direito previdenciário', 'previdenciario', 'previdenciário'] },
    { canonical: 'Língua Portuguesa', aliases: ['lingua portuguesa', 'língua portuguesa', 'portugues', 'português', 'gramatica', 'gramática'] },
    { canonical: 'Redação Oficial', aliases: ['redacao oficial', 'redação oficial', 'manual da presidencia', 'manual de redacao'] },
    { canonical: 'Legislação Especial', aliases: ['legislacao especial', 'legislação especial', 'leis especiais', 'leis penais especiais', 'legislacao institucional', 'leis extravagantes', 'legislacao estadual', 'legislação estadual', 'legislacao local'] },
    { canonical: 'Raciocínio Lógico', aliases: ['raciocinio logico', 'raciocínio lógico', 'raciocinio logico matematico', 'rlm', 'matematica', 'matemática'] },
    { canonical: 'Informática', aliases: ['informatica', 'informática', 'tecnologia da informacao', 'ti'] },
    { canonical: 'Ética e Estatuto OAB', aliases: ['etica', 'ética', 'estatuto da oab', 'deontologia', 'codigo de etica', 'código de ética'] },
    { canonical: 'Revisão e Questões', aliases: ['revisao e questoes', 'revisão e questões', 'revisoes', 'revisões', 'questoes', 'questões', 'simulados', 'treino'] },
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
function resolveCanonicalSubject(rawSubject, existingSubjects = []) {
    if (!rawSubject) return 'Geral';
    const norm = normalizeString(rawSubject);

    // 1. Procura nas matérias já cadastradas do usuário
    for (const subj of existingSubjects) {
        const normSubj = normalizeString(subj.title);
        if (normSubj === norm || norm.includes(normSubj) || normSubj.includes(norm)) {
            return subj.title;
        }
    }

    // 2. Procura nos ramos canônicos
    for (const b of KNOWN_BRANCHES) {
        for (const alias of b.aliases) {
            const normAlias = normalizeString(alias);
            if (norm === normAlias || norm.startsWith(normAlias) || normAlias.startsWith(norm)) {
                return b.canonical;
            }
        }
    }

    return rawSubject.trim();
}

// Helper: Tenta casar uma matéria com matérias existentes
export function findMatchingSubject(subjectName, existingSubjects = []) {
    if (!subjectName) return null;
    const normalizedTarget = normalizeString(subjectName);

    for (const subj of existingSubjects) {
        const normTitle = normalizeString(subj.title);
        const normWithoutDireito = normTitle.replace(/^direito\s+/, '');
        const targetWithoutDireito = normalizedTarget.replace(/^direito\s+/, '');

        if (normTitle === normalizedTarget || normWithoutDireito === targetWithoutDireito) {
            return subj;
        }

        if (normalizedTarget.length > 3 && (normTitle.includes(normalizedTarget) || normalizedTarget.includes(normWithoutDireito))) {
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
// 2. GERADOR DE CRONOGRAMA A PARTIR DE EDITAL (LOCAL E VIA IA)
// =========================================================================

export function parseEditalLocally(editalText, options = {}, existingSubjects = []) {
    const {
        weeksCount = 8,
        studyDaysPerWeek = 6,
        topicsPerDay = 2,
        restDays = [7]
    } = options;

    if (!editalText || !editalText.trim()) {
        return { success: false, error: 'Conteúdo do edital está vazio.' };
    }

    const lines = editalText.split('\n');
    const subjectsFound = [];
    let currentSubject = null;

    const subjectHeaderRegex = /^(?:[A-Z0-9.\-\s]+:)?\s*(DIREITO\s+[A-ZÁ-Ú\s]+|LÍNGUA PORTUGUESA|PORTUGUÊS|INFORMÁTICA|RACIOCÍNIO LÓGICO|ÉTICA|LEGISLAÇÃO|DIREITOS HUMANOS)[\s:]*$/i;
    const numberedItemRegex = /^\s*(\d+(?:\.\d+)*)[.\-\s)]+(.+)$/;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const isSubjectHeader = subjectHeaderRegex.test(line) ||
            (line.toUpperCase() === line && line.length > 4 && line.length < 60 && !numberedItemRegex.test(line));

        if (isSubjectHeader) {
            const cleanTitle = line.replace(/[:\-#]/g, '').trim();
            currentSubject = {
                title: cleanTitle,
                topics: []
            };
            subjectsFound.push(currentSubject);
            continue;
        }

        const numMatch = line.match(numberedItemRegex);
        if (numMatch) {
            const topicTitle = numMatch[2].trim();
            if (!currentSubject) {
                currentSubject = { title: 'Conhecimentos Gerais', topics: [] };
                subjectsFound.push(currentSubject);
            }
            currentSubject.topics.push({
                title: topicTitle,
                subtopics: [topicTitle]
            });
        } else if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
            const topicTitle = line.replace(/^[-•*]\s*/, '').trim();
            if (!currentSubject) {
                currentSubject = { title: 'Conhecimentos Gerais', topics: [] };
                subjectsFound.push(currentSubject);
            }
            currentSubject.topics.push({
                title: topicTitle,
                subtopics: [topicTitle]
            });
        } else if (currentSubject && line.length > 3) {
            const parts = line.split(';').map(p => p.trim()).filter(p => p.length > 2);
            for (const part of parts) {
                currentSubject.topics.push({
                    title: part,
                    subtopics: [part]
                });
            }
        }
    }

    if (subjectsFound.length === 0 || subjectsFound.every(s => s.topics.length === 0)) {
        return {
            success: false,
            error: 'Não foi possível identificar matérias ou tópicos no texto do edital. Tente separar com títulos de matérias ou numeração (1., 2., etc.).'
        };
    }

    const newSubjects = [];
    const updatedSubjects = [];
    const allTopicIds = [];
    const allTopicsList = [];

    subjectsFound.forEach((sf) => {
        let existing = findMatchingSubject(sf.title, existingSubjects);

        if (existing) {
            const newTopicsForExisting = [];
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
                allTopicsList.push({ ...existingTopic, subjectId: existing.id });
            });
            if (newTopicsForExisting.length > 0) {
                updatedSubjects.push(existing);
            }
        } else {
            const colorIndex = (existingSubjects.length + newSubjects.length) % SUBJECT_COLORS.length;
            const chosenColor = SUBJECT_COLORS[colorIndex];
            const newSubj = {
                id: generateUniqueId('subj'),
                title: sf.title,
                color: chosenColor.color,
                bgColor: chosenColor.bgColor,
                bgLight: chosenColor.bgLight,
                icon: ICONS[newSubjects.length % ICONS.length],
                topics: sf.topics.map(t => {
                    const topObj = {
                        id: generateUniqueId('top'),
                        title: t.title,
                        subtopics: t.subtopics || [t.title],
                        isNewlyCreated: true
                    };
                    allTopicIds.push(topObj.id);
                    allTopicsList.push({ ...topObj, subjectId: newSubj.id });
                    return topObj;
                }),
                isNewlyCreated: true
            };
            newSubjects.push(newSubj);
        }
    });

    const scheduleStructure = {};
    let dayIndex = 1;
    let topicIndex = 0;
    const restSet = new Set(restDays);

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
            for (let t = 0; t < topicsPerDay && topicIndex < allTopicsList.length; t++) {
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
        console.info("Gemini API key não encontrada no .env. Utilizando parser local.");
        return parseEditalLocally(editalText, options, existingSubjects);
    }

    const {
        weeksCount = 8,
        studyDaysPerWeek = 6,
        topicsPerDay = 2,
        restDays = [7],
        examName = 'Concurso / Exame'
    } = options;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const prompt = `Você é um coordenador pedagógico e especialista em preparação jurídica para concursos públicos e OAB no Brasil.
Analise o conteúdo programático do edital fornecido e crie uma matriz de estudos e um cronograma estruturado.

PARÂMETROS DO CRONOGRAMA:
- Nome do Exame: "${examName}"
- Duração total: ${weeksCount} semanas
- Dias de estudo por semana: ${studyDaysPerWeek} dias
- Tópicos por dia de estudo: ${topicsPerDay} tópicos
- Dias de descanso por semana: Dias da semana índice [${restDays.join(', ')}] (1=Segunda, 7=Domingo)

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
          "subtopics": ["Subtópico 1", "Subtópico 2", "Subtópico 3"]
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

Use "rest" para dias de descanso e "review" para dias de revisão. Intercale matérias diferentes no mesmo dia.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

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

        parsedAI.subjects.forEach((aiSubject) => {
            let existing = findMatchingSubject(aiSubject.title, existingSubjects);

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
                const newSubj = {
                    id: generateUniqueId('subj'),
                    title: aiSubject.title,
                    color: chosenColor.color,
                    bgColor: chosenColor.bgColor,
                    bgLight: chosenColor.bgLight,
                    icon: ICONS[newSubjects.length % ICONS.length],
                    topics: aiSubject.topics.map(aiTop => {
                        const topObj = {
                            id: generateUniqueId('top'),
                            title: aiTop.title,
                            subtopics: aiTop.subtopics || [aiTop.title],
                            isNewlyCreated: true
                        };
                        allTopicIds.push(topObj.id);
                        topicNameToIdMap.set(normalizeString(aiTop.title), topObj.id);
                        return topObj;
                    }),
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
