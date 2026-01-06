// Gera um cronograma semanal dinâmico baseado nos tópicos selecionados
// Distribui os tópicos em 6 semanas, com 2 tópicos por dia (6 dias de estudo + 1 de descanso)
export function generateDynamicSchedule(topicIds, subjects) {
    if (!topicIds || topicIds.length === 0) {
        return {};
    }

    // Pega os tópicos completos a partir dos IDs
    const allTopics = subjects.flatMap(s => s.topics);
    const selectedTopics = topicIds
        .map(id => allTopics.find(t => t.id === id))
        .filter(Boolean);

    if (selectedTopics.length === 0) {
        return {};
    }

    const schedule = {};
    const TOPICS_PER_DAY = 2;
    const STUDY_DAYS_PER_WEEK = 6; // 6 dias de estudo + 1 de descanso

    let topicIndex = 0;
    let weekNum = 1;
    let dayNum = 1;

    // Distribui os tópicos nos dias
    while (topicIndex < selectedTopics.length) {
        const weekKey = `week${weekNum}`;
        if (!schedule[weekKey]) {
            schedule[weekKey] = {};
        }

        // Formata o dia (ex: "Dia 01", "Dia 02")
        const dayKey = `Dia ${String(dayNum).padStart(2, '0')}`;

        // Pega os tópicos para este dia
        const dayTopics = [];
        for (let i = 0; i < TOPICS_PER_DAY && topicIndex < selectedTopics.length; i++) {
            dayTopics.push(selectedTopics[topicIndex].id);
            topicIndex++;
        }

        schedule[weekKey][dayKey] = dayTopics;

        // Avança para o próximo dia
        const dayInWeek = (dayNum - 1) % 7 + 1;
        if (dayInWeek === STUDY_DAYS_PER_WEEK) {
            // Adiciona dia de descanso
            const restDayKey = `Dia ${String(dayNum + 1).padStart(2, '0')}`;
            schedule[weekKey][restDayKey] = ['rest'];
            dayNum += 2; // Pula o dia de descanso
            weekNum++;
        } else {
            dayNum++;
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
        .filter(id => id !== 'rest');

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
