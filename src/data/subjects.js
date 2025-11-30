export const SUBJECTS = [
    {
        id: 'civil',
        title: 'Direito Civil',
        color: 'text-blue-600',
        bgColor: 'bg-blue-600',
        bgLight: 'bg-blue-50',
        icon: 'Scale',
        topics: [
            {
                id: 'civ_negocio',
                title: 'Negócio Jurídico',
                subtopics: [
                    'Fatos Jurídicos: Sentido estrito, Ato-Fato e Negócio',
                    'Escada Ponteana: Existência, Validade e Eficácia',
                    'Representação: Legal vs. Voluntária (Art. 119)'
                ]
            },
            {
                id: 'civ_defeitos',
                title: 'Defeitos do Negócio',
                subtopics: [
                    'Vícios de Consentimento: Erro, Dolo, Coação, Estado de Perigo, Lesão',
                    'Vícios Sociais: Fraude contra Credores, Simulação'
                ]
            },
            {
                id: 'civ_obrigacoes',
                title: 'Obrigações',
                subtopics: [
                    'Prescrição (Perda da pretensão) vs. Decadência (Perda do direito)',
                    'Modalidades: Dar coisa certa, Fazer (Fungível vs. Infungível)',
                    'Solidariedade: Não se presume, decorre da lei ou vontade'
                ]
            },
            {
                id: 'civ_pagamento',
                title: 'Extinção das Obrigações',
                subtopics: [
                    'Pagamento: Quem deve pagar (Terceiro interessado vs. Não interessado)',
                    'Consignação, Dação e Compensação',
                    'Inadimplemento: Mora vs. Absoluto, Cláusula Penal'
                ]
            },
            {
                id: 'civ_contratos_geral',
                title: 'Teoria Geral dos Contratos',
                subtopics: [
                    'Princípios: Autonomia, Boa-fé Objetiva, Função Social',
                    'Vícios Redibitórios: Defeito oculto (Ações Edilícias)',
                    'Evicção: Perda da coisa por decisão judicial/adm'
                ]
            },
            {
                id: 'civ_contratos_especie1',
                title: 'Contratos em Espécie I',
                subtopics: [
                    'Compra e Venda: Cláusulas especiais (Retrovenda)',
                    'Doação: Revogação por ingratidão/inexecução',
                    'Empréstimo: Mútuo vs. Comodato'
                ]
            },
            {
                id: 'civ_contratos_especie2',
                title: 'Contratos em Espécie II',
                subtopics: [
                    'Fiança: Benefício de Ordem, Outorga Uxória',
                    'Mandato: Procuração, poderes gerais vs. especiais'
                ]
            },
            {
                id: 'civ_resp_civil',
                title: 'Responsabilidade Civil',
                subtopics: [
                    'Elementos: Conduta, Culpa (Lato sensu), Nexo Causal, Dano',
                    'Objetiva (Risco) vs. Subjetiva (Culpa)',
                    'Excludentes: Culpa exclusiva da vítima, Caso fortuito/Força maior'
                ]
            },
            {
                id: 'civ_revisao_sem5',
                title: 'Revisão: Vícios e Contratos',
                subtopics: [
                    'Revisão de Vícios de Consentimento',
                    'Revisão de Cláusulas Especiais de Compra e Venda'
                ]
            }
        ]
    },
    {
        id: 'const',
        title: 'Direito Constitucional',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500',
        bgLight: 'bg-amber-50',
        icon: 'Landmark',
        topics: [
            {
                id: 'const_teoria',
                title: 'Teoria da Constituição',
                subtopics: [
                    'Poder Constituinte: Originário e Derivado',
                    'Eficácia das Normas: Plena, Contida e Limitada'
                ]
            },
            {
                id: 'const_art5',
                title: 'Direitos Fundamentais (Art. 5º)',
                subtopics: [
                    'Direito à Vida e Igualdade',
                    'Inviolabilidade Domiciliar',
                    'Propriedade: Função Social e Desapropriação'
                ]
            },
            {
                id: 'const_remedios',
                title: 'Remédios Constitucionais',
                subtopics: [
                    'Habeas Corpus: Liberdade de locomoção',
                    'Mandado de Segurança: Direito líquido e certo',
                    'Mandado de Injunção e Ação Popular'
                ]
            },
            {
                id: 'const_org_estado',
                title: 'Organização do Estado',
                subtopics: [
                    'Repartição de Competências: Exclusiva, Privativa, Concorrente e Comum',
                    'Federalismo e Autonomia dos Entes'
                ]
            },
            {
                id: 'const_legislativo',
                title: 'Processo Legislativo',
                subtopics: [
                    'Emenda Constitucional: Quórum e Limitações',
                    'Medida Provisória: Relevância, Urgência e Vedações',
                    'Sanção e Veto: Expresso e Motivado'
                ]
            },
            {
                id: 'const_poderes',
                title: 'Poderes Executivo e Judiciário',
                subtopics: [
                    'Executivo: Crime de Responsabilidade vs. Comum',
                    'Judiciário: Súmula Vinculante e CNJ'
                ]
            },
            {
                id: 'const_funcoes',
                title: 'Funções Essenciais à Justiça',
                subtopics: [
                    'Ministério Público: Princípios (Unidade, Indivisibilidade, Independência)',
                    'Advocacia Pública: AGU e Procuradorias',
                    'Defensoria: Promoção de direitos humanos e defesa dos necessitados'
                ]
            },
            {
                id: 'const_controle_geral',
                title: 'Controle de Constitucionalidade I',
                subtopics: [
                    'Supremacia: Formal e Material',
                    'Inconstitucionalidade: Por Ação ou Omissão',
                    'Controle Difuso: Cláusula de Reserva de Plenário (Art. 97)'
                ]
            },
            {
                id: 'const_controle_concentrado',
                title: 'Controle de Constitucionalidade II',
                subtopics: [
                    'ADI: Lei federal/estadual x CF',
                    'ADC: Lei federal x CF (Garante constitucionalidade)',
                    'ADPF: Subsidiária (Lei municipal, pré-constitucional)',
                    'Legitimados (Art. 103) e Efeitos (Erga Omnes, Vinculante, Ex Tunc)'
                ]
            },
            {
                id: 'const_rev_controle',
                title: 'Revisão: Controle Concentrado',
                subtopics: [
                    'Revisão Tabela de Ações (Legitimados x Objeto)',
                    'Revisão de Efeitos e Modulação'
                ]
            }
        ]
    },
    {
        id: 'adm',
        title: 'Direito Administrativo',
        color: 'text-slate-600',
        bgColor: 'bg-slate-600',
        bgLight: 'bg-slate-50',
        icon: 'Building2',
        topics: [
            {
                id: 'adm_regime',
                title: 'Regime Jurídico',
                subtopics: [
                    'Pedra de Toque: Supremacia vs Indisponibilidade',
                    'Organização: Desconcentração vs Descentralização',
                    'Adm. Indireta: Autarquia, Fundação, EP, SEM'
                ]
            },
            {
                id: 'adm_poderes',
                title: 'Poderes Administrativos',
                subtopics: [
                    'Vinculado vs. Discricionário',
                    'Poder de Polícia: Conceito, Atributos (DAC) e Ciclo'
                ]
            },
            {
                id: 'adm_atos',
                title: 'Atos Administrativos',
                subtopics: [
                    'Requisitos (CO-FI-FO-M-OB): Competência, Finalidade, Forma, Motivo, Objeto',
                    'Atributos (PATI): Presunção, Autoexecutoriedade, Tipicidade, Imperatividade'
                ]
            },
            {
                id: 'adm_atos_extincao',
                title: 'Extinção dos Atos',
                subtopics: [
                    'Anulação: Ilegalidade (Ex Tunc)',
                    'Revogação: Inconveniência (Ex Nunc)',
                    'Cassação: Descumprimento de requisitos'
                ]
            },
            {
                id: 'adm_licitacoes1',
                title: 'Licitações (Lei 14.133)',
                subtopics: [
                    'Modalidades: Pregão, Concorrência, Diálogo Competitivo',
                    'Critérios de Julgamento: Menor preço, Melhor técnica, Maior desconto'
                ]
            },
            {
                id: 'adm_contratos',
                title: 'Contratos Administrativos',
                subtopics: [
                    'Contratação Direta: Inexigibilidade vs. Dispensa',
                    'Cláusulas Exorbitantes: Alteração/Rescisão unilateral'
                ]
            },
            {
                id: 'adm_agentes',
                title: 'Agentes Públicos',
                subtopics: [
                    'Cargos: Efetivo vs. Comissão',
                    'Improbidade (Lei 8.429): Dolo específico, Enriquecimento Ilícito, Prejuízo ao Erário'
                ]
            },
            {
                id: 'adm_servicos',
                title: 'Serviços Públicos',
                subtopics: [
                    'Concessão (Contrato, concorrência) vs. Permissão (Adesão, precariedade)',
                    'Direitos do Usuário: Continuidade, Adequação'
                ]
            },
            {
                id: 'adm_resp_civil',
                title: 'Responsabilidade Civil do Estado',
                subtopics: [
                    'Teoria do Risco Administrativo (Art. 37 §6º)',
                    'Excludentes: Culpa exclusiva da vítima, Força maior',
                    'Direito de Regresso: Dolo ou culpa do agente'
                ]
            },
            {
                id: 'adm_intervencao',
                title: 'Intervenção na Propriedade',
                subtopics: [
                    'Desapropriação: Necessidade/Utilidade pública ou Interesse social',
                    'Indenização: Prévia, justa e em dinheiro (Regra)',
                    'Requisição: Perigo público iminente (Uso transitório)'
                ]
            }
        ]
    },
    {
        id: 'penal',
        title: 'Direito Penal',
        color: 'text-red-600',
        bgColor: 'bg-red-600',
        bgLight: 'bg-red-50',
        icon: 'Gavel',
        topics: [
            {
                id: 'pen_principios',
                title: 'Princípios e Lei Penal',
                subtopics: [
                    'Princípios: Legalidade, Insignificância, Irretroatividade',
                    'Lei no Tempo: Abolitio criminis, Novatio legis',
                    'Lei no Espaço: Teoria da Ubiquidade'
                ]
            },
            {
                id: 'pen_fato',
                title: 'Fato Típico',
                subtopics: [
                    'Conduta: Dolo e Culpa',
                    'Nexo Causal: Teoria da Equivalência',
                    'Tipicidade: Formal vs. Material',
                    'Erro de Tipo: Essencial vs. Acidental'
                ]
            },
            {
                id: 'pen_ilicitude',
                title: 'Ilicitude (Excludentes)',
                subtopics: [
                    'Estado de Necessidade e Legítima Defesa',
                    'Estrito Cumprimento do Dever Legal',
                    'Exercício Regular de Direito'
                ]
            },
            {
                id: 'pen_culpabilidade',
                title: 'Culpabilidade',
                subtopics: [
                    'Imputabilidade: Critério Biopsicológico',
                    'Potencial Consciência da Ilicitude: Erro de Proibição',
                    'Exigibilidade de Conduta Diversa: Coação e Obediência'
                ]
            },
            {
                id: 'pen_iter_concurso',
                title: 'Iter Criminis e Concurso',
                subtopics: [
                    'Iter Criminis: Cogitação, Preparação, Execução, Consumação',
                    'Tentativa e Desistência Voluntária',
                    'Concurso de Pessoas: Teoria Monista'
                ]
            },
            {
                id: 'pen_penas',
                title: 'Teoria da Pena',
                subtopics: [
                    'Penas Privativas de Liberdade vs. Restritivas de Direitos',
                    'Sistema Trifásico (Dosimetria)'
                ]
            },
            {
                id: 'pen_execucao',
                title: 'Execução e Extinção',
                subtopics: [
                    'Regimes: Fechado, Semiaberto, Aberto (Súmula 269 STJ)',
                    'Detração: Desconto do tempo de prisão provisória',
                    'Extinção da Punibilidade: Prescrição e Decadência'
                ]
            },
            {
                id: 'pen_crimes_especie',
                title: 'Crimes em Espécie',
                subtopics: [
                    'Homicídio: Privilegiado vs. Qualificado, Culposo',
                    'Lesão Corporal: Leve, Grave, Gravíssima'
                ]
            },
            {
                id: 'pen_patrimonio',
                title: 'Crimes contra o Patrimônio',
                subtopics: [
                    'Furto: Simples vs. Qualificado',
                    'Roubo: Violência ou grave ameaça',
                    'Estelionato: Fraude + Vantagem ilícita + Prejuízo'
                ]
            },
            {
                id: 'pen_dignidade_adm',
                title: 'Dignidade Sexual e Adm. Pública',
                subtopics: [
                    'Estupro e Estupro de Vulnerável',
                    'Peculato e Concussão',
                    'Corrupção Passiva e Prevaricação'
                ]
            },
            {
                id: 'pen_rev_calculo',
                title: 'Revisão: Cálculo de Pena',
                subtopics: [
                    'Circunstâncias Judiciais (1ª Fase)',
                    'Agravantes e Atenuantes (2ª Fase)',
                    'Causas de Aumento e Diminuição (3ª Fase)'
                ]
            }
        ]
    },
    {
        id: 'proc_civil',
        title: 'Processo Civil',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-600',
        bgLight: 'bg-indigo-50',
        icon: 'ScrollText',
        topics: [
            {
                id: 'proc_tgp',
                title: 'Teoria Geral do Processo',
                subtopics: [
                    'Jurisdição: Características',
                    'Ação: Condições e Elementos',
                    'Competência: Critérios e Diferenças (Absoluta vs Relativa)'
                ]
            },
            {
                id: 'proc_sujeitos',
                title: 'Sujeitos do Processo',
                subtopics: [
                    'Litisconsórcio: Necessário vs. Facultativo, Unitário vs. Simples',
                    'Intervenção de Terceiros: Denunciação, Chamamento, IDPJ'
                ]
            },
            {
                id: 'proc_fase_postulatoria',
                title: 'Fase Postulatória',
                subtopics: [
                    'Petição Inicial: Requisitos e Pedido',
                    'Improcedência Liminar do Pedido',
                    'Audiência de Conciliação'
                ]
            },
            {
                id: 'proc_defesa',
                title: 'Defesa e Saneamento',
                subtopics: [
                    'Contestação: Princípio da Eventualidade, Preliminares',
                    'Reconvenção: Contra-ataque do réu',
                    'Saneamento (Art. 357): Delimitação de questões e ônus da prova'
                ]
            },
            {
                id: 'proc_provas',
                title: 'Provas',
                subtopics: [
                    'Ônus da Prova: Regra estática vs. Dinamização',
                    'Espécies: Ata Notarial, Depoimento Pessoal',
                    'Prova Testemunhal e Pericial'
                ]
            },
            {
                id: 'proc_sentenca',
                title: 'Sentença e Coisa Julgada',
                subtopics: [
                    'Sentença: Relatório, Fundamentação, Dispositivo',
                    'Coisa Julgada: Formal vs. Material'
                ]
            },
            {
                id: 'proc_recursos1',
                title: 'Recursos I - Teoria e Apelação',
                subtopics: [
                    'Juízo de Admissibilidade vs. Mérito',
                    'Apelação: Cabimento e Efeitos (Devolutivo/Suspensivo)'
                ]
            },
            {
                id: 'proc_recursos2',
                title: 'Recursos II - Agravo e ED',
                subtopics: [
                    'Agravo de Instrumento: Rol taxativo (Art. 1015)',
                    'Embargos de Declaração: Omissão, Contradição, Obscuridade'
                ]
            },
            {
                id: 'proc_tutelas_rev',
                title: 'Revisão: Tutelas Provisórias',
                subtopics: [
                    'Tutela de Urgência: Probabilidade + Perigo',
                    'Tutela de Evidência'
                ]
            }
        ]
    },
    {
        id: 'trab',
        title: 'Direito do Trabalho',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-600',
        bgLight: 'bg-cyan-50',
        icon: 'Briefcase',
        topics: [
            {
                id: 'trab_principios',
                title: 'Princípios e Relação',
                subtopics: [
                    'Princípios: Proteção, Primazia da Realidade',
                    'Vínculo Empregatício: Requisitos SHOP',
                    'Distinções: Autônomo, Eventual e Avulso'
                ]
            },
            {
                id: 'trab_contrato',
                title: 'Contrato de Trabalho',
                subtopics: [
                    'Prazo Determinado: Hipóteses',
                    'Alteração (Art. 468 CLT): Mútuo consentimento + Sem prejuízo',
                    'Suspensão vs. Interrupção'
                ]
            },
            {
                id: 'trab_verbas',
                title: 'Remuneração e Verbas',
                subtopics: [
                    'Salário vs. Remuneração',
                    'Adicionais: Noturno, Insalubridade, Periculosidade',
                    'Equiparação Salarial: Requisitos'
                ]
            },
            {
                id: 'trab_jornada',
                title: 'Jornada de Trabalho',
                subtopics: [
                    'Limites: 8h diárias / 44h semanais',
                    'Horas Extras e Banco de Horas',
                    'Intervalos: Intrajornada e Interjornada'
                ]
            },
            {
                id: 'trab_justa_causa',
                title: 'Rescisão I - Justa Causa',
                subtopics: [
                    'Art. 482 CLT: Improbidade, Incontinência, Desídia',
                    'Rescisão Indireta: Falta grave do empregador'
                ]
            },
            {
                id: 'trab_rescisao_verbas',
                title: 'Rescisão II - Verbas e Estabilidade',
                subtopics: [
                    'Aviso Prévio: Proporcional',
                    'Estabilidade Provisória: Gestante, Cipeiro, Acidentado'
                ]
            },
            {
                id: 'trab_prescricao',
                title: 'Prescrição e FGTS',
                subtopics: [
                    'Prescrição Bienal e Quinquenal',
                    'FGTS: Natureza e Multa de 40%'
                ]
            },
            {
                id: 'trab_rev_prazos',
                title: 'Revisão Geral de Prazos',
                subtopics: [
                    'Recurso Ordinário (8 dias)',
                    'Outros prazos processuais trabalhistas'
                ]
            }
        ]
    },
    {
        id: 'revisao',
        title: 'Revisão e Questões',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500',
        bgLight: 'bg-emerald-50',
        icon: 'RotateCcw',
        topics: [
            {
                id: 'rev_sem1',
                title: 'Revisão Ativa + Questões (Sem 1)',
                subtopics: [
                    'Resolver 10 questões de cada matéria',
                    'Foco nos erros conceituais'
                ]
            },
            {
                id: 'rev_sem2',
                title: 'Revisão Ativa + Questões (Sem 2)',
                subtopics: [
                    'Resolver 10 questões de cada matéria da semana',
                    'Revisar pontos de dificuldade'
                ]
            },
            {
                id: 'rev_sem3',
                title: 'Revisão Ativa + Questões (Sem 3)',
                subtopics: [
                    'Resolver 10 questões de cada matéria da semana',
                    'Revisar pontos de dificuldade'
                ]
            },
            {
                id: 'rev_sem4',
                title: 'Revisão Ativa + Questões (Sem 4)',
                subtopics: [
                    'Resolver 10 questões de cada matéria da semana',
                    'Revisar pontos de dificuldade'
                ]
            },
            {
                id: 'rev_sem5',
                title: 'Revisão Ativa + Questões (Sem 5)',
                subtopics: [
                    'Resolver 10 questões de cada matéria da semana',
                    'Revisar pontos de dificuldade'
                ]
            },
            {
                id: 'rev_simulado_final',
                title: 'Simulado Final',
                subtopics: [
                    'Simular condição de prova (50-80 questões)',
                    'Todas as matérias misturadas'
                ]
            },
            {
                id: 'rev_analise_erros',
                title: 'Análise de Erros',
                subtopics: [
                    'Identificar lacunas finais',
                    'Leitura de lei seca específica dos erros'
                ]
            }
        ]
    }
];
