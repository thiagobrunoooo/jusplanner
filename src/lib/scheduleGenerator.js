// Gera um cronograma semanal dinâmico baseado nos tópicos selecionados
// ALGORITMO MELHORADO: Intercala tópicos de diferentes matérias para variedade diária
// SUPORTA: Personalização de dias, pesos de matérias, ordem de prioridade e blocos de revisão

const DEFAULT_OPTIONS = {
    topicsPerDay: 2,
    studyDaysPerWeek: 6,       // Dias de estudo por semana
    restDays: [7],              // Dias de descanso (1=seg, 7=dom)
    subjectWeights: {},         // { subjectId: 2 } = aparece 2x mais
    subjectOrder: [],           // Ordem de prioridade das matérias
    reviewEveryNDays: null,     // null = sem revisão, 7 = a cada 7 dias
    reviewTopicId: 'review'     // ID do tópico de revisão
};

export function generateDynamicSchedule(topicIds, subjects, options = {}) {
    if (!topicIds || topicIds.length === 0) {
        return {};
    }

    // Merge options com defaults
    const config = { ...DEFAULT_OPTIONS, ...options };

    // Ordenar subjects pela ordem de prioridade se especificada
    let orderedSubjects = [...subjects];
    if (config.subjectOrder && config.subjectOrder.length > 0) {
        orderedSubjects.sort((a, b) => {
            const indexA = config.subjectOrder.indexOf(a.id);
            const indexB = config.subjectOrder.indexOf(b.id);
            // Subjects sem ordem vão para o final
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }

    // Pega os tópicos completos a partir dos IDs, agrupados por matéria
    const topicsBySubject = new Map();

    orderedSubjects.forEach(subject => {
        const subjectTopics = subject.topics
            .filter(t => topicIds.includes(t.id))
            .map(t => ({ ...t, subjectId: subject.id, subjectTitle: subject.title }));

        if (subjectTopics.length > 0) {
            // Aplicar peso: duplicar tópicos se peso > 1
            const weight = config.subjectWeights[subject.id] || 1;
            const weightedTopics = [];
            for (let w = 0; w < weight; w++) {
                weightedTopics.push(...subjectTopics);
            }

            topicsBySubject.set(subject.id, {
                topics: weightedTopics,
                originalTopics: subjectTopics,
                currentIndex: 0,
                subjectTitle: subject.title,
                weight: weight
            });
        }
    });

    if (topicsBySubject.size === 0) {
        return {};
    }

    const schedule = {};
    const TOPICS_PER_DAY = config.topicsPerDay;
    const STUDY_DAYS_PER_WEEK = config.studyDaysPerWeek;
    const REST_DAYS = new Set(config.restDays);

    let weekNum = 1;
    let dayNum = 1;
    let dayInWeek = 1;
    let totalAssigned = 0;
    let daysSinceLastReview = 0;

    // Conta total de tópicos incluindo pesos
    const totalTopics = Array.from(topicsBySubject.values())
        .reduce((sum, s) => sum + s.topics.length, 0);

    // Cria uma fila circular de matérias para distribuição equilibrada
    const subjectQueue = Array.from(topicsBySubject.keys());
    let queueIndex = 0;

    // Função para pegar próximo tópico de uma matéria diferente da última
    const getNextTopic = (avoidSubjectId = null) => {
        const startIndex = queueIndex;

        // Tenta encontrar uma matéria diferente da última usada
        do {
            const subjectId = subjectQueue[queueIndex];
            const subjectData = topicsBySubject.get(subjectId);

            if (subjectData && subjectData.currentIndex < subjectData.topics.length) {
                // Se devemos evitar uma matéria e esta é ela, e há outras opções, pula
                if (avoidSubjectId && subjectId === avoidSubjectId) {
                    const hasOtherOptions = subjectQueue.some((id) => {
                        if (id === avoidSubjectId) return false;
                        const data = topicsBySubject.get(id);
                        return data && data.currentIndex < data.topics.length;
                    });

                    if (hasOtherOptions) {
                        queueIndex = (queueIndex + 1) % subjectQueue.length;
                        continue;
                    }
                }

                const topic = subjectData.topics[subjectData.currentIndex];
                subjectData.currentIndex++;
                queueIndex = (queueIndex + 1) % subjectQueue.length;
                return topic;
            }

            queueIndex = (queueIndex + 1) % subjectQueue.length;
        } while (queueIndex !== startIndex);

        // Se não encontrou evitando, tenta qualquer uma
        for (const subjectId of subjectQueue) {
            const subjectData = topicsBySubject.get(subjectId);
            if (subjectData && subjectData.currentIndex < subjectData.topics.length) {
                const topic = subjectData.topics[subjectData.currentIndex];
                subjectData.currentIndex++;
                return topic;
            }
        }

        return null;
    };

    // Distribui os tópicos nos dias, intercalando matérias
    while (totalAssigned < totalTopics) {
        const weekKey = `week${weekNum}`;
        if (!schedule[weekKey]) {
            schedule[weekKey] = {};
        }

        // Verifica se é dia de descanso
        const absoluteDayOfWeek = ((dayNum - 1) % 7) + 1; // 1-7
        if (REST_DAYS.has(absoluteDayOfWeek) || REST_DAYS.has(dayInWeek)) {
            const restDayKey = `Dia ${String(dayNum).padStart(2, '0')}`;
            schedule[weekKey][restDayKey] = ['rest'];
            dayNum++;
            dayInWeek++;
            if (dayInWeek > 7) {
                dayInWeek = 1;
                weekNum++;
            }
            continue;
        }

        // Verifica se é dia de revisão
        if (config.reviewEveryNDays && daysSinceLastReview >= config.reviewEveryNDays) {
            const reviewDayKey = `Dia ${String(dayNum).padStart(2, '0')}`;
            schedule[weekKey][reviewDayKey] = [config.reviewTopicId];
            daysSinceLastReview = 0;
            dayNum++;
            dayInWeek++;
            if (dayInWeek > 7) {
                dayInWeek = 1;
                weekNum++;
            }
            continue;
        }

        // Formata o dia (ex: "Dia 01", "Dia 02")
        const dayKey = `Dia ${String(dayNum).padStart(2, '0')}`;

        // Pega os tópicos para este dia, tentando variar as matérias
        const dayTopics = [];
        let lastSubjectId = null;

        for (let i = 0; i < TOPICS_PER_DAY && totalAssigned < totalTopics; i++) {
            const topic = getNextTopic(lastSubjectId);
            if (topic) {
                dayTopics.push(topic.id);
                lastSubjectId = topic.subjectId;
                totalAssigned++;
            }
        }

        if (dayTopics.length > 0) {
            schedule[weekKey][dayKey] = dayTopics;
            daysSinceLastReview++;
        }

        // Avança para o próximo dia
        dayNum++;
        dayInWeek++;
        if (dayInWeek > 7) {
            dayInWeek = 1;
            weekNum++;
        }
    }

    return schedule;
}

// Gera descrição da semana baseado nos tópicos
export function getWeekDescription(schedule, weekKey, subjects) {
    const weekData = schedule[weekKey];
    if (!weekData) return '';

    // Pega todos os tópicos IDs da semana
    const topicIds = Object.values(weekData)
        .flat()
        .filter(id => id !== 'rest' && id !== 'review');

    // Pega os subjects únicos
    const subjectNames = new Set();
    subjects.forEach(subject => {
        const hasTopicInWeek = subject.topics.some(t => topicIds.includes(t.id));
        if (hasTopicInWeek) {
            subjectNames.add(subject.title.replace('Direito ', ''));
        }
    });

    const names = Array.from(subjectNames).slice(0, 3);
    if (names.length === 0) return 'Revisão';
    if (names.length < subjectNames.size) {
        return `${names.join(', ')} e mais`;
    }
    return names.join(', ');
}
