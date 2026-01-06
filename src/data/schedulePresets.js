// Presets de cronogramas pré-definidos
import { SUBJECTS } from './subjects';

// Pega todos os topic IDs de todas as matérias
export const getAllTopicIds = () => {
    return SUBJECTS.flatMap(subject => subject.topics.map(topic => topic.id));
};

// IDs dos tópicos de Direito Administrativo II/III (tópicos mais avançados)
// Adm I: regime, poderes, atos (básico)
// Adm II: atos_extincao, licitacoes, contratos
// Adm III: agentes, servicos, resp_civil, intervencao
export const ADM_II_III_TOPICS = [
    'adm_atos_extincao',
    'adm_licitacoes1',
    'adm_contratos',
    'adm_agentes',
    'adm_servicos',
    'adm_resp_civil',
    'adm_intervencao'
];

// Presets disponíveis para novos usuários
export const SCHEDULE_PRESETS = [
    {
        id: 'revisao_geral',
        name: 'Revisão Geral OAB',
        description: 'Todos os tópicos para revisão completa',
        topicIds: getAllTopicIds(),
        icon: 'BookOpen',
        color: 'text-indigo-600'
    }
];
